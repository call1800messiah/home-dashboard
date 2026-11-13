import { Injectable } from '@angular/core';
import type { DocumentReference, QueryFn } from '@angular/fire/compat/firestore';
import { FieldValue, Timestamp } from '@angular/fire/firestore';
import type firebase from 'firebase/compat/app';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';



/**
 * Stands in for ApiService in the `mock` build configuration (`npm start`), which swaps
 * it in through `fileReplacements` in angular.json. It serves firestore-dump.json from
 * memory: writes update the screen but never reach Firebase, and a reload restores the
 * dump. Write validation follows Firestore's, so bugs don't only appear on the live database.
 */
const DUMP_URL = 'firestore-dump.json';
const MOCK_USER = { uid: 'mock-user', email: 'mock@example.com' };

type DocumentData = Record<string, unknown>;
type Documents = Record<string, DocumentData>;

interface FirestoreDump {
  collections: Record<string, { id: string; data: DocumentData }[]>;
}

function isMap(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function mapValues(source: Record<string, unknown>, transform: (value: unknown, key: string) => unknown) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, transform(value, key)]));
}

/** Turns a value from the dump into what Firestore's SDK would return for it. */
function revive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(revive);
  }
  if (!isMap(value)) {
    return value;
  }
  if ('__type' in value) {
    if (value['__type'] === 'timestamp') {
      return Timestamp.fromDate(new Date(value['value'] as string));
    }
    throw new Error(`Mock API does not support the dump value type "${value['__type']}"`);
  }
  return mapValues(value, revive);
}

function isDeleteField(value: FieldValue): boolean {
  return (value as unknown as { _methodName: string })._methodName === 'deleteField';
}

/** Copies a written value into its stored form, rejecting what Firestore would reject. */
function toStored(value: unknown, allowDeleteField: boolean, path = 'document'): unknown {
  if (value === undefined) {
    throw new Error(`Unsupported field value: undefined (found in ${path})`);
  }
  if (value instanceof FieldValue) {
    if (!isDeleteField(value)) {
      const name = (value as unknown as { _methodName: string })._methodName;
      throw new Error(`Mock API does not implement ${name}() (found in ${path})`);
    }
    if (!allowDeleteField) {
      throw new Error(`deleteField() can only be used when updating a document (found in ${path})`);
    }
    return value;
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => toStored(item, false, `${path}[${index}]`));
  }
  if (isMap(value)) {
    return mapValues(value, (item, key) => toStored(item, allowDeleteField, `${path}.${key}`));
  }
  if (value === null || value instanceof Timestamp || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value;
  }
  throw new Error(`Unsupported field value: ${typeof value} (found in ${path})`);
}

/** Applies `set(..., { merge: true })` semantics. An empty map replaces, it doesn't merge. */
function merge(target: Record<string, unknown>, changes: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  Object.entries(changes).forEach(([key, value]) => {
    if (value instanceof FieldValue) {
      delete result[key];
    } else if (isMap(value) && Object.keys(value).length > 0) {
      const current = result[key];
      result[key] = merge(isMap(current) ? current : {}, value);
    } else {
      result[key] = value;
    }
  });
  return result;
}

/** Timestamps are immutable, so only arrays and maps need copying. */
function clone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(clone) as T;
  }
  return isMap(value) ? mapValues(value, clone) as T : value;
}

/** Same shapes as in api.service.ts, which this file replaces in the mock build. */
export interface DocumentWrite {
  collectionID: string;
  documentID: string;
  data: object;
  merge: boolean;
}

export interface Transaction {
  get(collectionID: string, documentID: string): Promise<Record<string, any> | undefined>;
  set(write: DocumentWrite): void;
}

function generateId(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 20 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private collections = new Map<string, BehaviorSubject<Documents>>();
  private loaded?: Promise<void>;
  private user$ = new BehaviorSubject<firebase.User|null>(MOCK_USER as firebase.User);


  async addDocumentToCollection(document: any, collectionID: string): Promise<DocumentReference<unknown>> {
    const data = toStored(document, false) as DocumentData;
    await this.whenLoaded();
    const id = generateId();
    const collection = this.getCollection(collectionID);
    collection.next({ ...collection.value, [id]: data });
    return { id } as DocumentReference<unknown>;
  }

  createId(): string {
    return generateId();
  }

  async deleteDocumentFromCollection(documentId: string, collectionID: string): Promise<void> {
    await this.whenLoaded();
    const collection = this.getCollection(collectionID);
    const { [documentId]: deleted, ...remaining } = collection.value;
    collection.next(remaining);
  }

  getAuthState(): Observable<firebase.User|null> {
    return this.user$.asObservable();
  }

  getDataFromCollection(collectionID: string, queryFunction?: QueryFn<firebase.firestore.DocumentData>): Observable<any> {
    if (queryFunction) {
      console.warn(`Mock API ignores query functions: returning all of "${collectionID}"`);
    }
    return from(this.whenLoaded()).pipe(
      switchMap(() => this.getCollection(collectionID)),
      map((documents) => Object.keys(documents).sort().map((id) => ({ ...clone(documents[id]), id }))),
    );
  }

  getItemFromCollection(path: string): Observable<any> {
    const segments = path.split('/');
    if (segments.length !== 2) {
      throw new Error(`Mock API only supports "collection/document" paths, got "${path}"`);
    }
    const [collectionID, id] = segments;
    return from(this.whenLoaded()).pipe(
      switchMap(() => this.getCollection(collectionID)),
      map((documents) => ({
        type: 'value',
        payload: { id, exists: id in documents, data: () => clone(documents[id]) },
      })),
    );
  }

  async login(email: string, password: string): Promise<unknown> {
    const user = { ...MOCK_USER, email } as firebase.User;
    this.user$.next(user);
    return { user };
  }

  async logout(): Promise<void> {
    this.user$.next(null);
  }

  async removeFromArray(documentID: string, collectionID: string, field: string, value: unknown): Promise<void> {
    await this.whenLoaded();
    const collection = this.getCollection(collectionID);
    const document = collection.value[documentID];
    if (!document) {
      throw new Error(`No document to update: ${collectionID}/${documentID}`);
    }
    const current = document[field];
    const kept = Array.isArray(current) ? current.filter((entry) => entry !== value) : [];
    collection.next({ ...collection.value, [documentID]: { ...document, [field]: kept } });
  }

  /**
   * Nothing else writes while the work runs, so it runs once. Writes are validated before any is
   * applied, so a bad one changes nothing, like a failed Firestore transaction.
   */
  async runTransaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    await this.whenLoaded();
    const writes: (DocumentWrite & { stored: DocumentData })[] = [];
    const result = await work({
      get: async (collectionID, documentID) => clone(this.getCollection(collectionID).value[documentID]),
      set: (write) => writes.push({ ...write, stored: toStored(write.data, write.merge) as DocumentData }),
    });
    writes.forEach(({ collectionID, documentID, merge: mergeIntoExisting, stored }) => {
      const collection = this.getCollection(collectionID);
      const document = mergeIntoExisting ? merge(collection.value[documentID] ?? {}, stored) as DocumentData : stored;
      collection.next({ ...collection.value, [documentID]: document });
    });
    return result;
  }

  async updateDocumentInCollection(documentID: string, collectionID: string, data: any): Promise<void> {
    const changes = toStored(data, true) as DocumentData;
    await this.whenLoaded();
    const collection = this.getCollection(collectionID);
    const merged = merge(collection.value[documentID] ?? {}, changes) as DocumentData;
    collection.next({ ...collection.value, [documentID]: merged });
  }


  private getCollection(collectionID: string): BehaviorSubject<Documents> {
    let collection = this.collections.get(collectionID);
    if (!collection) {
      collection = new BehaviorSubject<Documents>({});
      this.collections.set(collectionID, collection);
    }
    return collection;
  }

  private async loadDump(): Promise<void> {
    const fail = (reason: string) => new Error(
      `Mock API could not load ${DUMP_URL} (${reason}). It belongs in the project root and is not committed: `
      + 'create a dump of the database, or use "npm run start:live".'
    );
    const response = await fetch(DUMP_URL);
    if (!response.ok) {
      throw fail(`HTTP ${response.status}`);
    }
    const dump: FirestoreDump = await response.json().catch(() => {
      throw fail('not valid JSON');
    });
    Object.entries(dump.collections).forEach(([collectionID, documents]) => {
      this.getCollection(collectionID).next(Object.fromEntries(
        documents.map(({ id, data }) => [id, revive(data) as DocumentData])
      ));
    });
  }

  private whenLoaded(): Promise<void> {
    this.loaded ??= this.loadDump();
    return this.loaded;
  }
}

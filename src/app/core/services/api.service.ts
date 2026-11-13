import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore, DocumentReference, QueryFn } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { arrayRemove } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import type firebase from 'firebase/compat/app';

/** One document write: set `data`, merged into the existing document or replacing it. */
export interface DocumentWrite {
  collectionID: string;
  documentID: string;
  data: object;
  merge: boolean;
}

/** What the work in runTransaction can do. All reads have to come before the first write. */
export interface Transaction {
  /** The document's data as the server has it now, or undefined if it doesn't exist. */
  get(collectionID: string, documentID: string): Promise<Record<string, any> | undefined>;
  set(write: DocumentWrite): void;
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private injector: EnvironmentInjector,
  ) {}


  addDocumentToCollection(document: any, collectionID: string): Promise<DocumentReference<unknown>> {
    return this.useFirestore((afs) => afs.collection(collectionID).add(document));
  }

  createId(): string {
    return this.useFirestore((afs) => afs.createId());
  }

  deleteDocumentFromCollection(documentId: string, collectionID: string): Promise<void> {
    return this.useFirestore((afs) => afs.collection(collectionID).doc(documentId).delete());
  }

  getAuthState(): Observable<firebase.User|null> {
    return this.afAuth.authState;
  }

  getDataFromCollection(collectionID: string, queryFunction?: QueryFn<firebase.firestore.DocumentData>): Observable<any> {
    return this.useFirestore((afs) => afs.collection(collectionID, queryFunction).valueChanges({ idField: 'id' }));
  }

  getItemFromCollection(path: string): Observable<any> {
    return this.useFirestore((afs) => afs.doc(path).snapshotChanges());
  }

  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    return this.afAuth.signOut();
  }

  /**
   * Removes every occurrence of `value` from an array field without rewriting the rest of it,
   * so entries other devices add meanwhile survive. Works offline like any other write.
   */
  removeFromArray(documentID: string, collectionID: string, field: string, value: unknown): Promise<void> {
    return this.useFirestore((afs) => afs.collection(collectionID).doc(documentID).update({ [field]: arrayRemove(value) }));
  }

  /**
   * Runs `work` against the server's current documents and writes all its writes together, or
   * none. Firestore runs `work` again if a document it read changes before the commit, so it must
   * not have side effects. Needs a connection: offline it rejects with code "unavailable".
   */
  runTransaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.useFirestore((afs) => afs.firestore.runTransaction((firestoreTransaction) => {
      const ref = (collectionID: string, documentID: string) => afs.firestore.collection(collectionID).doc(documentID);
      return work({
        get: async (collectionID, documentID) => (await firestoreTransaction.get(ref(collectionID, documentID))).data(),
        set: ({ collectionID, documentID, data, merge }) => {
          firestoreTransaction.set(ref(collectionID, documentID), data, { merge });
        },
      });
    }));
  }

  updateDocumentInCollection(documentID: string, collectionID: string, data: any) {
    return this.useFirestore((afs) => afs.collection(collectionID).doc(documentID).set(data, { merge: true }));
  }


  /**
   * AngularFire's collection and document classes call inject() when constructed, which
   * throws NG0203 in callers such as click handlers unless an injection context is provided.
   */
  private useFirestore<T>(operation: (afs: AngularFirestore) => T): T {
    return runInInjectionContext(this.injector, () => operation(this.afs));
  }
}

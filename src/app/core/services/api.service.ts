import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore, DocumentReference, QueryFn } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import type firebase from 'firebase/compat/app';

/** One document write in a batch: set `data`, merged into the existing document or replacing it. */
export interface BatchSet {
  collectionID: string;
  documentID: string;
  data: object;
  merge: boolean;
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

  /** Writes all operations together: either all of them are applied or none. */
  batchWrite(operations: BatchSet[]): Promise<void> {
    return this.useFirestore((afs) => {
      const batch = afs.firestore.batch();
      operations.forEach(({ collectionID, documentID, data, merge }) => {
        batch.set(afs.firestore.collection(collectionID).doc(documentID), data, { merge });
      });
      return batch.commit();
    });
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

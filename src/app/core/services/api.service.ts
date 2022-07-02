import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference, QueryFn } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/';



@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
  ) {}


  addDocumentToCollection(document: any, collectionID: string): Promise<DocumentReference<unknown>> {
    return this.afs.collection(collectionID).add(document);
  }

  deleteDocumentFromCollection(documentId: string, collectionID: string): Promise<void> {
    return this.afs.collection(collectionID).doc(documentId).delete();
  }

  getAuthState(): Observable<firebase.User|null> {
    return this.afAuth.authState;
  }

  getDataFromCollection(collectionID: string, queryFunction?: QueryFn<firebase.firestore.DocumentData>): Observable<any> {
    return this.afs.collection(collectionID, queryFunction).snapshotChanges();
  }

  getItemFromCollection(path: string): Observable<any> {
    return this.afs.doc(path).snapshotChanges();
  }

  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    return this.afAuth.signOut();
  }

  updateDocumentInCollection(documentID: string, collectionID: string, data: any) {
    return this.afs.collection(collectionID).doc(documentID).set(data, { merge: true });
  }
}

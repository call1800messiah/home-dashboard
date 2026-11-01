import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { deleteField } from '@angular/fire/firestore';

import { firebaseProviders } from './firebase.providers.mock';



describe('firebaseProviders (mock)', () => {
  it('sets up what deleteField() needs without anything injecting FirebaseApp', () => {
    // Other specs may have left AngularFire's schedulers behind, which would hide a failure.
    delete (globalThis as any)['ɵAngularFireScheduler'];
    expect(() => deleteField()).toThrowError(/AngularFireModule/);

    TestBed.configureTestingModule({ providers: [firebaseProviders] });
    TestBed.inject(ApplicationRef);

    expect(() => deleteField()).not.toThrow();
  });
});

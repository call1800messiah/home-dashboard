import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { deleteField, FieldValue } from '@angular/fire/firestore';

import { firebaseProviders } from './firebase.providers.mock';



describe('firebaseProviders (mock)', () => {
  it('leaves deleteField() usable without any Firebase services', () => {
    TestBed.configureTestingModule({ providers: [firebaseProviders] });
    TestBed.inject(ApplicationRef);

    expect(deleteField() instanceof FieldValue).toBeTrue();
  });
});

import { TestBed } from '@angular/core/testing';
import { FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, USE_EMULATOR } from '@angular/fire/compat/firestore';

import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AngularFirestore, useValue: {} },
        { provide: AngularFireAuth, useValue: {} },
      ],
    });
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

/**
 * Uses the real AngularFirestore, because its collection and document classes call inject()
 * when constructed. A click handler isn't an injection context, so ApiService has to provide
 * one. The fake project and dead emulator port keep these tests away from any real database:
 * writes just stay queued, so they are started but not awaited.
 */
describe('ApiService outside an injection context', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_OPTIONS, useValue: { projectId: 'demo-api-service-spec', apiKey: 'fake', appId: 'fake' } },
        { provide: FIREBASE_APP_NAME, useValue: 'api-service-spec' },
        { provide: USE_EMULATOR, useValue: ['localhost', 1] },
        { provide: AngularFireAuth, useValue: null },
      ],
    });
    service = TestBed.inject(ApiService);
  });

  it('can add a document', () => {
    expect(() => service.addDocumentToCollection({ a: 1 }, 'items')).not.toThrow();
  });

  it('can update a document', () => {
    expect(() => service.updateDocumentInCollection('id', 'items', { a: 1 })).not.toThrow();
  });

  it('can delete a document', () => {
    expect(() => service.deleteDocumentFromCollection('id', 'items')).not.toThrow();
  });

  it('can start reading a collection', () => {
    expect(() => service.getDataFromCollection('items')).not.toThrow();
  });

  it('can start reading a document', () => {
    expect(() => service.getItemFromCollection('items/id')).not.toThrow();
  });

  it('can remove a value from an array field', () => {
    expect(() => service.removeFromArray('id', 'items', 'tags', 'a')).not.toThrow();
  });

  it('can start a transaction', () => {
    expect(() => service.runTransaction(async () => undefined)).not.toThrow();
  });

  it('creates document ids', () => {
    expect(service.createId()).toMatch(/^\w{10,}$/);
  });
});

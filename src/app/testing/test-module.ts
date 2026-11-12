import { Type } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ApiService } from '../core/services/api.service';



/**
 * An empty, signed-out ApiService. This is deliberately not the mock from
 * api.service.mock.ts: that one loads firestore-dump.json, which isn't committed,
 * and tests have to pass on a fresh clone.
 */
const stubApi: Partial<Record<keyof ApiService, unknown>> = {
  addDocumentToCollection: () => Promise.resolve({ id: 'test-id' }),
  batchWrite: () => Promise.resolve(),
  createId: () => 'test-id',
  deleteDocumentFromCollection: () => Promise.resolve(),
  getAuthState: () => of(null),
  getDataFromCollection: () => of([]),
  getItemFromCollection: () => of(undefined),
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  updateDocumentInCollection: () => Promise.resolve(),
};

/**
 * TestBed setup that keeps Firebase out of a test. Pass the feature module that declares
 * the component under test, which brings in its Material, form and child components.
 */
export function testModule(...imports: Type<unknown>[]): TestModuleMetadata {
  return {
    imports: [NoopAnimationsModule, RouterTestingModule, ...imports],
    providers: [
      { provide: ApiService, useValue: stubApi },
      { provide: MAT_DIALOG_DATA, useValue: {} },
      { provide: MatDialogRef, useValue: { close: () => undefined } },
    ],
  };
}

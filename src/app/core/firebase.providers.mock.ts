import { ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';

import { environment } from '../../environments/environment';



/**
 * Replaces firebase.providers.ts in the `mock` build configuration. Starting Auth would
 * refresh any saved session against Firebase, so it stays out, along with Firestore and
 * Storage. The app itself is still needed: it sets up the schedulers that AngularFire's
 * wrapped functions, such as deleteField(), rely on. It is lazy and nothing else here
 * injects it, so it is created explicitly. Initializing it makes no requests.
 */
export const firebaseProviders = [
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  { provide: ENVIRONMENT_INITIALIZER, multi: true, useValue: () => inject(FirebaseApp) },
];

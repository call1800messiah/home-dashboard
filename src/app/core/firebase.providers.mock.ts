import { Provider } from '@angular/core';



/**
 * Replaces firebase.providers.ts in the `mock` build configuration. Nothing in mock mode
 * uses a Firebase service, and starting Auth would refresh any saved session against
 * Firebase, so none of them are set up.
 */
export const firebaseProviders: Provider[] = [];

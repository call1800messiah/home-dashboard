import { TestBed } from '@angular/core/testing';

import { AuthGuardService } from './auth-guard.service';
import { testModule } from '../../testing/test-module';

describe('AuthGuardService', () => {
  let service: AuthGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule(testModule());
    service = TestBed.inject(AuthGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { testModule } from '../../testing/test-module';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule(testModule());
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

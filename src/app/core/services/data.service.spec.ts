import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';
import { testModule } from '../../testing/test-module';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule(testModule());
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

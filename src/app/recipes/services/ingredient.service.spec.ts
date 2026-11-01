import { TestBed } from '@angular/core/testing';

import { IngredientService } from './ingredient.service';
import { testModule } from '../../testing/test-module';

describe('IngredientService', () => {
  let service: IngredientService;

  beforeEach(() => {
    TestBed.configureTestingModule(testModule());
    service = TestBed.inject(IngredientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

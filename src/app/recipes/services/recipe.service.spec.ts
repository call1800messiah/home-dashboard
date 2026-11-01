import { TestBed } from '@angular/core/testing';

import { RecipeService } from './recipe.service';
import { testModule } from '../../testing/test-module';

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule(testModule());
    service = TestBed.inject(RecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

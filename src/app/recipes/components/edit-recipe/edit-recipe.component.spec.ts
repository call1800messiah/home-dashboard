import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRecipeComponent } from './edit-recipe.component';
import { RecipesModule } from '../../recipes.module';
import { testModule } from '../../../testing/test-module';
import { RecipeService } from '../../services/recipe.service';
import { FormControl } from '@angular/forms';

describe('AddRecipeComponent', () => {
  let component: EditRecipeComponent;
  let fixture: ComponentFixture<EditRecipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(RecipesModule))
    .compileComponents();

    fixture = TestBed.createComponent(EditRecipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('portions', () => {
    let storeSpy: jasmine.Spy;

    beforeEach(() => {
      storeSpy = spyOn(TestBed.inject(RecipeService), 'storeRecipe').and.resolveTo(true);
      component.recipeForm.patchValue({ name: 'Test', time: '00:30' });
      component.recipeForm.addControl('ing-abc-amo', new FormControl(500));
      component.recipeForm.addControl('ing-abc-uni', new FormControl('g'));
      component.recipeForm.addControl('ing-def-amo', new FormControl(100));
      component.recipeForm.addControl('ing-def-uni', new FormControl('ml'));
    });

    function storedRecipe(): any {
      return storeSpy.calls.mostRecent().args[0];
    }

    it('should default to one portion', () => {
      expect(component.recipeForm.value.portions).toBe(1);
    });

    it('should store amounts unchanged for one portion', () => {
      component.save();
      expect(storedRecipe()['ing-abc-amo']).toBe(500);
      expect(storedRecipe()['ing-def-amo']).toBe(100);
    });

    it('should divide amounts by the number of portions', () => {
      component.recipeForm.patchValue({ portions: 4 });
      component.save();
      expect(storedRecipe()['ing-abc-amo']).toBe(125);
      expect(storedRecipe()['ing-def-amo']).toBe(25);
      expect(storedRecipe()['ing-abc-uni']).toBe('g');
    });

    it('should round divided amounts to two decimals', () => {
      component.recipeForm.patchValue({ portions: 3 });
      component.save();
      expect(storedRecipe()['ing-def-amo']).toBe(33.33);
    });

    it('should treat invalid portion counts as one portion', () => {
      for (const portions of [0, -2, null]) {
        component.recipeForm.patchValue({ portions });
        component.save();
        expect(storedRecipe()['ing-abc-amo']).toBe(500);
      }
    });

    it('should not pass the portion count on to the service', () => {
      component.recipeForm.patchValue({ portions: 4 });
      component.save();
      expect(storedRecipe().portions).toBeUndefined();
    });
  });
});

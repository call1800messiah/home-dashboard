import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { ListRecipesComponent } from './list-recipes.component';
import { RecipesModule } from '../../recipes.module';
import type { Recipe } from '../../models/recipe';
import { testModule } from '../../../testing/test-module';

describe('ListComponent', () => {
  let component: ListRecipesComponent;
  let fixture: ComponentFixture<ListRecipesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(RecipesModule))
    .compileComponents();

    fixture = TestBed.createComponent(ListRecipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps recipe cards and ingredient chips when the recipes re-emit as new objects', () => {
    // Firestore emits fresh objects on every save, so rows must be tracked by id, not identity.
    const makeRecipes = (): Recipe[] => ['a', 'b'].map((id) => ({
      id,
      author: 'u',
      children: [],
      created: new Date(0),
      edited: new Date(0),
      editedBy: 'u',
      name: `recipe ${id}`,
      requirements: ['x', 'y'].map((ingredientId) => ({
        amount: 1,
        ingredient: { id: ingredientId, name: `ingredient ${ingredientId}`, type: 'fruit' },
        unit: 'g',
      })),
      time: { hours: 0, minutes: 10 },
    }));
    const recipes = new BehaviorSubject(makeRecipes());
    component.recipes$ = recipes;
    const render = () => {
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      return Array.from(fixture.nativeElement.querySelectorAll('mat-card.recipe, span.ingredient'));
    };

    const rowsBefore = render();
    recipes.next(makeRecipes());
    const rowsAfter = render();

    expect(rowsBefore.length).toBe(6);
    expect(rowsAfter.length).toBe(6);
    rowsAfter.forEach((row, index) => expect(row).toBe(rowsBefore[index]));
  });
});

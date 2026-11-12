import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { ListIngredientsComponent } from './list-ingredients.component';
import { RecipesModule } from '../../recipes.module';
import type { Ingredient } from '../../models/ingredient';
import { testModule } from '../../../testing/test-module';

describe('ListIngredientsComponent', () => {
  let component: ListIngredientsComponent;
  let fixture: ComponentFixture<ListIngredientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(RecipesModule))
    .compileComponents();

    fixture = TestBed.createComponent(ListIngredientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps ingredient cards when the ingredients re-emit as new objects', () => {
    // Firestore emits fresh objects on every save, so cards must be tracked by id, not identity.
    const makeIngredients = (): Ingredient[] => ['a', 'b'].map((id) => ({ id, name: `ingredient ${id}`, type: 'fruit' }));
    const ingredients = new BehaviorSubject(makeIngredients());
    component.ingredients$ = ingredients;
    const render = () => {
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      return Array.from(fixture.nativeElement.querySelectorAll('mat-card.ingredient'));
    };

    const cardsBefore = render();
    ingredients.next(makeIngredients());
    const cardsAfter = render();

    expect(cardsBefore.length).toBe(2);
    expect(cardsAfter.length).toBe(2);
    cardsAfter.forEach((card, index) => expect(card).toBe(cardsBefore[index]));
  });
});

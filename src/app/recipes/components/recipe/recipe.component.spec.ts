import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { RecipeComponent } from './recipe.component';
import { RecipesModule } from '../../recipes.module';
import { SendIngredientsComponent } from '../send-ingredients/send-ingredients.component';
import type { Recipe } from '../../models/recipe';
import { AuthService } from '../../../core/services/auth.service';
import { testModule } from '../../../testing/test-module';

const flour = { id: 'i1', name: 'Mehl', type: 'dry' } as never;
const base = { author: 'a', created: new Date(0), edited: new Date(0), editedBy: 'a', time: { hours: 0, minutes: 0 } };

function recipe(ownIngredients: boolean, childIngredients: boolean): Recipe {
  const requirement = { ingredient: flour, amount: 100, unit: 'g' };
  const child: Recipe = { ...base, id: 'c', name: 'Teig', children: [], requirements: childIngredients ? [requirement] : [] };
  return { ...base, id: 'r', name: 'Brot', children: [child], requirements: ownIngredients ? [requirement] : [] };
}

describe('RecipeComponent', () => {
  let component: RecipeComponent;
  let fixture: ComponentFixture<RecipeComponent>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    const module = testModule(RecipesModule);
    await TestBed.configureTestingModule({
      ...module,
      providers: [
        ...module.providers!,
        { provide: MatDialog, useValue: dialog },
        { provide: AuthService, useValue: { user$: of({ id: 'u1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeComponent);
    component = fixture.componentInstance;
  });

  function show(shown: Recipe): void {
    component.recipe = shown;
    fixture.detectChanges();
  }

  function button(): HTMLButtonElement | undefined {
    return fixture.debugElement.queryAll(By.css('button'))
      .map((debugElement) => debugElement.nativeElement as HTMLButtonElement)
      .find((element) => element.textContent?.includes('Auf Liste'));
  }

  it('should create', () => {
    show(recipe(true, false));

    expect(component).toBeTruthy();
  });

  it('shows Auf Liste when only a sub-recipe has ingredients', () => {
    show(recipe(false, true));

    expect(button()).toBeDefined();
  });

  it('hides Auf Liste without ingredients', () => {
    show(recipe(false, false));

    expect(button()).toBeUndefined();
  });

  it('opens the dialog with the current portions', () => {
    component.onServingsChanged(6);
    show(recipe(true, false));

    button()!.click();

    expect(dialog.open).toHaveBeenCalledWith(
      SendIngredientsComponent,
      jasmine.objectContaining({ data: jasmine.objectContaining({ servings: 6, userID: 'u1' }) }),
    );
  });
});

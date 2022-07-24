import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, UntypedFormGroup } from '@angular/forms';
import { combineLatest, firstValueFrom, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';

import { EditRecipeData } from '../../models/edit-recipe-data';
import { RecipeService } from '../../services/recipe.service';
import { IngredientRequirement } from '../../models/ingredient-requirement';
import { Recipe } from '../../models/recipe';
import { Ingredient } from '../../models/ingredient';
import { IngredientService } from '../../services/ingredient.service';
import { EditIngredientComponent } from '../edit-ingredient/edit-ingredient.component';



@Component({
  selector: 'app-add-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss']
})
export class EditRecipeComponent implements OnInit {
  requirements!: IngredientRequirement[];
  recipeForm = new UntypedFormGroup({
    'ing-new-name': new FormControl<string | Ingredient>(''),
    'ing-new-amo': new FormControl(0),
    'ing-new-uni': new FormControl(''),
    instructions: new FormControl(''),
    name: new FormControl(''),
    summary: new FormControl(''),
    time: new FormControl('00:00'),
  });
  ingredients$!: Observable<Ingredient[]>;

  constructor(
    public dialogRef: MatDialogRef<EditRecipeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRecipeData,
    private dialog: MatDialog,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
  ) { }

  ngOnInit(): void {
    if (this.data?.recipe) {
      const recipe = this.data.recipe;
      this.requirements = [...recipe.requirements];
      this.recipeForm.patchValue({
        ...recipe,
        time: `${recipe.time.hours || '00'}:${recipe.time.minutes || '00'}`,
      });
      this.requirements.forEach((requirement) => {
        this.recipeForm.addControl(`ing-${requirement.ingredient.id}-amo`, new FormControl(requirement.amount));
        this.recipeForm.addControl(`ing-${requirement.ingredient.id}-uni`, new FormControl(requirement.unit));
      });
    } else {
      this.requirements = [];
    }

    this.ingredients$ = combineLatest([
      this.recipeForm.controls['ing-new-name'].valueChanges.pipe(
        startWith(this.recipeForm.controls['ing-new-name'].value),
      ),
      this.ingredientService.getIngredients(),
    ]).pipe(
      map(([item, list]) => EditRecipeComponent.filterIngredientListByValue(item, list))
    );
  }

  async addIngredient(): Promise<void> {
    const ingredient = this.recipeForm.controls['ing-new-name'].value;
    let added: Ingredient;
    if (typeof ingredient === 'string') {
      const dialogRef = this.dialog.open(EditIngredientComponent, {
        data: {
          newName: ingredient,
        },
        width: '500px',
      });
      const addedSuccessfully = await firstValueFrom(dialogRef.afterClosed());
      if (!addedSuccessfully) {
        console.warn('No ingredient was created for name', ingredient);
        return;
      }
      const newIngredient = await firstValueFrom(this.ingredientService.getIngredientByName(ingredient));
      if (!newIngredient) {
        console.error('Did not find ingredient with name', ingredient);
        return;
      }
      added = newIngredient;
    } else {
      added = ingredient;
    }

    // Add the new requirement to the requirements
    const ingredientRequirement: IngredientRequirement = {
      ingredient: added,
      amount: this.recipeForm.controls['ing-new-amo'].value,
      unit: this.recipeForm.controls['ing-new-uni'].value,
    };
    this.requirements.push(ingredientRequirement);
    this.recipeForm.addControl(`ing-${added.id}-amo`, new FormControl(ingredientRequirement.amount));
    this.recipeForm.addControl(`ing-${added.id}-uni`, new FormControl(ingredientRequirement.unit));

    // Reset new requirement inputs
    this.recipeForm.controls['ing-new-name'].setValue('');
    this.recipeForm.controls['ing-new-amo'].setValue(0);
    this.recipeForm.controls['ing-new-uni'].setValue('');
  }

  close(): void {
    this.dialogRef.close(false);
  }

  ingredientDisplayFn(ingredient: Ingredient): string {
    return ingredient && ingredient.name ? ingredient.name : '';
  }

  removeIngredient(requirement: IngredientRequirement): void {
    const index = this.requirements.findIndex((req) => req.ingredient.id === requirement.ingredient.id);
    if (index !== -1) {
      this.requirements.splice(index, 1);
      this.recipeForm.removeControl(`ing-${requirement.ingredient.id}-amo`);
      this.recipeForm.removeControl(`ing-${requirement.ingredient.id}-uni`);
    }
  }

  save(): void {
    const time = this.recipeForm.value.time.split(':');
    const recipe: Recipe = {
      ...this.recipeForm.value,
      time: {
        hours: parseInt(time[0], 10),
        minutes: parseInt(time[1], 10),
      },
      requirements: this.requirements,
    };
    this.recipeService.storeRecipe(recipe, this.data?.recipe?.id).then(result => {
      this.dialogRef.close(result);
    });
  }

  private static filterIngredientListByValue(value: string | Ingredient, list: Ingredient[]): Ingredient[] {
    if (typeof value !== 'string') {
      return [];
    }
    const filterValue = value.toLowerCase();

    return list.filter(option => option.name.toLowerCase().includes(filterValue));
  }
}

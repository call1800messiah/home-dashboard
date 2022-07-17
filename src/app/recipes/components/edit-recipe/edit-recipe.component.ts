import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, UntypedFormGroup } from '@angular/forms';

import { EditRecipeData } from '../../models/edit-recipe-data';
import { RecipeService } from '../../services/recipe.service';
import { IngredientRequirement } from '../../models/ingredient-requirement';
import { Recipe } from '../../models/recipe';
import { Ingredient } from '../../models/ingredient';



@Component({
  selector: 'app-add-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss']
})
export class EditRecipeComponent implements OnInit {
  ingredients!: IngredientRequirement[];
  recipeForm = new UntypedFormGroup({
    instructions: new FormControl(''),
    name: new FormControl(''),
    summary: new FormControl(''),
    time: new FormControl('00:00'),
  });

  constructor(
    public dialogRef: MatDialogRef<EditRecipeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRecipeData,
    private recipeService: RecipeService,
  ) { }

  ngOnInit(): void {
    if (this.data?.recipe) {
      const recipe = this.data.recipe;
      this.ingredients = [...recipe.ingredients];
      this.recipeForm.patchValue({
        ...recipe,
        time: `${recipe.time.hours || '00'}:${recipe.time.minutes || '00'}`,
      });
      this.ingredients.forEach((ingredient) => {
        this.recipeForm.addControl(`ing-${ingredient.ingredient.id}-amo`, new FormControl(ingredient.amount));
        this.recipeForm.addControl(`ing-${ingredient.ingredient.id}-uni`, new FormControl(ingredient.unit));
      });
    } else {
      this.ingredients = [];
    }
  }

  addIngredient(ingredient: Ingredient): void {
    const ingredientRequirement: IngredientRequirement = {
      ingredient,
      amount: 0,
      unit: ''
    };
    this.ingredients.push(ingredientRequirement);
    this.recipeForm.addControl(`ing-${ingredient.id}-amo`, new FormControl(ingredientRequirement.amount));
    this.recipeForm.addControl(`ing-${ingredient.id}-uni`, new FormControl(ingredientRequirement.unit));
  }

  close(): void {
    this.dialogRef.close(false);
  }

  removeIngredient(requirement: IngredientRequirement): void {
    const index = this.ingredients.findIndex((req) => req.ingredient.id === requirement.ingredient.id);
    if (index !== -1) {
      this.ingredients.splice(index, 1);
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
    };
    this.recipeService.storeRecipe(recipe, this.data?.recipe?.id).then(result => {
      this.dialogRef.close(result);
    });
  }
}

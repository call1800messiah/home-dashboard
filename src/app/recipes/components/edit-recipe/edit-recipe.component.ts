import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, UntypedFormGroup } from '@angular/forms';
import { combineLatest, firstValueFrom, Observable, startWith, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { EditRecipeData } from '../../models/edit-recipe-data';
import { RecipeService } from '../../services/recipe.service';
import { IngredientRequirement } from '../../models/ingredient-requirement';
import { Recipe } from '../../models/recipe';
import { Ingredient } from '../../models/ingredient';
import { IngredientService } from '../../services/ingredient.service';
import { EditIngredientComponent } from '../edit-ingredient/edit-ingredient.component';
import { AuthService } from '../../../core/services/auth.service';



@Component({
  selector: 'app-add-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss']
})
export class EditRecipeComponent implements OnInit, OnDestroy {
  requirements!: IngredientRequirement[];
  recipeForm = new UntypedFormGroup({
    'new-name': new FormControl<string | Ingredient>(''),
    'new-amo': new FormControl(0),
    'new-uni': new FormControl(''),
    instructions: new FormControl(''),
    name: new FormControl(''),
    summary: new FormControl(''),
    time: new FormControl('00:00'),
  });
  ingredients$!: Observable<Ingredient[]>;
  private userID!: string;
  private subscription = new Subscription();

  constructor(
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: EditRecipeData,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<EditRecipeComponent>,
    private ingredientService: IngredientService,
    private recipeService: RecipeService,
  ) {
    this.subscription.add(
      this.auth.user$.subscribe((user) => {
        if (user) {
          this.userID = user.id;
        }
      })
    );
  }

  ngOnInit(): void {
    if (this.data?.recipe) {
      const recipe = this.data.recipe;
      this.requirements = [...recipe.requirements];
      this.recipeForm.patchValue({
        ...recipe,
        time: `${this.zeroPad(recipe.time.hours) || '00'}:${this.zeroPad(recipe.time.minutes) || '00'}`,
      });
      this.requirements.forEach((requirement) => {
        this.recipeForm.addControl(`ing-${requirement.ingredient.id}-amo`, new FormControl(requirement.amount));
        this.recipeForm.addControl(`ing-${requirement.ingredient.id}-uni`, new FormControl(requirement.unit));
      });
    } else {
      this.requirements = [];
    }

    this.ingredients$ = combineLatest([
      this.recipeForm.controls['new-name'].valueChanges.pipe(
        startWith(this.recipeForm.controls['new-name'].value),
      ),
      this.ingredientService.getIngredients(),
    ]).pipe(
      map(([item, list]) => EditRecipeComponent.filterIngredientListByValue(item, list))
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  async addIngredient(): Promise<void> {
    const ingredient = this.recipeForm.controls['new-name'].value;
    let added: Ingredient;
    if (typeof ingredient === 'string') {
      const dialogRef = this.dialog.open(EditIngredientComponent, {
        data: {
          newName: ingredient,
        },
        maxHeight: '90vh',
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
      amount: this.recipeForm.controls['new-amo'].value,
      unit: this.recipeForm.controls['new-uni'].value,
    };
    this.requirements.push(ingredientRequirement);
    this.recipeForm.addControl(`ing-${added.id}-amo`, new FormControl(ingredientRequirement.amount));
    this.recipeForm.addControl(`ing-${added.id}-uni`, new FormControl(ingredientRequirement.unit));

    // Reset new requirement inputs
    this.recipeForm.controls['new-name'].setValue('');
    this.recipeForm.controls['new-amo'].setValue(0);
    this.recipeForm.controls['new-uni'].setValue('');
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
      edited: new Date(),
      editedBy: this.userID,
      time: {
        hours: parseInt(time[0], 10),
        minutes: parseInt(time[1], 10),
      },
    };
    if (!this.data?.recipe?.id) {
      recipe.author = this.userID;
      recipe.created = recipe.edited;
    }
    if (this.data?.parent) {
      // If this is a new child recipe
      recipe.parent = this.data.parent;
    } else if (this.data?.recipe?.parent) {
      // If we are editing an existing child recipe
      recipe.parent = this.data.recipe.parent;
    }

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

  private zeroPad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`
  }
}

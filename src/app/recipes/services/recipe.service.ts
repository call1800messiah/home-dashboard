import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import FieldValue = firebase.firestore.FieldValue;

import { Recipe } from '../models/recipe';
import { ApiService } from '../../core/services/api.service';
import { Ingredient } from '../models/ingredient';
import { IngredientService } from './ingredient.service';
import { RecipeDbo } from '../models/recipe-dbo';
import { DataService } from '../../core/services/data.service';
import { IngredientRequirement } from '../models/ingredient-requirement';



@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  static readonly collection = 'recipes';
  private recipes$!: BehaviorSubject<Recipe[]>;

  constructor(
    private api: ApiService,
    private data: DataService,
    private ingredientsService: IngredientService,
  ) {}

  static deserializeRecipes([recipes, ingredients]: [any, Ingredient[]]): Recipe[] {
    return recipes.reduce((all: any, recipeData: any) => {
      const recipeIngredients = Object.entries(recipeData.ingredients).reduce((allI: any, [id, amount]: any) => {
        const ingredient = ingredients.find((ing) => ing.id === id);
        if (ingredient && recipeData.ingredientUnits[id] !== undefined) {
          allI.push({
            amount: amount,
            ingredient,
            unit: recipeData.ingredientUnits[id],
          });
        }
        return allI;
      }, []);

      all.push({
        id: recipeData.id,
        requirements: recipeIngredients.sort((
          a: IngredientRequirement,
          b: IngredientRequirement
        ) => a.ingredient.name.localeCompare(b.ingredient.name, 'de-DE')),
        instructions: recipeData.instructions,
        name: recipeData.name,
        summary: recipeData.summary,
        time: {
          hours: Math.floor(recipeData.time),
          minutes: Math.floor(recipeData.time % 1 * 60),
        },
      });
      return all;
    }, []);
  }

  getRecipeById(id: string): Observable<Recipe|undefined> {
    return this.getRecipes().pipe(
      map((recipes) => recipes.find(recipe => recipe.id === id))
    );
  }

  getRecipes(): Observable<Recipe[]> {
    if (!this.recipes$) {
      this.recipes$ = new BehaviorSubject<Recipe[]>([]);
      combineLatest([
        this.api.getDataFromCollection(RecipeService.collection),
        this.ingredientsService.getIngredients()
      ]).pipe(
        map(RecipeService.deserializeRecipes)
      ).subscribe((recipes: Recipe[]) => {
        this.recipes$.next(recipes);
      })
    }

    return this.recipes$.asObservable();
  }

  serializeRecipe(recipe: Omit<Recipe, 'id'>, recipeId?: string): RecipeDbo {
    let ingredients: Record<string, number | FieldValue> = {};
    let ingredientUnits: Record<string, string | FieldValue> = {};

    recipe.requirements?.forEach((requirement) => {
      ingredients[requirement.ingredient.id] = requirement.amount;
      ingredientUnits[requirement.ingredient.id] = requirement.unit;
    });

    if (recipeId) {
      this.getRecipeById(recipeId).pipe(
        take(1),
      ).subscribe((currentRecipe) => {
        if (!currentRecipe) {
          return;
        }
        currentRecipe.requirements.forEach((requirement) => {
          if (!ingredients[requirement.ingredient.id]) {
            ingredients[requirement.ingredient.id] = FieldValue.delete();
            ingredientUnits[requirement.ingredient.id] = FieldValue.delete();
          }
        });
      })
    }

    return {
      ingredients,
      ingredientUnits,
      instructions: recipe.instructions,
      name: recipe.name,
      summary: recipe.summary,
      time: (recipe.time?.hours ?? 0) + ((recipe.time?.minutes ?? 0) / 60)
    };
  }

  storeRecipe(recipe: Omit<Recipe, 'id'>, id?: string): Promise<boolean> {
    return this.data.store(this.serializeRecipe(recipe, id), RecipeService.collection, id);
  }
}

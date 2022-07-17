import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Recipe } from '../models/recipe';
import { ApiService } from '../../core/services/api.service';
import { Ingredient } from '../models/ingredient';
import { IngredientService } from './ingredient.service';
import { RecipeDbo } from '../models/recipe-dbo';
import { DataService } from '../../core/services/data.service';



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
        if (ingredient && recipeData.ingredientUnits[id]) {
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
        ingredients: recipeIngredients,
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

  static serializeRecipe(recipe: Omit<Recipe, 'id'>): RecipeDbo {
    let ingredients: Record<string, number> = {};
    let ingredientUnits: Record<string, string> = {};

    recipe.ingredients?.forEach((requirement) => {
      ingredients[requirement.ingredient.id] = requirement.amount;
      ingredientUnits[requirement.ingredient.id] = requirement.unit;
    });

    return {
      ingredients,
      ingredientUnits,
      instructions: recipe.instructions,
      name: recipe.name,
      summary: recipe.summary,
      time: (recipe.time?.hours ?? 0) + ((recipe.time?.minutes ?? 0) / 60)
    };
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

  storeRecipe(recipe: Omit<Recipe, 'id'>, id?: string): Promise<boolean> {
    return this.data.store(RecipeService.serializeRecipe(recipe), RecipeService.collection, id);
  }
}

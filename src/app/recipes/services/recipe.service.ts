import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Recipe } from '../models/recipe';
import { ApiService } from '../../core/services/api.service';
import { Ingredient } from '../models/ingredient';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private ingredients$!: BehaviorSubject<Ingredient[]>;
  private recipes$!: BehaviorSubject<Recipe[]>;

  constructor(
    private api: ApiService
  ) {}

  static deserializeIngredients(ingredients: any): Ingredient[] {
    return ingredients.reduce((all: any, ingredientData: any) => {
      all.push(ingredientData);
      return all;
    }, []);
  }

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

  getRecipeById(id: string): Observable<Recipe|undefined> {
    return this.getRecipes().pipe(
      map((recipes) => recipes.find(recipe => recipe.id === id))
    );
  }

  getRecipes(): Observable<Recipe[]> {
    if (!this.recipes$) {
      this.recipes$ = new BehaviorSubject<Recipe[]>([]);
      combineLatest([
        this.api.getDataFromCollection('recipes'),
        this.getIngredients()
      ]).pipe(
        map(RecipeService.deserializeRecipes)
      ).subscribe((recipes: Recipe[]) => {
        this.recipes$.next(recipes);
      })
    }

    return this.recipes$.asObservable();
  }

  getIngredients(): Observable<Ingredient[]> {
    if (!this.ingredients$) {
      this.ingredients$ = new BehaviorSubject<Ingredient[]>([]);
      this.api.getDataFromCollection('ingredients').pipe(
        map(RecipeService.deserializeIngredients)
      ).subscribe((ingredients: Ingredient[]) => {
        this.ingredients$.next(ingredients);
      })
    }

    return this.ingredients$.asObservable();
  }
}

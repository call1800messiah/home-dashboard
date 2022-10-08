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
  private recipeMap: Record<string, Recipe | undefined> = {};

  constructor(
    private api: ApiService,
    private data: DataService,
    private ingredientsService: IngredientService,
  ) {}

  deleteRecipe(id: string): Promise<void> {
    return this.api.deleteDocumentFromCollection(id, RecipeService.collection);
  }

  deserializeRecipes([recipes, ingredients]: [any, Ingredient[]]): Recipe[] {
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

      const recipe = {
        author: recipeData.author ?? '',
        children: [],
        created: recipeData.created ?? '',
        edited: recipeData.edited ?? '',
        editedBy: recipeData.editedBy ?? '',
        id: recipeData.id,
        instructions: recipeData.instructions ?? '',
        name: recipeData.name || 'Missing name',
        parent: recipeData.parent,
        requirements: recipeIngredients.sort((
          a: IngredientRequirement,
          b: IngredientRequirement
        ) => a.ingredient.name.localeCompare(b.ingredient.name, 'de-DE')),
        summary: recipeData.summary ?? '',
        time: {
          hours: Math.floor(recipeData.time),
          minutes: Math.floor(recipeData.time % 1 * 60),
        },
      };
      this.recipeMap[recipe.id] = recipe;
      all.push(recipe);
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
        map(this.deserializeRecipes.bind(this)),
        map(this.resolveRecipeChildren.bind(this)),
      ).subscribe((recipes: Recipe[]) => {
        this.recipes$.next(recipes);
      });
    }

    return this.recipes$.asObservable();
  }

  resolveRecipeChildren(recipes: Recipe[]): Recipe[] {
    recipes.forEach((recipe) => {
      if (recipe.parent) {
        this.recipeMap[recipe.parent]?.children.push(recipe);
      }
    });
    return recipes;
  }

  serializeRecipe(recipe: Omit<Recipe, 'id'>, recipeId?: string): RecipeDbo {
    let ingredients: Record<string, number | FieldValue> = {};
    let ingredientUnits: Record<string, string | FieldValue> = {};

    Object.entries(recipe).forEach(([key, value]) => {
      const split = key.split('-');
      if (split[0] === 'ing' && split[2] === 'amo') {
        ingredients[split[1]] = value as unknown as number;
      }
      if (split[0] === 'ing' && split[2] === 'uni') {
        ingredientUnits[split[1]] = value as unknown as string;
      }
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

    const recipeDBO: RecipeDbo = {
      edited: recipe.edited,
      editedBy: recipe.editedBy,
      ingredients,
      ingredientUnits,
      instructions: recipe.instructions || '',
      name: recipe.name,
      summary: recipe.summary || '',
      time: (recipe.time?.hours ?? 0) + ((recipe.time?.minutes ?? 0) / 60)
    };
    if (!recipeId) {
      recipeDBO.author = recipe.author;
      recipeDBO.created = recipe.created;
    }
    if (recipe.parent) {
      recipeDBO.parent = recipe.parent;
    }

    return recipeDBO;
  }

  storeRecipe(recipe: Omit<Recipe, 'id'>, id?: string): Promise<boolean> {
    return this.data.store(this.serializeRecipe(recipe, id), RecipeService.collection, id);
  }
}

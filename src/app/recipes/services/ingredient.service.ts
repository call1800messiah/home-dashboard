import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Ingredient } from '../models/ingredient';
import { ApiService } from '../../core/services/api.service';
import { UtilService } from '../../core/services/util.service';
import { DataService } from '../../core/services/data.service';



@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  static readonly collection = 'ingredients';
  static ingredientTypes = {
    dairy: 'Milchprodukt',
    fish: 'Fisch',
    fluid: 'Flüssigkeit',
    fruit: 'Obst',
    grain: 'Getreide',
    meat: 'Fleisch',
    spice: 'Gewürz',
    vegetable: 'Gemüse'
  };
  private ingredients$!: BehaviorSubject<Ingredient[]>;

  constructor(
    private api: ApiService,
    private data: DataService,
  ) {}

  static deserializeIngredients(ingredients: any): Ingredient[] {
    return ingredients.reduce((all: any, ingredientData: any) => {
      all.push(ingredientData);
      return all;
    }, []);
  }

  getIngredientByName(name: string): Observable<Ingredient | undefined> {
    return this.ingredients$.pipe(
      map((ingredients) => ingredients.find((ingredient) => ingredient.name === name))
    )
  }

  getIngredients(): Observable<Ingredient[]> {
    if (!this.ingredients$) {
      this.ingredients$ = new BehaviorSubject<Ingredient[]>([]);
      this.api.getDataFromCollection(IngredientService.collection).pipe(
        map(IngredientService.deserializeIngredients),
        map((ingredients) => ingredients.sort(UtilService.orderByName)),
      ).subscribe((ingredients: Ingredient[]) => {
        this.ingredients$.next(ingredients);
      })
    }

    return this.ingredients$.asObservable();
  }

  storeIngredient(ingredient: Omit<Ingredient, 'id'>, id?: string): Promise<boolean> {
    return this.data.store(ingredient, IngredientService.collection, id);
  }
}

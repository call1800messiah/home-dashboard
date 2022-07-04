import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Ingredient } from '../models/ingredient';
import { ApiService } from '../../core/services/api.service';



@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  static readonly collection = 'ingredients';
  private ingredients$!: BehaviorSubject<Ingredient[]>;

  constructor(
    private api: ApiService
  ) {}

  static deserializeIngredients(ingredients: any): Ingredient[] {
    return ingredients.reduce((all: any, ingredientData: any) => {
      all.push(ingredientData);
      return all;
    }, []);
  }

  getIngredients(): Observable<Ingredient[]> {
    if (!this.ingredients$) {
      this.ingredients$ = new BehaviorSubject<Ingredient[]>([]);
      this.api.getDataFromCollection(IngredientService.collection).pipe(
        map(IngredientService.deserializeIngredients)
      ).subscribe((ingredients: Ingredient[]) => {
        this.ingredients$.next(ingredients);
      })
    }

    return this.ingredients$.asObservable();
  }
}

import { Component, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { Ingredient } from '../../models/ingredient';
import { IngredientService } from '../../services/ingredient.service';
import { EditIngredientComponent } from '../edit-ingredient/edit-ingredient.component';

@Component({
  selector: 'app-list-ingredients',
  templateUrl: './list-ingredients.component.html',
  styleUrls: ['./list-ingredients.component.scss']
})
export class ListIngredientsComponent implements OnInit {
  filterText: BehaviorSubject<string>;
  ingredients$: Observable<Ingredient[]>;
  ingredientTypes = IngredientService.ingredientTypes;

  constructor(
    private dialog: MatDialog,
    private ingredientService: IngredientService,
  ) {
    this.filterText = new BehaviorSubject<string>('');
    this.ingredients$ = combineLatest([
      this.ingredientService.getIngredients(),
      this.filterText,
    ]).pipe(
      map(this.filterIngredientsByText),
    );
  }

  ngOnInit(): void {
  }

  addIngredient(): void {
    this.dialog.open(EditIngredientComponent, {
      disableClose: true,
      maxHeight: '90vh',
      width: '500px',
    });
  }

  editIngredient(ingredient: Ingredient): void {
    this.dialog.open(EditIngredientComponent, {
      data: {
        ingredient
      },
      disableClose: true,
      maxHeight: '90vh',
      width: '500px',
    });
  }


  onFilterChanged(text: string) {
    this.filterText.next(text);
  }


  private filterIngredientsByText([ingredients, text]: [Ingredient[], string]): Ingredient[] {
    return ingredients.filter((ingredient) => {
      return ingredient.name.toLowerCase().includes(text.toLowerCase())
        || IngredientService.ingredientTypes[ingredient.type].toLowerCase().includes(text.toLowerCase());
    });
  }
}

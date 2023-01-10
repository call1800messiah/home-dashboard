import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Ingredient } from '../../models/ingredient';
import { IngredientService } from '../../services/ingredient.service';
import { EditIngredientComponent } from '../edit-ingredient/edit-ingredient.component';

@Component({
  selector: 'app-list-ingredients',
  templateUrl: './list-ingredients.component.html',
  styleUrls: ['./list-ingredients.component.scss']
})
export class ListIngredientsComponent implements OnInit {
  ingredients$: Observable<Ingredient[]>;
  ingredientTypes = IngredientService.ingredientTypes;

  constructor(
    private dialog: MatDialog,
    private ingredientService: IngredientService,
  ) {
    this.ingredients$ = this.ingredientService.getIngredients();
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
}

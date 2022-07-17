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

  editIngredient(ingredient: Ingredient): void {
    const dialogRef = this.dialog.open(EditIngredientComponent, {
      data: {
        ingredient
      },
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
    });
  }
}

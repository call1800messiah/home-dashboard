import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, switchMap } from 'rxjs';

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';
import { EditRecipeComponent } from '../edit-recipe/edit-recipe.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';



@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent implements OnInit, OnDestroy {
  recipe!: Recipe;
  recipeTypes = RecipeService.recipeTypes;
  servings: number;
  private recipeSub!: Subscription;

  constructor(
    private dialog: MatDialog,
    private recipeService: RecipeService,
    private route: ActivatedRoute,
  ) {
    this.servings = 4;
  }

  ngOnInit(): void {
    this.recipeSub = this.route.paramMap.pipe(
      switchMap(params => {
        return this.recipeService.getRecipeById(params.get('id') ?? '');
      }),
    ).subscribe((recipe) => {
      if (recipe) {
        this.recipe = recipe;
      }
    });
  }

  ngOnDestroy() {
    this.recipeSub.unsubscribe();
  }


  addChildRecipe() {
    this.dialog.open(EditRecipeComponent, {
      data: {
        parent: this.recipe.id,
      },
      disableClose: true,
      maxHeight: '90vh',
      width: '750px',
    });
  }

  deleteRecipe(recipe: Recipe): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        question: `Willst du das Rezept ${recipe.name} wirklich löschen?`,
        onConfirm: () => {
          this.recipeService.deleteRecipe(recipe.id);
        }
      },
      disableClose: true,
      maxWidth: '90vw',
      width: '400px',
    });
  }

  editRecipe(recipe: Recipe): void {
    this.dialog.open(EditRecipeComponent, {
      data: {
        recipe,
      },
      disableClose: true,
      maxHeight: '90vh',
      width: '750px',
    });
  }

  onServingsChanged(amount: number) {
    this.servings = amount;
  }
}

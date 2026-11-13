import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, switchMap } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';
import { EditRecipeComponent } from '../edit-recipe/edit-recipe.component';
import { SendIngredientsComponent } from '../send-ingredients/send-ingredients.component';
import type { SendIngredientsData } from '../../models/send-ingredients-data';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';



@Component({
    selector: 'app-recipe',
    templateUrl: './recipe.component.html',
    styleUrls: ['./recipe.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RecipeComponent implements OnInit, OnDestroy {
  recipe!: Recipe;
  recipeTypes = RecipeService.recipeTypes;
  servings: number;
  userID?: string;
  private recipeSub!: Subscription;
  private userSub!: Subscription;

  constructor(
    private auth: AuthService,
    private dialog: MatDialog,
    private recipeService: RecipeService,
    private route: ActivatedRoute,
  ) {
    this.servings = 4;
  }

  get hasIngredients(): boolean {
    return !!this.recipe && (this.recipe.requirements.length > 0
      || this.recipe.children.some((child) => child.requirements.length > 0));
  }

  ngOnInit(): void {
    this.userSub = this.auth.user$.subscribe((user) => {
      if (user) {
        this.userID = user.id;
      }
    });
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
    this.userSub.unsubscribe();
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

  sendIngredients(): void {
    if (!this.userID) {
      return;
    }
    const data: SendIngredientsData = { recipe: this.recipe, servings: this.servings, userID: this.userID };
    this.dialog.open(SendIngredientsComponent, {
      data,
      maxHeight: '90vh',
      width: '500px',
    });
  }

  onServingsChanged(amount: number) {
    this.servings = amount;
  }
}

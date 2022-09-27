import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';
import { EditRecipeComponent } from '../edit-recipe/edit-recipe.component';



@Component({
  selector: 'app-list-recipes',
  templateUrl: './list-recipes.component.html',
  styleUrls: ['./list-recipes.component.scss']
})
export class ListRecipesComponent implements OnInit {
  recipes$: Observable<Recipe[]>;

  constructor(
    private dialog: MatDialog,
    private recipeService: RecipeService,
    private router: Router,
  ) {
    this.recipes$ = this.recipeService.getRecipes().pipe(
      map((recipes) => recipes.filter((recipe) => !recipe.parent)),
    );
  }

  ngOnInit(): void {
  }


  addRecipe(): void {
    this.dialog.open(EditRecipeComponent, {
      maxHeight: '90vh',
      width: '750px',
    });
  }


  goToRecipe(id: string) {
    this.router.navigate([`recipes/recipe/${id}`]);
  }
}

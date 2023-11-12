import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';
import { EditRecipeComponent } from '../edit-recipe/edit-recipe.component';
import { UtilService } from '../../../core/services/util.service';



@Component({
  selector: 'app-list-recipes',
  templateUrl: './list-recipes.component.html',
  styleUrls: ['./list-recipes.component.scss']
})
export class ListRecipesComponent implements OnInit {
  filterText: BehaviorSubject<string>;
  recipeTypes = RecipeService.recipeTypes;
  recipes$: Observable<Recipe[]>;

  constructor(
    private dialog: MatDialog,
    private recipeService: RecipeService,
    private router: Router,
  ) {
    this.filterText = new BehaviorSubject<string>('');
    this.recipes$ = combineLatest([
      this.recipeService.getRecipes().pipe(
        map((recipes) => recipes.filter((recipe) => !recipe.parent)),
      ),
      this.filterText,
    ]).pipe(
      map(this.filterRecipesByText),
      map((recipes) => recipes.sort(UtilService.orderByName)),
    );
  }

  ngOnInit(): void {
  }


  addRecipe(): void {
    this.dialog.open(EditRecipeComponent, {
      disableClose: true,
      maxHeight: '90vh',
      width: '750px',
    });
  }


  goToRecipe(id: string) {
    this.router.navigate([`recipes/recipe/${id}`]);
  }


  onFilterChanged(text: string) {
    this.filterText.next(text);
  }


  private filterRecipesByText([recipes, text]: [Recipe[], string]): Recipe[] {
    return recipes.filter((recipe) => {
      return recipe.name.toLowerCase().includes(text.toLowerCase())
        || recipe.summary?.toLowerCase().includes(text.toLowerCase())
        || recipe.type && RecipeService.recipeTypes[recipe.type].toLowerCase().includes(text.toLowerCase())
        || recipe.requirements.find((requirement) => requirement.ingredient.name.toLowerCase().includes(text.toLowerCase()));
    });
  }
}

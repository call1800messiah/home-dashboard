import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';
import { EditRecipeComponent } from '../edit-recipe/edit-recipe.component';



@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  recipes$: Observable<Recipe[]>;

  constructor(
    private dialog: MatDialog,
    private recipeService: RecipeService,
    private router: Router,
  ) {
    this.recipes$ = this.recipeService.getRecipes();
  }

  ngOnInit(): void {
  }


  addRecipe(): void {
    const dialogRef = this.dialog.open(EditRecipeComponent, {
      width: '500px'
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
    });
  }


  goToRecipe(id: string) {
    this.router.navigate([`recipes/${id}`]);
  }
}

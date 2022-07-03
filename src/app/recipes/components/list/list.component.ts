import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';



@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  recipes$: Observable<Recipe[]>;

  constructor(
    private recipeService: RecipeService,
    private router: Router,
  ) {
    this.recipes$ = this.recipeService.getRecipes();
  }

  ngOnInit(): void {
  }


  goToRecipe(id: string) {
    this.router.navigate([`recipes/${id}`]);
  }
}

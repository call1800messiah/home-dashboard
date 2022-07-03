import { Component, OnInit } from '@angular/core';
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
  ) {
    this.recipes$ = this.recipeService.getRecipes();
  }

  ngOnInit(): void {
  }

}

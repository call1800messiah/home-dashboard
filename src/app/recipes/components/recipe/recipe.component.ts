import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe';



@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent implements OnInit, OnDestroy {
  recipe!: Recipe;
  private recipeSub!: Subscription;

  constructor(
    private recipeService: RecipeService,
    private route: ActivatedRoute,
  ) {}

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
}

import { NgModule } from '@angular/core';

import { ListRecipesComponent } from './components/list-recipes/list-recipes.component';
import { RecipesRoutingModule } from './recipes-routing.module';
import { SharedModule } from '../shared/shared.module';
import { RecipeComponent } from './components/recipe/recipe.component';
import { RecipeTimeComponent } from './components/recipe-time/recipe-time.component';
import { ListIngredientRequirementsComponent } from './components/list-ingredient-requirements/list-ingredient-requirements.component';
import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';
import { AddIngredientComponent } from './components/add-ingredient/add-ingredient.component';
import { ListIngredientsComponent } from './components/list-ingredients/list-ingredients.component';
import { EditIngredientComponent } from './components/edit-ingredient/edit-ingredient.component';



@NgModule({
  declarations: [
    ListRecipesComponent,
    RecipeComponent,
    RecipeTimeComponent,
    ListIngredientRequirementsComponent,
    EditRecipeComponent,
    AddIngredientComponent,
    ListIngredientsComponent,
    EditIngredientComponent
  ],
  imports: [
    SharedModule,
    RecipesRoutingModule,
  ]
})
export class RecipesModule { }

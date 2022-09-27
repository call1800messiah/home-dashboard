import { NgModule } from '@angular/core';

import { ListRecipesComponent } from './components/list-recipes/list-recipes.component';
import { RecipesRoutingModule } from './recipes-routing.module';
import { SharedModule } from '../shared/shared.module';
import { RecipeComponent } from './components/recipe/recipe.component';
import { RecipeTimeComponent } from './components/recipe-time/recipe-time.component';
import { ListIngredientRequirementsComponent } from './components/list-ingredient-requirements/list-ingredient-requirements.component';
import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';
import { ListIngredientsComponent } from './components/list-ingredients/list-ingredients.component';
import { EditIngredientComponent } from './components/edit-ingredient/edit-ingredient.component';
import { ServingCountComponent } from './components/serving-count/serving-count.component';



@NgModule({
  declarations: [
    ListRecipesComponent,
    RecipeComponent,
    RecipeTimeComponent,
    ListIngredientRequirementsComponent,
    EditRecipeComponent,
    ListIngredientsComponent,
    EditIngredientComponent,
    ServingCountComponent,
  ],
  imports: [
    SharedModule,
    RecipesRoutingModule,
  ]
})
export class RecipesModule { }

import { NgModule } from '@angular/core';

import { ListComponent } from './components/list/list.component';
import { RecipesRoutingModule } from './recipes-routing.module';
import { SharedModule } from '../shared/shared.module';
import { RecipeComponent } from './components/recipe/recipe.component';
import { RecipeTimeComponent } from './components/recipe-time/recipe-time.component';
import { IngredientListComponent } from './components/ingredient-list/ingredient-list.component';



@NgModule({
  declarations: [
    ListComponent,
    RecipeComponent,
    RecipeTimeComponent,
    IngredientListComponent
  ],
  imports: [
    SharedModule,
    RecipesRoutingModule,
  ]
})
export class RecipesModule { }

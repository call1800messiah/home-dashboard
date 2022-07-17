import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListRecipesComponent } from './components/list-recipes/list-recipes.component';
import { RecipeComponent } from './components/recipe/recipe.component';
import { ListIngredientsComponent } from './components/list-ingredients/list-ingredients.component';



const routes: Routes = [{
  path: '',
  children: [
    { path: '', component: ListRecipesComponent, title: 'Rezepte' },
    { path: 'recipe/:id', component: RecipeComponent, title: 'Rezept' },
    { path: 'ingredients', component: ListIngredientsComponent, title: 'Zutaten' },
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecipesRoutingModule { }

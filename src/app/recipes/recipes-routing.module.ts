import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListComponent } from './components/list/list.component';
import { RecipeComponent } from './components/recipe/recipe.component';



const routes: Routes = [{
  path: '',
  children: [
    { path: '', component: ListComponent, title: 'Rezepte' },
    { path: ':id', component: RecipeComponent, title: 'Rezept' },
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecipesRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListsComponent } from './components/lists/lists.component';
import { ListComponent } from './components/list/list.component';



const routes: Routes = [{
  path: '',
  children: [
    { path: '', component: ListsComponent, title: 'Todo Listen' },
    { path: 'list/:id', component: ListComponent, title: 'Todo Liste' },
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TodoRoutingModule { }

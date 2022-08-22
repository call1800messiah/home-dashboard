import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListsComponent } from './components/lists/lists.component';
import { ListComponent } from './components/list/list.component';
import { TodoItemComponent } from './components/todo-item/todo-item.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    ListsComponent,
    ListComponent,
    TodoItemComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
  ]
})
export class TodoModule { }

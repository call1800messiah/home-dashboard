import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListsComponent } from './components/lists/lists.component';
import { ListComponent } from './components/list/list.component';
import { TodoItemComponent } from './components/todo-item/todo-item.component';
import { SharedModule } from '../shared/shared.module';
import { EditTodoListComponent } from './components/edit-todo-list/edit-todo-list.component';
import { TodoRoutingModule } from './todo-routing.module';
import { AddTodoItemComponent } from './components/add-todo-item/add-todo-item.component';
import { EditTodoItemComponent } from './components/edit-todo-item/edit-todo-item.component';



@NgModule({
  declarations: [
    ListsComponent,
    ListComponent,
    TodoItemComponent,
    EditTodoListComponent,
    AddTodoItemComponent,
    EditTodoItemComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TodoRoutingModule,
  ]
})
export class TodoModule { }

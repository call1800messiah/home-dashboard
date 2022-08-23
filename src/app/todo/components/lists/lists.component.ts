import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { TodoList } from '../../models/todo-list';
import { TodoService } from '../../services/todo.service';
import { EditTodoListComponent } from '../edit-todo-list/edit-todo-list.component';



@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.scss']
})
export class ListsComponent implements OnInit {
  public lists$: Observable<TodoList[]>

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private todoService: TodoService,
  ) {
    this.lists$ = this.todoService.getTodoLists();
  }

  ngOnInit(): void {
  }

  addList(): void {
    this.dialog.open(EditTodoListComponent, {
      width: '500px',
    });
  }

  goToList(id: string): void {
    this.router.navigate([`todo/list/${id}`]);
  }
}

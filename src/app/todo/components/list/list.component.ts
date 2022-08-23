import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, switchMap } from 'rxjs';

import { TodoList } from '../../models/todo-list';
import { TodoService } from '../../services/todo.service';
import { EditTodoListComponent } from '../edit-todo-list/edit-todo-list.component';



@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  list!: TodoList;
  private listSub!: Subscription;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private todoService: TodoService,
  ) { }

  ngOnInit(): void {
    this.listSub = this.route.paramMap.pipe(
      switchMap(params => {
        return this.todoService.getListById(params.get('id') ?? '');
      }),
    ).subscribe((list) => {
      if (list) {
        this.list = list;
      }
    });
  }

  ngOnDestroy() {
    this.listSub.unsubscribe();
  }

  editList() {
    this.dialog.open(EditTodoListComponent, {
      data: {
        list: this.list,
      },
      width: '500px',
    });
  }
}

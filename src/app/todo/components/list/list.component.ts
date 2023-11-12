import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, switchMap } from 'rxjs';

import type { TodoList } from '../../models/todo-list';
import { TodoService } from '../../services/todo.service';
import { EditTodoListComponent } from '../edit-todo-list/edit-todo-list.component';
import { AuthService } from '../../../core/services/auth.service';
import { EditTodoItemComponent } from '../edit-todo-item/edit-todo-item.component';



@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  list!: TodoList;
  userID!: string;
  private subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private todoService: TodoService,
  ) {
    this.subscription.add(
      this.auth.user$.subscribe((user) => {
        if (user) {
          this.userID = user.id;
        }
      })
    );
  }

  ngOnInit(): void {
    this.subscription.add(
      this.route.paramMap.pipe(
        switchMap(params => {
          return this.todoService.getListById(params.get('id') ?? '');
        }),
      ).subscribe((list) => {
        if (list) {
          this.list = list;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  addTodoItem() {
    this.dialog.open(EditTodoItemComponent, {
      data: {
        listId: this.list.id,
      },
      width: '500px',
    });
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

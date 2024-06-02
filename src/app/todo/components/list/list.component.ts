import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, switchMap } from 'rxjs';

import type { TodoItem } from '../../models/todo-item';
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
  allowSorting = false;
  list!: TodoList;
  userID!: string;
  finishedItems: TodoItem[] = [];
  visibleItems: TodoItem[] = [];
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
          this.finishedItems = list.items.filter(item => item.done);
          this.visibleItems = list.keepDone ? list.items : list.items.filter(item => !item.done);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  addTodoItemAfter(item?: TodoItem) {
    this.dialog.open(EditTodoItemComponent, {
      data: {
        listId: this.list.id,
        position: item ? this.list.items.findIndex(listItem => listItem.id === item.id) + 1 : 0,
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

  onDrop(event: CdkDragDrop<TodoItem[]>) {
    // Sort the list of items
    const items = [...this.list.items];
    items.splice(event.currentIndex, 0, items.splice(event.previousIndex, 1)[0]);
    const newList: TodoList = {
      ...this.list,
      items
    };
    this.todoService.storeTodoList({
      ...this.list,
      items
    }, newList.id);
  }

  toggleSorting() {
    this.allowSorting = !this.allowSorting;
  }
}

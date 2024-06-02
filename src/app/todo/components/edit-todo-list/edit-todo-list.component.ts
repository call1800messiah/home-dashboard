import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { EditTodoListData } from '../../models/edit-todo-list-data';
import { TodoList } from '../../models/todo-list';
import { AuthService } from '../../../core/services/auth.service';
import { TodoService } from '../../services/todo.service';



@Component({
  selector: 'app-edit-todo-list',
  templateUrl: './edit-todo-list.component.html',
  styleUrls: ['./edit-todo-list.component.scss']
})
export class EditTodoListComponent implements OnInit, OnDestroy {
  listForm =  new UntypedFormGroup({
    name: new FormControl(''),
    keepDone: new FormControl(false),
  });
  private subscription = new Subscription();
  private userID!: string;

  constructor(
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: EditTodoListData,
    public dialogRef: MatDialogRef<EditTodoListComponent>,
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
    if (this.data?.list) {
      this.listForm.patchValue({
        ...this.data.list,
      });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  close(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    const list: TodoList = {
      ...this.listForm.value,
      edited: new Date(),
      editedBy: this.userID,
      items: this.data?.list?.items ?? [],
    };
    if (!this.data?.list?.id) {
      list.author = this.userID;
      list.created = list.edited;
    }
    this.todoService.storeTodoList(list, this.data?.list?.id).then((result) => {
      this.dialogRef.close(result);
    });
  }
}

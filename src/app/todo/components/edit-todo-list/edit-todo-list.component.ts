import { Component, Inject, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
    styleUrls: ['./edit-todo-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
    const { name, keepDone } = this.listForm.value;
    const existingId = this.data?.list?.id;
    const saved = existingId
      ? this.todoService.updateTodoListSettings(existingId, { name, keepDone }, this.userID)
      : this.todoService.storeTodoList(this.newList(name, keepDone));
    saved.then((result) => {
      this.dialogRef.close(result);
    });
  }

  private newList(name: string, keepDone: boolean): Omit<TodoList, 'id'> {
    const now = new Date();
    return { name, keepDone, items: [], author: this.userID, created: now, edited: now, editedBy: this.userID };
  }
}

import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TodoService } from '../../services/todo.service';
import { FormControl, UntypedFormGroup } from '@angular/forms';
import type { TodoItem } from '../../models/todo-item';
import type { EditTodoItemData } from '../../models/edit-todo-item-data';

@Component({
  selector: 'app-edit-todo-item',
  templateUrl: './edit-todo-item.component.html',
  styleUrls: ['./edit-todo-item.component.scss']
})
export class EditTodoItemComponent implements OnInit, OnDestroy {
  itemForm = new UntypedFormGroup({
    content: new FormControl(''),
  });
  private subscription = new Subscription();
  private userID!: string;

  constructor(
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: EditTodoItemData,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<EditTodoItemComponent>,
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
    if (this.data?.item) {
      this.itemForm.patchValue({
        ...this.data.item,
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
    const item: TodoItem = {
      ...this.itemForm.value,
      edited: new Date(),
      editedBy: this.userID,
    };
    if (!this.data?.item?.id) {
      item.author = this.userID;
      item.created = item.edited;
      this.todoService.storeNewTodoItem(item, this.data.listId).then((result) => {
        this.dialogRef.close(result);
      });
    } else {
      this.todoService.storeEditedTodoItem(item, this.data.item.id).then((result) => {
        this.dialogRef.close(result);
      });
    }
  }
}

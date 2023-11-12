import { Component, Input, OnInit } from '@angular/core';

import type { TodoItem } from '../../models/todo-item';
import { TodoService } from '../../services/todo.service';



@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.scss']
})
export class TodoItemComponent implements OnInit {
  @Input() item!: TodoItem;
  @Input() listId!: string;
  @Input() userID!: string;
  editing: boolean = false;
  editContent: string = '';

  constructor(
    private todoService: TodoService,
  ) { }

  ngOnInit(): void {
  }

  cancelEdit() {
    this.editContent = '';
    this.editing = false;
  }

  confirmEdit() {
    const editedItem: Omit<TodoItem, 'id'> = {
      ...this.item,
      content: this.editContent,
      edited: new Date(),
      editedBy: this.userID,
    };
    // @ts-ignore
    delete editedItem.id;
    this.todoService.storeEditedTodoItem(editedItem, this.item.id).then(() => {
      this.editing = false;
    });
  }

  deleteItem() {
    this.todoService.deleteTodoItem(this.item.id, this.listId).then();
  }

  toggleDone() {
    const done = !this.item.done;
    const doneItem: Omit<TodoItem, 'id'> = {
      ...this.item,
      done,
      doneBy: this.userID,
      markedDone: done ? new Date() : undefined,
    };
    // @ts-ignore
    delete doneItem.id;
    if (!done) {
      delete doneItem.doneBy;
      delete doneItem.markedDone;
    }
    this.todoService.storeEditedTodoItem(doneItem, this.item.id).then();
  }

  toggleEdit() {
    this.editContent = this.item.content;
    this.editing = !this.editing;
  }
}

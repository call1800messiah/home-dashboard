import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.scss']
})
export class TodoItemComponent implements OnInit {
  @Input() item!: TodoItem;
  @Input() userID!: string;
  @Output() addTodo = new EventEmitter();
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
    this.todoService.storeTodoItem(editedItem, this.item.id).then(() => {
      this.editing = false;
    });
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
    this.todoService.storeTodoItem(doneItem, this.item.id).then();
  }

  toggleEdit() {
    this.editContent = this.item.content;
    this.editing = !this.editing;
  }
}

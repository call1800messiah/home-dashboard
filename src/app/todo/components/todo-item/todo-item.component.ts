import { Component, Input, OnInit } from '@angular/core';
import { TodoItem } from '../../models/todo-item';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.scss']
})
export class TodoItemComponent implements OnInit {
  @Input() item!: TodoItem;
  editing: boolean = false;

  constructor(
    private todoService: TodoService,
  ) { }

  ngOnInit(): void {
  }

  toggleDone() {
    const done = !this.item.done;
    this.todoService.storeTodoItem({
      ...this.item,
      done,
      markedDone: done ? new Date() : undefined,
    });
  }

  toggleEdit() {
    this.editing = !this.editing;
  }
}

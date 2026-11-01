import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-add-todo-item',
    templateUrl: './add-todo-item.component.html',
    styleUrls: ['./add-todo-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AddTodoItemComponent implements OnInit {
  @Output() addTodoItem = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  addClicked(): void {
    this.addTodoItem.emit();
  }
}

import { Component, Input } from '@angular/core';
import type { TodoItem } from '../../models/todo-item';

@Component({
  selector: 'app-sort-item',
  templateUrl: './sort-item.component.html',
  styleUrl: './sort-item.component.scss'
})
export class SortItemComponent {
  @Input() item!: TodoItem;
}

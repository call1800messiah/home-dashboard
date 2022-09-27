import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';



@Component({
  selector: 'app-serving-count',
  templateUrl: './serving-count.component.html',
  styleUrls: ['./serving-count.component.scss']
})
export class ServingCountComponent implements OnInit {
  @Output() servingsChanged = new EventEmitter<number>();
  @Input() servings!: number;

  constructor() {}

  ngOnInit(): void {
  }

  onServingsChanged(amount: number) {
    this.servingsChanged.emit(amount);
  }
}

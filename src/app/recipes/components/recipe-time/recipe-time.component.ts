import { Component, Input, OnInit } from '@angular/core';
import { Time } from '@angular/common';



@Component({
  selector: 'app-recipe-time',
  templateUrl: './recipe-time.component.html',
  styleUrls: ['./recipe-time.component.scss']
})
export class RecipeTimeComponent implements OnInit {
  @Input() time!: Time;
  displayTime!: string;

  constructor() {}

  ngOnInit(): void {
    this.displayTime = `${this.time.hours !== 0 ? this.time.hours : ''}${(this.time.hours && this.time.minutes) ? ':' : ''}${this.time.minutes !== 0 ? this.time.minutes : ''}`;
  }
}

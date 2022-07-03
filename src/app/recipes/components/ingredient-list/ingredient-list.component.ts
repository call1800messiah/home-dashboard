import { Component, Input, OnInit } from '@angular/core';
import { IngredientRequirement } from '../../models/ingredient-requirement';

@Component({
  selector: 'app-ingredient-list',
  templateUrl: './ingredient-list.component.html',
  styleUrls: ['./ingredient-list.component.scss']
})
export class IngredientListComponent implements OnInit {
  @Input() ingredients!: IngredientRequirement[];
  displayedColumns = ['name', 'amount'];
  portions: number = 4;

  constructor() {}

  ngOnInit(): void {}

}

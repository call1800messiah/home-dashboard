import { Component, Input, OnInit } from '@angular/core';
import { IngredientRequirement } from '../../models/ingredient-requirement';

@Component({
  selector: 'app-list-ingredient-requirements',
  templateUrl: './list-ingredient-requirements.component.html',
  styleUrls: ['./list-ingredient-requirements.component.scss']
})
export class ListIngredientRequirementsComponent implements OnInit {
  @Input() requirements!: IngredientRequirement[];
  @Input() servings!: number;
  displayedColumns = ['name', 'amount'];

  constructor() {}

  ngOnInit(): void {}
}

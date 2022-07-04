import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { EditRecipeData } from '../../models/edit-recipe-data';
import { RecipeService } from '../../services/recipe.service';



@Component({
  selector: 'app-add-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss']
})
export class EditRecipeComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EditRecipeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRecipeData,
    private recipeService: RecipeService,
  ) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close(false);
  }

  save() {
    this.dialogRef.close(true);
  }
}

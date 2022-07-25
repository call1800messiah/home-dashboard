import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EditIngredientData } from '../../models/edit-ingredient-data';
import { IngredientService } from '../../services/ingredient.service';
import { Ingredient } from '../../models/ingredient';
import { FormControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-edit-ingredient',
  templateUrl: './edit-ingredient.component.html',
  styleUrls: ['./edit-ingredient.component.scss']
})
export class EditIngredientComponent implements OnInit {
  ingredientForm = new UntypedFormGroup({
    name: new FormControl(''),
    type: new FormControl(''),
  });
  ingredientTypes: Record<string, string>[] = Object.entries(IngredientService.ingredientTypes).map(([key, value]) => {
    return { key, value };
  });

  constructor(
    public dialogRef: MatDialogRef<EditIngredientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditIngredientData,
    private ingredientService: IngredientService,
  ) { }

  ngOnInit(): void {
    if (this.data?.ingredient?.id) {
      this.ingredientForm.patchValue(this.data.ingredient);
    } else if (this.data.newName) {
      this.ingredientForm.patchValue({
        name: this.data.newName,
      });
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    const ingredient: Ingredient = {
      ...this.ingredientForm.value
    };

    this.ingredientService.storeIngredient(ingredient, this.data?.ingredient?.id).then((result) => {
      this.dialogRef.close(result);
    });
  }
}

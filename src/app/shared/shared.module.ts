import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { FilterComponent } from './components/filter/filter.component';
import { SelectOnFocusDirective } from './directives/select-on-focus.directive';
import { FocusOnInitDirective } from './directives/focus-on-init.directive';



@NgModule({
  declarations: [
    ConfirmDialogComponent,
    FilterComponent,
    FocusOnInitDirective,
    SelectOnFocusDirective,
  ],
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRippleModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
  exports: [
    ConfirmDialogComponent,
    CommonModule,
    DragDropModule,
    FilterComponent,
    FocusOnInitDirective,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRippleModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    SelectOnFocusDirective,
  ]
})
export class SharedModule { }

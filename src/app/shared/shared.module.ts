import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIngredientComponent } from './edit-ingredient.component';
import { RecipesModule } from '../../recipes.module';
import { testModule } from '../../../testing/test-module';

describe('EditIngredientComponent', () => {
  let component: EditIngredientComponent;
  let fixture: ComponentFixture<EditIngredientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(RecipesModule))
    .compileComponents();

    fixture = TestBed.createComponent(EditIngredientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

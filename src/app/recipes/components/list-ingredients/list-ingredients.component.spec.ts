import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListIngredientsComponent } from './list-ingredients.component';
import { RecipesModule } from '../../recipes.module';
import { testModule } from '../../../testing/test-module';

describe('ListIngredientsComponent', () => {
  let component: ListIngredientsComponent;
  let fixture: ComponentFixture<ListIngredientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(RecipesModule))
    .compileComponents();

    fixture = TestBed.createComponent(ListIngredientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

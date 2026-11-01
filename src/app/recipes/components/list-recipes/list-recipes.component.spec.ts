import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRecipesComponent } from './list-recipes.component';
import { RecipesModule } from '../../recipes.module';
import { testModule } from '../../../testing/test-module';

describe('ListComponent', () => {
  let component: ListRecipesComponent;
  let fixture: ComponentFixture<ListRecipesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(RecipesModule))
    .compileComponents();

    fixture = TestBed.createComponent(ListRecipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

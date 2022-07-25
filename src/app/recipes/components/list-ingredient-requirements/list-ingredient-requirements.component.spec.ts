import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListIngredientRequirementsComponent } from './list-ingredient-requirements.component';

describe('IngredientListComponent', () => {
  let component: ListIngredientRequirementsComponent;
  let fixture: ComponentFixture<ListIngredientRequirementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListIngredientRequirementsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListIngredientRequirementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

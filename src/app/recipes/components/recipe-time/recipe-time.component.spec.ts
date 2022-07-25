import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeTimeComponent } from './recipe-time.component';

describe('RecipeTimeComponent', () => {
  let component: RecipeTimeComponent;
  let fixture: ComponentFixture<RecipeTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecipeTimeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

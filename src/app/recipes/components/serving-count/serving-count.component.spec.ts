import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServingCountComponent } from './serving-count.component';

describe('ServingCountComponent', () => {
  let component: ServingCountComponent;
  let fixture: ComponentFixture<ServingCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServingCountComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServingCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

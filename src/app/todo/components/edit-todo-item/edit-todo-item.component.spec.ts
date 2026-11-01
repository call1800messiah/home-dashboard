import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTodoItemComponent } from './edit-todo-item.component';
import { TodoModule } from '../../todo.module';
import { testModule } from '../../../testing/test-module';

describe('EditTodoItemComponent', () => {
  let component: EditTodoItemComponent;
  let fixture: ComponentFixture<EditTodoItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(TodoModule))
    .compileComponents();

    fixture = TestBed.createComponent(EditTodoItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

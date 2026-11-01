import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTodoListComponent } from './edit-todo-list.component';
import { TodoModule } from '../../todo.module';
import { testModule } from '../../../testing/test-module';

describe('EditTodoListComponent', () => {
  let component: EditTodoListComponent;
  let fixture: ComponentFixture<EditTodoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(TodoModule))
    .compileComponents();

    fixture = TestBed.createComponent(EditTodoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

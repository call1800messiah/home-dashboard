import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { EditTodoListComponent } from './edit-todo-list.component';
import { TodoModule } from '../../todo.module';
import { TodoService } from '../../services/todo.service';
import { testModule } from '../../../testing/test-module';
import type { EditTodoListData } from '../../models/edit-todo-list-data';
import type { TodoList } from '../../models/todo-list';

describe('EditTodoListComponent', () => {
  let component: EditTodoListComponent;
  let fixture: ComponentFixture<EditTodoListComponent>;
  let todoService: TodoService;

  function create(data: EditTodoListData | null): void {
    const module = testModule(TodoModule);
    TestBed.configureTestingModule({
      ...module,
      providers: [...module.providers!, { provide: MAT_DIALOG_DATA, useValue: data }],
    });
    todoService = TestBed.inject(TodoService);
    spyOn(todoService, 'storeTodoList').and.resolveTo('new-id');
    spyOn(todoService, 'updateTodoListSettings').and.resolveTo(true);
    fixture = TestBed.createComponent(EditTodoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    create({});
    expect(component).toBeTruthy();
  });

  it('saves only the settings of an existing list, not its items', () => {
    const list = {
      id: 'dst', name: 'Einkauf', keepDone: false, items: [], author: 'a',
      created: new Date(0), edited: new Date(0), editedBy: 'a',
    } as TodoList;
    create({ list });
    component.listForm.patchValue({ name: 'Wocheneinkauf', keepDone: true });
    component.save();
    expect(todoService.updateTodoListSettings).toHaveBeenCalledTimes(1);
    const [id, settings] = (todoService.updateTodoListSettings as jasmine.Spy).calls.mostRecent().args;
    expect(id).toBe('dst');
    expect(settings).toEqual({ name: 'Wocheneinkauf', keepDone: true });
    expect(todoService.storeTodoList).not.toHaveBeenCalled();
  });

  it('creates a new list with no items', () => {
    create({});
    component.listForm.patchValue({ name: 'Drogerie', keepDone: false });
    component.save();
    expect(todoService.storeTodoList).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ name: 'Drogerie', keepDone: false, items: [] }),
    );
  });
});

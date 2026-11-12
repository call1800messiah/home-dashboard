import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComponent } from './list.component';
import type { TodoItem } from '../../models/todo-item';
import { TodoModule } from '../../todo.module';
import { testModule } from '../../../testing/test-module';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(TodoModule))
    .compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps item rows when the list re-emits with new objects for the same items', () => {
    // Firestore emits fresh objects on every change, so rows must be tracked by id, not identity.
    const makeItems = (): TodoItem[] => ['a', 'b'].map((id) => ({
      id,
      author: 'u',
      content: `item ${id}`,
      created: new Date(0),
      done: false,
      edited: new Date(0),
      editedBy: 'u',
    }));
    const showList = (items: TodoItem[]) => {
      component.list = { id: 'list', author: 'u', created: new Date(0), edited: new Date(0), editedBy: 'u', items, keepDone: true, name: 'List' };
      component.visibleItems = items;
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      return Array.from(fixture.nativeElement.querySelectorAll('app-todo-item'));
    };

    const rowsBefore = showList(makeItems());
    const rowsAfter = showList(makeItems());

    expect(rowsBefore.length).toBe(2);
    expect(rowsAfter.length).toBe(2);
    rowsAfter.forEach((row, index) => expect(row).toBe(rowsBefore[index]));
  });
});

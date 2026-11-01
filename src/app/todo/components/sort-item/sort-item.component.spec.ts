import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortItemComponent } from './sort-item.component';
import { TodoModule } from '../../todo.module';
import { testModule } from '../../../testing/test-module';
import type { TodoItem } from '../../models/todo-item';

describe('SortItemComponent', () => {
  let component: SortItemComponent;
  let fixture: ComponentFixture<SortItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(testModule(TodoModule))
    .compileComponents();
    
    fixture = TestBed.createComponent(SortItemComponent);
    component = fixture.componentInstance;
    component.item = { content: 'Item' } as TodoItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

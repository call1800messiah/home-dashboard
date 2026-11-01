import { TestBed } from '@angular/core/testing';

import { TodoService } from './todo.service';
import { testModule } from '../../testing/test-module';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule(testModule());
    service = TestBed.inject(TodoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

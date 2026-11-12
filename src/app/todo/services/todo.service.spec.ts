import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TodoService } from './todo.service';
import { testModule } from '../../testing/test-module';
import { ApiService, BatchSet } from '../../core/services/api.service';

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

/** The check the mock API uses to recognise deleteField(). */
function isDeleteField(value: unknown): boolean {
  return (value as { _methodName?: string } | undefined)?._methodName === 'deleteField';
}

describe('TodoService.sendOpenItems', () => {
  let service: TodoService;
  let batchWrite: jasmine.Spy<(operations: BatchSet[]) => Promise<void>>;

  const lists = [
    { id: 'src', name: 'Wöchentlich', items: ['s1', 's2', 's3', 'gone'], keepDone: false },
    { id: 'dst', name: 'Einkaufsliste', items: ['t1', 'gone2'], keepDone: false },
  ];
  const items = [
    { id: 's1', content: 'Milch 2l', done: false },
    { id: 's2', content: 'Joghurt', done: false },
    { id: 's3', content: 'Kaffee', done: true },
    { id: 't1', content: 'Milch 1l', done: true, doneBy: 'u2', markedDone: new Date(0) },
  ];

  beforeEach(() => {
    let nextId = 0;
    batchWrite = jasmine.createSpy('batchWrite').and.resolveTo();
    const api = {
      getDataFromCollection: (collectionID: string) => of(collectionID === 'todo' ? lists : items),
      createId: () => `new${++nextId}`,
      batchWrite,
    };
    const module = testModule();
    TestBed.configureTestingModule({ ...module, providers: [...module.providers!, { provide: ApiService, useValue: api }] });
    service = TestBed.inject(TodoService);
  });

  const written = (): BatchSet[] => batchWrite.calls.mostRecent().args[0];

  it('writes updates, new items and the target list in one batch', async () => {
    const summary = await service.sendOpenItems('src', 'dst', 'u1');
    expect(batchWrite).toHaveBeenCalledTimes(1);
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todoItems', documentID: 't1', merge: true,
      data: jasmine.objectContaining({ content: 'Milch 2l', done: false, editedBy: 'u1' }),
    }));
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todoItems', documentID: 'new1', merge: false,
      data: jasmine.objectContaining({ content: 'Joghurt', done: false, author: 'u1', editedBy: 'u1' }),
    }));
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todo', documentID: 'dst', merge: true,
      data: jasmine.objectContaining({ items: ['new1', 't1'], editedBy: 'u1' }),
    }));
    expect(summary.reopened).toEqual(['Milch 1l → 2l']);
    expect(summary.added).toEqual(['Joghurt']);
  });

  it('removes doneBy and markedDone when unticking', async () => {
    await service.sendOpenItems('src', 'dst', 'u1');
    const t1 = written().find((operation) => operation.documentID === 't1')!.data as Record<string, unknown>;
    expect(isDeleteField(t1['doneBy'])).toBeTrue();
    expect(isDeleteField(t1['markedDone'])).toBeTrue();
  });

  it('does not send ticked items', async () => {
    const summary = await service.sendOpenItems('src', 'dst', 'u1');
    expect(JSON.stringify(summary)).not.toContain('Kaffee');
  });

  it('rejects when the target list does not exist', async () => {
    await expectAsync(service.sendOpenItems('src', 'missing', 'u1')).toBeRejected();
    expect(batchWrite).not.toHaveBeenCalled();
  });

  it('rejects when the batch fails', async () => {
    batchWrite.and.rejectWith(new Error('offline'));
    await expectAsync(service.sendOpenItems('src', 'dst', 'u1')).toBeRejected();
  });
});

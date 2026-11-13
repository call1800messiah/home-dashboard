import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TodoService } from './todo.service';
import { testModule } from '../../testing/test-module';
import { ApiService, DocumentWrite, Transaction } from '../../core/services/api.service';

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

type Documents = Record<string, Record<string, Record<string, unknown>>>;

/**
 * Runs the work against `documents` like a Firestore transaction: reads see the documents,
 * writes are collected and only kept when the work succeeds.
 */
function fakeTransaction(documents: Documents, committed: DocumentWrite[][]) {
  return async <T>(work: (transaction: Transaction) => Promise<T>): Promise<T> => {
    const writes: DocumentWrite[] = [];
    const result = await work({
      get: async (collectionID, documentID) => documents[collectionID]?.[documentID],
      set: (write) => writes.push(write),
    });
    committed.push(writes);
    return result;
  };
}

describe('TodoService.sendOpenItems', () => {
  let service: TodoService;
  let committed: DocumentWrite[][];
  let runTransaction: jasmine.Spy;

  // What this device last saw: the cache the source list's open items come from.
  const lists = [
    { id: 'src', name: 'Wöchentlich', items: ['s1', 's2', 's3', 'gone'], keepDone: false },
    { id: 'dst', name: 'Einkaufsliste', items: ['t1'], keepDone: false },
  ];
  const items = [
    { id: 's1', content: 'Milch 2l', done: false },
    { id: 's2', content: 'Joghurt', done: false },
    { id: 's3', content: 'Kaffee', done: true },
    { id: 't1', content: 'Milch 1l', done: true, doneBy: 'u2', markedDone: new Date(0) },
  ];
  // The server, where another device has meanwhile added "Brot" to the target list.
  let server: Documents;

  beforeEach(() => {
    let nextId = 0;
    committed = [];
    server = {
      todo: { dst: { name: 'Einkaufsliste', items: ['t1', 't2', 'gone2'], keepDone: false } },
      todoItems: {
        t1: { content: 'Milch 1l', done: true, doneBy: 'u2', markedDone: new Date(0) },
        t2: { content: 'Brot', done: false },
      },
    };
    runTransaction = jasmine.createSpy('runTransaction').and.callFake((work) => fakeTransaction(server, committed)(work));
    const api = {
      getDataFromCollection: (collectionID: string) => of(collectionID === 'todo' ? lists : items),
      createId: () => `new${++nextId}`,
      runTransaction,
    };
    const module = testModule();
    TestBed.configureTestingModule({ ...module, providers: [...module.providers!, { provide: ApiService, useValue: api }] });
    service = TestBed.inject(TodoService);
  });

  const written = (): DocumentWrite[] => committed[committed.length - 1];

  it('writes updates, new items and the target list in one transaction', async () => {
    const summary = await service.sendOpenItems('src', 'dst', 'u1');
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todoItems', documentID: 't1', merge: true,
      data: jasmine.objectContaining({ content: 'Milch 2l', done: false, editedBy: 'u1' }),
    }));
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todoItems', documentID: 'new1', merge: false,
      data: jasmine.objectContaining({ content: 'Joghurt', done: false, author: 'u1', editedBy: 'u1' }),
    }));
    expect(summary.reopened).toEqual(['Milch 1l → 2l']);
    expect(summary.added).toEqual(['Joghurt']);
  });

  it('keeps items another device added to the target list meanwhile', async () => {
    await service.sendOpenItems('src', 'dst', 'u1');
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todo', documentID: 'dst', merge: true,
      data: jasmine.objectContaining({ items: ['new1', 't1', 't2'], editedBy: 'u1' }),
    }));
  });

  it('matches against the target items on the server', async () => {
    server['todoItems']['t2'] = { content: 'Joghurt', done: true };
    const summary = await service.sendOpenItems('src', 'dst', 'u1');
    expect(summary.reopened).toContain('Joghurt');
    expect(summary.added).toEqual([]);
  });

  it('removes doneBy and markedDone when unticking', async () => {
    await service.sendOpenItems('src', 'dst', 'u1');
    const t1 = written().find((write) => write.documentID === 't1')!.data as Record<string, unknown>;
    expect(isDeleteField(t1['doneBy'])).toBeTrue();
    expect(isDeleteField(t1['markedDone'])).toBeTrue();
  });

  it('does not send ticked items', async () => {
    const summary = await service.sendOpenItems('src', 'dst', 'u1');
    expect(JSON.stringify(summary)).not.toContain('Kaffee');
  });

  it('rejects when the target list does not exist', async () => {
    await expectAsync(service.sendOpenItems('src', 'missing', 'u1')).toBeRejected();
    expect(committed).toEqual([]);
  });

  it('rejects when the target list was deleted on the server', async () => {
    delete server['todo']['dst'];
    await expectAsync(service.sendOpenItems('src', 'dst', 'u1')).toBeRejected();
    expect(committed).toEqual([]);
  });

  it('rejects when the transaction fails', async () => {
    runTransaction.and.rejectWith(new Error('offline'));
    await expectAsync(service.sendOpenItems('src', 'dst', 'u1')).toBeRejected();
  });
});

describe('TodoService.sendItems', () => {
  let service: TodoService;
  let committed: DocumentWrite[][];
  let server: Documents;

  beforeEach(() => {
    let nextId = 0;
    committed = [];
    server = {
      todo: { dst: { name: 'Einkaufsliste', items: ['t1', 't2'], keepDone: false } },
      todoItems: {
        t1: { content: 'Milch 1l', done: true, doneBy: 'u2', markedDone: new Date(0) },
        t2: { content: 'Brot', done: false },
      },
    };
    const api = {
      getDataFromCollection: () => of([]),
      createId: () => `new${++nextId}`,
      runTransaction: (work: any) => fakeTransaction(server, committed)(work),
    };
    const module = testModule();
    TestBed.configureTestingModule({ ...module, providers: [...module.providers!, { provide: ApiService, useValue: api }] });
    service = TestBed.inject(TodoService);
  });

  const written = (): DocumentWrite[] => committed[committed.length - 1];

  it('adds amounts in add mode', async () => {
    server['todoItems']['t2'] = { content: 'Brot 1', done: false };
    const summary = await service.sendItems([{ content: 'Brot 2', name: 'Brot', quantity: '2', exactName: true }], 'dst', 'u1', 'add');
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todoItems', documentID: 't2',
      data: jasmine.objectContaining({ content: 'Brot 3' }),
    }));
    expect(summary.quantityIncreased).toEqual(['Brot 1 → 3']);
  });

  it('creates new items from the source content', async () => {
    await service.sendItems([{ content: 'Zucker', name: 'Zucker', exactName: true }], 'dst', 'u1');
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todoItems', documentID: 'new1', merge: false,
      data: jasmine.objectContaining({ content: 'Zucker' }),
    }));
    expect(written()).toContain(jasmine.objectContaining({
      collectionID: 'todo', documentID: 'dst',
      data: jasmine.objectContaining({ items: ['new1', 't1', 't2'] }),
    }));
  });

  it('rejects when the target list does not exist', async () => {
    await expectAsync(service.sendItems([{ content: 'Zucker', name: 'Zucker', exactName: true }], 'missing', 'u1')).toBeRejected();
    expect(committed).toEqual([]);
  });
});

describe('TodoService.updateTodoListSettings', () => {
  let service: TodoService;
  let api: jasmine.SpyObj<Pick<ApiService, 'updateDocumentInCollection'>>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['updateDocumentInCollection']);
    api.updateDocumentInCollection.and.resolveTo();
    const module = testModule();
    TestBed.configureTestingModule({ ...module, providers: [...module.providers!, { provide: ApiService, useValue: api }] });
    service = TestBed.inject(TodoService);
  });

  it('writes name and keepDone without touching the items, so items added elsewhere stay', async () => {
    await service.updateTodoListSettings('dst', { name: 'Wocheneinkauf', keepDone: true }, 'u1');
    const [documentID, collectionID, data] = api.updateDocumentInCollection.calls.mostRecent().args;
    expect([documentID, collectionID]).toEqual(['dst', 'todo']);
    expect(data).toEqual(jasmine.objectContaining({ name: 'Wocheneinkauf', keepDone: true, editedBy: 'u1' }));
    expect(data.edited).toEqual(jasmine.any(Date));
    expect('items' in data).toBeFalse();
  });
});

describe('TodoService.deleteTodoItem', () => {
  let service: TodoService;
  let api: jasmine.SpyObj<Pick<ApiService, 'removeFromArray' | 'deleteDocumentFromCollection' | 'updateDocumentInCollection'>>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['removeFromArray', 'deleteDocumentFromCollection', 'updateDocumentInCollection']);
    api.removeFromArray.and.resolveTo();
    api.deleteDocumentFromCollection.and.resolveTo();
    const module = testModule();
    TestBed.configureTestingModule({ ...module, providers: [...module.providers!, { provide: ApiService, useValue: api }] });
    service = TestBed.inject(TodoService);
  });

  it('removes only this item from the list, so items added elsewhere stay', async () => {
    await service.deleteTodoItem('t1', 'dst');
    expect(api.removeFromArray).toHaveBeenCalledOnceWith('dst', 'todo', 'items', 't1');
    expect(api.updateDocumentInCollection).not.toHaveBeenCalled();
  });

  it('deletes the item document', async () => {
    await service.deleteTodoItem('t1', 'dst');
    expect(api.deleteDocumentFromCollection).toHaveBeenCalledOnceWith('t1', 'todoItems');
  });
});

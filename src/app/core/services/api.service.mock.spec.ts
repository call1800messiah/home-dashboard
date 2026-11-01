import { TestBed } from '@angular/core/testing';
import { deleteField, serverTimestamp, Timestamp } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { filter, skip, take } from 'rxjs/operators';

import { ApiService } from './api.service.mock';



const doc = (id: string, data: Record<string, unknown>) => ({
  id,
  path: `todo/${id}`,
  createTime: '2024-01-01T00:00:00.000Z',
  updateTime: '2024-01-01T00:00:00.000Z',
  data,
});

const fixture = () => ({
  meta: { project: 'test', database: '(default)', exportedAt: '2024-01-01T00:00:00.000Z' },
  collections: {
    todo: [
      doc('b', {
        name: 'B',
        id: 'stale-id-field',
        created: { __type: 'timestamp', value: '2024-01-02T03:04:05.000Z' },
        items: ['x', 'y'],
        nested: {
          keep: 1,
          change: 2,
          deep: { when: { __type: 'timestamp', value: '2024-05-06T00:00:00.000Z' } },
        },
      }),
      doc('a', { name: 'A' }),
    ],
    recipes: [doc('r', { name: 'R' })],
  },
});

describe('ApiService (mock)', () => {
  let service: ApiService;
  let fetchSpy: jasmine.Spy;

  const docs = (collection = 'todo'): Promise<any[]> =>
    firstValueFrom(service.getDataFromCollection(collection));
  const byId = async (id: string, collection = 'todo'): Promise<any> =>
    (await docs(collection)).find((item) => item.id === id);

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch').and.callFake(
      async () => new Response(JSON.stringify(fixture()), { status: 200 }),
    );
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiService);
  });

  describe('reading', () => {
    it('loads the dump once however many collections are read', async () => {
      await docs('todo');
      await docs('recipes');
      await docs('todo');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.calls.mostRecent().args[0]).toBe('firestore-dump.json');
    });

    it('returns documents in id order, like Firestore', async () => {
      expect((await docs()).map((item) => item.id)).toEqual(['a', 'b']);
    });

    it('lets the document id override an id stored in the data, like idField', async () => {
      expect((await byId('b')).id).toBe('b');
    });

    it('returns an empty list for a collection the dump does not contain', async () => {
      expect(await docs('unknown')).toEqual([]);
    });

    it('revives timestamps at any depth', async () => {
      const item = await byId('b');

      expect(item.created instanceof Timestamp).toBeTrue();
      expect(item.created.toDate().toISOString()).toBe('2024-01-02T03:04:05.000Z');
      expect(item.nested.deep.when.toDate().toISOString()).toBe('2024-05-06T00:00:00.000Z');
    });

    it('keeps the store safe from callers changing what they received', async () => {
      const item = await byId('b');
      item.items.push('changed');
      item.nested.keep = 99;

      const again = await byId('b');
      expect(again.items).toEqual(['x', 'y']);
      expect(again.nested.keep).toBe(1);
    });

    it('warns that query functions are ignored', async () => {
      const warn = spyOn(console, 'warn');

      await firstValueFrom(service.getDataFromCollection('todo', (ref) => ref));

      expect(warn).toHaveBeenCalled();
    });

    it('fails with a message naming the file when the dump cannot be loaded', async () => {
      fetchSpy.and.callFake(async () => new Response('', { status: 404 }));
      TestBed.resetTestingModule();
      service = TestBed.inject(ApiService);

      await expectAsync(docs()).toBeRejectedWithError(/firestore-dump\.json/);
    });

    it('fails with a message naming the file when the response is not JSON', async () => {
      fetchSpy.and.callFake(async () => new Response('<html></html>', { status: 200 }));
      TestBed.resetTestingModule();
      service = TestBed.inject(ApiService);

      await expectAsync(docs()).toBeRejectedWithError(/firestore-dump\.json/);
    });

    it('fails on a value type the mock does not understand', async () => {
      const dump = fixture();
      dump.collections.recipes[0].data['ref'] = { __type: 'reference', path: 'todo/a' };
      fetchSpy.and.callFake(async () => new Response(JSON.stringify(dump), { status: 200 }));
      TestBed.resetTestingModule();
      service = TestBed.inject(ApiService);

      await expectAsync(docs('recipes')).toBeRejectedWithError(/reference/);
    });
  });

  describe('getItemFromCollection', () => {
    it('returns a snapshot action for an existing document', async () => {
      const action = await firstValueFrom(service.getItemFromCollection('todo/a'));

      expect(action.payload.id).toBe('a');
      expect(action.payload.exists).toBeTrue();
      expect(action.payload.data()).toEqual({ name: 'A' });
    });

    it('reports a missing document as not existing', async () => {
      const action = await firstValueFrom(service.getItemFromCollection('todo/nope'));

      expect(action.payload.exists).toBeFalse();
      expect(action.payload.data()).toBeUndefined();
    });
  });

  describe('adding', () => {
    it('stores the document under a generated id and returns it', async () => {
      const reference = await service.addDocumentToCollection({ name: 'New' }, 'todo');

      expect(reference.id).toBeTruthy();
      expect((await byId(reference.id)).name).toBe('New');
    });

    it('notifies open listeners', async () => {
      const next = firstValueFrom(service.getDataFromCollection('todo').pipe(skip(1), take(1)));
      await docs();

      await service.addDocumentToCollection({ name: 'New' }, 'todo');

      expect((await next).length).toBe(3);
    });

    it('creates a collection that does not exist yet', async () => {
      await service.addDocumentToCollection({ name: 'First' }, 'unknown');

      expect((await docs('unknown')).length).toBe(1);
    });

    it('has the document visible to listeners before the write resolves', async () => {
      let seen = 0;
      const subscription = service.getDataFromCollection('todo').subscribe((items: any[]) => {
        seen = items.length;
      });
      await docs();

      await service.addDocumentToCollection({ name: 'New' }, 'todo');

      expect(seen).toBe(3);
      subscription.unsubscribe();
    });

    it('returns dates as timestamps, like Firestore', async () => {
      const when = new Date('2024-03-03T00:00:00.000Z');
      const { id } = await service.addDocumentToCollection({ when }, 'todo');

      const item = await byId(id);
      expect(item.when instanceof Timestamp).toBeTrue();
      expect(item.when.toDate().toISOString()).toBe(when.toISOString());
    });

    it('rejects undefined values, like Firestore', async () => {
      await expectAsync(
        service.addDocumentToCollection({ a: { b: undefined } }, 'todo'),
      ).toBeRejectedWithError(/undefined/);
      expect((await docs()).length).toBe(2);
    });

    it('rejects deleteField(), like Firestore', async () => {
      await expectAsync(
        service.addDocumentToCollection({ type: deleteField() }, 'todo'),
      ).toBeRejectedWithError(/deleteField/);
    });
  });

  describe('updating', () => {
    it('merges nested maps and keeps untouched fields', async () => {
      await service.updateDocumentInCollection('b', 'todo', { nested: { change: 3 } });

      const item = await byId('b');
      expect(item.name).toBe('B');
      expect(item.nested.keep).toBe(1);
      expect(item.nested.change).toBe(3);
    });

    it('replaces arrays instead of merging them', async () => {
      await service.updateDocumentInCollection('b', 'todo', { items: ['z'] });

      expect((await byId('b')).items).toEqual(['z']);
    });

    it('replaces a map when given an empty map, like Firestore', async () => {
      await service.updateDocumentInCollection('b', 'todo', { nested: {} });

      expect((await byId('b')).nested).toEqual({});
    });

    it('creates the document when it does not exist', async () => {
      await service.updateDocumentInCollection('new', 'todo', { name: 'New', map: { a: 1 } });

      const item = await byId('new');
      expect(item.name).toBe('New');
      expect(item.map).toEqual({ a: 1 });
    });

    it('removes top-level fields marked with deleteField()', async () => {
      await service.updateDocumentInCollection('b', 'todo', { items: deleteField() });

      expect('items' in (await byId('b'))).toBeFalse();
    });

    it('removes nested fields marked with deleteField()', async () => {
      await service.updateDocumentInCollection('b', 'todo', { nested: { keep: deleteField() } });

      const item = await byId('b');
      expect('keep' in item.nested).toBeFalse();
      expect(item.nested.change).toBe(2);
    });

    it('rejects field values the mock does not implement', async () => {
      await expectAsync(
        service.updateDocumentInCollection('b', 'todo', { when: serverTimestamp() }),
      ).toBeRejectedWithError(/serverTimestamp/);
    });

    it('notifies open listeners', async () => {
      const updated = firstValueFrom(service.getDataFromCollection('todo').pipe(
        filter((items: any[]) => items.some((item) => item.name === 'Changed')),
      ));

      await service.updateDocumentInCollection('a', 'todo', { name: 'Changed' });

      expect((await updated).length).toBe(2);
    });
  });

  describe('deleting', () => {
    it('removes the document and notifies open listeners', async () => {
      const next = firstValueFrom(service.getDataFromCollection('todo').pipe(skip(1), take(1)));
      await docs();

      await service.deleteDocumentFromCollection('a', 'todo');

      expect((await next).map((item: any) => item.id)).toEqual(['b']);
    });

    it('resolves for a document that does not exist, like Firestore', async () => {
      await expectAsync(service.deleteDocumentFromCollection('nope', 'todo')).toBeResolved();
    });
  });

  describe('auth', () => {
    const authState = () => firstValueFrom(service.getAuthState());

    it('starts signed in as a fake user with the fields AuthService needs', async () => {
      const user = await authState();

      expect(user?.uid).toBeTruthy();
      expect(user?.email).toBeTruthy();
    });

    it('signs out', async () => {
      await service.logout();

      expect(await authState()).toBeNull();
    });

    it('signs back in with any credentials', async () => {
      await service.logout();
      await service.login('someone@example.com', 'any-password');

      expect((await authState())?.email).toBe('someone@example.com');
    });
  });
});

# Send a List's Open Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a todo list send its open items to another list, reusing (unticking, re-quantifying) matching items there instead of duplicating them, and show a summary.

**Architecture:** Pure functions split item text into name and quantity, match names, and compute a send plan (updates, new items, summary). `TodoService.sendOpenItems` turns the plan into one Firestore write batch via a new `ApiService.batchWrite`. A new `SendItemsComponent` (target dropdown + "Senden") sits in a new row on the list page and opens a new `SendSummaryComponent` dialog.

**Tech Stack:** Angular 22 (module-based, `standalone: false`, `ChangeDetectionStrategy.Eager`), Angular Material, `@angular/fire` compat, Karma/Jasmine.

**Spec:** `docs/superpowers/specs/2026-11-03-copy-items-between-lists-design.md`

## Global Constraints

- Branch `feature/copy-list-items`. Run tests with `npx ng test --watch=false` (single file: `--include=<path to spec>`).
- UI copy is German, exactly: "Offene Einträge senden an", "Senden", "An <target name> gesendet", "Ähnlicher Name verwendet (n)", "Wieder offen (n)", "Menge geändert (n)", "Neu hinzugefügt (n)", "War schon offen (n)", "OK", "Keine offenen Einträge", "Senden fehlgeschlagen".
- New components are declared in `TodoModule`, `standalone: false`, `changeDetection: ChangeDetectionStrategy.Eager`, like the existing ones.
- Tests use `testModule(...)` from `src/app/testing/test-module.ts`; nothing may touch real Firebase.
- `@for` blocks over Firestore data track by `id`.
- No new npm dependencies.
- Every commit message ends with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01NhbZqyPHZmKUemki5J3nXH
  ```

## Review Focus

1. **Dangling item IDs:** a list's `items` array can reference a deleted item document, which `deserializeTodoLists` turns into `undefined`. A send must skip those, not crash. Test in Task 4.
2. **Remembered target deleted:** the stored target ID may name a list that no longer exists. Nothing is preselected; a send to a missing list fails with "Senden fehlgeschlagen". Tests in Tasks 4 and 6.
3. **Double tap on "Senden":** a second tap while a send is running must not start a second send. Test in Task 6.
4. **User not loaded yet:** with no user ID, "Senden" stays disabled (items would otherwise be written with `editedBy: undefined`). Test in Task 6.
5. **Messy spacing and case:** "  milch   2l " must split and match like "Milch 2l". Test in Task 1.

---

### Task 1: Name/quantity split and name matching

**Files:**
- Create: `src/app/todo/services/send-items.ts`
- Test: `src/app/todo/services/send-items.spec.ts`

**Interfaces:**
- Produces:
  - `interface SplitText { name: string; quantity?: string }`
  - `splitQuantity(text: string): SplitText`
  - `normalizeName(name: string): string`: lower case, trimmed, runs of whitespace collapsed to one space. Umlauts are not folded.
  - `isCloseName(a: string, b: string): boolean`: takes normalized names.

- [ ] **Step 1: Write the failing tests**

```ts
describe('splitQuantity', () => {
  const cases: [string, string, string | undefined][] = [
    ['Banane 10', 'Banane', '10'],
    ['Sellerie 225g', 'Sellerie', '225g'],
    ['Ingwer 10 g', 'Ingwer', '10 g'],
    ['Kartoffeln 1,5kg', 'Kartoffeln', '1,5kg'],
    ['Kürbis max 1.5kg', 'Kürbis', 'max 1.5kg'],
    ['Nektarinen ca. 4', 'Nektarinen', 'ca. 4'],
    ['Risotto Reis mind. 650 g', 'Risotto Reis', 'mind. 650 g'],
    ['Magerquark, mind. 500 g', 'Magerquark', 'mind. 500 g'],
    ['Spinat, 1000 g', 'Spinat', '1000 g'],
    ['Gläschen mit Fisch 2-3', 'Gläschen mit Fisch', '2-3'],
    ['Karotte 4 mittelgroße', 'Karotte', '4 mittelgroße'],
    ['Windeln 2 Coupon nutzen', 'Windeln', '2 Coupon nutzen'],
    ['CO2 Kartusche 2', 'CO2 Kartusche', '2'],
    ['Käse G 2', 'Käse G', '2'],
    ['Sweet Chili Sauce 200 g', 'Sweet Chili Sauce', '200 g'],
    ['Kleine Tomaten', 'Kleine Tomaten', undefined],
    ['6 - 8 Bodys', '6 - 8 Bodys', undefined],
    ['  milch   2l ', 'milch', '2l'],
  ];
  cases.forEach(([text, name, quantity]) => {
    it(`splits "${text}"`, () => {
      expect(splitQuantity(text)).toEqual(quantity === undefined ? { name } : { name, quantity });
    });
  });
});

describe('normalizeName', () => {
  it('ignores case and extra spaces', () => expect(normalizeName('  Passierte   Tomate ')).toBe('passierte tomate'));
  it('keeps umlauts', () => expect(normalizeName('Äpfel')).toBe('äpfel'));
});

describe('isCloseName', () => {
  it('matches one letter added', () => expect(isCloseName('tomate', 'tomaten')).toBeTrue());
  it('matches one letter in one word of several', () => expect(isCloseName('passierte tomate', 'passierte tomaten')).toBeTrue());
  it('matches one letter replaced', () => expect(isCloseName('banane', 'banana')).toBeTrue());
  it('rejects short words', () => expect(isCloseName('reis', 'eis')).toBeFalse());
  it('rejects a one-letter word', () => expect(isCloseName('käse g', 'käse t')).toBeFalse());
  it('rejects part of a word', () => expect(isCloseName('milch', 'hafermilch')).toBeFalse());
  it('rejects a different word count', () => expect(isCloseName('tee', 'tee für aurelio')).toBeFalse());
  it('rejects two differing words', () => expect(isCloseName('rote linse', 'roten linsen')).toBeFalse());
  it('rejects equal names', () => expect(isCloseName('milch', 'milch')).toBeFalse());
});
```

- [ ] **Step 2: Run the tests and check that they fail**

Run: `npx ng test --watch=false --include=src/app/todo/services/send-items.spec.ts`
Expected: compile error, `send-items` does not exist.

- [ ] **Step 3: Implement the three functions in `send-items.ts`**

`splitQuantity`: split the trimmed text on whitespace. The quantity starts at the first token at index > 0 that begins with a digit (`/^\d/`). If the token before it is `ca.`, `max`, `max.`, `mind.` or `mind` (case-insensitive) and is not the first token, the quantity starts there instead. Name = the tokens before, joined by one space, with a trailing comma removed. Quantity = the remaining tokens joined by one space. If there is no such token, the whole text (tokens joined) is the name.

`isCloseName`: split both names on spaces. They need the same number of words and exactly one differing word. That word must be at least 5 characters long in both versions and differ by exactly one insertion, deletion or substitution.

- [ ] **Step 4: Run the tests and check that they pass**

Run: same as Step 2. Expected: all pass.

- [ ] **Step 5: Commit**

`git add src/app/todo/services/send-items.ts src/app/todo/services/send-items.spec.ts`, message `feat: Split todo items into name and quantity and match names`.

---

### Task 2: Send plan

**Files:**
- Modify: `src/app/todo/services/send-items.ts`
- Test: `src/app/todo/services/send-items.spec.ts`

**Interfaces:**
- Consumes: `splitQuantity`, `normalizeName`, `isCloseName` (Task 1); `TodoItem` (`src/app/todo/models/todo-item.ts`).
- Produces:
  ```ts
  export interface SendSummary {
    closeMatches: string[];    // "Tomate → Tomaten" (source name → target name)
    reopened: string[];        // target name, or a quantity change string
    quantityChanged: string[]; // quantity change string
    added: string[];           // full text of each new item
    alreadyOpen: string[];     // target name
  }
  export interface SendUpdate { itemId: string; content: string; untick: boolean }
  export interface SendPlan { updates: SendUpdate[]; newItems: string[]; summary: SendSummary }
  export function planSend(sourceItems: TodoItem[], targetItems: TodoItem[]): SendPlan
  ```
  `sourceItems` are the open items to send, in source order. `targetItems` are all items on the target list, in list order. A quantity change string is `"<target name> <old quantity> → <new quantity>"`, or `"<target name> → <new quantity>"` when the target had no quantity.

- [ ] **Step 1: Write the failing tests**

Use a helper `item(id: string, content: string, done = false): TodoItem`, with the other fields filled with fixed values.

```ts
describe('planSend', () => {
  it('reopens a ticked same-name item', () => {
    const plan = planSend([item('s1', 'Milch')], [item('t1', 'Milch', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch', untick: true }]);
    expect(plan.summary.reopened).toEqual(['Milch']);
  });
  it('replaces the quantity and keeps the target name', () => {
    const plan = planSend([item('s1', 'Tomate 500g')], [item('t1', 'Tomaten 1kg', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Tomaten 500g', untick: true }]);
    expect(plan.summary.closeMatches).toEqual(['Tomate → Tomaten']);
    expect(plan.summary.reopened).toEqual(['Tomaten 1kg → 500g']);
  });
  it('changes only the quantity of an open item', () => {
    const plan = planSend([item('s1', 'Milch 2l')], [item('t1', 'Milch 1l')]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch 2l', untick: false }]);
    expect(plan.summary.quantityChanged).toEqual(['Milch 1l → 2l']);
  });
  it('keeps the target quantity when the source has none', () => {
    const plan = planSend([item('s1', 'Milch')], [item('t1', 'Milch 1l', true)]);
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Milch 1l', untick: true }]);
  });
  it('leaves an open item with the same quantity alone', () => {
    const plan = planSend([item('s1', 'milch  1l')], [item('t1', 'Milch 1l')]);
    expect(plan.updates).toEqual([]);
    expect(plan.summary.alreadyOpen).toEqual(['Milch']);
  });
  it('adds unmatched items in source order', () => {
    const plan = planSend([item('s1', 'Hafermilch 2'), item('s2', 'Joghurt')], [item('t1', 'Milch', true)]);
    expect(plan.newItems).toEqual(['Hafermilch 2', 'Joghurt']);
    expect(plan.summary.added).toEqual(['Hafermilch 2', 'Joghurt']);
    expect(plan.updates).toEqual([]);
  });
  it('prefers a same-name match over a close one', () => {
    const plan = planSend([item('s1', 'Tomate')], [item('t1', 'Tomaten', true), item('t2', 'Tomate', true)]);
    expect(plan.updates.map((u) => u.itemId)).toEqual(['t2']);
    expect(plan.summary.closeMatches).toEqual([]);
  });
  it('prefers an open candidate, then the first', () => {
    expect(planSend([item('s1', 'Milch')], [item('t1', 'Milch', true), item('t2', 'Milch')]).summary.alreadyOpen).toEqual(['Milch']);
    expect(planSend([item('s1', 'Milch')], [item('t1', 'Milch', true), item('t2', 'Milch', true)]).updates.map((u) => u.itemId)).toEqual(['t1']);
  });
  it('uses the first of several close matches and flags it', () => {
    const plan = planSend([item('s1', 'Tomate')], [item('t1', 'Tomaten', true), item('t2', 'Tomates', true)]);
    expect(plan.updates.map((u) => u.itemId)).toEqual(['t1']);
    expect(plan.summary.closeMatches).toEqual(['Tomate → Tomaten']);
  });
  it('does not add the same new item twice in one send', () => {
    const plan = planSend([item('s1', 'Joghurt'), item('s2', 'joghurt')], []);
    expect(plan.newItems).toEqual(['Joghurt']);
    expect(plan.summary.alreadyOpen).toEqual(['Joghurt']);
  });
});
```

- [ ] **Step 2: Run the tests and check that they fail**

Run: `npx ng test --watch=false --include=src/app/todo/services/send-items.spec.ts`
Expected: compile error, `planSend` does not exist.

- [ ] **Step 3: Implement `planSend`**

Work on a copy of the target items, so each source item sees the effect of earlier ones. A new item joins that copy as open. If a later source item matches a new item, change that item's entry in `newItems` instead of producing a `SendUpdate`. Several changes to the same target item collapse into one `SendUpdate`: the last content wins, and `untick` is true if any change unticked it. The rules and summary groups are in the spec's "Matching" and "What happens to each sent item" sections.

- [ ] **Step 4: Run the tests and check that they pass**

Run: same as Step 2. Expected: all pass.

- [ ] **Step 5: Commit**

Message `feat: Plan sending open items to another todo list`.

---

### Task 3: Batch writes in ApiService

**Files:**
- Modify: `src/app/core/services/api.service.ts`, `src/app/core/services/api.service.mock.ts`, `src/app/testing/test-module.ts`
- Test: `src/app/core/services/api.service.spec.ts`

**Interfaces:**
- Produces (on `ApiService`, the mock and the test stub):
  ```ts
  export interface BatchSet { collectionID: string; documentID: string; data: object; merge: boolean }
  batchWrite(operations: BatchSet[]): Promise<void>
  createId(): string
  ```
  `BatchSet` is exported from `api.service.ts`.

- [ ] **Step 1: Write the failing tests**

In the existing `describe('ApiService outside an injection context', …)` block:
```ts
it('can start a batch write', () => {
  expect(() => service.batchWrite([{ collectionID: 'items', documentID: 'id', data: { a: 1 }, merge: true }])).not.toThrow();
});
it('creates document ids', () => {
  expect(service.createId()).toMatch(/^\w{10,}$/);
});
```

- [ ] **Step 2: Run the tests and check that they fail**

Run: `npx ng test --watch=false --include=src/app/core/services/api.service.spec.ts`
Expected: compile error, `batchWrite` does not exist.

- [ ] **Step 3: Implement**

- **`api.service.ts`:** both methods go through `useFirestore()`. `batchWrite` creates `afs.firestore.batch()`, calls `batch.set(afs.firestore.collection(collectionID).doc(documentID), data, { merge })` for each operation, and returns `batch.commit()`. `createId` returns `afs.createId()`.
- **`api.service.mock.ts`:** `batchWrite` waits for `whenLoaded()` and then validates every operation with `toStored(data, merge)` before applying any, so a bad operation changes nothing. With `merge` it uses `merge(existing ?? {}, …)`; without, it replaces the document. `createId` returns `generateId()`.
- **`test-module.ts` stub:** `batchWrite: () => Promise.resolve()` and `createId: () => 'test-id'`.

- [ ] **Step 4: Run the tests and check that they pass**

Run: `npx ng test --watch=false`. Expected: all pass.

- [ ] **Step 5: Commit**

Message `feat: Add batch writes and id creation to ApiService`.

---

### Task 4: TodoService.sendOpenItems

**Files:**
- Modify: `src/app/todo/services/todo.service.ts`
- Test: `src/app/todo/services/todo.service.spec.ts`

**Interfaces:**
- Consumes: `planSend`, `SendSummary` (Task 2); `ApiService.batchWrite`, `ApiService.createId`, `BatchSet` (Task 3).
- Produces: `sendOpenItems(sourceListId: string, targetListId: string, userId: string): Promise<SendSummary>`. It rejects if either list is missing or the batch fails.

- [ ] **Step 1: Write the failing tests**

Build a new `describe('TodoService.sendOpenItems')` with `testModule()`, overriding the `ApiService` provider with a stub:
- `getDataFromCollection(id)` returns `of(lists)` for `'todo'` and `of(items)` for `'todoItems'`.
- `createId` returns `'new1'`, `'new2'`, … in turn.
- `batchWrite` is a `jasmine.createSpy().and.resolveTo()`.

Fixture: source list `src` with items `s1 'Milch 2l'` (open), `s2 'Joghurt'` (open), `s3 'Kaffee'` (ticked) and a dangling ID `'gone'`. Target list `dst` with items `t1 'Milch 1l'` (ticked, with `doneBy` and `markedDone`) and the dangling ID `'gone2'`.

```ts
it('writes updates, new items and the target list in one batch', async () => {
  const summary = await service.sendOpenItems('src', 'dst', 'u1');
  const ops: BatchSet[] = api.batchWrite.calls.mostRecent().args[0];
  expect(api.batchWrite).toHaveBeenCalledTimes(1);
  expect(ops).toContain(jasmine.objectContaining({ collectionID: 'todoItems', documentID: 't1', merge: true,
    data: jasmine.objectContaining({ content: 'Milch 2l', done: false, editedBy: 'u1' }) }));
  expect(ops).toContain(jasmine.objectContaining({ collectionID: 'todoItems', documentID: 'new1', merge: false,
    data: jasmine.objectContaining({ content: 'Joghurt', done: false, author: 'u1', editedBy: 'u1' }) }));
  expect(ops).toContain(jasmine.objectContaining({ collectionID: 'todo', documentID: 'dst', merge: true,
    data: jasmine.objectContaining({ items: ['new1', 't1'], editedBy: 'u1' }) }));
  expect(summary.reopened).toEqual(['Milch 1l → 2l']);
  expect(summary.added).toEqual(['Joghurt']);
});
it('removes doneBy and markedDone when unticking', async () => {
  await service.sendOpenItems('src', 'dst', 'u1');
  const t1 = api.batchWrite.calls.mostRecent().args[0].find((op: BatchSet) => op.documentID === 't1');
  expect(isDeleteField(t1.data.doneBy)).toBeTrue();
  expect(isDeleteField(t1.data.markedDone)).toBeTrue();
});
it('does not send ticked items', async () => {
  const summary = await service.sendOpenItems('src', 'dst', 'u1');
  expect(JSON.stringify(summary)).not.toContain('Kaffee');
});
it('rejects when the target list does not exist', async () => {
  await expectAsync(service.sendOpenItems('src', 'missing', 'u1')).toBeRejected();
  expect(api.batchWrite).not.toHaveBeenCalled();
});
it('rejects when the batch fails', async () => {
  api.batchWrite.and.rejectWith(new Error('offline'));
  await expectAsync(service.sendOpenItems('src', 'dst', 'u1')).toBeRejected();
});
```
Define `isDeleteField(value)` in the spec as `value?._methodName === 'deleteField'`, the same check the mock uses. The dangling ID `'gone2'` is left out of the written `items`.

- [ ] **Step 2: Run the tests and check that they fail**

Run: `npx ng test --watch=false --include=src/app/todo/services/todo.service.spec.ts`
Expected: compile error, `sendOpenItems` does not exist.

- [ ] **Step 3: Implement `sendOpenItems`**

- Take one snapshot of `getTodoLists()` (`take(1)`, as a promise) and find both lists. Throw if either is missing.
- Source items: `list.items.filter((i) => i && !i.done)`. Target items: `list.items.filter(Boolean)`.
- Pass both to `planSend`, then build the operations:
  - Each update: `content`, `edited: new Date()`, `editedBy: userId`. When `untick` is set, also `done: false`, `doneBy: deleteField()`, `markedDone: deleteField()`. Use `merge: true`.
  - Each new item: ID from `api.createId()`, with `author`, `content`, `created`, `done: false`, `edited`, `editedBy`. Use `merge: false`.
  - The target list: `items` = new IDs in order, then the existing target item IDs; plus `edited` and `editedBy`. Use `merge: true`.
- Call `api.batchWrite(ops)` once and return `plan.summary`. If there are no updates and no new items, skip the batch.

- [ ] **Step 4: Run the tests and check that they pass**

Run: same as Step 2. Expected: all pass.

- [ ] **Step 5: Commit**

Message `feat: Send a todo list's open items to another list in one batch`.

---

### Task 5: Summary dialog

**Files:**
- Create: `src/app/todo/components/send-summary/send-summary.component.{ts,html,scss,spec.ts}`
- Create: `src/app/todo/models/send-summary-data.ts`
- Modify: `src/app/todo/todo.module.ts` (declare)

**Interfaces:**
- Consumes: `SendSummary` (Task 2).
- Produces:
  - `interface SendSummaryData { targetName: string; summary: SendSummary }`
  - `SendSummaryComponent` (selector `app-send-summary`), which reads `SendSummaryData` from `MAT_DIALOG_DATA`.

- [ ] **Step 1: Write the failing tests**

Provide `MAT_DIALOG_DATA` with `targetName: 'Einkaufsliste'` and a summary with `closeMatches: ['Tomate → Tomaten']`, `reopened: ['Milch', 'Brot']`, `quantityChanged: []`, `added: ['Joghurt']`, `alreadyOpen: []`.
```ts
it('shows the title and only non-empty groups, in order', () => {
  const text = fixture.nativeElement.textContent;
  expect(text).toContain('An Einkaufsliste gesendet');
  const headings = Array.from(fixture.nativeElement.querySelectorAll('.group-title')).map((e: any) => e.textContent.trim());
  expect(headings).toEqual(['Ähnlicher Name verwendet (1)', 'Wieder offen (2)', 'Neu hinzugefügt (1)']);
  expect(text).toContain('Tomate → Tomaten');
  expect(text).toContain('Joghurt');
});
it('closes on OK', () => {
  const close = spyOn(TestBed.inject(MatDialogRef), 'close');
  fixture.nativeElement.querySelector('button').click();
  expect(close).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the tests and check that they fail**

Run: `npx ng test --watch=false --include=src/app/todo/components/send-summary/send-summary.component.spec.ts`
Expected: compile error.

- [ ] **Step 3: Implement the component**

Group order: closeMatches "Ähnlicher Name verwendet", reopened "Wieder offen", quantityChanged "Menge geändert", added "Neu hinzugefügt", alreadyOpen "War schon offen". Each group heading has class `group-title`. Entries are joined with ", ". The close-match group is highlighted (amber background, as in the mockup). There is one `mat-button` labelled "OK" with `mat-dialog-close`.

- [ ] **Step 4: Run the tests and check that they pass**

Run: same as Step 2. Expected: pass.

- [ ] **Step 5: Commit**

Message `feat: Show a summary after sending list items`.

---

### Task 6: Send control on the list page

**Files:**
- Create: `src/app/todo/components/send-items/send-items.component.{ts,html,scss,spec.ts}`
- Modify: `src/app/todo/todo.module.ts` (declare), `src/app/shared/shared.module.ts` (import and export `MatSnackBarModule`), `src/app/todo/components/list/list.component.html`, `src/app/todo/components/list/list.component.scss`, `src/app/todo/components/list/list.component.spec.ts`, `src/scss/common.scss` (`.container-top-controls`, which only this page uses)

**Interfaces:**
- Consumes: `TodoService.sendOpenItems`, `TodoService.getTodoLists` (Task 4); `SendSummaryComponent`, `SendSummaryData` (Task 5).
- Produces: `SendItemsComponent`, selector `app-send-items`, with `@Input() list!: TodoList` and `@Input() userID?: string`. Its public members, used by tests: `targets$: Observable<TodoList[]>`, `targetId: string | null`, `sending: boolean`, `selectTarget(id: string): void`, `send(): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

Configure the TestBed with `testModule(TodoModule)` plus overriding providers:
- a `TodoService` stub: `getTodoLists` returns `of([source, shopping, drogerie])`, and `sendOpenItems` is a spy;
- `MatDialog` as `jasmine.createSpyObj(['open'])`;
- `MatSnackBar` as `jasmine.createSpyObj(['open'])`.

Clear `localStorage` key `todo-send-target-src` before and after each test. Set `list` (id `src`, one open item) and `userID = 'u1'`, then render.

```ts
it('offers the other lists only', async () => {
  expect((await firstValueFrom(component.targets$)).map((l) => l.id)).toEqual(['shopping', 'drogerie']);
});
it('remembers the target per source list', () => {
  component.selectTarget('shopping');
  expect(localStorage.getItem('todo-send-target-src')).toBe('shopping');
});
it('preselects the remembered target', () => { /* set key to 'shopping' before first render */ expect(component.targetId).toBe('shopping'); });
it('ignores a remembered target that no longer exists', () => { /* key 'deleted' */ expect(component.targetId).toBeNull(); });
it('disables Senden without a target or user', () => { /* no target → button disabled; target but userID undefined → disabled */ });
it('shows "Keine offenen Einträge" when nothing is open', async () => {
  /* list with only ticked items */ await component.send();
  expect(snackBar.open).toHaveBeenCalledWith('Keine offenen Einträge', undefined, jasmine.anything());
  expect(todoService.sendOpenItems).not.toHaveBeenCalled();
});
it('sends and opens the summary', async () => {
  component.selectTarget('shopping'); todoService.sendOpenItems.and.resolveTo(summary);
  await component.send();
  expect(todoService.sendOpenItems).toHaveBeenCalledOnceWith('src', 'shopping', 'u1');
  expect(dialog.open).toHaveBeenCalledWith(SendSummaryComponent, jasmine.objectContaining({ data: { targetName: 'Einkaufsliste', summary } }));
});
it('ignores a second tap while sending', async () => {
  component.selectTarget('shopping'); todoService.sendOpenItems.and.returnValue(new Promise(() => undefined));
  component.send(); component.send();
  expect(todoService.sendOpenItems).toHaveBeenCalledTimes(1);
});
it('shows "Senden fehlgeschlagen" on failure', async () => {
  component.selectTarget('shopping'); todoService.sendOpenItems.and.rejectWith(new Error('x'));
  await component.send();
  expect(snackBar.open).toHaveBeenCalledWith('Senden fehlgeschlagen', undefined, jasmine.anything());
  expect(dialog.open).not.toHaveBeenCalled();
});
```
In `list.component.spec.ts`, add a test: `app-send-items` is rendered with sorting off and absent after `toggleSorting()`. Use the existing `showList` / `markForCheck` pattern.

- [ ] **Step 2: Run the tests and check that they fail**

Run: `npx ng test --watch=false --include='src/app/todo/components/{send-items,list}/*.spec.ts'`
Expected: compile error / failures.

- [ ] **Step 3: Implement**

- **`SendItemsComponent`:**
  - Read the stored target in `ngOnInit`. Keep it only if it is among `targets$`.
  - Template: a `mat-form-field` with `mat-select` labelled "Offene Einträge senden an", options tracked by `id`, plus a `mat-flat-button` "Senden" with an icon. The button is disabled when `!targetId || !userID || sending`.
  - Wrap `localStorage` access in `try`/`catch`.
  - Snack bar duration: 4000 ms.
  - Look up the target name for the dialog from `targets$`.
- **`list.component.html`:**
  - Header row: the `h1` and the sort and edit `mat-fab` buttons share a flex row, title growing, buttons on the right. Restyle `.container-top-controls` so it is no longer absolutely positioned.
  - Below it, when `!allowSorting`: `<app-send-items [list]="list" [userID]="userID">`, in a raised, rounded box as in the mockup (option B).

- [ ] **Step 4: Run the full suite and check that it passes**

Run: `npx ng test --watch=false`. Expected: all pass, no NG0956 warnings.

- [ ] **Step 5: Check in the app**

Run `npx ng serve`. Open a list, pick a target, press "Senden", and check that the summary appears. Check that the target is still selected after a reload, and that the row is hidden in sorting mode. Check at phone width (390 px) that the row stays on one line.

- [ ] **Step 6: Commit**

Message `feat: Add a control to send a list's open items to another list`.

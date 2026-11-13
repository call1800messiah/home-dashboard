# Send Recipe Ingredients to a List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From a recipe, send the checked ingredients, scaled to a chosen portion count, to a todo list. Matching items there are reused, and open ones with the same unit have their amounts added up.

**Architecture:** The pure send planner and the summary dialog move into `src/app/shared`. The planner then learns two new things: pre-split sources (whole names, such as "Weizenmehl Type 405") and an `'add'` amount mode. `TodoService` gets a `sendItems` core that `sendOpenItems` wraps. A shared target-list dropdown replaces the one inside `SendItemsComponent`. A new recipes dialog builds ingredient rows, lets the user untick them, and calls `sendItems(..., 'add')`.

**Tech Stack:** Angular 22 (module-based, `standalone: false`, `ChangeDetectionStrategy.Eager`), Angular Material, `@angular/fire`, Karma/Jasmine.

**Spec:** `docs/superpowers/specs/2026-11-13-recipe-ingredients-to-list-design.md`

## Global Constraints

- Branch `feature/recipe-ingredients-to-list` (already created; the spec is committed there).
- Run tests with `npx ng test --watch=false`. For a single file, add `--include=<path to spec>`.
- UI copy is German, exactly:
  - recipe page: "Auf Liste"
  - dialog: "Zutaten auf Liste", "Portionen", "Senden an", "Abbrechen", "Senden"
  - summary group: "Menge erhöht"
  - messages: "Keine Verbindung: Senden geht nur online", "Senden fehlgeschlagen"
- All existing copy stays exactly as it is.
- List sending's behaviour must not change. Every existing case in `send-items.spec.ts`, `todo.service.spec.ts`, `send-items.component.spec.ts` and `send-summary.component.spec.ts` keeps passing. They may be moved, and their imports changed.
- New components are `standalone: false` with `changeDetection: ChangeDetectionStrategy.Eager`.
- Common code goes in `src/app/shared` and is declared and exported by `SharedModule`. `SharedModule` must not import anything from `src/app/todo` or `src/app/recipes`.
- Tests use `testModule(...)` from `src/app/testing/test-module.ts`; nothing may touch real Firebase.
- `localStorage` keys: `todo-send-target-<sourceListId>` (unchanged) and `recipe-send-target`.
- No new npm dependencies.
- Every commit message ends with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```

## Review Focus

- **The portion field is emptied, or set to 0 or a negative number:** "Senden" is disabled, and no amount shows "NaN". *(Task 7)*
- **"Senden" is tapped twice quickly:** only one send happens. *(Task 7)*
- **The same recipe is sent twice:** open items add up a second time ("Mehl 500 g" → "Mehl 1000 g"). This is intended; it is pinned so nobody "fixes" it. *(Task 3)*
- **A short ingredient name is a prefix of a longer list item** ("Mehl" vs "Mehl Type 405 1 kg"): they don't match, and a new item is added. *(Task 3)*
- **Units differ only in case or spacing** ("200G" vs "500 g"): they still add up. *(Task 2)*

---

### Task 1: Move the planner and the summary dialog into shared

A pure move. Nothing changes in behaviour.

**Files:**
- Move: `src/app/todo/services/send-items.ts` → `src/app/shared/utils/send-items.ts`
- Move: `src/app/todo/services/send-items.spec.ts` → `src/app/shared/utils/send-items.spec.ts`
- Move: `src/app/todo/components/send-summary/*` (4 files) → `src/app/shared/components/send-summary/`
- Move: `src/app/todo/models/send-summary-data.ts` → `src/app/shared/models/send-summary-data.ts`
- Create: `src/app/shared/utils/send-messages.ts`
- Modify: `src/app/shared/shared.module.ts`, `src/app/todo/todo.module.ts`, `src/app/todo/services/todo.service.ts`, `src/app/todo/components/send-items/send-items.component.ts` and `.spec.ts`

**Interfaces:**
- Produces:
  - `SendSummaryComponent`, declared and exported by `SharedModule`, so it is no longer in `TodoModule`.
  - `src/app/shared/utils/send-messages.ts` exports `SEND_OFFLINE_MESSAGE = 'Keine Verbindung: Senden geht nur online'` and `SEND_FAILED_MESSAGE = 'Senden fehlgeschlagen'`.
  - `SendItemsComponent` stops exporting `OFFLINE_MESSAGE` and uses these constants instead.

- [ ] **Step 1:** Move the files with `git mv`. Fix all imports, and fix the spec path comment at the top of `send-items.ts`.
- [ ] **Step 2:** Create `send-messages.ts`. Switch `SendItemsComponent` and its spec to the new constants.
- [ ] **Step 3:** Run `npx ng test --watch=false`. Expected: all tests pass, with the same count as before the move.
- [ ] **Step 4:** Commit: `refactor: Move send planner and summary dialog to the shared module`.

### Task 2: Amount helpers

**Files:**
- Create: `src/app/shared/utils/amounts.ts`
- Test: `src/app/shared/utils/amounts.spec.ts`

**Interfaces:**
- Produces:
  - `formatAmount(value: number, decimal: ',' | '.' = ','): string`. Rounds to at most 2 decimal places, drops trailing zeros, and uses the given decimal separator.
  - `interface ParsedAmount { value: number; unit: string; decimal: ',' | '.'; spaced: boolean }`
  - `parseAmount(quantity: string): ParsedAmount | undefined`. Accepts only `<number><optional spaces><optional single unit word>`, where the number is digits with an optional `,` or `.` decimal part. The unit is kept as written. `decimal` is `'.'` only when the number contains a dot. `spaced` is true when there is whitespace between the number and the unit.
  - `addAmounts(target: string, source: string): string | undefined`. Returns the target quantity increased by the source quantity, written in the target's style (unit, decimal separator, spacing), or `undefined` when the two can't be added.
    - Units match when they are equal after lowercasing. An empty unit matches an empty unit.
    - g↔kg and ml↔l convert by 1000 into the target's unit.

- [ ] **Step 1: Write the failing tests**

```ts
describe('formatAmount', () => {
  it('drops trailing zeros', () => expect(formatAmount(250)).toBe('250'));
  it('uses a comma', () => expect(formatAmount(0.5)).toBe('0,5'));
  it('rounds to two decimals', () => expect(formatAmount(4 / 3)).toBe('1,33'));
  it('can use a dot', () => expect(formatAmount(1.7, '.')).toBe('1.7'));
});

describe('parseAmount', () => {
  it('reads number and unit', () => expect(parseAmount('500 g')).toEqual({ value: 500, unit: 'g', decimal: ',', spaced: true }));
  it('reads a comma decimal without space', () => expect(parseAmount('1,5kg')).toEqual({ value: 1.5, unit: 'kg', decimal: ',', spaced: false }));
  it('reads a dot decimal', () => expect(parseAmount('1.2 kg')?.decimal).toBe('.'));
  it('reads a bare number', () => expect(parseAmount('3')).toEqual({ value: 3, unit: '', decimal: ',', spaced: false }));
  ['2-3', 'ca. 4', '2 Coupon nutzen', 'viel'].forEach((text) =>
    it(`rejects "${text}"`, () => expect(parseAmount(text)).toBeUndefined()));
});

describe('addAmounts', () => {
  it('adds the same unit', () => expect(addAmounts('200 g', '500 g')).toBe('700 g'));
  it('keeps the target spacing', () => expect(addAmounts('200g', '500 g')).toBe('700g'));
  it('ignores unit case', () => expect(addAmounts('200G', '500 g')).toBe('700G'));
  it('converts g into kg', () => expect(addAmounts('1 kg', '500 g')).toBe('1,5 kg'));
  it('keeps the target dot', () => expect(addAmounts('1.2 kg', '500 g')).toBe('1.7 kg'));
  it('converts l into ml', () => expect(addAmounts('200 ml', '1 l')).toBe('1200 ml'));
  it('adds bare numbers', () => expect(addAmounts('2', '3')).toBe('5'));
  it('refuses different units', () => expect(addAmounts('2 Stück', '500 g')).toBeUndefined());
  it('refuses unreadable amounts', () => expect(addAmounts('2-3', '1')).toBeUndefined());
});
```

- [ ] **Step 2:** Run `npx ng test --watch=false --include=src/app/shared/utils/amounts.spec.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement the three functions in `amounts.ts`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: Parse, format and add item amounts`.

### Task 3: Planner: pre-split sources and the `'add'` mode

**Files:**
- Modify: `src/app/shared/utils/send-items.ts`, `src/app/shared/components/send-summary/send-summary.component.ts`
- Test: `src/app/shared/utils/send-items.spec.ts`, `src/app/shared/components/send-summary/send-summary.component.spec.ts`

**Interfaces:**
- Consumes: `addAmounts` (Task 2).
- Produces:
  - **Source type and its builder:**
    - `interface SendSource { content: string; name: string; quantity?: string; exactName: boolean }`. `content` is the text written for a new item.
    - `sourceFromText(text: string): SendSource`, which returns `{ content: text, ...splitQuantity(text), exactName: false }`.
  - **Amount mode:** `type AmountMode = 'replace' | 'add'`.
  - **New planner signature:** `planSend(sources: SendSource[], targetItems: TodoItem[], mode: AmountMode = 'replace'): SendPlan`.
  - **Name-prefix split:** `splitByName(text: string, name: string): SplitText | undefined`.
    - It compares the first *n* words of `text` with the *n* words of `name`, where *n* is the word count of `name`, using `normalizeName`.
    - It returns `undefined` if those words differ.
    - If no words are left over, it returns `{ name: <those words as written in text> }`.
    - If the next word starts with a digit, or is a qualifier from `QUANTITY_QUALIFIERS` followed by a word that starts with a digit, it returns `{ name, quantity: <rest> }`.
    - Otherwise it returns `undefined`.
  - **New summary field:** `SendSummary` gains `quantityIncreased: string[]`, shown in the summary as group "Menge erhöht", placed after "Wieder offen" and before "Menge geändert".

**Matching order for a source:**

1. If `exactName` is set: target items where `splitByName(content, source.name)` is defined (pick an open one, else the first). The target's name and quantity come from that split.
2. The existing `splitQuantity` same-name match.
3. The existing close-name match.

**Amounts:** in `'add'` mode, for an *open* target where both quantities exist and `addAmounts(targetQuantity, quantity)` is defined:

- the content becomes `${targetName} ${sum}`;
- the summary gets `"${targetName} ${targetQuantity} → ${sum}"` in `quantityIncreased`.

Everything else behaves exactly as in `'replace'` mode. A ticked target is reopened with the source quantity and never added to.

- [ ] **Step 1: Write the failing tests.**
  - Existing `planSend` tests: wrap their sources with `sourceFromText`.
  - Add these cases, using an `exact(name, quantity?)` helper that builds `{ content: quantity ? \`${name} ${quantity}\` : name, name, quantity, exactName: true }`:

```ts
describe('planSend in add mode', () => {
  it('adds to an open item with the same unit', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl 200 g')], 'add');
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Mehl 700 g', untick: false }]);
    expect(plan.summary.quantityIncreased).toEqual(['Mehl 200 g → 700 g']);
  });
  it('adds again when the same recipe is sent twice', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl 500 g')], 'add');
    expect(plan.updates[0].content).toBe('Mehl 1000 g');
  });
  it('reopens a ticked item with the recipe amount', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl 200 g', true)], 'add');
    expect(plan.updates).toEqual([{ itemId: 't1', content: 'Mehl 500 g', untick: true }]);
    expect(plan.summary.reopened).toEqual(['Mehl 200 g → 500 g']);
  });
  it('replaces and reports a different unit', () => {
    const plan = planSend([exact('Eier', '3')], [item('t1', 'Eier 1 Packung')], 'add');
    expect(plan.updates[0].content).toBe('Eier 3');
    expect(plan.summary.quantityChanged).toEqual(['Eier 1 Packung → 3']);
  });
  it('gives an amountless open item the recipe amount', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl')], 'add');
    expect(plan.updates[0].content).toBe('Mehl 500 g');
  });
  it('adds two lines for the same item in sequence', () => {
    const plan = planSend([exact('Butter', '100 g'), exact('Butter', '50 g')], [item('t1', 'Butter 250 g')], 'add');
    expect(plan.updates[0].content).toBe('Butter 400 g');
  });
  it('keeps a name with a number whole', () => {
    const plan = planSend([exact('Weizenmehl Type 405', '500 g')],
      [item('t1', 'Weizenmehl Type 550 1 kg'), item('t2', 'Weizenmehl Type 405 200 g')], 'add');
    expect(plan.updates).toEqual([{ itemId: 't2', content: 'Weizenmehl Type 405 700 g', untick: false }]);
  });
  it('adds a new item for a name with a number that is not on the list', () => {
    const plan = planSend([exact('Weizenmehl Type 405', '500 g')], [item('t1', 'Weizenmehl Type 550 1 kg')], 'add');
    expect(plan.newItems).toEqual(['Weizenmehl Type 405 500 g']);
  });
  it('does not match a longer name that starts with the ingredient', () => {
    const plan = planSend([exact('Mehl', '500 g')], [item('t1', 'Mehl Type 405 1 kg')], 'add');
    expect(plan.newItems).toEqual(['Mehl 500 g']);
  });
  it('matches ignoring case and keeps the list spelling', () => {
    const plan = planSend([exact('mehl', '500 g')], [item('t1', 'Mehl 200 g')], 'add');
    expect(plan.updates[0].content).toBe('Mehl 700 g');
  });
});

describe('splitByName', () => {
  it('splits off the amount', () => expect(splitByName('Weizenmehl Type 405 500 g', 'weizenmehl type 405')).toEqual({ name: 'Weizenmehl Type 405', quantity: '500 g' }));
  it('accepts a qualifier', () => expect(splitByName('Mehl ca. 1 kg', 'mehl')).toEqual({ name: 'Mehl', quantity: 'ca. 1 kg' }));
  it('accepts the bare name', () => expect(splitByName('Mehl', 'mehl')).toEqual({ name: 'Mehl' }));
  it('rejects a longer name', () => expect(splitByName('Mehl Type 405', 'mehl')).toBeUndefined());
});
```

  Also add a summary component test: a summary with `quantityIncreased: ['Mehl 200 g → 700 g']` shows "Menge erhöht (1)" after "Wieder offen".

- [ ] **Step 2:** Run the two specs with `--include`. Expected: FAIL.
- [ ] **Step 3:** Implement the changes in `send-items.ts`, and add the group to `GROUP_TITLES` in the summary component. Have `findMatch` return the target's split (`{ item, close, name, quantity }`) so the main loop stops re-splitting the target.
- [ ] **Step 4:** Run both specs, then the full suite. Expected: PASS, and all old `planSend` cases are unchanged.
- [ ] **Step 5:** Commit: `feat: Add up amounts and keep whole ingredient names when sending`.

### Task 4: `TodoService.sendItems`

**Files:**
- Modify: `src/app/todo/services/todo.service.ts`
- Test: `src/app/todo/services/todo.service.spec.ts`

**Interfaces:**
- Consumes: `SendSource`, `AmountMode`, `sourceFromText`, `planSend` (Task 3).
- Produces: `sendItems(sources: SendSource[], targetListId: string, userId: string, mode: AmountMode = 'replace'): Promise<SendSummary>`.
  - It holds today's transaction body: the fresh read of the target, dropping deleted items, and `writeSend`.
  - It rejects when the target list doesn't exist.
  - `sendOpenItems(sourceListId, targetListId, userId)` keeps its signature and becomes: find the source in the cache, map its open items with `sourceFromText(item.content)`, then `return this.sendItems(sources, targetListId, userId)`.

- [ ] **Step 1: Write the failing tests** in a new `describe('TodoService.sendItems', …)` that reuses the `sendOpenItems` fixture (server target `dst` holding `t1 'Milch 1l' (done)` and `t2 'Brot'`).
  - `'adds amounts in add mode'`: server `t2` is `'Brot 1'`; send `[{ content: 'Brot 2', name: 'Brot', quantity: '2', exactName: true }]` with `'add'`. Expect a write of `t2` with `content: 'Brot 3'`, and `summary.quantityIncreased` equal to `['Brot 1 → 3']`.
  - `'creates new items from the source content'`: send an exact `'Zucker'` source. Expect a new item with `content: 'Zucker'`, and the target list's `items` starting with that new id.
  - `'rejects when the target list does not exist'`.
- [ ] **Step 2:** Run `--include=src/app/todo/services/todo.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `sendItems` and slim down `sendOpenItems`.
- [ ] **Step 4:** Run the same spec. Expected: PASS, including all old `sendOpenItems` cases.
- [ ] **Step 5:** Commit: `feat: Send any items to a list through one shared core`.

### Task 5: Shared target-list dropdown

**Files:**
- Create: `src/app/shared/components/target-list-picker/target-list-picker.component.{ts,html,scss,spec.ts}`
- Modify: `src/app/shared/shared.module.ts`, `src/app/todo/components/send-items/send-items.component.{ts,html,scss,spec.ts}`

**Interfaces:**
- Produces: `TargetListPickerComponent`, selector `app-target-list-picker`, declared and exported by `SharedModule`.
  - **Inputs:**
    - `@Input() lists: { id: string; name: string }[] | null`
    - `@Input({ required: true }) storageKey!: string`
    - `@Input({ required: true }) label!: string`
  - **Output:** `@Output() targetChange = new EventEmitter<string>()`
  - **Public state:** `targetId: string | null`.
  - **Behaviour:**
    - When `lists` arrives (in `ngOnChanges`) and nothing has been chosen yet, it preselects the stored id if that id is in `lists`, and emits it.
    - When the user picks a list, it stores the id and emits it.
    - `localStorage` access is wrapped in `try/catch`, as in `SendItemsComponent` today.
    - It renders a `mat-form-field` (`appearance="fill"`, `subscriptSizing="dynamic"`) with a `mat-select`, one option per list (`track list.id`).
- Afterwards, `SendItemsComponent` drops its own storage code, `readStoredTarget` and the `firstValueFrom` preselection. It renders `<app-target-list-picker [lists]="targets$ | async" [storageKey]="'todo-send-target-' + list.id" label="Offene Einträge senden an" (targetChange)="targetId = $event">`, and the picker takes the width the dropdown had.

- [ ] **Step 1: Write the failing picker tests** (`'stores and emits the chosen list'`, `'preselects and emits the stored list'`, `'ignores a stored list that no longer exists'`, `'works without localStorage'` with `spyOn(localStorage, 'getItem').and.throwError('denied')`).
  - Move these cases from `send-items.component.spec.ts`: "remembers the target per source list", "preselects the remembered target", "ignores a remembered target that no longer exists". Keep one integration case there, "remembers the target per source list", checking the key `todo-send-target-<id>`.
- [ ] **Step 2:** Run the picker spec. Expected: FAIL.
- [ ] **Step 3:** Implement the picker, and switch `SendItemsComponent` over to it.
- [ ] **Step 4:** Run the full suite. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor: Share the target list dropdown`.

### Task 6: Ingredient rows

**Files:**
- Create: `src/app/recipes/models/ingredient-row.ts`, `src/app/recipes/utils/ingredient-rows.ts`
- Test: `src/app/recipes/utils/ingredient-rows.spec.ts`

**Interfaces:**
- Consumes: `formatAmount` (Task 2), `SendSource` (Task 3), `Recipe` and `IngredientRequirement`.
- Produces:
  - `interface IngredientRow { key: string; name: string; amount: number; unit: string }`. `amount` is per portion. `key` is `${ingredient.id}|${unit.trim().toLowerCase()}`.
  - `buildIngredientRows(recipe: Recipe): IngredientRow[]`. Takes the main recipe's requirements, then each child's in order. Rows with the same `key` are merged by summing `amount`, keeping the first row's position and spelling.
  - `rowQuantity(row: IngredientRow, servings: number): string | undefined`. Returns `undefined` when `row.amount <= 0` or `servings` is not a whole number ≥ 1. Otherwise it returns `formatAmount(row.amount * servings)`, followed by `' ' + unit` when the unit is not empty.
  - `rowSource(row: IngredientRow, servings: number): SendSource`. Returns `{ content, name, quantity, exactName: true }`, where `content` is `name` or `${name} ${quantity}`.

- [ ] **Step 1: Write the failing tests:**
  - `'lists the main recipe, then the sub-recipes'`
  - `'merges the same ingredient with the same unit across parts'`
  - `'keeps different units apart'`
  - `rowQuantity` scales and rounds: amount `1/3`, servings `4`, unit `'EL'` gives `'1,33 EL'`.
  - `rowQuantity` gives `undefined` for amount `0`, for servings `0`, for servings `-1`, and for `null` cast to number.
  - `rowSource` builds `'Salz'` with no quantity, and `'Mehl 500 g'` from amount 125, servings 4, unit `'g'`.
- [ ] **Step 2:** Run with `--include`. Expected: FAIL.
- [ ] **Step 3:** Implement the functions.
- [ ] **Step 4:** Run with `--include`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: Build sendable ingredient rows from a recipe`.

### Task 7: Send-ingredients dialog

**Files:**
- Create: `src/app/recipes/models/send-ingredients-data.ts`, `src/app/recipes/components/send-ingredients/send-ingredients.component.{ts,html,scss,spec.ts}`
- Modify: `src/app/recipes/recipes.module.ts` (declare the dialog)

**Interfaces:**
- Consumes:
  - Task 6: `buildIngredientRows`, `rowQuantity`, `rowSource`
  - Task 4: `TodoService.getTodoLists()` and `sendItems(..., 'add')`
  - Task 5: `TargetListPickerComponent`
  - Task 1: `SendSummaryComponent`, `SendSummaryData`, `SEND_OFFLINE_MESSAGE`, `SEND_FAILED_MESSAGE`
- Produces:
  - `interface SendIngredientsData { recipe: Recipe; servings: number; userID: string }`
  - `SendIngredientsComponent`, opened with `MatDialog`, with this public state:
    - `rows: IngredientRow[]`
    - `checked: Set<string>` (row keys; starts with all of them)
    - `servings: number`
    - `targetId: string | null`
    - `sending: boolean`
    - `get canSend(): boolean`, true only with a target, a whole `servings` ≥ 1, at least one checked row, and not sending
    - `send(): Promise<void>`
  - **Template:**
    - Title: "Zutaten auf Liste".
    - A number input "Portionen" (`step 1`, `min 1`) bound to `servings`.
    - One `mat-checkbox` row per ingredient, showing the name and `rowQuantity(row, servings) ?? ''` (`track row.key`).
    - `<app-target-list-picker [lists]="targets$ | async" storageKey="recipe-send-target" label="Senden an">`.
    - Actions: "Abbrechen" (`mat-dialog-close`) and "Senden" (`[disabled]="!canSend"`).
  - **`send()` behaviour:**
    - It returns early unless `canSend`.
    - When offline (`navigator.onLine` false), it shows a snackbar with `SEND_OFFLINE_MESSAGE` (4000 ms) and returns.
    - Otherwise it calls `sendItems(checked rows → rowSource, targetId, userID, 'add')`, closes its dialog, and opens `SendSummaryComponent` (`width: '500px'`) with the target's name.
    - On error, it stays open and shows `SEND_OFFLINE_MESSAGE` when `code === 'unavailable'`, otherwise `SEND_FAILED_MESSAGE`. `sending` is reset in `finally`.

- [ ] **Step 1: Write the failing tests**, using `testModule(RecipesModule)`, a `TodoService` spy, and `MAT_DIALOG_DATA` holding a recipe (main: Mehl 125 g, Salz 0; child: Mehl 50 g) with `servings: 4`:
  - `'shows every ingredient checked with scaled amounts'`: two rows, `'Mehl'`/`'700 g'` and `'Salz'`/`''`, both checked.
  - `'rescales when the portion count changes'`: servings 2 gives `'350 g'`.
  - `'keeps ticks when the portion count changes'`.
  - `'disables Senden without a valid portion count'`: for `0`, `-1` and `null`, the button is disabled and no amount text contains `NaN`.
  - `'disables Senden when nothing is checked'`.
  - `'sends only checked ingredients in add mode'`: untick Salz, then expect `sendItems` called with `[jasmine.objectContaining({ content: 'Mehl 700 g', exactName: true })]`, `'dst'`, `'u1'`, `'add'`.
  - `'closes and opens the summary after sending'`.
  - `'ignores a second tap while sending'`.
  - `'does not send while offline'` (SEND_OFFLINE_MESSAGE).
  - `'stays open and explains a failure'` (SEND_FAILED_MESSAGE, dialog not closed).
- [ ] **Step 2:** Run with `--include`. Expected: FAIL.
- [ ] **Step 3:** Implement the component and declare it in `RecipesModule`.
- [ ] **Step 4:** Run with `--include`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: Add a dialog to send a recipe's ingredients to a list`.

### Task 8: Button on the recipe page

**Files:**
- Modify: `src/app/recipes/components/recipe/recipe.component.{ts,html,scss,spec.ts}`

**Interfaces:**
- Consumes: `SendIngredientsComponent` and `SendIngredientsData` (Task 7), and `AuthService.user$` (as in `ListComponent`).
- Produces:
  - `RecipeComponent` gets `userID?: string`, subscribed from `AuthService.user$` in `ngOnInit` and unsubscribed in `ngOnDestroy`.
  - It gets `get hasIngredients(): boolean`, true when the recipe or any child has requirements.
  - It gets `sendIngredients(): void`, which opens the dialog with `{ recipe, servings, userID }`, `maxHeight: '90vh'` and `width: '500px'`.
  - The template places a button `mat-stroked-button` with `<mat-icon>add_shopping_cart</mat-icon> Auf Liste` next to `app-serving-count`. It is shown only when `hasIngredients`, and disabled while `userID` is unknown.

- [ ] **Step 1: Write the failing tests:**
  - `'shows Auf Liste when only a sub-recipe has ingredients'`
  - `'hides Auf Liste without ingredients'`
  - `'opens the dialog with the current portions'`: set servings to 6, click, and expect `dialog.open` called with `SendIngredientsComponent` and `jasmine.objectContaining({ data: jasmine.objectContaining({ servings: 6, userID: 'u1' }) })`.
- [ ] **Step 2:** Run with `--include`. Expected: FAIL.
- [ ] **Step 3:** Implement the button and its handlers.
- [ ] **Step 4:** Run the full suite (`npx ng test --watch=false`) and `npx ng build`. Expected: all tests pass and the build succeeds with no errors.
- [ ] **Step 5:** Commit: `feat: Send a recipe's ingredients to a list from the recipe page`.

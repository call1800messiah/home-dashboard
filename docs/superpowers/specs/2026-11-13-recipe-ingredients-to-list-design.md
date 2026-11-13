# Send a recipe's ingredients to a todo list

Status: draft 2026-11-13. Branch: `feature/recipe-ingredients-to-list`.

## Why

When cooking a recipe, its ingredients have to be typed onto the shopping list by hand. Usually only some of them are needed, because the rest are already at home, and the amounts depend on how many portions are cooked. The user wants to put the needed ingredients, in the right amounts, onto a list in one step, without creating duplicates of items already on that list.

This builds on list sending (`docs/superpowers/specs/2026-11-03-copy-items-between-lists-design.md`). The target list choice and the duplicate matching work the same way, and the code is shared.

## Goals

- From a recipe, open a dialog that lists every ingredient with its amount for a chosen portion count. Every ingredient starts checked.
- Untick ingredients that don't need to be bought, change the portion count, pick a target list, and send.
- Ingredients become open, unticked items on the target list.
- Items already on the list are reused, not duplicated. This uses the same name and close-name matching as list sending.
- If a reused item is still open, its amount is increased by the recipe's amount when the units match. Cooking two recipes in one week then gives the total.
- The chosen target list is remembered, because it is almost always the same list.

## Non-goals

- Changing recipes or ingredients.
- Converting between units other than g/kg and ml/l.
- Remembering which ingredients were unticked, either between dialog openings or per recipe.
- Sending while offline.

## Anti-goals

- Changing how list sending behaves. It keeps replacing amounts, exactly as it does today.
- Near-duplicates on the target list ("Mehl 200 g" next to "Mehl 500 g").
- Silent guesses: close matches and changed amounts must show up in the summary afterwards.

## Approaches considered

1. **Extend the existing send code (chosen).** `planSend` gets a setting for how to handle amounts. The service's send path is split into a shared core that takes item texts. The target dropdown, the planner and the summary dialog move into the shared module. One matcher serves both features.
2. **A separate planner for recipes.** List sending would stay untouched, but there would be two copies of the matching code that drift apart.
3. **Pass ingredients as fake todo items to `sendOpenItems` unchanged.** Adding up amounts needs a planner change anyway, so this saves nothing.

The user picked 1 and asked that all common code go into the shared module.

## Decided with the user

- A button on the recipe page opens a dialog.
- The dialog has a portion field at the top that scales the amounts immediately. Below it, every ingredient has a checkbox and starts checked.
- The target list is picked with the same kind of dropdown as list sending and is stored in `localStorage`.
- Items arrive on the target list open and unticked. Matching reuses list sending's rules: same name first, then a close name ("Tomate"/"Tomaten"); among several candidates, an open item is preferred.
- **Amounts (option B):** when the matched item is open and the units match, the amounts are added up ("Mehl 200 g" + 500 g → "Mehl 700 g"). Otherwise, the recipe's amount replaces the item's amount, as in list sending.
- Common code lives in `src/app/shared`.

## How it behaves

### The button

The recipe page (`RecipeComponent`) shows a button next to the portion field (`app-serving-count`), with a cart icon (`add_shopping_cart`) and the label "Auf Liste". It is only shown when the recipe or one of its sub-recipes has ingredients. *(My call. The "Zutaten" heading is only rendered when the main recipe has its own ingredients, so it can't hold the button for recipes whose ingredients are all in sub-recipes. The portion field sits above all ingredient lists and is what the dialog starts from.)*

### The dialog

```
┌ Zutaten auf Liste ──────────────────────────┐
│ Portionen [ 4 ]                             │
│ ☑ Mehl                              500 g   │
│ ☑ Butter                            250 g   │
│ ☐ Salz                                      │
│ ☑ Eier                              3       │
│                                             │
│ [Senden an: Wocheneinkauf ▾]                │
│                      [Abbrechen] [Senden ➤] │
└─────────────────────────────────────────────┘
```

- **Portion field:** a number input (`step 1`, `min 1`) that starts at the recipe page's current portion count. Changing it rescales all amounts immediately. It does not change the portion count on the recipe page. *(My call.)*
- **Ingredients:** one flat list made of the main recipe's ingredients followed by each sub-recipe's ingredients, in the order shown on the page. If an ingredient (same ingredient id) appears more than once with the same unit, it is shown once with the amounts added together. With different units, it is shown on separate rows. *(My call. This replaces the grouping by sub-recipe I first suggested, because a combined row can't belong to one sub-recipe.)*
- **Checkboxes:** all checked when the dialog opens. Ticks stay as they are when the portion count changes.
- **Target list:** the shared target dropdown (below), listing all todo lists. The choice is remembered under one key for all recipes, `recipe-send-target`. If the stored list no longer exists, nothing is preselected.
- **"Senden"** is disabled until a target is picked, while nothing is checked, and while a send is in progress. When offline, it shows the same "Keine Verbindung: Senden geht nur online" message as list sending.
- **After sending:** the dialog closes and the shared summary dialog opens. If the send fails, the dialog stays open with the existing error snackbar, so the user's choices are kept.

### Turning an ingredient into item text

- The text is `<name> <amount> <unit>`: "Mehl 500 g", "Eier 3". An ingredient with amount 0 (no amount) becomes just its name ("Salz"). An empty unit is left out.
- Amount = stored amount × portions. Stored amounts are per portion.
- Amounts are rounded to at most two decimal places, trailing zeros are dropped, and the decimal separator is a German comma: "1,33", "0,5", "250". *(My call.)*
- The dialog hands the planner the name and the amount as separate values, not as one text to split. Ingredient names can contain numbers ("Weizenmehl Type 405"), and `splitQuantity` would cut the name at the "405". *(My call; see "Ingredient names with numbers" below.)*

### Ingredient names with numbers

`splitQuantity` treats the first later word that starts with a digit as the start of the amount. So "Weizenmehl Type 405 500 g" would split into the name "Weizenmehl Type", which would then match "Weizenmehl Type 550". *(My call, so that list sending is unchanged:)*

- **Pre-split sources:** the planner accepts source items that are already split, as `{ name, quantity? }`. List sending builds these with `splitQuantity` as today. The recipe dialog builds them from the ingredient name and the formatted amount and unit. So `sendItems` takes `{ name, quantity? }[]` rather than `string[]`.
- **Matching against the target:** for a source whose name was given (not split), a target item also counts as having the *same name* when its normalized text equals the source name, or starts with the source name followed by a space and an amount that starts with a digit or a quantity qualifier. Its amount is then that remainder. This check comes before the usual `splitQuantity` comparison. So "Weizenmehl Type 405 500 g" on the list is found again by the next recipe, and "Weizenmehl Type 550 1 kg" is not.
- **Close matches:** these keep using the `splitQuantity` names, as today.
- **Known limit:** list sending keeps its current behaviour for such names.

### Adding up amounts (planner)

`planSend` gets an option for the amount mode: `'replace'` (the default, used by list sending, with behaviour unchanged) or `'add'` (used by recipes).

In `'add'` mode, when a source item matches a target item:

- **The target is ticked:** reopen it with the source amount. Nothing is added, because a ticked item was already bought. This is the same as list sending.
- **The target is open, and both amounts parse as `<number> <unit>` with matching units:** the new amount is the sum, written in the target's unit and number style.
  - "Matching units" means equal after lowercasing and ignoring the space between number and unit ("200g" equals "200 g"). An empty unit matches an empty unit ("Eier 2" + 3 → "Eier 5").
  - g/kg and ml/l are converted to the target's unit ("Mehl 1 kg" + 500 g → "Mehl 1,5 kg"). *(My call.)*
  - Numbers parse with comma or dot as the decimal separator. The sum is written in the target's style, using the same rounding as above: the target's unit, the target's decimal separator (a dot only if the target used one, otherwise a comma), and the target's spacing between number and unit. "Mehl 200g" + 500 g → "Mehl 700g"; "Mehl 1.2 kg" + 500 g → "Mehl 1.7 kg". *(My call.)*
- **The target is open with no amount** ("Mehl"): it takes the source amount.
- **Otherwise** (different units, ranges like "2-3", qualifiers like "ca. 4", text after the number): the source amount replaces the target's amount, as in `'replace'` mode.
- **The source has no amount:** the target is left as it is (it is only reopened if it was ticked). This is the same as list sending.

Two recipe lines that match the same target item in one send add up in sequence, because the planner already applies each line to the effect of the ones before it.

### Summary

The existing summary groups stay. One new group, "Menge erhöht" (amount increased), lists additions as "Mehl 200 g → 700 g". Replacements still go to "Menge geändert" (amount changed), and any replacement in `'add'` mode, for example because the units didn't match, shows up there so it is never silent. The dialog title stays "An <list> gesendet".

## Code structure

### Moves into `src/app/shared` and `SharedModule`

- **The planner** (`src/app/todo/services/send-items.ts`, together with its spec), including `splitQuantity`, the matching, `planSend` and the summary types, plus the new amount parsing and adding. *Suggested location:* `src/app/shared/utils/send-items.ts`.
- **`SendSummaryComponent`** with `SendSummaryData`, declared and exported by `SharedModule`.
- **A new target-list dropdown component**, taken out of `SendItemsComponent`'s dropdown. It is a "dumb" component:
  - inputs: the selectable lists (`{ id, name }[]`), the `localStorage` key, and the label;
  - output: the chosen id.
  - It owns reading and writing the stored choice, including the private-mode `try/catch` and ignoring a stored id that isn't in the lists.

  It takes lists as input instead of injecting `TodoService`, so the shared module doesn't depend on the todo feature. `SendItemsComponent` uses it and keeps its per-source-list key `todo-send-target-<listId>`.
- **The amount formatting helper** (rounding, German comma), used both to write ingredient lines and to write sums.

### Stays where it is

- **`TodoService`** stays in `src/app/todo` (it is `providedIn: 'root'`, so recipes can inject it). `sendOpenItems` becomes a thin wrapper around a new shared core, `sendItems(contents: string[], targetListId, userId, amountMode)`. The core holds the transaction that is in `sendOpenItems` today, including the fresh read of the target and dropping deleted items. *(My call: moving the todo data service into shared is a bigger refactor than this feature needs.)*
- **`SendItemsComponent`** stays in todo and swaps its dropdown for the shared one.

### New in `src/app/recipes`

- **A dialog component** (for example `SendIngredientsComponent`). Its data is the recipe (with children) and the starting portion count. It builds the combined ingredient rows, keeps the ticks, formats item texts, calls `TodoService.sendItems(..., 'add')`, and opens the summary.
- **The button and dialog opening** in `RecipeComponent`.

## Left to the builder

- Where the recipe page gets the current user id from. List sending gets it as an input; follow how other recipe writes get `editedBy`.
- Exact styling, dialog width (list sending's summary uses `500px`), and test structure. The existing `send-items.spec.ts` and `todo.service.spec.ts` must keep passing after the move, with the new `'add'` cases added.

# Send a todo list's open items to another list

Status: approved 2026-11-12. Branch: `feature/copy-list-items`.

## Why

The household keeps one long shopping list ("Wocheneinkauf", 113 items). Items are never deleted, only ticked and unticked. Many items are bought every week, and finding and unticking each one by hand is tedious because the list is so long. They want to put the weekly items back on the shopping list with one click.

Todo lists are also used for things other than shopping (packing lists, errands, 3D printing ideas), so the feature must not clutter or change how other lists work.

## The idea

Keep the weekly items on a separate, normal todo list (for example "Wöchentlich"). Any list gets a control to send its open items to another list. Items that are already on the target list get unticked there instead of added again.

## Goals

- One tap sends the weekly list's open items to the shopping list.
- Items already on the shopping list are reused (unticked, quantity updated), not duplicated.
- Small spelling differences ("Tomate" / "Tomaten") still count as the same item.
- Afterwards, the user can see what happened, especially any close-match guesses.

## Non-goals

- Sending single items. It is always all open items of the list.
- Moving items. The source list is never changed.
- Renaming items on the target list.
- Merging or cleaning up duplicates that already exist on the target list.

## Anti-goals

- Growing the shopping list with near-duplicates ("Milch 1l" next to "Milch 2l").
- Treating distinct items as the same: "Käse G" and "Käse T" are different items (letters are likely people); "Milch" is not "Hafermilch".
- Silent guesses: any close match must be visible afterwards.

## The control (decided: option B from the mockups)

Mockups: https://claude.ai/artifact/5kVFhS6xS91Evs2Jj2wKPJ (private to the user; the description below is enough to build from).

On the list page (`ListComponent`), the existing sort and edit buttons move up next to the list title, in one row: title on the left taking the remaining width, the two round buttons on the right. Below the title, a row of its own holds:

- a dropdown labelled "Offene Einträge senden an" listing the other todo lists by name, taking the remaining width;
- a "Senden" button with a send/arrow icon, to the right of the dropdown.

The row sits above the list card, in a slightly raised box with rounded corners; on a phone it stays one line. The `.container-top-controls` class in `src/scss/common.scss` is only used by this page, so it can be changed or replaced freely.

The chosen target is stored in `localStorage`, so it is preselected next time. *Builder's call (mine):* the key is per source list (for example `todo-send-target-<sourceListId>`), so each list remembers its own target. If the stored list no longer exists, nothing is preselected.

*My call:* the row is hidden while sorting mode is on, like the add-item field. "Senden" is disabled until a target is selected and while a send is in progress.

## What gets sent

- Only open (unticked) items of the source list. Ticked items are skipped; ticking an item on the weekly list is how the user leaves it out for a week.
- The source list and its items are not changed.

## Splitting an item into name and quantity

Most shopping items end in a quantity. Real examples from the data: "Banane 10", "Sellerie 225g", "Ingwer 10 g", "Kartoffeln 1,5kg", "Kokosmilch 800 ml", "Nektarinen ca. 4", "Kürbis max 1.5kg", "Risotto Reis mind. 650 g", "Gläschen mit Fisch 2-3", "Karotte 4 mittelgroße", "Windeln 2 Coupon nutzen", "Spinat, 1000 g", "Sweet Chili Sauce 200 g", "CO2 Kartusche 2".

Rule (agreed with the user):

- The **quantity** starts at the first standalone number: a word that starts with a digit, possibly with a unit attached ("225g", "1,5kg", "2-3"). If the word directly before it is "ca.", "max", "max.", "mind." or "mind", the quantity starts there instead. Everything from that point to the end of the text is the quantity, including trailing words ("4 mittelgroße", "2 Coupon nutzen", "500 g oder Fettucine").
- The **name** is everything before the quantity, trimmed, with a trailing comma removed ("Spinat," → "Spinat").
- A digit inside a word is not a standalone number: "CO2 Kartusche 2" → name "CO2 Kartusche", quantity "2".
- No standalone number → the whole text is the name, no quantity.
- *My call:* if the text starts with a number ("6 - 8 Bodys"), the whole text is the name. This barely occurs on shopping lists and avoids an empty name.

| Text | Name | Quantity |
|---|---|---|
| Banane 10 | Banane | 10 |
| Kartoffeln 1,5kg | Kartoffeln | 1,5kg |
| Risotto Reis mind. 650 g | Risotto Reis | mind. 650 g |
| Magerquark, mind. 500 g | Magerquark | mind. 500 g |
| Karotte 4 mittelgroße | Karotte | 4 mittelgroße |
| CO2 Kartusche 2 | CO2 Kartusche | 2 |
| Käse G 2 | Käse G | 2 |
| Kleine Tomaten | Kleine Tomaten | (none) |

## Matching a sent item to the target list

Only names are compared. Names are normalised first: lower case, leading and trailing spaces removed, runs of spaces collapsed to one. *My call:* umlauts are not folded (ä ≠ a).

For each sent item, in this order:

1. **Same name:** a target item whose normalised name is equal.
2. **Close name:** a target item whose name has the same number of words, where exactly one word differs, that word differs by one letter (one insertion, deletion or substitution), and both versions of that word have at least 5 letters.
   - Matches: "Tomate" / "Tomaten", "Passierte Tomate" / "Passierte Tomaten", "Banane" / "Bananen".
   - No match: "Reis" / "Eis" (too short), "Käse G" / "Käse T" (the differing word is one letter), "Milch" / "Hafermilch" (more than one letter), "Tee" / "Tee für Aurelio" (different word count).
3. **No match:** create a new item.

A same-name match always wins over a close match.

**Several candidates** (*my call*, the user did not decide this):
- Several same-name items on the target: use an open one if there is one, otherwise the first in list order.
- No same-name item but several close matches: same rule (an open one if there is one, otherwise the first in list order). It is listed under "Ähnlicher Name verwendet" like any close match. Creating a new item instead would add the near-duplicates this feature is meant to avoid.

Both lists are compared in their current state when "Senden" is pressed. *My call:* two weekly items matching the same target item are applied in weekly-list order (the second wins on quantity); this is an edge case not worth special handling.

## What happens to each sent item

| Situation | Result on the target list | Summary group |
|---|---|---|
| Match, ticked | Unticked; quantity replaced if the sent item has one | "Wieder offen" |
| Match, already open, quantity differs | Quantity replaced | "Menge geändert" |
| Match, already open, same or no quantity | Nothing changes | "War schon offen" |
| No match | New open item with the sent item's full text | "Neu hinzugefügt" |
| Any close match | as above | also listed under "Ähnlicher Name verwendet" |

Details:

- **Replacing the quantity:** the target item's text becomes its own name (exactly as written on the target) + a space + the sent item's quantity. "Tomate 500g" sent to "Tomaten 1kg" gives "Tomaten 500g". If the sent item has no quantity, the target's text is not changed.
- "Quantity differs" compares the quantity strings after trimming and collapsing spaces.
- **Unticking** works like unticking in the UI (`TodoItemComponent.toggleDone`): `done: false`, and `doneBy` and `markedDone` removed.
- Any change to a target item sets `edited` to now and `editedBy` to the current user.
- **New items** are created the way `EditTodoItemComponent` creates them (author, created, edited, editedBy = current user / now, `done: false`). *My call:* they are inserted at the top of the target list, in the order they appear on the source list.

## Summary popup

After a send, a dialog (Angular Material dialog, like the existing ones) titled "An <target name> gesendet" lists the groups that are not empty, in this order, each with its count and the item names:

1. "Ähnlicher Name verwendet (n)": "Tomate → Tomaten", highlighted so guesses stand out.
2. "Wieder offen (n)"
3. "Menge geändert (n)": "Milch 1l → 2l"
4. "Neu hinzugefügt (n)"
5. "War schon offen (n)"

An item that was unticked and got a new quantity appears under "Wieder offen" with the quantity change shown ("Milch 1l → 2l"). One "OK" button closes the dialog. The user stays on the source list.

*My call:* if the source list has no open items, the button does nothing but show a short message ("Keine offenen Einträge") instead of the dialog.

*My call:* a send is all or nothing. All item updates, the new item documents and the target list's item array go into one Firestore write batch, so a failure leaves the target list unchanged. On failure, show an error message ("Senden fehlgeschlagen") and no summary.

*Changed 2026-11-13:* the batch became a Firestore transaction that reads the target list and its items from the server. A batch queued offline could commit later with an outdated item array and drop items another device had added meanwhile. Sending now needs a connection: offline, the button shows "Keine Verbindung: Senden geht nur online" instead of queueing. Ticking items is unaffected and still works offline. Deleting an item now removes just its ID from the list with `arrayRemove`. Adding an item still rewrites the whole array, so an offline add can still drop items sent meanwhile; fixing that needs a different way of storing list order.

## Constraints

- Angular 22 with `@angular/fire` compat on `develop`; the app is module-based (`standalone: false`) and German-language.
- Firestore data model: lists (`todo` collection) hold an ordered array of item IDs; items live in `todoItems`. See `src/app/todo/services/todo.service.ts`.
- No new dependencies are needed.
- Tests run with Karma/Jasmine (`npm test`); `src/app/testing/test-module.ts` provides a stubbed `ApiService`.

## Code notes for the builder

- `ApiService` has no batch method yet. Add one (the compat `AngularFirestore` exposes `firestore.batch()` and `createId()` for new document IDs), go through `useFirestore()` like the other methods, and add it to the stub in `src/app/testing/test-module.ts` and to `api.service.mock.ts`.
- Do not build the send on `TodoService.storeNewTodoItem`: it rewrites the list's item array from a `take(1)` snapshot per item, so several calls in a row can lose items. The batch writes the target list's item array once, with all new IDs inserted.
- `TodoService.storeEditedTodoItem` updates an item and already clears `doneBy` / `markedDone` when they are undefined (via `serializeTodoItem`).
- `TodoService.getTodoLists()` gives all lists for the dropdown (exclude the source list itself).
- The name/quantity split and the matching are pure functions; put them where they can be unit-tested without Angular, and test them with the examples in this document.
- `localStorage` is already used directly in `FilterComponent` and `AuthService`.

## Left to the builder

- Component structure (a separate send-control component or part of `ListComponent`), naming, and where the pure functions live.
- Exact styling of the control row and dialog, within the look of the mockups and the existing Material theme.
- Icons.

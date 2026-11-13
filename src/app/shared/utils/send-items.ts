/**
 * Pure logic for sending items (a todo list's open items, or a recipe's ingredients) to a todo list.
 * See docs/superpowers/specs/2026-11-03-copy-items-between-lists-design.md and
 * docs/superpowers/specs/2026-11-13-recipe-ingredients-to-list-design.md.
 */

import { addAmounts } from './amounts';

export interface SplitText {
  name: string;
  quantity?: string;
}

/** Words that belong to the quantity when they come right before its number ("ca. 4", "mind. 500 g"). */
const QUANTITY_QUALIFIERS = ['ca.', 'max', 'max.', 'mind.', 'mind'];

/**
 * Splits an item's text into a name and a trailing quantity. The quantity starts at the first
 * word after the first that begins with a digit, or at a qualifier directly before it.
 */
export function splitQuantity(text: string): SplitText {
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
  const numberIndex = words.findIndex((word, index) => index > 0 && /^\d/.test(word));
  // Text that starts with a number ("6 - 8 Bodys") is all name, so the name is never empty.
  if (numberIndex < 0 || /^\d/.test(words[0] ?? '')) {
    return { name: words.join(' ') };
  }

  const qualifierIndex = numberIndex - 1;
  const start = qualifierIndex > 0 && QUANTITY_QUALIFIERS.includes(words[qualifierIndex].toLowerCase())
    ? qualifierIndex
    : numberIndex;
  return {
    name: words.slice(0, start).join(' ').replace(/,$/, ''),
    quantity: words.slice(start).join(' '),
  };
}

/**
 * Splits `text` into `name` (as written in `text`) and the quantity after it, when `text` starts
 * with the words of `name` and nothing but a quantity follows. Undefined otherwise, so
 * "Mehl Type 405" is not "Mehl" with an amount.
 */
export function splitByName(text: string, name: string): SplitText | undefined {
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
  const nameLength = normalizeName(name).split(' ').length;
  const head = words.slice(0, nameLength).join(' ');
  if (words.length < nameLength || normalizeName(head) !== normalizeName(name)) {
    return undefined;
  }

  const rest = words.slice(nameLength);
  if (rest.length === 0) {
    return { name: head };
  }
  const startsWithDigit = (word: string | undefined) => /^\d/.test(word ?? '');
  if (startsWithDigit(rest[0]) || (QUANTITY_QUALIFIERS.includes(rest[0].toLowerCase()) && startsWithDigit(rest[1]))) {
    return { name: head, quantity: rest.join(' ') };
  }
  return undefined;
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Minimum length of the differing word for a close match, so "Reis" and "Eis" stay apart. */
const CLOSE_MATCH_MIN_LENGTH = 5;

/**
 * Whether two normalized names differ in exactly one word, by exactly one letter, where that
 * word is long enough for a one-letter difference to be a spelling variant ("Tomate"/"Tomaten").
 */
export function isCloseName(a: string, b: string): boolean {
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  if (wordsA.length !== wordsB.length) {
    return false;
  }

  const differing = wordsA.map((word, index) => [word, wordsB[index]]).filter(([wordA, wordB]) => wordA !== wordB);
  if (differing.length !== 1) {
    return false;
  }

  const [wordA, wordB] = differing[0];
  return wordA.length >= CLOSE_MATCH_MIN_LENGTH
    && wordB.length >= CLOSE_MATCH_MIN_LENGTH
    && isOneEditApart(wordA, wordB);
}

/** Whether one insertion, deletion or substitution turns one (different) word into the other. */
function isOneEditApart(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (longer.length - shorter.length > 1) {
    return false;
  }

  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) {
    i++;
  }
  const rest = shorter.length === longer.length ? i + 1 : i;
  return shorter.slice(rest) === longer.slice(i + 1);
}

/** What a send did, as display lines for the summary dialog. */
export interface SendSummary {
  /** "Tomate → Tomaten": source name → target name, for every close match used. */
  closeMatches: string[];
  /** Target name, or a quantity change string when the quantity changed too. */
  reopened: string[];
  /** "Mehl 200 g → 700 g": open items whose quantity the sent amount was added to. */
  quantityIncreased: string[];
  /** Quantity change strings for items that were already open. */
  quantityChanged: string[];
  /** Full text of each new item. */
  added: string[];
  /** Target name of each matched item that was already open and unchanged. */
  alreadyOpen: string[];
}

/** A change to an existing target item. */
export interface SendUpdate {
  itemId: string;
  content: string;
  untick: boolean;
}

export interface SendPlan {
  updates: SendUpdate[];
  /** Text of each item to create, in source order. */
  newItems: string[];
  summary: SendSummary;
}

/** The fields of a target list item the planner reads. */
export interface SendTarget {
  id: string;
  content: string;
  done: boolean;
}

/** One item to send. `content` is the text written for a new item. */
export interface SendSource {
  content: string;
  name: string;
  quantity?: string;
  /** Match only targets whose text starts with exactly `name`, even if it holds a number. */
  exactName: boolean;
}

/** A source taken from an item's text, split into name and quantity the usual way. */
export function sourceFromText(text: string): SendSource {
  return { content: text, ...splitQuantity(text), exactName: false };
}

/** Whether a sent quantity replaces the target's quantity or is added to it where possible. */
export type AmountMode = 'replace' | 'add';

interface WorkingItem {
  id: string;
  content: string;
  done: boolean;
  /** Index into newItems for items this send creates. */
  newIndex?: number;
  /** Whether this send created or changed the item already. */
  touched?: boolean;
}

interface Match extends SplitText {
  item: WorkingItem;
  close: boolean;
}

/**
 * Works out what sending `sources` (in source order) to a list holding `targetItems` (in list
 * order) does. Each source sees the effect of the ones before it. In `'add'` mode, an amount sent
 * to an open item with an addable quantity is added to that quantity instead of replacing it; one
 * that cannot be added to an item this send already created or changed is joined with " + ", so
 * the same ingredient in two units keeps both amounts.
 */
export function planSend(sources: SendSource[], targetItems: SendTarget[], mode: AmountMode = 'replace'): SendPlan {
  const working: WorkingItem[] = targetItems.map(({ id, content, done }) => ({ id, content, done }));
  const updates = new Map<string, SendUpdate>();
  const newItems: string[] = [];
  const summary: SendSummary = {
    closeMatches: [], reopened: [], quantityIncreased: [], quantityChanged: [], added: [], alreadyOpen: [],
  };

  for (const source of sources) {
    const { name: sourceName, quantity } = source;
    const match = findMatch(source, working);
    if (!match) {
      working.push({
        id: `new-${newItems.length}`, content: source.content, done: false, newIndex: newItems.length, touched: true,
      });
      newItems.push(source.content);
      summary.added.push(source.content);
      continue;
    }

    const { item: target, name: targetName, quantity: targetQuantity } = match;
    if (match.close) {
      summary.closeMatches.push(`${sourceName} → ${targetName}`);
    }

    const sum = mode === 'add' && !target.done && quantity !== undefined && targetQuantity !== undefined
      ? addAmounts(targetQuantity, quantity) ?? (target.touched ? `${targetQuantity} + ${quantity}` : undefined)
      : undefined;
    let content: string;
    if (sum !== undefined) {
      content = `${targetName} ${sum}`;
      summary.quantityIncreased.push(`${targetName} ${targetQuantity} → ${sum}`);
    } else {
      const quantityChanged = quantity !== undefined && quantity !== targetQuantity;
      content = quantityChanged ? `${targetName} ${quantity}` : target.content;
      const change = targetQuantity ? `${targetName} ${targetQuantity} → ${quantity}` : `${targetName} → ${quantity}`;
      if (target.done) {
        summary.reopened.push(quantityChanged ? change : targetName);
      } else if (quantityChanged) {
        summary.quantityChanged.push(change);
      } else {
        summary.alreadyOpen.push(targetName);
        continue;
      }
    }

    if (target.newIndex !== undefined) {
      newItems[target.newIndex] = content;
      summary.added[target.newIndex] = content;
    } else {
      const untick = (updates.get(target.id)?.untick ?? false) || target.done;
      updates.set(target.id, { itemId: target.id, content, untick });
    }
    target.content = content;
    target.done = false;
    target.touched = true;
  }

  return { updates: [...updates.values()], newItems, summary };
}

/**
 * For an exact-name source, a target starting with exactly that name; then the same name, then
 * a close name. Among several, an open item, else the first. Carries the target's split.
 */
function findMatch(source: SendSource, items: WorkingItem[]): Match | undefined {
  const pick = <T extends { item: WorkingItem }>(candidates: T[]) => candidates.find(({ item }) => !item.done) ?? candidates[0];

  if (source.exactName) {
    const exact = pick(items.flatMap((item) => {
      const split = splitByName(item.content, source.name);
      return split ? [{ item, ...split }] : [];
    }));
    if (exact) {
      return { ...exact, close: false };
    }
  }

  const name = normalizeName(source.name);
  const named = items.map((item) => ({ item, ...splitQuantity(item.content) }));
  const same = pick(named.filter((candidate) => normalizeName(candidate.name) === name));
  if (same) {
    return { ...same, close: false };
  }
  const close = pick(named.filter((candidate) => isCloseName(name, normalizeName(candidate.name))));
  return close ? { ...close, close: true } : undefined;
}

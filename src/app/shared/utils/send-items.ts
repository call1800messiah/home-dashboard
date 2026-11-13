/**
 * Pure logic for sending a todo list's open items to another list.
 * See docs/superpowers/specs/2026-11-03-copy-items-between-lists-design.md.
 */

import type { TodoItem } from '../../todo/models/todo-item';

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

interface WorkingItem {
  id: string;
  content: string;
  done: boolean;
  /** Index into newItems for items this send creates. */
  newIndex?: number;
}

/**
 * Works out what sending `sourceItems` (the open items, in source order) to a list holding
 * `targetItems` (in list order) does. Each source item sees the effect of the ones before it.
 */
export function planSend(sourceItems: TodoItem[], targetItems: TodoItem[]): SendPlan {
  const working: WorkingItem[] = targetItems.map(({ id, content, done }) => ({ id, content, done }));
  const updates = new Map<string, SendUpdate>();
  const newItems: string[] = [];
  const summary: SendSummary = { closeMatches: [], reopened: [], quantityChanged: [], added: [], alreadyOpen: [] };

  for (const source of sourceItems) {
    const { name: sourceName, quantity } = splitQuantity(source.content);
    const match = findMatch(normalizeName(sourceName), working);
    if (!match) {
      working.push({ id: `new-${newItems.length}`, content: source.content, done: false, newIndex: newItems.length });
      newItems.push(source.content);
      summary.added.push(source.content);
      continue;
    }

    const target = match.item;
    const { name: targetName, quantity: targetQuantity } = splitQuantity(target.content);
    if (match.close) {
      summary.closeMatches.push(`${sourceName} → ${targetName}`);
    }

    const quantityChanged = quantity !== undefined && quantity !== targetQuantity;
    const content = quantityChanged ? `${targetName} ${quantity}` : target.content;
    const change = targetQuantity ? `${targetName} ${targetQuantity} → ${quantity}` : `${targetName} → ${quantity}`;
    if (target.done) {
      summary.reopened.push(quantityChanged ? change : targetName);
    } else if (quantityChanged) {
      summary.quantityChanged.push(change);
    } else {
      summary.alreadyOpen.push(targetName);
      continue;
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
  }

  return { updates: [...updates.values()], newItems, summary };
}

/** Same name first, then a close name; among several, an open item, else the first. */
function findMatch(name: string, items: WorkingItem[]): { item: WorkingItem; close: boolean } | undefined {
  const named = items.map((item) => ({ item, name: normalizeName(splitQuantity(item.content).name) }));
  const pick = (candidates: typeof named) => (candidates.find(({ item }) => !item.done) ?? candidates[0])?.item;

  const same = pick(named.filter((candidate) => candidate.name === name));
  if (same) {
    return { item: same, close: false };
  }
  const close = pick(named.filter((candidate) => isCloseName(name, candidate.name)));
  return close ? { item: close, close: true } : undefined;
}

/**
 * Pure logic for sending a todo list's open items to another list.
 * See docs/superpowers/specs/2026-11-03-copy-items-between-lists-design.md.
 */

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

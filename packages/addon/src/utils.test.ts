import { expect, it, test } from 'vitest';
import { matchesTitle, sanitizeTitle } from './utils.js';
import { describe } from 'node:test';

describe('sanitizeTitle', () => {
  // See also: https://github.com/sleeyax/stremio-easynews-addon/issues/38#issuecomment-2467015435.
  it.each([
    ['Three Colors: Blue (1993)', 'three colors blue 1993'],
    [
      'Willy Wonka & the Chocolate Factory (1973)',
      'willy wonka and the chocolate factory 1973',
    ],
    ["America's got talent", 'americas got talent'],
    ['WALL-E (2008)', 'wall e 2008'],
    ['WALL·E', 'walle'],
    [
      'Mission: Impossible - Dead Reckoning Part One (2023)',
      'mission impossible dead reckoning part one 2023',
    ],
    [
      'The Lord of the Rings: The Fellowship of the Ring',
      'the lord of the rings the fellowship of the ring',
    ],
    ['Once Upon a Time ... in Hollywood', 'once upon a time in hollywood'],
    ['Am_er-ic.a', 'am er ic a'],
    ['Amérîcâ', 'amérîcâ'],
    ["D'où vient-il?", 'doù vient il'],
    ['Fête du cinéma', 'fête du cinéma'],
  ])("sanitizes the title '%s'", (input, expected) => {
    expect(sanitizeTitle(input)).toBe(expected);
  });
});

describe('matchesTitle', () => {
  it.each([
    // ignore apostrophes
    ["America's Next Top Model", "America's", true],
    ["America's Next Top Model", 'Americas', true],
    // french characters should match exactly
    ['Fête du cinéma', 'cinema', false],
    ['Fête du cinéma', 'cinéma', true],
    ['Fête du cinéma', 'Fete', false],
    ['Fête du cinéma', 'Fête', true],
    // ignore special characters
    ['Am_er-ic.a the Beautiful', 'America the Beautiful', false],
    ['Am_er-ic.a the Beautiful', 'Am er ic a the Beautiful', true],
  ])("matches the title '%s' with query '%s'", (title, query, expected) => {
    expect(matchesTitle(title, query, false)).toBe(expected);
  });
});

import { describe, expect, it } from 'vitest';
import { checkPasswordPolicy } from '../src/utils';

describe('checkPasswordPolicy', () => {
  it('accepts a strong password', () => {
    expect(checkPasswordPolicy('Str0ngPassword')).toEqual([]);
  });

  it('rejects short passwords', () => {
    expect(checkPasswordPolicy('Ab1')).not.toEqual([]);
  });

  it.each([
    ['alllowercase1x', 'uppercase'],
    ['ALLUPPERCASE1X', 'lowercase'],
    ['NoDigitsHereAtAll', 'digit'],
  ])('reports a missing character class: %s', (pw, word) => {
    expect(checkPasswordPolicy(pw).join(' ')).toContain(word);
  });

  it("rejects passwords over bcrypt's 72-byte limit", () => {
    expect(checkPasswordPolicy('Aa1' + 'x'.repeat(80))).not.toEqual([]);
  });
});

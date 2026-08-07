import { describe, expect, it } from 'vitest';
import { count, currency, money, percent, sparkPath } from '@/lib/platform/format';

describe('money', () => {
    it('compacts millions to two decimals', () => {
        expect(money(2_470_000)).toBe('$2.47M');
    });

    it('drops to one decimal past ten million', () => {
        expect(money(12_300_000)).toBe('$12.3M');
    });

    it('compacts thousands with no decimals', () => {
        expect(money(320_000)).toBe('$320K');
        expect(money(1_500)).toBe('$2K');
    });

    it('prints small amounts in full', () => {
        expect(money(850)).toBe('$850');
        expect(money(0)).toBe('$0');
    });

    it('handles negatives by magnitude', () => {
        expect(money(-320_000)).toBe('$-320K');
    });
});

describe('currency / count / percent', () => {
    it('formats exact currency with separators', () => {
        expect(currency(5850)).toBe('$5,850');
    });

    it('formats counts with separators', () => {
        expect(count(1248)).toBe('1,248');
    });

    it('formats percentages to one decimal by default', () => {
        expect(percent(98.234)).toBe('98.2%');
        expect(percent(94, 0)).toBe('94%');
    });
});

describe('sparkPath', () => {
    it('returns nothing for a series too short to draw', () => {
        expect(sparkPath([], 100, 20)).toBe('');
        expect(sparkPath([5], 100, 20)).toBe('');
    });

    it('spans the full width and starts with a move command', () => {
        const path = sparkPath([1, 2, 3], 100, 20, 1);
        expect(path.startsWith('M1.00,')).toBe(true);
        expect(path).toContain('L99.00,');
    });

    it('puts the maximum at the top and the minimum at the bottom', () => {
        const [first, , last] = sparkPath([0, 5, 10], 100, 20, 0).split(' ');
        expect(first).toBe('M0.00,20.00');
        expect(last).toBe('L100.00,0.00');
    });

    it('does not divide by zero on a flat series', () => {
        expect(sparkPath([4, 4, 4], 100, 20, 0)).toBe('M0.00,20.00 L50.00,20.00 L100.00,20.00');
    });
});

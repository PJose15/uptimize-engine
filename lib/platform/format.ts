/** Formatting helpers shared by every UPTIMAIZE platform surface. */

/** $320K · $1.23M · $5,850 */
export function money(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
        const millions = value / 1_000_000;
        return `$${millions.toFixed(millions >= 10 ? 1 : 2)}M`;
    }
    if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value.toLocaleString('en-US')}`;
}

/** Compact money, or an em dash when the figure has no source yet. */
export function moneyOrDash(value: number): string {
    return value > 0 ? money(value) : '—';
}

/** Exact currency with separators: $5,850 */
export function currency(value: number): string {
    return `$${value.toLocaleString('en-US')}`;
}

/** Exact currency, or an em dash when the figure has no source yet. */
export function currencyOrDash(value: number): string {
    return value > 0 ? currency(value) : '—';
}

/** 1,248 */
export function count(value: number): string {
    return value.toLocaleString('en-US');
}

/** 98.2% */
export function percent(value: number, digits = 1): string {
    return `${value.toFixed(digits)}%`;
}

/** Turn a number series into an SVG polyline path scaled to `width` × `height`. */
export function sparkPath(series: number[], width: number, height: number, pad = 1): string {
    if (series.length < 2) return '';
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const stepX = (width - pad * 2) / (series.length - 1);

    return series
        .map((point, i) => {
            const x = pad + i * stepX;
            const y = height - pad - ((point - min) / span) * (height - pad * 2);
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
}

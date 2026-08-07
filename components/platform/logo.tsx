import { cn } from '@/lib/utils';

/**
 * The UPTIMAIZE mark — an amethyst "U" interlocked with a citrine "P".
 * The amethyst stroke is painted last so it reads in front where the two cross,
 * exactly as the brand sheet specifies.
 */
export function UptimaizeMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="37 22 153 169"
            fill="none"
            aria-hidden="true"
            className={cn('h-8 w-[29px]', className)}
        >
            <path
                d="M103.5 130 V70 A38.5 38.5 0 1 1 151.5 106"
                stroke="#FFCD4A"
                strokeWidth="15"
                strokeLinecap="round"
            />
            <path
                d="M46 116.5 V139.5 A42 42 0 0 0 130 139.5 V83.5"
                stroke="#7B5CFF"
                strokeWidth="15"
                strokeLinecap="round"
            />
        </svg>
    );
}

/** Letterspaced wordmark: amethyst "A", citrine "I", two-tone rule beneath. */
export function UptimaizeWordmark({
    className,
    size = 17,
    tone = 'dark',
}: {
    className?: string;
    /** Wordmark cap size in px; the tagline and rule scale from it. */
    size?: number;
    /** `dark` for obsidian surfaces, `light` for quartz surfaces. */
    tone?: 'dark' | 'light';
}) {
    const base = tone === 'dark' ? 'text-up-text' : 'text-[#0B0B0D]';
    const tagline = tone === 'dark' ? 'text-up-faint' : 'text-[#6E6E7A]';

    return (
        <span className={cn('block leading-none', className)}>
            <span
                className={cn('block font-medium tracking-[0.18em]', base)}
                style={{ fontSize: size }}
            >
                UPTIM<span className="text-up-primary">A</span>
                <span className="text-up-gold">I</span>ZE
            </span>

            <span className="mt-[5px] flex justify-center" aria-hidden="true">
                <span className="h-[2px] w-[18px] rounded-full bg-up-primary" />
                <span className="h-[2px] w-[18px] rounded-full bg-up-gold" />
            </span>

            <span
                className={cn('mt-[6px] block text-center font-medium tracking-[0.32em]', tagline)}
                style={{ fontSize: Math.max(7, Math.round(size * 0.44)) }}
            >
                ALIGNED INTELLIGENCE
            </span>
        </span>
    );
}

interface LogoProps {
    className?: string;
    /** Hide the wordmark and tagline, leaving only the mark. */
    markOnly?: boolean;
    /** Stack the mark above the wordmark (primary lockup). */
    stacked?: boolean;
    tone?: 'dark' | 'light';
    size?: number;
}

/** Full lockup: mark + UPTIMAIZE wordmark + "Aligned Intelligence" tagline. */
export function UptimaizeLogo({
    className,
    markOnly = false,
    stacked = false,
    tone = 'dark',
    size = 16,
}: LogoProps) {
    if (markOnly) {
        return <UptimaizeMark className={className} />;
    }

    if (stacked) {
        return (
            <div className={cn('flex flex-col items-center gap-4', className)}>
                <UptimaizeMark className="h-[58px] w-[52px]" />
                <UptimaizeWordmark size={size} tone={tone} />
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <UptimaizeMark />
            <UptimaizeWordmark size={size} tone={tone} />
        </div>
    );
}

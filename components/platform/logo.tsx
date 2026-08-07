import { cn } from '@/lib/utils';

/** The UPTIMAIZE mark: an ascending "U" that resolves into an upward arrow. */
export function UptimaizeMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className={cn('h-8 w-8', className)}
        >
            <defs>
                <linearGradient id="up-mark-gradient" x1="4" y1="30" x2="28" y2="2" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5B3BE8" />
                    <stop offset="0.55" stopColor="#7C5CFF" />
                    <stop offset="1" stopColor="#C4B5FF" />
                </linearGradient>
            </defs>
            <path
                d="M9 5.5 V17.5 A7 7 0 0 0 23 17.5 V7"
                stroke="url(#up-mark-gradient)"
                strokeWidth="3.2"
                strokeLinecap="round"
            />
            <path
                d="M19.4 10 L23 6.4 L26.6 10"
                stroke="url(#up-mark-gradient)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

interface LogoProps {
    className?: string;
    /** Hide the wordmark and tagline, leaving only the mark. */
    markOnly?: boolean;
}

/** Full lockup: mark + UPTIMAIZE wordmark + "Aligned Intelligence" tagline. */
export function UptimaizeLogo({ className, markOnly = false }: LogoProps) {
    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <UptimaizeMark />
            {!markOnly && (
                <div className="leading-none">
                    <div className="text-[17px] font-semibold tracking-[0.14em] text-up-text">
                        UPTIM<span className="text-up-primary">AI</span>ZE
                    </div>
                    <div className="mt-1 text-[8px] font-medium uppercase tracking-[0.34em] text-up-faint">
                        Aligned Intelligence
                    </div>
                </div>
            )}
        </div>
    );
}

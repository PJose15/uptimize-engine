import Link from 'next/link';
import { X } from 'lucide-react';
import { partnerName, type PlatformSearchParams } from '@/lib/platform/scope';

/** Dismissible chips showing the partner/search scope currently applied. */
export function ScopeChips({
    basePath,
    params,
}: {
    basePath: string;
    params: PlatformSearchParams;
}) {
    const without = (key: 'partner' | 'q') => {
        const next = new URLSearchParams();
        if (key !== 'partner' && params.partner) next.set('partner', params.partner);
        if (key !== 'q' && params.q) next.set('q', params.q);
        const search = next.toString();
        return search ? `${basePath}?${search}` : basePath;
    };

    const chips: { key: 'partner' | 'q'; label: string }[] = [];
    const partner = partnerName(params.partner);
    if (partner) chips.push({ key: 'partner', label: partner });
    if (params.q?.trim()) chips.push({ key: 'q', label: `“${params.q.trim()}”` });

    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
                <Link
                    key={chip.key}
                    href={without(chip.key)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-up-primary/35 bg-up-primary/12 py-1 pl-2.5 pr-2 text-[12px] font-medium text-up-primary transition-colors hover:bg-up-primary/20"
                >
                    {chip.label}
                    <X className="h-3.5 w-3.5" />
                </Link>
            ))}
        </div>
    );
}

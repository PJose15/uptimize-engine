'use client';

import { Suspense, useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar, type ScopeOption } from './topbar';

/**
 * Platform chrome. The sidebar is a fixed rail from `xl` up and a slide-over
 * drawer below it, which is why shell state lives on the client while every
 * page underneath stays a server component.
 */
export function PlatformShell({
    partners,
    period,
    approvalCount,
    alertCount,
    children,
}: {
    partners: ScopeOption[];
    period: string;
    approvalCount: number;
    alertCount: number;
    children: React.ReactNode;
}) {
    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
        if (!navOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setNavOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [navOpen]);

    return (
        <div className="up-canvas flex min-h-screen text-up-text">
            <div className="hidden xl:block">
                <Sidebar approvalCount={approvalCount} alertCount={alertCount} />
            </div>

            {navOpen && (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setNavOpen(false)}
                        className="absolute inset-0 bg-black/70"
                    />
                    <div className="relative h-full w-[236px] shadow-2xl">
                        <Sidebar
                            approvalCount={approvalCount}
                            alertCount={alertCount}
                            onNavigate={() => setNavOpen(false)}
                        />
                    </div>
                </div>
            )}

            <div className="flex h-screen min-w-0 flex-1 flex-col">
                {/* Only the topbar reads useSearchParams, so the boundary stays
                    around it — page content keeps server-rendering. */}
                <Suspense
                    fallback={<div className="h-16 shrink-0 border-b border-up-line bg-up-canvas" />}
                >
                    <Topbar
                        partners={partners}
                        period={period}
                        alertCount={alertCount}
                        onOpenNav={() => setNavOpen(true)}
                    />
                </Suspense>
                <main className="up-scroll flex-1 overflow-y-auto px-4 pb-10 pt-6 sm:px-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

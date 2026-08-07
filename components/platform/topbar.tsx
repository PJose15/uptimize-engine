'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Bell,
    Calendar,
    ChevronDown,
    Download,
    LogOut,
    Search,
    Settings,
    Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const SCOPES = [
    'All Partners',
    'SouthRex Solutions',
    'AutoPro Motors',
    'Elite Trim Pros',
    'PowerGrid Energy',
    'NextLevel Services',
    'Triple S Solar',
];

export function Topbar({ period, alertCount = 12 }: { period: string; alertCount?: number }) {
    const { user, logout } = useAuth();
    const [scope, setScope] = useState(SCOPES[0]);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // ⌘K / Ctrl+K focuses search, matching the hint rendered in the field.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                searchRef.current?.focus();
            }
            if (event.key === 'Escape') setMenuOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [menuOpen]);

    const displayName = user?.username ?? 'Operator';
    const role = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'Administrator';
    const initials = displayName
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-up-line bg-up-canvas/85 px-6 backdrop-blur">
            {/* Partner scope */}
            <label className="relative hidden items-center md:inline-flex">
                <Building2 className="pointer-events-none absolute left-3 h-4 w-4 text-up-faint" />
                <select
                    value={scope}
                    onChange={(event) => setScope(event.target.value)}
                    aria-label="Partner scope"
                    className="h-9 w-[200px] appearance-none rounded-lg border border-up-line bg-up-panel pl-9 pr-8 text-[13px] font-medium text-up-text outline-none transition-colors hover:border-up-primary/40 focus:border-up-primary"
                >
                    {SCOPES.map((option) => (
                        <option key={option} value={option} className="bg-up-panel">
                            {option}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-up-faint" />
            </label>

            {/* Search */}
            <div className="relative hidden min-w-0 flex-1 lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-up-faint" />
                <input
                    ref={searchRef}
                    type="search"
                    placeholder="Search partners, agents, workflows, leaks..."
                    className="h-9 w-full rounded-lg border border-up-line bg-up-panel pl-9 pr-16 text-[13px] text-up-text outline-none transition-colors placeholder:text-up-faint hover:border-up-primary/40 focus:border-up-primary"
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-up-line bg-up-raise px-1.5 py-0.5 text-[10px] font-medium text-up-faint">
                    ⌘K
                </kbd>
            </div>

            <div className="ml-auto flex items-center gap-2">
                {/* Period */}
                <button
                    type="button"
                    className="hidden h-9 items-center gap-2 rounded-lg border border-up-line bg-up-panel px-3 text-[13px] font-medium text-up-text transition-colors hover:border-up-primary/40 sm:inline-flex"
                >
                    <Calendar className="h-4 w-4 text-up-faint" />
                    {period}
                    <ChevronDown className="h-4 w-4 text-up-faint" />
                </button>

                {/* Alerts */}
                <Link
                    href="/alerts"
                    aria-label={`Alerts (${alertCount} unread)`}
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-up-line bg-up-panel text-up-dim transition-colors hover:border-up-primary/40 hover:text-up-text"
                >
                    <Bell className="h-[17px] w-[17px]" />
                    {alertCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-up-red px-1 text-[10px] font-bold text-white">
                            {alertCount}
                        </span>
                    )}
                </Link>

                {/* Export */}
                <Link
                    href="/reports"
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-up-primary px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-up-primary-deep"
                >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                </Link>

                {/* Account */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        className="flex h-9 items-center gap-2 rounded-lg border border-up-line bg-up-panel pl-1.5 pr-2 transition-colors hover:border-up-primary/40"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-up-primary-deep to-up-primary text-[10px] font-semibold text-white">
                            {initials || 'UP'}
                        </span>
                        <span className="hidden text-left leading-tight xl:block">
                            <span className="block text-[12px] font-medium text-up-text">
                                {displayName}
                            </span>
                            <span className="block text-[10px] text-up-faint">{role}</span>
                        </span>
                        <ChevronDown
                            className={cn(
                                'h-4 w-4 text-up-faint transition-transform',
                                menuOpen && 'rotate-180'
                            )}
                        />
                    </button>

                    {menuOpen && (
                        <div
                            role="menu"
                            className="absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-up-line bg-up-panel py-1 shadow-2xl"
                        >
                            <Link
                                href="/settings"
                                role="menuitem"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-up-dim transition-colors hover:bg-up-raise hover:text-up-text"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                            <Link
                                href="/engine"
                                role="menuitem"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-up-dim transition-colors hover:bg-up-raise hover:text-up-text"
                            >
                                <Building2 className="h-4 w-4" />
                                Pipeline Engine
                            </Link>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={logout}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-up-dim transition-colors hover:bg-up-raise hover:text-up-red"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

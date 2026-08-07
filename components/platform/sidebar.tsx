'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Activity,
    ArrowRight,
    BarChart3,
    Bell,
    Bot,
    ChevronRight,
    FileText,
    Globe,
    LayoutGrid,
    ScanEye,
    Settings,
    ShieldCheck,
    TrendingDown,
    Users,
    Workflow,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { UptimaizeLogo } from './logo';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
    badgeTone?: 'gold' | 'red';
}

const PRIMARY_NAV: NavItem[] = [
    { href: '/command-center', label: 'Command Center', icon: LayoutGrid },
    { href: '/overview', label: 'Overview', icon: Globe },
    { href: '/partners', label: 'Partners & Accounts', icon: Users },
    { href: '/agents', label: 'AI Agents', icon: Bot },
    { href: '/workflows', label: 'Workflows', icon: Workflow },
    { href: '/shadow-ops', label: 'Shadow Ops', icon: ScanEye },
    { href: '/revenue-leaks', label: 'Revenue Leaks', icon: TrendingDown },
    { href: '/approvals', label: 'Approvals', icon: ShieldCheck, badgeTone: 'gold' },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: '/roi', label: 'ROI', icon: BarChart3 },
    { href: '/activity', label: 'Activity', icon: Activity },
];

const SECONDARY_NAV: NavItem[] = [
    { href: '/alerts', label: 'Alerts', icon: Bell, badgeTone: 'red' },
    { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({
    item,
    active,
    onNavigate,
}: {
    item: NavItem;
    active: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                active
                    ? 'bg-up-primary/16 text-up-text'
                    : 'text-up-dim hover:bg-up-raise/70 hover:text-up-text'
            )}
        >
            <Icon
                className={cn(
                    'h-[17px] w-[17px] shrink-0',
                    active ? 'text-up-primary' : 'text-up-faint group-hover:text-up-dim'
                )}
                strokeWidth={1.9}
            />
            <span className="truncate">{item.label}</span>
            {item.badge !== undefined && (
                <span
                    className={cn(
                        'ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                        item.badgeTone === 'red' ? 'bg-up-red text-white' : 'bg-up-gold text-up-deep'
                    )}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

export function Sidebar({
    approvalCount = 0,
    alertCount = 0,
    onNavigate,
}: {
    approvalCount?: number;
    alertCount?: number;
    /** Called when a nav item is clicked, so the mobile drawer can close. */
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const { user } = useAuth();

    const counts: Record<string, number> = {
        '/approvals': approvalCount,
        '/alerts': alertCount,
    };
    const withCount = (item: NavItem): NavItem => {
        const badge = counts[item.href];
        return badge ? { ...item, badge } : item;
    };

    const displayName = user?.username ?? 'Operator';
    const role = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'Administrator';
    const initials = displayName
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <aside className="up-scroll flex h-screen w-[236px] shrink-0 flex-col overflow-y-auto border-r border-up-line bg-up-deep">
            <div className="px-5 pb-5 pt-6">
                <Link href="/command-center" aria-label="UPTIMAIZE home" onClick={onNavigate}>
                    <UptimaizeLogo />
                </Link>
            </div>

            <nav className="space-y-1 px-3">
                {PRIMARY_NAV.map((item) => (
                    <NavLink
                        key={item.href}
                        item={withCount(item)}
                        active={isActive(item.href)}
                        onNavigate={onNavigate}
                    />
                ))}
            </nav>

            <div className="mx-5 my-4 border-t border-up-line-soft" />

            <nav className="space-y-1 px-3">
                {SECONDARY_NAV.map((item) => (
                    <NavLink
                        key={item.href}
                        item={withCount(item)}
                        active={isActive(item.href)}
                        onNavigate={onNavigate}
                    />
                ))}
            </nav>

            {/* Executive briefing card */}
            <div className="mx-4 mt-5 overflow-hidden rounded-xl border border-up-line bg-gradient-to-b from-up-primary/12 to-transparent">
                <div className="relative px-4 pb-4 pt-4">
                    <p className="text-[13px] font-semibold leading-snug text-up-text">
                        Intelligent Systems.
                        <br />
                        <span className="text-up-primary">Optimized Outcomes.</span>
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-up-faint">
                        See how UPTIMAIZE can increase your bottom line.
                    </p>
                    <Link
                        href="/reports"
                        className="mt-3 inline-flex w-full items-center justify-between rounded-lg border border-up-line bg-up-raise/70 px-3 py-2 text-[12px] font-medium text-up-text transition-colors hover:border-up-primary/50 hover:bg-up-primary/15"
                    >
                        Book a strategy call
                        <ArrowRight className="h-3.5 w-3.5 text-up-primary" />
                    </Link>
                    <svg
                        viewBox="0 0 200 40"
                        className="pointer-events-none mt-3 h-8 w-full"
                        fill="none"
                        aria-hidden="true"
                    >
                        {[0, 1, 2, 3, 4].map((i) => (
                            <path
                                key={`amethyst-${i}`}
                                d={`M0 ${34 - i * 2} C 50 ${28 - i * 4}, 120 ${14 + i * 2}, 200 ${4 + i * 3}`}
                                stroke="#7B5CFF"
                                strokeOpacity={0.55 - i * 0.08}
                                strokeWidth="1"
                            />
                        ))}
                        {[0, 1, 2].map((i) => (
                            <path
                                key={`citrine-${i}`}
                                d={`M0 ${38 - i * 2} C 60 ${34 - i * 3}, 130 ${22 + i * 2}, 200 ${12 + i * 3}`}
                                stroke="#FFCD4A"
                                strokeOpacity={0.45 - i * 0.1}
                                strokeWidth="1"
                            />
                        ))}
                    </svg>
                </div>
            </div>

            {/* System status */}
            <div className="mx-4 mt-4 rounded-xl border border-up-line bg-up-panel/70 px-4 py-3">
                <p className="up-label text-up-faint">System Status</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-up-dim">
                    <span className="h-2 w-2 rounded-full bg-up-green" />
                    All systems operational
                </p>
                <Link
                    href="/activity"
                    className="mt-2 inline-block text-[11px] font-medium text-up-primary hover:text-up-text"
                >
                    View status page
                </Link>
            </div>

            {/* Account */}
            <div className="mt-auto border-t border-up-line px-4 py-4">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-up-raise/60"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-up-primary-deep to-up-primary text-[11px] font-semibold text-white">
                        {initials || 'UP'}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-up-text">
                            {displayName}
                        </span>
                        <span className="block truncate text-[11px] text-up-faint">{role}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-up-faint" />
                </Link>
            </div>
        </aside>
    );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Activity,
    ShieldCheck,
    BarChart3,
    Lock,
    ScrollText,
    Zap,
    ChevronRight,
} from 'lucide-react';
import { mockClient } from './mock-data';

const navItems = [
    { href: '/portal', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/portal/activity', label: 'Activity', icon: Activity },
    { href: '/portal/approvals', label: 'Approvals', icon: ShieldCheck },
    { href: '/portal/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/portal/permissions', label: 'Permissions', icon: Lock },
    { href: '/portal/audit', label: 'Audit Log', icon: ScrollText },
];

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const client = mockClient;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
                {/* Brand */}
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Uptimize</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Client Portal</p>
                        </div>
                    </div>

                    {/* Agent Status */}
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{client.agent.name}</span>
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">Active</span>
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            {client.agent.description}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                                        ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                                    }
                `}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                                {item.label}
                                {item.label === 'Approvals' && (
                                    <span className="ml-auto bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                                        2
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Client Info */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                            {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{client.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{client.company}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UptimaizeLogo } from '@/components/platform/logo';

const FIELD =
    'h-10 w-full rounded-lg border border-up-line bg-up-canvas px-3 text-[13px] text-up-text outline-none transition-colors placeholder:text-up-faint focus:border-up-primary';

/** Brand loading state: an amethyst arc chasing a citrine one. */
function Splash() {
    return (
        <div className="up-canvas flex min-h-screen items-center justify-center">
            <span
                className="h-9 w-9 animate-spin rounded-full border-[3px] border-transparent"
                style={{ borderTopColor: '#7B5CFF', borderRightColor: '#7B5CFF', borderBottomColor: '#FFCD4A', borderLeftColor: '#FFCD4A' }}
            />
        </div>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            const redirect = searchParams.get('redirect') || '/';
            router.push(redirect);
        }
    }, [user, authLoading, router, searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);

            if (!result.success) {
                setError(result.error || 'Login failed');
            } else {
                const redirect = searchParams.get('redirect') || '/';
                router.push(redirect);
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <Splash />;

    // Already logged in, will redirect
    if (user) return null;

    return (
        <div className="up-canvas flex min-h-screen items-center justify-center p-4 text-up-text">
            <div className="w-full max-w-sm">
                <div className="flex justify-center">
                    <UptimaizeLogo stacked size={18} />
                </div>

                <div className="mt-8 rounded-2xl border border-up-line bg-up-panel/90 p-6 shadow-2xl">
                    <h1 className="text-lg font-semibold text-up-text">Sign in</h1>
                    <p className="mt-1 text-[13px] text-up-dim">
                        Access the executive command center.
                    </p>

                    <form onSubmit={handleLogin} className="mt-6 space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-up-red/30 bg-up-red/10 p-3 text-[13px] text-up-red">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <label className="block">
                            <span className="up-label block text-up-faint">Username</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`${FIELD} mt-2`}
                                placeholder="admin"
                                autoComplete="username"
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="up-label block text-up-faint">Password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${FIELD} mt-2`}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-up-primary text-[13px] font-semibold text-white transition-colors hover:bg-up-primary-deep disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-[11px] text-up-faint">
                    © 2025 UPTIMAIZE · Intelligent Systems. Optimized Outcomes.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<Splash />}>
            <LoginForm />
        </Suspense>
    );
}

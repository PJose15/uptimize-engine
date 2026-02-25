'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error for debugging
        console.error('[Uptimize Error Boundary]', {
            message: error.message,
            digest: error.digest,
            stack: error.stack,
        });
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#0a0a0a',
            color: '#e5e5e5',
        }}>
            <div style={{
                maxWidth: '480px',
                textAlign: 'center',
                padding: '2rem',
                border: '1px solid #333',
                borderRadius: '12px',
                backgroundColor: '#141414',
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#fff',
                }}>
                    Something went wrong
                </h1>
                <p style={{
                    fontSize: '0.875rem',
                    color: '#888',
                    marginBottom: '1.5rem',
                    lineHeight: 1.6,
                }}>
                    The Uptimize Engine encountered an unexpected error. This has been logged for investigation.
                </p>

                {error.digest && (
                    <p style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        marginBottom: '1rem',
                        fontFamily: 'monospace',
                    }}>
                        Error ID: {error.digest}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                        onClick={reset}
                        style={{
                            padding: '0.625rem 1.25rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#fff',
                            backgroundColor: '#2563eb',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            padding: '0.625rem 1.25rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#ccc',
                            backgroundColor: 'transparent',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = '#666')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = '#444')}
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}

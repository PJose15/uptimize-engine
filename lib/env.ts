/**
 * Environment Validation
 *
 * Fails fast at boot with a readable message instead of surfacing a missing
 * key as a mid-pipeline provider error twenty seconds into an agent run.
 *
 * Invoked from instrumentation.ts, which Next.js runs once per server start.
 */

/** Vars the app cannot run without. */
const REQUIRED = ['DATABASE_URL'] as const;

/** Vars required in production only — dev has safe fallbacks. */
const REQUIRED_IN_PRODUCTION = ['NEXTAUTH_SECRET'] as const;

/** At least one of these must be set for any agent to run. */
const PROVIDER_KEYS = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'GROQ_API_KEY',
    'MISTRAL_API_KEY',
    'PERPLEXITY_API_KEY',
] as const;

/**
 * Optional capabilities and what silently degrades without them. Reported as
 * warnings so a partial local setup still boots.
 */
const OPTIONAL_CAPABILITIES: Array<{ vars: string[]; capability: string }> = [
    { vars: ['BRAVE_API_KEY'], capability: "Agent 1 live web research (falls back to model knowledge)" },
    { vars: ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_SPREADSHEET_ID'], capability: 'Google Sheets lead ingestion' },
    { vars: ['WEBHOOK_API_KEY'], capability: 'POST /api/webhooks/trigger (returns 503 until set)' },
    { vars: ['SLACK_WEBHOOK_URL'], capability: 'Slack notifications' },
];

export interface EnvValidationResult {
    errors: string[];
    warnings: string[];
}

export function validateEnv(): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    for (const key of REQUIRED) {
        if (!process.env[key]) {
            errors.push(`${key} is required`);
        }
    }

    for (const key of REQUIRED_IN_PRODUCTION) {
        if (!process.env[key]) {
            const message = `${key} is required in production`;
            if (isProduction) {
                errors.push(message);
            } else {
                warnings.push(`${message} (using an insecure development default)`);
            }
        }
    }

    const configuredProviders = PROVIDER_KEYS.filter(key => process.env[key]);
    if (configuredProviders.length === 0) {
        errors.push(
            `At least one AI provider key is required (one of: ${PROVIDER_KEYS.join(', ')})`
        );
    }

    for (const { vars, capability } of OPTIONAL_CAPABILITIES) {
        const missing = vars.filter(key => !process.env[key]);
        if (missing.length > 0) {
            warnings.push(`${capability} disabled — missing ${missing.join(', ')}`);
        }
    }

    return { errors, warnings };
}

/**
 * Validate and report. Throws on a missing required var so the server refuses
 * to start half-configured.
 */
export function assertEnv(): void {
    const { errors, warnings } = validateEnv();

    for (const warning of warnings) {
        console.warn(`[env] ${warning}`);
    }

    if (errors.length > 0) {
        const detail = errors.map(e => `  - ${e}`).join('\n');
        throw new Error(
            `Environment validation failed:\n${detail}\n\nCopy .env.example to .env and fill in the required values.`
        );
    }
}

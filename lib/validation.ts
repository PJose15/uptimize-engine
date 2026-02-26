/**
 * Input Validation Schemas
 * Zod schemas for validating all user inputs
 */

import { z } from 'zod';

// Lead input validation
export const LeadInputSchema = z.object({
    leads: z.string()
        .min(10, 'Lead input must be at least 10 characters')
        .max(50000, 'Lead input cannot exceed 50,000 characters')
        .refine(
            (val) => !containsMaliciousPatterns(val),
            'Input contains potentially harmful patterns'
        ),
});

// Template validation
export const TemplateSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name cannot exceed 100 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
    description: z.string()
        .max(500, 'Description cannot exceed 500 characters')
        .optional()
        .default(''),
    content: z.string()
        .min(1, 'Content is required')
        .max(10000, 'Content cannot exceed 10,000 characters'),
});

// Settings validation
export const SettingsSchema = z.object({
    slackWebhookUrl: z.string().url().optional().or(z.literal('')),
    notificationEmail: z.string().email().optional().or(z.literal('')),
    defaultTimeout: z.number().min(30).max(600).optional().default(120),
    maxConcurrency: z.number().min(1).max(10).optional().default(2),
});

// Webhook trigger validation
export const WebhookTriggerSchema = z.object({
    leads: z.string().min(10).max(50000),
    callbackUrl: z.string().url().optional(),
    metadata: z.record(z.unknown()).optional(),
});

// API Key validation
export const ApiKeySchema = z.string()
    .min(20, 'API key too short')
    .max(200, 'API key too long')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Invalid API key format');

/**
 * Check for malicious patterns in input
 */
function containsMaliciousPatterns(input: string): boolean {
    const maliciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,  // Script tags
        /javascript:/gi,                                         // JS protocol
        /on\w+\s*=/gi,                                          // Event handlers
        /data:text\/html/gi,                                     // Data URLs
        /\{\{.*\}\}/g,                                          // Template injection
        /\$\{.*\}/g,                                            // Template literals
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Validate and parse input with helpful error messages
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map(err =>
        `${err.path.join('.')}: ${err.message}`
    );

    return { success: false, errors };
}

/**
 * Validation error response
 */
export function validationErrorResponse(errors: string[]): Response {
    return new Response(
        JSON.stringify({
            error: 'Validation failed',
            details: errors,
        }),
        {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

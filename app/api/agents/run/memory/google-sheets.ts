import { google } from 'googleapis';
import { logger } from '../logger';

// Configuration for Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID; // The ID of the "Zenthia Brain" sheet

// Tab names (standardized structure)
const TABS = {
    DAILY_BRIEF: 'DailyBrief_Log',
    CONTENT_LIBRARY: 'Content_Library',
    METRICS_WEEKLY: 'Metrics_Weekly',
    OFFERS_EXPERIMENTS: 'Offers_Experiments'
};

// In-memory cache for development/fallback
const MOCK_BEST_HOOKS = [
    { text: "Stop buying [Product Category] until you read this...", engagement_rate: 8.5, platform: "TikTok" },
    { text: "3 signs you might need [Benefit]...", engagement_rate: 7.2, platform: "IG" },
    { text: "My morning routine changed forever when...", engagement_rate: 6.8, platform: "TikTok" }
];

/**
 * Get authenticated Sheets client
 */
async function getSheetsClient() {
    try {
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (!credentialsJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            logger.warn("No Google Sheets credentials found. Using mock memory.");
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            credentials: credentialsJson ? JSON.parse(credentialsJson) : undefined,
            scopes: SCOPES,
        });

        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        logger.error("Failed to initialize Google Sheets client", {}, { error: String(error) });
        return null;
    }
}

/**
 * Generic: Read last N rows from a tab
 */
async function readLastNRows(tabName: string, n: number = 20): Promise<any[]> {
    const sheets = await getSheetsClient();
    if (!sheets || !SPREADSHEET_ID) return [];

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tabName}!A2:Z1000`, // Read up to row 1000, skipping header
        });

        const rows = response.data.values || [];
        return rows.slice(-n); // Return last N rows
    } catch (error) {
        logger.warn(`Failed to read from ${tabName}`, {}, { error: String(error) });
        return [];
    }
}

/**
 * Generic: Append a row to a tab
 */
async function appendRow(tabName: string, row: any[]): Promise<boolean> {
    const sheets = await getSheetsClient();
    if (!sheets || !SPREADSHEET_ID) {
        logger.warn(`Cannot append to ${tabName} - no Sheets connection`);
        return false;
    }

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tabName}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row]
            }
        });
        logger.info(`Appended row to ${tabName}`);
        return true;
    } catch (error) {
        logger.error(`Failed to append to ${tabName}`, {}, { error: String(error) });
        return false;
    }
}

// ============================================================================
// Public Read Functions
// ============================================================================

export interface BestHook {
    text: string;
    engagement_rate: number;
    platform: string;
}

/**
 * Get best performing hooks from Content_Library
 */
export async function getBestHooks(limit: number = 5): Promise<BestHook[]> {
    const rows = await readLastNRows(TABS.CONTENT_LIBRARY, 20);

    if (rows.length === 0) {
        // Fallback to mock
        return MOCK_BEST_HOOKS.slice(0, limit);
    }

    // Assume columns: [Date, Platform, Hook, Engagement%, ...]
    const hooks = rows
        .map(row => ({
            text: row[2] || '',
            platform: row[1] || '',
            engagement_rate: parseFloat(row[3]) || 0
        }))
        .filter(h => h.text.length > 0);

    return hooks
        .sort((a, b) => b.engagement_rate - a.engagement_rate)
        .slice(0, limit);
}

/**
 * Get last N daily briefs from DailyBrief_Log
 */
export async function getLastDailyBriefs(n: number = 10): Promise<any[]> {
    return await readLastNRows(TABS.DAILY_BRIEF, n);
}

/**
 * Get latest weekly metrics from Metrics_Weekly
 */
export async function getLatestMetrics(): Promise<any> {
    const rows = await readLastNRows(TABS.METRICS_WEEKLY, 1);
    return rows[0] || null;
}

/**
 * Get weekly results (alias for backwards compatibility)
 */
export async function getWeeklyResults() {
    const metrics = await getLatestMetrics();
    if (!metrics) return "No weekly results recorded yet.";
    return metrics;
}

// ============================================================================
// Public Write Functions
// ============================================================================

/**
 * Save a hook to Content_Library
 */
export async function saveHook(hook: string, platform: string, engagement: number = 0) {
    const row = [
        new Date().toISOString(),
        platform,
        hook,
        engagement,
        'auto-logged'
    ];
    return await appendRow(TABS.CONTENT_LIBRARY, row);
}

/**
 * Save a daily brief to DailyBrief_Log
 */
export async function saveDailyBrief(briefData: any) {
    const row = [
        new Date().toISOString(),
        briefData.today_focus || '',
        JSON.stringify(briefData.top_3_actions || []),
        briefData.yesterday_win || ''
    ];
    return await appendRow(TABS.DAILY_BRIEF, row);
}

/**
 * Save full ZGO output to Content_Library (hooks from plan)
 */
export async function saveContentPlan(plan: any) {
    if (!plan.content_plan_7_days || !Array.isArray(plan.content_plan_7_days)) {
        return false;
    }

    let success = true;
    for (const day of plan.content_plan_7_days) {
        if (day.video_hook) {
            const saved = await saveHook(day.video_hook, day.platform || 'unknown', 0);
            success = success && saved;
        }
    }
    return success;
}

/**
 * Save offer experiment to Offers_Experiments
 */
export async function saveOfferExperiment(offer: string, hypothesis: string) {
    const row = [
        new Date().toISOString(),
        offer,
        hypothesis,
        'pending'
    ];
    return await appendRow(TABS.OFFERS_EXPERIMENTS, row);
}

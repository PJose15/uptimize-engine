import { google } from 'googleapis';
import { logger } from '../logger';

// Configuration for Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID; // The ID of the "Zenthia Brain" sheet (1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c)


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

        // Try explicit credentials first, then fallback to application default credentials (from gcloud auth)
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
    platform: string;
    impressions?: number;
    views?: number;
    watch_time?: number;
    clicks?: number;
    engagement_rate: number;
    posted?: boolean;
    winner?: boolean;
}

/**
 * Get best performing hooks from Content_Library
 */
export async function getBestHooks(limit: number = 5): Promise<BestHook[]> {
    const rows = await readLastNRows(TABS.CONTENT_LIBRARY, 50); // Read more for better data

    if (rows.length === 0) {
        // Fallback to mock
        return MOCK_BEST_HOOKS.slice(0, limit);
    }

    // Columns: [timestamp, platform, hook, impressions, views, watch_time, clicks, engagement_rate, posted, winner, notes]
    const hooks = rows
        .map(row => ({
            text: row[2] || '',
            platform: row[1] || '',
            impressions: parseInt(row[3]) || 0,
            views: parseInt(row[4]) || 0,
            watch_time: parseFloat(row[5]) || 0,
            clicks: parseInt(row[6]) || 0,
            engagement_rate: parseFloat(row[7]) || 0,
            posted: row[8] === 'yes' || row[8] === 'true',
            winner: row[9] === 'yes' || row[9] === 'true'
        }))
        .filter(h => h.text.length > 0);

    // Prioritize winners first, then by engagement rate
    return hooks
        .sort((a, b) => {
            if (a.winner !== b.winner) return (b.winner ? 1 : 0) - (a.winner ? 1 : 0);
            return b.engagement_rate - a.engagement_rate;
        })
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
 * Save a hook to Content_Library with full performance tracking
 */
export async function saveHook(
    hook: string,
    platform: string,
    metrics?: {
        impressions?: number;
        views?: number;
        watch_time?: number;
        clicks?: number;
        engagement_rate?: number;
        posted?: boolean;
        winner?: boolean;
        notes?: string;
    }
) {
    const row = [
        new Date().toISOString(),
        platform,
        hook,
        metrics?.impressions || 0,
        metrics?.views || 0,
        metrics?.watch_time || 0,
        metrics?.clicks || 0,
        metrics?.engagement_rate || 0,
        metrics?.posted ? 'yes' : 'no',
        metrics?.winner ? 'yes' : 'no',
        metrics?.notes || 'auto-generated'
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
            const saved = await saveHook(
                day.video_hook,
                day.platform || 'unknown',
                {
                    notes: `Day ${day.day || '?'} - ${day.format || 'video'}`
                }
            );
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

/**
 * Batch save all hooks from Content Factory
 * All hooks are marked as posted=no, winner=no (scheduled content)
 */
export async function saveAllHooks(hooks: any[], platform: string = 'TikTok') {
    if (!hooks || !Array.isArray(hooks) || hooks.length === 0) {
        logger.warn('saveAllHooks called with empty or invalid hooks array');
        return false;
    }

    logger.info(`Batch saving ${hooks.length} hooks from Content Factory`);

    let successCount = 0;
    for (let i = 0; i < hooks.length; i++) {
        const hook = hooks[i];
        const hookText = hook.hook_text || hook.text || hook;

        if (typeof hookText === 'string' && hookText.length > 0) {
            const saved = await saveHook(
                hookText,
                platform,
                {
                    posted: false,
                    winner: false,
                    notes: `Content Factory batch #${i + 1} - ${hook.angle || 'generated'}`
                }
            );

            if (saved) successCount++;
        }
    }

    logger.info(`Successfully saved ${successCount}/${hooks.length} hooks to Content_Library`);
    return successCount === hooks.length;
}


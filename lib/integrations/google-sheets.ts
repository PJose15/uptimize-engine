/**
 * Google Sheets Integration - Lead Import
 * 
 * Imports leads from a Google Sheet for pipeline processing
 */

import { google, sheets_v4 } from 'googleapis';

export interface SheetLead {
    name: string;
    company?: string;
    role?: string;
    email?: string;
    phone?: string;
    context?: string;
    source?: string;
    row?: number;
}

export interface GoogleSheetsConfig {
    credentials: {
        client_email: string;
        private_key: string;
    };
    spreadsheetId: string;
    range?: string; // e.g., 'Leads!A2:G'
}

export class GoogleSheetsIntegration {
    private sheets: sheets_v4.Sheets;
    private spreadsheetId: string;

    constructor(private config: GoogleSheetsConfig) {
        const auth = new google.auth.GoogleAuth({
            credentials: config.credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.spreadsheetId = config.spreadsheetId;
    }

    /**
     * Import leads from the configured Google Sheet
     */
    async importLeads(range?: string): Promise<SheetLead[]> {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: range || this.config.range || 'Sheet1!A2:G1000',
        });

        const rows = response.data.values || [];

        return rows.map((row, index) => ({
            name: row[0] || 'Unknown',
            company: row[1] || undefined,
            role: row[2] || undefined,
            email: row[3] || undefined,
            phone: row[4] || undefined,
            context: row[5] || undefined,
            source: row[6] || 'Google Sheets',
            row: index + 2, // +2 because we start from row 2 (header is row 1)
        }));
    }

    /**
     * Convert leads to the text format expected by Agent 1
     */
    formatLeadsForAgent1(leads: SheetLead[]): string {
        return leads.map((lead, i) => {
            const lines = [`${i + 1}. ${lead.name}`];
            if (lead.company) lines.push(`   Company: ${lead.company}`);
            if (lead.role) lines.push(`   Role: ${lead.role}`);
            if (lead.email) lines.push(`   Email: ${lead.email}`);
            if (lead.context) lines.push(`   Context: ${lead.context}`);
            return lines.join('\n');
        }).join('\n\n');
    }

    /**
     * Write pipeline results back to the sheet
     */
    async writeResults(
        results: Array<{
            row: number;
            fitScore?: number;
            shadowOpsDensity?: number;
            status?: string;
            notes?: string;
        }>,
        startColumn: string = 'H'
    ): Promise<void> {
        const requests: sheets_v4.Schema$Request[] = results.map(result => ({
            updateCells: {
                range: {
                    sheetId: 0,
                    startRowIndex: result.row - 1,
                    endRowIndex: result.row,
                    startColumnIndex: this.columnToIndex(startColumn),
                    endColumnIndex: this.columnToIndex(startColumn) + 4,
                },
                rows: [{
                    values: [
                        { userEnteredValue: { numberValue: result.fitScore ?? 0 } },
                        { userEnteredValue: { numberValue: result.shadowOpsDensity ?? 0 } },
                        { userEnteredValue: { stringValue: result.status ?? 'Processed' } },
                        { userEnteredValue: { stringValue: result.notes ?? '' } },
                    ],
                }],
                fields: 'userEnteredValue',
            },
        }));

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: { requests },
        });
    }

    /**
     * Append a new lead to the sheet
     */
    async appendLead(lead: SheetLead): Promise<void> {
        await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: 'Sheet1!A:G',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    lead.name,
                    lead.company || '',
                    lead.role || '',
                    lead.email || '',
                    lead.phone || '',
                    lead.context || '',
                    lead.source || 'Manual',
                ]],
            },
        });
    }

    private columnToIndex(column: string): number {
        return column.toUpperCase().charCodeAt(0) - 65;
    }
}

/**
 * Create integration from environment variables
 */
export function createGoogleSheetsIntegration(): GoogleSheetsIntegration | null {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
        console.warn('Google Sheets integration not configured. Missing environment variables.');
        return null;
    }

    return new GoogleSheetsIntegration({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        spreadsheetId,
        range: process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A2:G1000',
    });
}

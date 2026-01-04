// Script to create required tabs in Google Sheets for Zenthia Memory Layer
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c';

// Tab structure definitions
const TABS = [
    {
        name: 'DailyBrief_Log',
        headers: ['timestamp', 'focus', 'actions', 'yesterday_win']
    },
    {
        name: 'Content_Library',
        headers: ['timestamp', 'platform', 'hook', 'impressions', 'views', 'watch_time', 'clicks', 'engagement_rate', 'posted', 'winner', 'notes']
    },
    {
        name: 'Metrics_Weekly',
        headers: ['week_ending', 'visits', 'purchases', 'revenue', 'top_hook', 'notes']
    },
    {
        name: 'Offers_Experiments',
        headers: ['timestamp', 'offer', 'hypothesis', 'status', 'result']
    }
];

async function getSheetsClient() {
    try {
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        const auth = new google.auth.GoogleAuth({
            credentials: credentialsJson ? JSON.parse(credentialsJson) : undefined,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        console.error('❌ Failed to initialize Google Sheets client:', error.message);
        return null;
    }
}

async function createTab(sheets, tabName, headers) {
    try {
        // Create the tab
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: tabName
                        }
                    }
                }]
            }
        });

        // Add headers
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tabName}!A1:Z1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [headers]
            }
        });

        console.log(`✅ Created tab with headers: ${tabName}`);
        return true;
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`⏭️  Skipped (already exists): ${tabName}`);
            return false;
        }
        console.error(`❌ Failed to create tab ${tabName}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('\n🚀 Zenthia Memory Layer - Tab Setup\n');
    console.log('=========================================\n');

    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID.substring(0, 10)}...`);

    const sheets = await getSheetsClient();
    if (!sheets) {
        console.error('\n❌ Could not connect to Google Sheets');
        console.log('\nMake sure you have authenticated with:');
        console.log('  gcloud auth application-default login');
        console.log('\nOR set GOOGLE_APPLICATION_CREDENTIALS_JSON in .env.local\n');
        process.exit(1);
    }

    console.log('✅ Connected to Google Sheets API\n');

    // Create tabs
    let created = 0;

    for (const tab of TABS) {
        const success = await createTab(sheets, tab.name, tab.headers);
        if (success) created++;
    }

    console.log('\n=========================================');
    console.log(`✅ Setup complete! Created ${created} new tabs`);
    console.log('=========================================\n');

    if (created > 0) {
        console.log('🎉 Your memory layer is ready!');
        console.log('\nNext steps:');
        console.log('  1. npm run dev');
        console.log('  2. node test-api-client.js\n');
    } else {
        console.log('✅ All tabs already exist. Ready to test!\n');
    }
}

main().catch(console.error);

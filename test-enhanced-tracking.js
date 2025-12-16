const { google } = require('googleapis');
const SHEET_ID = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c';

async function testEnhancedTracking() {
    const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Testing Enhanced Performance Tracking...\n');

    // Add a few test hooks with different performance levels
    const testHooks = [
        {
            hook: "Stop scrolling - this changed my business forever...",
            platform: "TikTok",
            impressions: 50000,
            views: 12000,
            clicks: 850,
            engagement_rate: 24.5,
            posted: true,
            winner: true,
            notes: "WINNER - Best performer this month"
        },
        {
            hook: "3 signs you need to pivot your strategy...",
            platform: "Instagram",
            impressions: 35000,
            views: 8500,
            clicks: 420,
            engagement_rate: 12.7,
            posted: true,
            winner: false,
            notes: "Good performance but not top"
        },
        {
            hook: "My morning routine that 10x'd my productivity...",
            platform: "TikTok",
            impressions: 0,
            views: 0,
            clicks: 0,
            engagement_rate: 0,
            posted: false,
            winner: false,
            notes: "Scheduled for next week"
        }
    ];

    console.log('Adding test data with performance metrics...\n');

    for (const data of testHooks) {
        const row = [
            new Date().toISOString(),
            data.platform,
            data.hook,
            data.impressions,
            data.views,
            0, // watch_time
            data.clicks,
            data.engagement_rate,
            data.posted ? 'yes' : 'no',
            data.winner ? 'yes' : 'no',
            data.notes
        ];

        try {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: 'Content_Library!A:K',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [row] }
            });

            const status = data.winner ? '🏆 WINNER' : data.posted ? '✅ Posted' : '📅 Scheduled';
            console.log(`${status} - ${data.hook.substring(0, 50)}...`);
            console.log(`   Engagement: ${data.engagement_rate}% | Views: ${data.views}\n`);
        } catch (e) {
            console.log('❌ Error:', e.message);
        }
    }

    console.log('🎉 Test data added! Check your Google Sheet.\n');
    console.log('💡 Next: The system will now prioritize WINNERS when learning!\n');
}

testEnhancedTracking();

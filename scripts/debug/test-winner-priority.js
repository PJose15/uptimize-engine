// Direct test of getBestHooks with winner prioritization

const { google } = require('googleapis');
const SHEET_ID = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c';

async function testWinnerPrioritization() {
    console.log('🎯 TESTING WINNER PRIORITIZATION\n');
    console.log('='.repeat(70) + '\n');

    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Read from Content_Library
    console.log('📖 Reading from Content_Library tab...\n');

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Content_Library!A2:K100',
        });

        const rows = response.data.values || [];
        console.log(`✅ Found ${rows.length} hooks in Content_Library\n`);

        // Parse and sort like getBestHooks does
        const hooks = rows
            .map(row => ({
                text: row[2] || '',
                platform: row[1] || '',
                impressions: parseInt(row[3]) || 0,
                views: parseInt(row[4]) || 0,
                clicks: parseInt(row[6]) || 0,
                engagement_rate: parseFloat(row[7]) || 0,
                posted: row[8] === 'yes' || row[8] === 'true',
                winner: row[9] === 'yes' || row[9] === 'true',
                notes: row[10] || ''
            }))
            .filter(h => h.text.length > 0);

        // Sort: Winners first, then by engagement
        const sorted = hooks.sort((a, b) => {
            if (a.winner !== b.winner) return (b.winner ? 1 : 0) - (a.winner ? 1 : 0);
            return b.engagement_rate - a.engagement_rate;
        });

        console.log('='.repeat(70));
        console.log('🏆 BEST HOOKS (Winners prioritized):');
        console.log('='.repeat(70) + '\n');

        sorted.slice(0, 5).forEach((hook, idx) => {
            const winnerBadge = hook.winner ? '🏆 WINNER' : '        ';
            const postedBadge = hook.posted ? '✅ Posted' : '📅 Scheduled';

            console.log(`${idx + 1}. ${winnerBadge} | ${postedBadge}`);
            console.log(`   Platform: ${hook.platform}`);
            console.log(`   Hook: "${hook.text.substring(0, 70)}..."`);
            console.log(`   📊 Metrics:`);
            console.log(`      - Impressions: ${hook.impressions.toLocaleString()}`);
            console.log(`      - Views: ${hook.views.toLocaleString()}`);
            console.log(`      - Engagement: ${hook.engagement_rate}%`);
            if (hook.notes) console.log(`   💭 Notes: ${hook.notes}`);
            console.log('');
        });

        console.log('='.repeat(70));
        console.log('✅ VERIFICATION:');
        console.log('='.repeat(70));

        const winnerCount = sorted.filter(h => h.winner).length;
        const postedCount = sorted.filter(h => h.posted).length;

        console.log(`✅ Total hooks: ${sorted.length}`);
        console.log(`🏆 Winners: ${winnerCount}`);
        console.log(`✅ Posted: ${postedCount}`);
        console.log(`📅 Scheduled: ${sorted.length - postedCount}\n`);

        if (sorted[0]?.winner) {
            console.log('🎉 SUCCESS! Winners appear FIRST in the list!');
            console.log('🧠 ZGO will learn from top performers on next run.\n');
        }

        console.log('='.repeat(70));
        console.log('💡 NEXT STEPS:');
        console.log('='.repeat(70));
        console.log('1. Post the generated hooks to TikTok/Instagram');
        console.log('2. Track real metrics (views, engagement, etc.)');
        console.log('3. Update Content_Library with actual data');
        console.log('4. Mark your best performers as "winner: yes"');
        console.log('5. Run ZGO again → it learns from winners! 🔄\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testWinnerPrioritization();

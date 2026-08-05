const { google } = require('googleapis');
const SHEET_ID = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c';

async function addHeaders() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📊 Adding enhanced tracking columns to Content_Library...\n');

  const headers = [
    'timestamp',
    'platform',
    'hook',
    'impressions',
    'views',
    'watch_time',
    'clicks',
    'engagement_rate',
    'posted',
    'winner',
    'notes'
  ];

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Content_Library!A1:K1',
      valueInputOption: 'RAW',
      requestBody: { values: [headers] }
    });
    console.log('✅ Headers added successfully!\n');
    console.log('📋 New columns:');
    headers.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));
    console.log('\n🎉 Content_Library ready for performance tracking!\n');
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
}

addHeaders();

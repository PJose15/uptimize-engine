const { google } = require('googleapis');
const SHEET_ID = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c';

async function testWrite() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('📝 Testing write to Content_Library...\n');
  
  const testRow = [
    new Date().toISOString(),
    'TikTok',
    'This is a TEST hook from the memory layer!',
    '9.5',
    'test-run'
  ];
  
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Content_Library!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [testRow] }
    });
    console.log('✅ SUCCESS! Wrote test data to Content_Library');
    console.log('🔍 Check your Google Sheet - you should see the test hook!\n');
    console.log('🎉 YOUR GOOGLE SHEETS MEMORY LAYER IS FULLY WORKING!\n');
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
}
testWrite();

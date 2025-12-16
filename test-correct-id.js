const { google } = require('googleapis');
const SHEET_ID = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c';
async function test() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'properties,sheets.properties' });
    console.log('\n🎉 SUCCESS! Connected to:', res.data.properties.title);
    console.log('\n📋 Tabs:');
    res.data.sheets.forEach(s => console.log('  -', s.properties.title));
  } catch (e) {
    console.log('Error:', e.message);
  }
}
test();

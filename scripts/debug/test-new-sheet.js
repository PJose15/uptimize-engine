const { google } = require('googleapis');
const SHEET_ID = '1uiVrgmREq2WTIJ-pAkpl9cGFJa-DM59JFQgWP3DW-fc';
async function test() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    console.log('SUCCESS! Connected to:', res.data.properties.title);
  } catch (e) {
    console.log('Error:', e.message);
  }
}
test();

const { google } = require('googleapis');
const SHEET_ID = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2yQ6c';
const TABS = ['Content_Library', 'Metrics_Weekly', 'Offers_Experiments'];

async function addTabs() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('Adding missing tabs...');
  
  for (const tabName of TABS) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: tabName }
            }
          }]
        }
      });
      console.log('✅ Created:', tabName);
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⏭️  Skipped (exists):', tabName);
      } else {
        console.log('❌ Error creating', tabName + ':', e.message);
      }
    }
  }
  console.log('\n🎉 Done!');
}
addTabs();

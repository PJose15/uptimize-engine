// Final comprehensive test

const { google } = require('googleapis');

const GOOGLE_SHEET_ID = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2y6Be';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function finalTest() {
    console.log('🔍 Final Google Sheets Test...\n');

    try {
        // Create auth client
        const auth = new google.auth.GoogleAuth({
            scopes: SCOPES,
        });

        const client = await auth.getClient();
        console.log('✅ Got auth client');

        // Check which project is being used
        const credentials = await auth.getCredentials();
        console.log(`📧 Quota Project: ${credentials.quota_project_id || 'none'}`);

        const sheets = google.sheets({ version: 'v4', auth });

        // List all spreadsheets the user has access to (via Drive API)
        console.log('\n📑 Attempting to access sheet...');

        const response = await sheets.spreadsheets.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            fields: 'properties,sheets.properties'
        });

        console.log(`\n🎉 SUCCESS! Connected to: "${response.data.properties.title}"`);
        console.log('\n📋 Available tabs:');
        response.data.sheets.forEach(sheet => {
            console.log(`   - ${sheet.properties.title}`);
        });

        console.log('\n✅ Your Google Sheets memory layer is READY!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 404) {
            console.error('\n🔍 This means the sheet cannot be found.');
            console.error('Possible reasons:');
            console.error('1. Sheet ID is incorrect');
            console.error('2. Sheet is not shared with the authenticated Google account');
            console.error('3. You authenticated with a different Google account than the one that owns the sheet\n');
            console.error('Try:');
            console.error('- Double-check the Sheet ID in the URL');
            console.error('- Make sure the sheet is shared with: pj.acostalls@gmail.com');
            console.error('- Or re-run: gcloud auth application-default login (with correct account)\n');
        }
    }
}

finalTest();

// Quick Node.js script to set up Google Sheets credentials

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=========================================');
console.log('Zenthia Brain - Google Sheets Setup');
console.log('=========================================\n');

// From the screenshot, I can see the Sheet ID
const SHEET_ID_FROM_URL = '1C-gOS7MgygKaHo9Hyh7q9VrQ1yiW7xneEFvwbp2y6Be';

rl.question(`I detected your Sheet ID: ${SHEET_ID_FROM_URL}\nIs this correct? (y/n): `, (answer) => {
    let sheetId = SHEET_ID_FROM_URL;

    if (answer.toLowerCase() !== 'y') {
        rl.question('Enter the correct Sheet ID: ', (customId) => {
            sheetId = customId;
            addToEnv(sheetId);
            rl.close();
        });
    } else {
        addToEnv(sheetId);
        rl.close();
    }
});

function addToEnv(sheetId) {
    const envPath = '.env.local';
    let envContent = '';

    // Read existing .env.local if it exists
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if GOOGLE_SHEET_ID already exists
    if (envContent.includes('GOOGLE_SHEET_ID=')) {
        console.log('\n⚠️  GOOGLE_SHEET_ID already exists in .env.local');
        console.log('Please manually update it or delete the line and run this again.');
    } else {
        // Add Google Sheets config
        const sheetsConfig = `\n# Google Sheets Memory Layer\nGOOGLE_SHEET_ID=${sheetId}\n`;
        fs.appendFileSync(envPath, sheetsConfig);
        console.log('\n✅ Sheet ID added to .env.local!');
    }

    console.log('\n=========================================');
    console.log('NEXT: Set up Service Account Credentials');
    console.log('=========================================');
    console.log('\n1. Go to: https://console.cloud.google.com');
    console.log('2. Create/select project');
    console.log('3. Enable "Google Sheets API"');
    console.log('4. Create Service Account → Download JSON key');
    console.log('5. Run: node add-credentials.js');
    console.log('\n📖 See docs/CREDENTIALS_SETUP.md for detailed steps\n');
}

// Helper script to add Google Service Account credentials to .env.local

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔐 Google Service Account Credential Setup\n');
console.log('This will add your service account JSON to .env.local\n');

rl.question('Enter the path to your downloaded JSON key file: ', (jsonPath) => {
    // Resolve path
    const fullPath = path.resolve(jsonPath.trim().replace(/^["']|["']$/g, ''));

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
        console.error(`\n❌ File not found: ${fullPath}`);
        console.log('\nTip: Drag and drop the JSON file into this terminal window');
        rl.close();
        return;
    }

    try {
        // Read JSON file
        const jsonContent = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(jsonContent);

        // Validate it's a service account
        if (parsed.type !== 'service_account') {
            console.error('\n❌ This doesn\'t look like a service account JSON file');
            rl.close();
            return;
        }

        console.log(`\n✅ Valid service account: ${parsed.client_email}`);

        // Minify JSON (remove newlines for .env)
        const minified = JSON.stringify(parsed);

        // Read .env.local
        const envPath = '.env.local';
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Check if already exists
        if (envContent.includes('GOOGLE_APPLICATION_CREDENTIALS_JSON=')) {
            console.log('\n⚠️  GOOGLE_APPLICATION_CREDENTIALS_JSON already exists');

            rl.question('\nReplace it? (y/n): ', (answer) => {
                if (answer.toLowerCase() === 'y') {
                    // Remove old line
                    envContent = envContent.replace(/GOOGLE_APPLICATION_CREDENTIALS_JSON=.*/g, '');
                    addCredential(envPath, envContent, minified, parsed.client_email);
                } else {
                    console.log('\n❌ Cancelled. No changes made.');
                }
                rl.close();
            });
        } else {
            addCredential(envPath, envContent, minified, parsed.client_email);
            rl.close();
        }

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        rl.close();
    }
});

function addCredential(envPath, envContent, minified, email) {
    // Add credential
    const newLine = `GOOGLE_APPLICATION_CREDENTIALS_JSON=${minified}\n`;

    // Append to env
    fs.writeFileSync(envPath, envContent + '\n' + newLine);

    console.log('\n✅ Credentials added to .env.local!');
    console.log('\n📋 Next steps:');
    console.log(`   1. Share your Google Sheet with: ${email}`);
    console.log('   2. Restart dev server: npm run dev');
    console.log('   3. Test: node test-api-client.js');
    console.log('\n🎉 Memory layer will be fully active!\n');
}

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read key manually
const envPath = path.join(process.cwd(), '.env.local');
let apiKey = '';
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/GEMINI_API_KEY=(.+)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

if (!apiKey) {
    console.error("No GEMINI_API_KEY found in .env.local");
    process.exit(1);
}

console.log(`Using Key: ${apiKey.substring(0, 5)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Available Models:");
                json.models.forEach(m => console.log(` - ${m.name}`));
            } else {
                console.log("Response:", data);
            }
        } catch (e) {
            console.log("Raw Response:", data);
        }
    });
}).on('error', e => {
    console.error(e);
});

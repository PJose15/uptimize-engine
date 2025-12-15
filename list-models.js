const fs = require('fs');
const path = require('path');
const https = require('https');

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
    console.error("No GEMINI_API_KEY found");
    process.exit(1);
}

console.log(`Testing with key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`\nStatus: ${res.statusCode}\n`);
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("✅ Available Models:");
                json.models
                    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                    .forEach(m => {
                        const name = m.name.replace('models/', '');
                        console.log(` - ${name}`);
                    });
            } else {
                console.log("Response:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log("Raw Response:", data);
        }
    });
}).on('error', e => {
    console.error("Error:", e);
});

const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(process.cwd(), '.env.local');
let apiKey = '';
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

if (!apiKey) {
    console.error("No ANTHROPIC_API_KEY found");
    process.exit(1);
}

console.log(`Testing Anthropic key: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}\n`);

const data = JSON.stringify({
    model: "claude-3-haiku-20240307",
    max_tokens: 50,
    messages: [{ role: "user", content: "Say 'Anthropic API is working!'" }]
});

const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}\n`);
        try {
            const json = JSON.parse(responseData);
            if (json.content && json.content[0]) {
                console.log("✅ Anthropic Response:");
                console.log(json.content[0].text);
                console.log(`\nModel: ${json.model}`);
            } else if (json.error) {
                console.log("❌ Error:", JSON.stringify(json.error, null, 2));
            } else {
                console.log("Response:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log("Raw Response:", responseData);
        }
    });
});

req.on('error', (e) => console.error("Request Error:", e));
req.write(data);
req.end();

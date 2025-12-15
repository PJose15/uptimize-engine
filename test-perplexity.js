const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(process.cwd(), '.env.local');
let apiKey = '';
try {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/PERPLEXITY_API_KEY=(.+)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

if (!apiKey) {
    console.error("No PERPLEXITY_API_KEY found");
    process.exit(1);
}

console.log(`Testing Perplexity key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}\n`);

const data = JSON.stringify({
    model: "sonar",
    messages: [{ role: "user", content: "Say 'Perplexity API is working!'" }]
});

const options = {
    hostname: 'api.perplexity.ai',
    path: '/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
            if (json.choices && json.choices[0]) {
                console.log("✅ Perplexity Response:");
                console.log(json.choices[0].message.content);
                console.log(`\nModel: ${json.model}`);
            } else if (json.error) {
                console.log(" ❌ Error:", json.error.message || JSON.stringify(json.error, null, 2));
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


// CommonJS version
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

console.log('Starting orchestrator test (CommonJS)...');
const { OpenAI } = require("openai");

async function testDirectOpenAI() {
    console.log('Testing Direct OpenAI...');
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('No OpenAI API key found in process.env');
        return;
    }
    // console.log('Key starts with:', apiKey.substring(0, 8));

    const client = new OpenAI({ apiKey });
    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say test" }],
            max_tokens: 10,
        });
        console.log('Direct OpenAI success:', completion.choices[0].message.content);
    } catch (e) {
        console.error('Direct OpenAI failed:', e);
    }
}

testDirectOpenAI();

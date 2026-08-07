const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

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

const genAI = new GoogleGenerativeAI(apiKey);
// Using a known stable model
const modelName = "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: modelName });

async function run() {
    console.log(`Generating content with Gemini (${modelName})...`);
    try {
        const result = await model.generateContent("Hello, are you working?");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Error:", e);
    }
}

run();

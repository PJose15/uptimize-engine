/**
 * Direct Gemini Test - Bypasses the fallback chain
 * Tests the Gemini provider directly with a simple prompt
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGeminiDirect() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found");
        return;
    }

    console.log("Testing Gemini 2.0 Flash directly...");
    console.log(`API Key: ${apiKey.substring(0, 8)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent(
            "Generate a JSON object with 3 sample leads for a sales intelligence system. Each lead should have: name, company, role, pain_point. Return ONLY valid JSON."
        );
        const text = result.response.text();
        console.log("\n✅ SUCCESS! Response:");
        console.log(text);
    } catch (error) {
        console.error("\n❌ ERROR:", error);
    }
}

testGeminiDirect();

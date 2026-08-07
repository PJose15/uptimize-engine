// Test each LLM provider individually to diagnose issues

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk').default;

async function testGemini() {
    console.log('\n🔍 Testing Gemini...');
    console.log('='.repeat(50));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('❌ GEMINI_API_KEY not set');
        return false;
    }

    console.log('✓ API Key: SET');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Try current model
        console.log('\nTrying: gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        console.log('✅ gemini-1.5-flash WORKS!');
        console.log(`   Response: ${response.text().substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.log(`❌ gemini-1.5-flash FAILED: ${error.message.substring(0, 100)}`);

        // Try alternative models
        const alternativeModels = [
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-1.0-pro'
        ];

        for (const modelName of alternativeModels) {
            try {
                console.log(`\nTrying alternative: ${modelName}...`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Say hello');
                const response = await result.response;
                console.log(`✅ ${modelName} WORKS!`);
                console.log(`   Response: ${response.text().substring(0, 50)}...`);
                console.log(`\n💡 SOLUTION: Update config.ts model to "${modelName}"`);
                return true;
            } catch (err) {
                console.log(`❌ ${modelName} failed: ${err.message.substring(0, 80)}...`);
            }
        }

        return false;
    }
}

async function testAnthropic() {
    console.log('\n🔍 Testing Anthropic...');
    console.log('='.repeat(50));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.log('❌ ANTHROPIC_API_KEY not set');
        return false;
    }

    console.log('✓ API Key: SET');

    try {
        const client = new Anthropic({ apiKey });

        // Try current model
        console.log('\nTrying: claude-3-5-sonnet-20241022...');
        const message = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 100,
            messages: [{ role: 'user', content: 'Say hello' }],
        });
        console.log('✅ claude-3-5-sonnet-20241022 WORKS!');
        console.log(`   Response: ${message.content[0].text.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.log(`❌ claude-3-5-sonnet-20241022 FAILED: ${error.message.substring(0, 100)}`);

        // Try alternative models
        const alternativeModels = [
            'claude-3-5-sonnet-20240620',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];

        for (const modelName of alternativeModels) {
            try {
                console.log(`\nTrying alternative: ${modelName}...`);
                const client = new Anthropic({ apiKey });
                const message = await client.messages.create({
                    model: modelName,
                    max_tokens: 100,
                    messages: [{ role: 'user', content: 'Say hello' }],
                });
                console.log(`✅ ${modelName} WORKS!`);
                console.log(`   Response: ${message.content[0].text.substring(0, 50)}...`);
                console.log(`\n💡 SOLUTION: Update config.ts model to "${modelName}"`);
                return true;
            } catch (err) {
                console.log(`❌ ${modelName} failed: ${err.message.substring(0, 80)}...`);
            }
        }

        return false;
    }
}

async function runTests() {
    console.log('\n🧪 PROVIDER DIAGNOSTIC TEST');
    console.log('='.repeat(50));

    const geminiWorks = await testGemini();
    const anthropicWorks = await testAnthropic();

    console.log('\n\n📊 RESULTS:');
    console.log('='.repeat(50));
    console.log(`Gemini: ${geminiWorks ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`Anthropic: ${anthropicWorks ? '✅ WORKING' : '❌ NOT WORKING'}`);

    if (!geminiWorks && !anthropicWorks) {
        console.log('\n❌ CRITICAL: No providers working!');
        console.log('   Check API keys in .env.local');
    } else if (geminiWorks || anthropicWorks) {
        console.log('\n✅ At least one provider works!');
        console.log('   Update config.ts with working model names');
    }
}

runTests().catch(console.error);

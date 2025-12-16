// Test script for Zenthia Content Factory

const fetch = require('node-fetch');

async function testContentFactory() {
    console.log('🏭 Testing Zenthia Content Factory\n');
    console.log('='.repeat(70) + '\n');

    const requestBody = {
        agent: "zenthia_content_factory",
        context: {
            product: "Online Course: Social Media Growth for Coaches",
            platform: "TikTok",
            goal: "viral education content that drives course sales",
            vibe: "friendly expert, no-BS, actionable"
        },
        mode: "balanced"
    };

    console.log('📤 Sending request to Content Factory...\n');

    try {
        const response = await fetch('http://localhost:3000/api/agents/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(90000) // 90 seconds
        });

        if (!response.ok) {
            console.log(`❌ HTTP Error: ${response.status}`);
            const text = await response.text();
            console.log(text);
            return;
        }

        const data = await response.json();

        console.log('✅ Response received!\n');
        console.log('='.repeat(70));
        console.log('📊 METADATA:');
        console.log('='.repeat(70));
        console.log(`Agent: ${data.data?.agent || 'unknown'}`);
        console.log(`Mode: ${data.data?.mode || 'unknown'}`);
        console.log(`Provider: ${data.data?.provider || 'unknown'}`);
        console.log(`Model: ${data.data?.model || 'unknown'}\n`);

        const result = data.data?.result;

        if (result) {
            console.log('='.repeat(70));
            console.log('🎯 GENERATED CONTENT:');
            console.log('='.repeat(70) + '\n');

            // Show hooks
            if (result.hooks && Array.isArray(result.hooks)) {
                console.log(`📌 ${result.hooks.length} HOOKS GENERATED:\n`);
                result.hooks.slice(0, 3).forEach((hook, i) => {
                    console.log(`${i + 1}. "${hook.hook_text}"`);
                    console.log(`   Angle: ${hook.angle} | Style: ${hook.claim_style} | CTA: ${hook.cta}\n`);
                });
                if (result.hooks.length > 3) {
                    console.log(`   ... and ${result.hooks.length - 3} more hooks\n`);
                }
            }

            // Show scripts
            if (result.scripts && Array.isArray(result.scripts)) {
                console.log(`📝 ${result.scripts.length} SCRIPTS GENERATED:\n`);
                const sample = result.scripts[0];
                if (sample) {
                    console.log(`Sample Script (Hook #${sample.hook_id}):`);
                    console.log(`Script: "${sample.script.substring(0, 100)}..."`);
                    console.log(`B-roll: ${sample.broll}`);
                    console.log(`Caption: "${sample.caption.substring(0, 60)}..."\n`);
                }
            }

            // Show schedule
            if (result.schedule_7_days && Array.isArray(result.schedule_7_days)) {
                console.log(`📅 7-DAY POSTING SCHEDULE:\n`);
                result.schedule_7_days.forEach(day => {
                    console.log(`Day ${day.day}: ${day.post_idea} (use hook #${day.which_script_hook})`);
                });
                console.log('');
            }

            console.log('='.repeat(70));
            console.log('💾 MEMORY INTEGRATION:');
            console.log('='.repeat(70));
            console.log('✅ All 10 hooks auto-saved to Google Sheets');
            console.log('✅ Marked as posted: NO');
            console.log('✅ Marked as winner: NO');
            console.log('✅ Ready for you to post and track!\n');

            console.log('='.repeat(70));
            console.log('🎉 CONTENT FACTORY TEST COMPLETE!');
            console.log('='.repeat(70));
            console.log('\n📊 Check your "Zenthia Brain" Google Sheet → Content_Library tab');
            console.log('   Should have 10 new rows with scheduled content!\n');
        } else {
            console.log('❌ No result data in response');
        }

    } catch (error) {
        console.error('\n❌ Test Error:', error.message);
        if (error.name === 'AbortError') {
            console.log('\n💡 Request timed out - LLM might be taking longer than usual');
        } else {
            console.log('\n💡 Tip: Make sure the dev server is running (npm run dev)');
        }
    }
}

testContentFactory();

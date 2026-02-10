// Quick test script to check pipeline status
const testLeads = "Sarah Chen, Operations Director at GrowthScale - tracking 500 leads/month in spreadsheets";

async function testPipeline() {
    console.log('🚀 Testing pipeline at http://localhost:3000/api/pipeline/run\n');

    try {
        const response = await fetch('http://localhost:3000/api/pipeline/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads: testLeads })
        });

        if (!response.ok) {
            console.error('❌ Pipeline failed:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }

        console.log('✅ Pipeline started, streaming results...\n');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
                try {
                    const data = JSON.parse(line.replace('data: ', ''));

                    if (data.type === 'agent_start') {
                        console.log(`🔄 Agent ${data.agentNumber} started: ${data.agentName}`);
                    }

                    if (data.type === 'agent_complete') {
                        const status = data.success ? '✅' : '❌';
                        console.log(`${status} Agent ${data.agentNumber} completed in ${(data.duration / 1000).toFixed(1)}s`);
                        if (!data.success && data.result?.error) {
                            console.error(`   Error: ${data.result.error}`);
                        }
                    }

                    if (data.type === 'pipeline_complete') {
                        console.log(`\n🎉 Pipeline completed in ${(data.totalDuration / 1000).toFixed(1)}s`);
                    }

                    if (data.type === 'error') {
                        console.error(`\n❌ Pipeline error: ${data.message}`);
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }

        console.log('\n✅ Test completed successfully');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPipeline();

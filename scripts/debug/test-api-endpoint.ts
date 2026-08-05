/**
 * Test the live API endpoint
 */
async function testApiEndpoint() {
    console.log("🚀 Testing Live API Endpoint...\n");

    const payload = {
        task: `Analyze these 3 leads for a SaaS startup:
1) John Smith, CEO at TechCorp - uses spreadsheets for all tracking
2) Sarah Jones, Ops Manager at GrowthCo - overwhelmed by DMs
3) Mike Lee, Founder at StartupX - manual invoicing chaos`,
        agentId: "agent-1",
        mode: "fast"
    };

    console.log("📤 Request payload:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("\n");

    try {
        const response = await fetch("http://localhost:3000/api/agents/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log(`📥 Response status: ${response.status}`);

        const data = await response.json();
        console.log("\n📋 Response:");
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log("\n✅ API test successful!");
        } else {
            console.log("\n❌ API returned error:", data.error || data.message);
        }
    } catch (error) {
        console.error("\n❌ Request failed:", error);
    }
}

testApiEndpoint();

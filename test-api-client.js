// Test script for Zenthia Growth Operator
async function testZenthiaGrowthOperator() {
    console.log("Testing Zenthia Growth Operator...\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch("http://localhost:3000/api/agents/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task: "Create a 3-day content plan for TikTok focused on sleep support",
                agent: "zenthia_growth_operator",
                context: {
                    brandName: "Zenthia",
                    channels: ["TikTok"],
                    budget: "$0",
                    timePerDayMins: 30,
                    products: [{
                        name: "Sleep Support",
                        benefits: ["promotes restful sleep", "supports relaxation"],
                        price: "$29"
                    }],
                    voice: "warm, science-backed"
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        console.log("✅ Status:", response.status);

        if (response.ok) {
            const data = await response.json();
            console.log("\n📦 Response:");
            console.log(JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log("\n❌ Error Response:", errorText);
        }

    } catch (e) {
        clearTimeout(timeout);
        console.error("\n❌ Request failed:", e.message);
    }
}

testZenthiaGrowthOperator();

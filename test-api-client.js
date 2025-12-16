// Simple test for JSON parsing with quality mode
async function testQualityModeSimple() {
    console.log("Testing Quality Mode with Simple Task...\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch("http://localhost:3000/api/agents/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task: "Create 1 Instagram post idea about sleep support",
                agent: "zenthia_growth_operator",
                mode: "balanced",  // Use balanced instead of quality to avoid timeouts
                context: {
                    brandName: "Zenthia",
                    channels: ["IG"],
                    products: [{
                        name: "Sleep Blend",
                        benefits: ["promotes restful sleep"],
                        price: "$29"
                    }]
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        console.log("Status:", response.status);

        if (response.ok) {
            const data = await response.json();
            console.log("\n✅ SUCCESS!");
            console.log("Provider:", data.data.provider);
            console.log("Model:", data.data.model);
            console.log("Latency:", data.data.latencyMs + "ms");

            if (data.data.result) {
                console.log("\n📋 Result Keys:", Object.keys(data.data.result));
                console.log("\nFull result:");
                console.log(JSON.stringify(data.data.result, null, 2));
            } else {
                console.log("\n⚠️ No structured result in response");
            }
        } else {
            const errorText = await response.text();
            console.log("\n❌ Error:");
            const errorData = JSON.parse(errorText);
            console.log("Message:", errorData.message);
            if (errorData.error) {
                console.log("\nError details:");
                console.log(errorData.error.details);
            }
        }
    } catch (e) {
        clearTimeout(timeout);
        console.error("\n❌ Request failed:", e.message);
    }
}

testQualityModeSimple();

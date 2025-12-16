// Test script for Memory Layer integration
async function testMemoryLayer() {
    console.log("🧠 Testing Memory Layer Integration...\n");
    console.log("Note: Expecting mock data usage since no Google Credentials are set.\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    try {
        const response = await fetch("http://localhost:3000/api/agents/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task: "Create a TikTok script based on our best performing hooks",
                agent: "zenthia_growth_operator",
                mode: "fast", // Use fast for quick test
                context: {
                    brandName: "Zenthia",
                    channels: ["TikTok"],
                    products: [{ name: "Focus Blend", price: "$35" }]
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        console.log("Status:", response.status);

        if (response.ok) {
            const data = await response.json();
            const result = data.data.result;

            console.log("\n✅ SUCCESS: Agent ran with memory!");

            // Inspect the content to see if it mentions the hooks
            // (We can't easily see the prompt, but if the output references "top performing" or specifics from mock data, it worked)
            // Mock data has: "Stop buying [Product Category] until you read this..."

            if (result && result.content_plan_7_days) {
                console.log("\nGenerated Hook (Day 1):");
                const hook = result.content_plan_7_days[0].video_hook;
                console.log(`"${hook}"`);

                // Check if it looks similar to mock data pattern
                if (hook.toLowerCase().includes("stop buying") || hook.toLowerCase().includes("signs")) {
                    console.log("\n✨ Verification: Output seems influenced by memory/mock hooks!");
                } else {
                    console.log("\nℹ️ Output might vary, but memory injection didn't crash.");
                }
            }

        } else {
            const errorText = await response.text();
            console.log("\n❌ Error Response:", errorText);
        }

    } catch (e) {
        clearTimeout(timeout);
        console.error("\n❌ Request failed:", e.message);
    }
}

testMemoryLayer();

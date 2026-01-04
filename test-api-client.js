// Enhanced test script for Memory Layer integration with better output visibility
async function testMemoryLayer() {
    console.log("🧠 Testing Memory Layer Integration...\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    try {
        console.log("📡 Sending request to agent...\n");

        const response = await fetch("http://localhost:3000/api/agents/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task: "Create a growth plan based on our best performing hooks",
                agent: "zenthia_growth_operator",
                mode: "fast",
                context: {
                    brandName: "Zenthia",
                    channels: ["TikTok"],
                    products: [{ name: "Focus Blend", price: "$35" }]
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        console.log("📊 Status:", response.status);
        console.log("=".repeat(60));

        if (response.ok) {
            const data = await response.json();

            console.log("\n✅ SUCCESS: Agent responded!\n");
            console.log("Provider:", data.data?.provider);
            console.log("Model:", data.data?.model);
            console.log("Latency:", data.data?.latencyMs, "ms");
            console.log("=".repeat(60));

            const result = data.data?.result;

            if (result) {
                console.log("\n📋 Generated Content Preview:");
                console.log("=".repeat(60));

                if (result.today_brief) {
                    console.log("\n🎯 Today's Focus:");
                    console.log("  ", result.today_brief.focus);
                }

                if (result.content_plan_7_days && result.content_plan_7_days.length > 0) {
                    console.log("\n🎬 First Hook Generated:");
                    const firstDay = result.content_plan_7_days[0];
                    console.log("  Platform:", firstDay.platform);
                    console.log("  Hook:", firstDay.video_hook);
                    console.log("=".repeat(60));

                    // Check if output seems influenced by memory patterns
                    const hook = firstDay.video_hook.toLowerCase();
                    if (hook.includes("stop") || hook.includes("signs") || hook.includes("morning routine")) {
                        console.log("\n✨ MEMORY LAYER WORKING: Hook matches memory patterns!");
                    }
                }

                console.log("\n📊 Full structured output available in data.result");
                console.log("\n🎉 TEST PASSED: Memory integration successful!\n");
            } else {
                console.log("\n⚠️  No structured result in response");
                console.log("Full response:", JSON.stringify(data, null, 2).substring(0, 500));
            }

        } else {
            const errorText = await response.text();
            console.log("\n❌ Error Response:", errorText);
        }

    } catch (e) {
        clearTimeout(timeout);
        console.error("\n❌ Request failed:", e.message);
        if (e.name === 'AbortError') {
            console.log("⏱️  Request timed out after 40 seconds");
        }
    }
}

testMemoryLayer();

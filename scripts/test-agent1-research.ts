/**
 * Test script for Agent 1 research capabilities
 * Run: npx tsx scripts/test-agent1-research.ts
 */

import { getAvailableResearchTools } from '../app/api/agents/run/uptimize/agent-1-market-intelligence';
import { searchBrave, findBusinessesInArea, researchBusinessViaBrave, formatBraveResearchForPrompt } from '../lib/research/brave-search';

async function testResearch() {
    console.log('=== Agent 1 Research Tool Test ===\n');

    // 1. Check available research tools
    console.log('1. Checking available research tools...');
    const tools = await getAvailableResearchTools();
    console.log('Available research tools:', JSON.stringify(tools, null, 2));
    console.log();

    // 2. Test Brave Search (requires BRAVE_API_KEY)
    const braveKey = process.env.BRAVE_API_KEY;
    if (!braveKey) {
        console.log('2. BRAVE_API_KEY not set — skipping Brave Search tests');
        console.log('   Set BRAVE_API_KEY in .env to enable web search fallback\n');
        return;
    }

    console.log('2. Testing Brave Search — basic query...');
    try {
        const results = await searchBrave('fitness gyms in Ponce Puerto Rico', 5);
        console.log(`   Found ${results.length} web results`);
        for (const r of results.slice(0, 3)) {
            console.log(`   - ${r.title}: ${r.url}`);
        }
    } catch (err) {
        console.error('   Brave search error:', err);
    }
    console.log();

    // 3. Test business area search
    console.log('3. Testing findBusinessesInArea...');
    try {
        const businesses = await findBusinessesInArea('fitness', 'Ponce, Puerto Rico', 5);
        console.log(`   Found ${businesses.length} businesses`);
        for (const b of businesses) {
            console.log(`   - ${b.name} (${b.domain}): ${b.description.slice(0, 80)}...`);
        }
    } catch (err) {
        console.error('   Business search error:', err);
    }
    console.log();

    // 4. Test comprehensive research on a single business
    console.log('4. Testing researchBusinessViaBrave (quick depth)...');
    try {
        const research = await researchBusinessViaBrave('Planet Fitness', 'Ponce Puerto Rico', 'quick');
        console.log(`   General results: ${research.general.length}`);
        console.log(`   Reviews: ${research.reviews.length}`);
        console.log(`   Hiring signals: ${research.hiring.length}`);
        console.log(`   Social presence: ${research.social.length}`);

        const formatted = formatBraveResearchForPrompt('Planet Fitness Ponce', research);
        console.log('\n   Formatted prompt snippet (first 500 chars):');
        console.log('   ' + formatted.slice(0, 500).replace(/\n/g, '\n   '));
    } catch (err) {
        console.error('   Research error:', err);
    }

    console.log('\n=== Test complete ===');
}

testResearch().catch(console.error);

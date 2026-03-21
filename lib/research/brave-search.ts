/**
 * Brave Search API — Web search fallback for Agent 1 research
 * Used when MCP research tools are not available or not connected.
 */

export interface BraveWebResult {
    title: string;
    url: string;
    description: string;
    extra_snippets?: string[];
}

export interface BusinessSearchResult {
    name: string;
    domain: string;
    description: string;
    url: string;
}

/**
 * Search Brave Web API
 */
export async function searchBrave(query: string, count = 10): Promise<BraveWebResult[]> {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) throw new Error('BRAVE_API_KEY not configured');

    const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
        {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': apiKey,
            },
        }
    );

    if (!response.ok) throw new Error(`Brave search failed: ${response.status}`);
    const data = await response.json();
    return data.web?.results ?? [];
}

/**
 * Find businesses in a specific area using Brave Search
 */
export async function findBusinessesInArea(
    industry: string,
    location: string,
    count = 10
): Promise<BusinessSearchResult[]> {
    const query = `${industry} businesses in ${location}`;
    const results = await searchBrave(query, count * 2);

    return results
        .filter(r => isBusinessResult(r))
        .slice(0, count)
        .map(r => ({
            name: extractBusinessName(r.title),
            domain: extractDomain(r.url),
            description: r.description,
            url: r.url,
        }));
}

/**
 * Search for reviews and complaints about a specific business
 */
export async function searchBusinessReviews(
    businessName: string,
    location?: string
): Promise<BraveWebResult[]> {
    const locationSuffix = location ? ` ${location}` : '';
    const query = `"${businessName}"${locationSuffix} reviews complaints`;
    return searchBrave(query, 10);
}

/**
 * Search for hiring signals for a business
 */
export async function searchHiringSignals(
    businessName: string
): Promise<BraveWebResult[]> {
    const query = `"${businessName}" hiring jobs "now hiring" OR "we're hiring" OR "join our team"`;
    return searchBrave(query, 5);
}

/**
 * Search for social media presence
 */
export async function searchSocialPresence(
    businessName: string
): Promise<BraveWebResult[]> {
    const query = `"${businessName}" site:facebook.com OR site:instagram.com OR site:linkedin.com`;
    return searchBrave(query, 10);
}

/**
 * Comprehensive research on a single business using Brave Search
 */
export async function researchBusinessViaBrave(
    businessName: string,
    location?: string,
    depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<{
    general: BraveWebResult[];
    reviews: BraveWebResult[];
    hiring: BraveWebResult[];
    social: BraveWebResult[];
}> {
    const locationSuffix = location ? ` ${location}` : '';

    if (depth === 'quick') {
        const general = await searchBrave(`"${businessName}"${locationSuffix}`, 5);
        return { general, reviews: [], hiring: [], social: [] };
    }

    // Standard and deep: run searches in parallel
    const [general, reviews, hiring, social] = await Promise.all([
        searchBrave(`"${businessName}"${locationSuffix}`, depth === 'deep' ? 10 : 5),
        searchBusinessReviews(businessName, location),
        searchHiringSignals(businessName),
        depth === 'deep' ? searchSocialPresence(businessName) : Promise.resolve([]),
    ]);

    return { general, reviews, hiring, social };
}

/**
 * Format Brave research results for inclusion in an Agent 1 prompt
 */
export function formatBraveResearchForPrompt(
    businessName: string,
    research: Awaited<ReturnType<typeof researchBusinessViaBrave>>
): string {
    let output = `### ${businessName}\n\n`;

    if (research.general.length > 0) {
        output += `**Web Results:**\n`;
        for (const r of research.general.slice(0, 5)) {
            output += `- ${r.title}: ${r.description}\n`;
            if (r.url) output += `  Source: ${r.url}\n`;
        }
        output += '\n';
    }

    if (research.reviews.length > 0) {
        output += `**Reviews & Complaints:**\n`;
        for (const r of research.reviews.slice(0, 5)) {
            output += `- ${r.title}: ${r.description}\n`;
        }
        output += '\n';
    }

    if (research.hiring.length > 0) {
        output += `**Hiring Signals:**\n`;
        for (const r of research.hiring.slice(0, 3)) {
            output += `- ${r.title}: ${r.description}\n`;
        }
        output += '\n';
    }

    if (research.social.length > 0) {
        output += `**Social Presence:**\n`;
        for (const r of research.social.slice(0, 3)) {
            output += `- ${r.title} (${r.url})\n`;
        }
        output += '\n';
    }

    return output;
}

// ---- Helpers ----

function isBusinessResult(result: BraveWebResult): boolean {
    const lowerUrl = result.url.toLowerCase();
    const skipDomains = ['wikipedia.org', 'yelp.com', 'facebook.com', 'instagram.com',
        'twitter.com', 'linkedin.com', 'youtube.com', 'reddit.com', 'tiktok.com'];
    return !skipDomains.some(d => lowerUrl.includes(d));
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

function extractBusinessName(title: string): string {
    // Remove common suffixes like " - Home", " | Official Site", etc.
    return title
        .replace(/\s*[-|–—]\s*(Home|Official|Website|About|Contact).*$/i, '')
        .replace(/\s*\|.*$/, '')
        .trim();
}

/**
 * UptimizeAI Research MCP Servers
 *
 * Specialized MCP servers for Agent 1 (Market Intelligence) to gather
 * real data about prospects, companies, and market signals.
 *
 * These servers enable:
 * - Web search for hiring signals, complaints, news
 * - LinkedIn profile/company data gathering
 * - Review site aggregation (Google Reviews, G2, Capterra)
 * - Social listening (Twitter/X, Facebook, Instagram)
 * - Industry-specific data sources
 */

import type { MCPServerConfig, MCPTool, MCPResource } from "./mcp-client";

// ============================================================================
// RESEARCH MCP SERVER TYPES
// ============================================================================

export interface ResearchResult {
  source: string;
  url?: string;
  title: string;
  snippet: string;
  timestamp?: string;
  relevance_score?: number;
  metadata?: Record<string, unknown>;
}

export interface CompanyProfile {
  name: string;
  domain?: string;
  industry?: string;
  size_range?: string;
  location?: string;
  description?: string;
  technologies?: string[];
  social_profiles?: Record<string, string>;
  recent_news?: ResearchResult[];
  hiring_signals?: HiringSignal[];
  pain_indicators?: PainIndicator[];
}

export interface PersonProfile {
  name: string;
  title?: string;
  company?: string;
  linkedin_url?: string;
  email?: string;
  bio?: string;
  recent_posts?: SocialPost[];
  authority_signals?: string[];
}

export interface HiringSignal {
  job_title: string;
  source: string;
  posted_date?: string;
  url?: string;
  keywords_matched?: string[];
  signal_type: "expansion" | "replacement" | "new_role" | "urgent";
}

export interface PainIndicator {
  type: "review" | "social_post" | "forum" | "news";
  source: string;
  text: string;
  sentiment: "negative" | "neutral" | "positive";
  pain_category?: string;
  pillar_mapping?: string;
  timestamp?: string;
}

export interface SocialPost {
  platform: "linkedin" | "twitter" | "facebook" | "instagram";
  text: string;
  timestamp: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  url?: string;
}

export interface ReviewData {
  platform: "google" | "g2" | "capterra" | "trustpilot" | "yelp" | "glassdoor";
  rating: number;
  total_reviews: number;
  recent_reviews: Array<{
    rating: number;
    text: string;
    date: string;
    reviewer?: string;
    response?: string;
  }>;
  pain_themes?: string[];
}

// ============================================================================
// WEB SEARCH MCP SERVER
// ============================================================================

export const WEB_SEARCH_SERVER_CONFIG: MCPServerConfig = {
  server_id: "research_web_search",
  name: "Web Search Research",
  description: "Search the web for company news, hiring signals, complaints, and market intelligence",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@anthropic/mcp-server-web-search"],
  capabilities: {
    tools: true,
    resources: false,
    prompts: true,
    sampling: false,
  },
  timeout_ms: 30000,
  retry_config: {
    max_retries: 3,
    backoff_ms: 1000,
  },
};

export const WEB_SEARCH_TOOLS: MCPTool[] = [
  {
    name: "search_web",
    description: "General web search for any query. Returns top results with snippets.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        num_results: {
          type: "number",
          description: "Number of results to return (default: 10, max: 50)"
        },
        time_range: {
          type: "string",
          description: "Time filter: 'day', 'week', 'month', 'year', 'all'"
        },
        site_filter: {
          type: "string",
          description: "Limit search to specific domain (e.g., 'linkedin.com')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_news",
    description: "Search news articles about a company, person, or topic",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Company name, person name, or topic"
        },
        num_results: {
          type: "number",
          description: "Number of articles to return (default: 10)"
        },
        time_range: {
          type: "string",
          description: "Time filter: 'day', 'week', 'month', 'year'"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_hiring_signals",
    description: "Search for job postings that indicate growth, pain, or urgency",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "Company name to search for job postings"
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords to look for (e.g., 'operations manager', 'automation', 'urgent')"
        },
        job_boards: {
          type: "array",
          items: { type: "string" },
          description: "Specific job boards to search (default: all major boards)"
        }
      },
      required: ["company"]
    }
  },
  {
    name: "search_complaints",
    description: "Search for complaints, negative reviews, or pain signals about a company",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "Company name"
        },
        pain_categories: {
          type: "array",
          items: { type: "string" },
          description: "Pain categories to look for (e.g., 'slow response', 'lost orders', 'poor communication')"
        }
      },
      required: ["company"]
    }
  },
  {
    name: "search_tech_stack",
    description: "Identify technologies used by a company from job posts, website, and tech databases",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "Company name"
        },
        domain: {
          type: "string",
          description: "Company website domain"
        }
      },
      required: ["company"]
    }
  }
];

// ============================================================================
// LINKEDIN MCP SERVER
// ============================================================================

export const LINKEDIN_SERVER_CONFIG: MCPServerConfig = {
  server_id: "research_linkedin",
  name: "LinkedIn Research",
  description: "Gather LinkedIn profile and company data for prospect research",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@uptimize/mcp-server-linkedin"],
  capabilities: {
    tools: true,
    resources: true,
    prompts: false,
    sampling: false,
  },
  timeout_ms: 30000,
  retry_config: {
    max_retries: 3,
    backoff_ms: 2000,
  },
};

export const LINKEDIN_TOOLS: MCPTool[] = [
  {
    name: "get_person_profile",
    description: "Get LinkedIn profile data for a person",
    inputSchema: {
      type: "object",
      properties: {
        linkedin_url: {
          type: "string",
          description: "LinkedIn profile URL"
        },
        name: {
          type: "string",
          description: "Person's full name (used with company for lookup)"
        },
        company: {
          type: "string",
          description: "Person's company (used with name for lookup)"
        }
      }
    }
  },
  {
    name: "get_company_profile",
    description: "Get LinkedIn company page data",
    inputSchema: {
      type: "object",
      properties: {
        company_url: {
          type: "string",
          description: "LinkedIn company page URL"
        },
        company_name: {
          type: "string",
          description: "Company name for lookup"
        }
      }
    }
  },
  {
    name: "get_recent_posts",
    description: "Get recent LinkedIn posts from a person or company",
    inputSchema: {
      type: "object",
      properties: {
        linkedin_url: {
          type: "string",
          description: "LinkedIn profile or company page URL"
        },
        num_posts: {
          type: "number",
          description: "Number of recent posts to retrieve (default: 10)"
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Filter posts containing these keywords"
        }
      },
      required: ["linkedin_url"]
    }
  },
  {
    name: "search_people",
    description: "Search LinkedIn for people matching criteria",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Job title or role to search for"
        },
        company: {
          type: "string",
          description: "Company name"
        },
        industry: {
          type: "string",
          description: "Industry filter"
        },
        location: {
          type: "string",
          description: "Geographic location"
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords to include in search"
        }
      }
    }
  },
  {
    name: "get_company_employees",
    description: "Get list of employees at a company with their roles",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name"
        },
        department_filter: {
          type: "string",
          description: "Filter by department (e.g., 'Operations', 'Sales')"
        },
        seniority_filter: {
          type: "string",
          description: "Filter by seniority (e.g., 'Director', 'VP', 'C-Level')"
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "get_hiring_activity",
    description: "Get recent hiring activity for a company from LinkedIn",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name"
        },
        time_range_days: {
          type: "number",
          description: "Look back period in days (default: 30)"
        }
      },
      required: ["company_name"]
    }
  }
];

// ============================================================================
// REVIEW SITES MCP SERVER
// ============================================================================

export const REVIEW_SITES_SERVER_CONFIG: MCPServerConfig = {
  server_id: "research_reviews",
  name: "Review Sites Research",
  description: "Aggregate reviews from Google, G2, Capterra, Trustpilot, Yelp",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@uptimize/mcp-server-reviews"],
  capabilities: {
    tools: true,
    resources: true,
    prompts: false,
    sampling: false,
  },
  timeout_ms: 30000,
  retry_config: {
    max_retries: 3,
    backoff_ms: 1000,
  },
};

export const REVIEW_SITES_TOOLS: MCPTool[] = [
  {
    name: "get_google_reviews",
    description: "Get Google Business reviews for a company",
    inputSchema: {
      type: "object",
      properties: {
        business_name: {
          type: "string",
          description: "Business name"
        },
        location: {
          type: "string",
          description: "City or address for location-based businesses"
        },
        num_reviews: {
          type: "number",
          description: "Number of recent reviews to retrieve (default: 20)"
        },
        min_rating: {
          type: "number",
          description: "Filter by minimum rating (1-5)"
        },
        max_rating: {
          type: "number",
          description: "Filter by maximum rating (1-5, useful for finding complaints)"
        }
      },
      required: ["business_name"]
    }
  },
  {
    name: "get_g2_reviews",
    description: "Get G2 software reviews (for B2B SaaS competitors or clients)",
    inputSchema: {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "Software product name"
        },
        category: {
          type: "string",
          description: "G2 category (e.g., 'CRM', 'Project Management')"
        },
        num_reviews: {
          type: "number",
          description: "Number of reviews to retrieve (default: 20)"
        },
        sentiment_filter: {
          type: "string",
          description: "Filter by sentiment: 'positive', 'negative', 'mixed'"
        }
      },
      required: ["product_name"]
    }
  },
  {
    name: "get_capterra_reviews",
    description: "Get Capterra software reviews",
    inputSchema: {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "Software product name"
        },
        num_reviews: {
          type: "number",
          description: "Number of reviews to retrieve (default: 20)"
        }
      },
      required: ["product_name"]
    }
  },
  {
    name: "get_glassdoor_reviews",
    description: "Get Glassdoor employee reviews (useful for understanding internal operations)",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name"
        },
        num_reviews: {
          type: "number",
          description: "Number of reviews to retrieve (default: 20)"
        },
        department_filter: {
          type: "string",
          description: "Filter by department (e.g., 'Operations', 'Customer Service')"
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "get_trustpilot_reviews",
    description: "Get Trustpilot reviews for a company",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name or domain"
        },
        num_reviews: {
          type: "number",
          description: "Number of reviews to retrieve (default: 20)"
        },
        rating_filter: {
          type: "number",
          description: "Filter by exact star rating (1-5)"
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "aggregate_reviews",
    description: "Aggregate reviews across all platforms for a single company",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name"
        },
        domain: {
          type: "string",
          description: "Company website domain"
        },
        include_platforms: {
          type: "array",
          items: { type: "string" },
          description: "Platforms to include (default: all)"
        },
        focus_on_pain: {
          type: "boolean",
          description: "Focus on negative reviews and pain indicators (default: true)"
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "extract_pain_themes",
    description: "Analyze reviews to extract common pain themes mapped to 6 pillars",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name"
        },
        review_sources: {
          type: "array",
          items: { type: "string" },
          description: "Sources to analyze (or 'all')"
        }
      },
      required: ["company_name"]
    }
  }
];

// ============================================================================
// SOCIAL LISTENING MCP SERVER
// ============================================================================

export const SOCIAL_LISTENING_SERVER_CONFIG: MCPServerConfig = {
  server_id: "research_social",
  name: "Social Listening Research",
  description: "Monitor Twitter/X, Facebook, Instagram for mentions, complaints, and signals",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@uptimize/mcp-server-social"],
  capabilities: {
    tools: true,
    resources: true,
    prompts: false,
    sampling: false,
  },
  timeout_ms: 30000,
  retry_config: {
    max_retries: 3,
    backoff_ms: 1000,
  },
};

export const SOCIAL_LISTENING_TOOLS: MCPTool[] = [
  {
    name: "search_twitter",
    description: "Search Twitter/X for mentions, complaints, or discussions",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (supports Twitter operators)"
        },
        from_user: {
          type: "string",
          description: "Filter to posts from specific user"
        },
        to_user: {
          type: "string",
          description: "Filter to posts mentioning specific user"
        },
        num_results: {
          type: "number",
          description: "Number of results (default: 50)"
        },
        time_range: {
          type: "string",
          description: "Time filter: 'day', 'week', 'month'"
        },
        sentiment_filter: {
          type: "string",
          description: "Filter by sentiment: 'positive', 'negative', 'neutral'"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_twitter_profile",
    description: "Get Twitter/X profile and recent tweets for a user",
    inputSchema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Twitter username (without @)"
        },
        include_replies: {
          type: "boolean",
          description: "Include replies in tweet history"
        },
        num_tweets: {
          type: "number",
          description: "Number of recent tweets (default: 20)"
        }
      },
      required: ["username"]
    }
  },
  {
    name: "search_facebook",
    description: "Search public Facebook posts and pages",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        page_name: {
          type: "string",
          description: "Specific page to search"
        },
        post_type: {
          type: "string",
          description: "Type: 'post', 'comment', 'review'"
        },
        num_results: {
          type: "number",
          description: "Number of results (default: 30)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_facebook_page",
    description: "Get Facebook page info and recent posts",
    inputSchema: {
      type: "object",
      properties: {
        page_name: {
          type: "string",
          description: "Facebook page name or URL"
        },
        include_reviews: {
          type: "boolean",
          description: "Include page reviews"
        },
        num_posts: {
          type: "number",
          description: "Number of recent posts (default: 20)"
        }
      },
      required: ["page_name"]
    }
  },
  {
    name: "search_instagram",
    description: "Search Instagram for hashtags and business account posts",
    inputSchema: {
      type: "object",
      properties: {
        hashtag: {
          type: "string",
          description: "Hashtag to search (without #)"
        },
        username: {
          type: "string",
          description: "Business account username"
        },
        num_results: {
          type: "number",
          description: "Number of results (default: 30)"
        }
      }
    }
  },
  {
    name: "get_instagram_business",
    description: "Get Instagram business account info and posts",
    inputSchema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Instagram username"
        },
        include_comments: {
          type: "boolean",
          description: "Include post comments"
        },
        num_posts: {
          type: "number",
          description: "Number of posts (default: 20)"
        }
      },
      required: ["username"]
    }
  },
  {
    name: "monitor_mentions",
    description: "Get recent mentions of a brand across all social platforms",
    inputSchema: {
      type: "object",
      properties: {
        brand_name: {
          type: "string",
          description: "Brand or company name to monitor"
        },
        include_misspellings: {
          type: "boolean",
          description: "Include common misspellings (default: true)"
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: "Platforms to search: 'twitter', 'facebook', 'instagram'"
        },
        sentiment_focus: {
          type: "string",
          description: "Focus on: 'negative', 'positive', 'all'"
        },
        time_range_days: {
          type: "number",
          description: "Look back period in days (default: 7)"
        }
      },
      required: ["brand_name"]
    }
  }
];

// ============================================================================
// INDUSTRY DATA MCP SERVER
// ============================================================================

export const INDUSTRY_DATA_SERVER_CONFIG: MCPServerConfig = {
  server_id: "research_industry",
  name: "Industry Data Research",
  description: "Industry-specific databases, associations, and regulatory data",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@uptimize/mcp-server-industry"],
  capabilities: {
    tools: true,
    resources: true,
    prompts: false,
    sampling: false,
  },
  timeout_ms: 30000,
  retry_config: {
    max_retries: 3,
    backoff_ms: 1000,
  },
};

export const INDUSTRY_DATA_TOOLS: MCPTool[] = [
  {
    name: "get_company_data",
    description: "Get company data from business databases (Crunchbase, ZoomInfo, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name"
        },
        domain: {
          type: "string",
          description: "Company website domain"
        },
        data_sources: {
          type: "array",
          items: { type: "string" },
          description: "Sources: 'crunchbase', 'zoominfo', 'linkedin', 'dnb'"
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "get_industry_associations",
    description: "Get relevant industry associations and memberships",
    inputSchema: {
      type: "object",
      properties: {
        industry: {
          type: "string",
          description: "Industry name (e.g., 'freight forwarding', 'property management')"
        },
        region: {
          type: "string",
          description: "Geographic region for regional associations"
        }
      },
      required: ["industry"]
    }
  },
  {
    name: "get_regulatory_filings",
    description: "Get regulatory filings, licenses, or compliance records",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Company name"
        },
        industry: {
          type: "string",
          description: "Industry for relevant regulatory bodies"
        },
        filing_types: {
          type: "array",
          items: { type: "string" },
          description: "Types of filings to retrieve"
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "get_competitor_landscape",
    description: "Get competitor analysis for a company or industry segment",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Target company name"
        },
        industry: {
          type: "string",
          description: "Industry to analyze"
        },
        location: {
          type: "string",
          description: "Geographic focus"
        }
      },
      required: ["industry"]
    }
  },
  {
    name: "get_market_trends",
    description: "Get market trends and industry reports",
    inputSchema: {
      type: "object",
      properties: {
        industry: {
          type: "string",
          description: "Industry name"
        },
        topics: {
          type: "array",
          items: { type: "string" },
          description: "Specific topics (e.g., 'automation', 'labor shortage')"
        },
        time_range: {
          type: "string",
          description: "Time range for trends: 'month', 'quarter', 'year'"
        }
      },
      required: ["industry"]
    }
  }
];

// ============================================================================
// UNIFIED RESEARCH ORCHESTRATOR
// ============================================================================

export interface ResearchQuery {
  target_type: "company" | "person" | "industry";
  target_name: string;
  target_domain?: string;
  research_goals: ResearchGoal[];
  depth: "quick" | "standard" | "deep";
  pillar_focus?: string[];
}

export type ResearchGoal =
  | "identify_decision_makers"
  | "find_pain_signals"
  | "assess_tech_stack"
  | "monitor_hiring"
  | "gather_reviews"
  | "social_sentiment"
  | "competitor_context"
  | "recent_news"
  | "expansion_signals";

export interface ResearchPlan {
  query: ResearchQuery;
  steps: ResearchStep[];
  estimated_time_seconds: number;
}

export interface ResearchStep {
  step_number: number;
  server_id: string;
  tool_name: string;
  params: Record<string, unknown>;
  purpose: string;
  pillar_relevance?: string[];
}

export interface ComprehensiveResearchResult {
  target: {
    type: string;
    name: string;
    domain?: string;
  };
  company_profile?: CompanyProfile;
  decision_makers?: PersonProfile[];
  pain_signals: PainIndicator[];
  hiring_signals: HiringSignal[];
  reviews: ReviewData[];
  social_mentions: SocialPost[];
  recent_news: ResearchResult[];
  tech_stack: string[];
  six_pillar_analysis: {
    shadow_ops_indicators: string[];
    exception_indicators: string[];
    audit_trail_indicators: string[];
    knowledge_decision_indicators: string[];
    handoff_sla_indicators: string[];
    channel_evidence_indicators: string[];
  };
  research_confidence: "high" | "medium" | "low";
  research_gaps: string[];
  recommended_angles: string[];
  timestamp: string;
}

/**
 * Plan research steps based on query
 */
export function planResearch(query: ResearchQuery): ResearchPlan {
  const steps: ResearchStep[] = [];
  let stepNumber = 1;

  // Always start with basic company/person profile
  if (query.target_type === "company") {
    steps.push({
      step_number: stepNumber++,
      server_id: "research_web_search",
      tool_name: "search_web",
      params: { query: `"${query.target_name}" company`, num_results: 5 },
      purpose: "Get basic company info and website",
    });

    steps.push({
      step_number: stepNumber++,
      server_id: "research_linkedin",
      tool_name: "get_company_profile",
      params: { company_name: query.target_name },
      purpose: "Get LinkedIn company profile",
    });
  }

  if (query.target_type === "person") {
    steps.push({
      step_number: stepNumber++,
      server_id: "research_linkedin",
      tool_name: "get_person_profile",
      params: { name: query.target_name },
      purpose: "Get LinkedIn person profile",
    });
  }

  // Add goal-specific steps
  for (const goal of query.research_goals) {
    switch (goal) {
      case "identify_decision_makers":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_linkedin",
          tool_name: "get_company_employees",
          params: {
            company_name: query.target_name,
            seniority_filter: "Director,VP,C-Level",
            department_filter: "Operations,Customer Success,Technology",
          },
          purpose: "Find decision makers in relevant departments",
          pillar_relevance: ["knowledge_decisions"],
        });
        break;

      case "find_pain_signals":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_web_search",
          tool_name: "search_complaints",
          params: {
            company: query.target_name,
            pain_categories: ["slow response", "lost orders", "miscommunication", "manual process"],
          },
          purpose: "Find pain signals and complaints",
          pillar_relevance: ["shadow_ops", "exceptions", "handoffs_slas"],
        });

        steps.push({
          step_number: stepNumber++,
          server_id: "research_reviews",
          tool_name: "extract_pain_themes",
          params: { company_name: query.target_name },
          purpose: "Extract pain themes from reviews",
          pillar_relevance: ["shadow_ops", "exceptions", "channels_evidence"],
        });
        break;

      case "assess_tech_stack":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_web_search",
          tool_name: "search_tech_stack",
          params: {
            company: query.target_name,
            domain: query.target_domain,
          },
          purpose: "Identify current technology stack",
          pillar_relevance: ["shadow_ops", "audit_trail"],
        });
        break;

      case "monitor_hiring":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_web_search",
          tool_name: "search_hiring_signals",
          params: {
            company: query.target_name,
            keywords: ["operations", "automation", "process", "urgent", "immediate"],
          },
          purpose: "Find hiring signals indicating growth or pain",
          pillar_relevance: ["shadow_ops", "handoffs_slas"],
        });

        steps.push({
          step_number: stepNumber++,
          server_id: "research_linkedin",
          tool_name: "get_hiring_activity",
          params: { company_name: query.target_name },
          purpose: "Get recent LinkedIn hiring activity",
        });
        break;

      case "gather_reviews":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_reviews",
          tool_name: "aggregate_reviews",
          params: {
            company_name: query.target_name,
            domain: query.target_domain,
            focus_on_pain: true,
          },
          purpose: "Aggregate reviews across platforms",
          pillar_relevance: ["exceptions", "channels_evidence"],
        });
        break;

      case "social_sentiment":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_social",
          tool_name: "monitor_mentions",
          params: {
            brand_name: query.target_name,
            sentiment_focus: "negative",
            time_range_days: 30,
          },
          purpose: "Monitor social media for sentiment and complaints",
          pillar_relevance: ["channels_evidence"],
        });
        break;

      case "recent_news":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_web_search",
          tool_name: "search_news",
          params: {
            query: query.target_name,
            time_range: "month",
            num_results: 10,
          },
          purpose: "Get recent news and announcements",
        });
        break;

      case "competitor_context":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_industry",
          tool_name: "get_competitor_landscape",
          params: {
            company_name: query.target_name,
          },
          purpose: "Understand competitive landscape",
        });
        break;

      case "expansion_signals":
        steps.push({
          step_number: stepNumber++,
          server_id: "research_web_search",
          tool_name: "search_news",
          params: {
            query: `"${query.target_name}" expansion OR "new location" OR funding OR acquisition`,
            time_range: "quarter",
          },
          purpose: "Find expansion and growth signals",
        });
        break;
    }
  }

  // Estimate time based on depth
  const timePerStep = query.depth === "quick" ? 2 : query.depth === "standard" ? 5 : 10;
  const estimatedTime = steps.length * timePerStep;

  return {
    query,
    steps,
    estimated_time_seconds: estimatedTime,
  };
}

// ============================================================================
// RESEARCH SERVER PRESETS (for MCP_SERVER_PRESETS)
// ============================================================================

export const RESEARCH_MCP_PRESETS = {
  research_web_search: {
    name: "Web Search Research",
    description: "Web search for company intelligence, hiring signals, complaints, and news",
    capabilities: { tools: true, resources: false, prompts: true, sampling: false },
  },
  research_linkedin: {
    name: "LinkedIn Research",
    description: "LinkedIn profile and company data for prospect research",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },
  research_reviews: {
    name: "Review Sites Research",
    description: "Aggregate reviews from Google, G2, Capterra, Trustpilot for pain signals",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },
  research_social: {
    name: "Social Listening Research",
    description: "Monitor Twitter/X, Facebook, Instagram for mentions and sentiment",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },
  research_industry: {
    name: "Industry Data Research",
    description: "Industry databases, associations, regulatory data, and market trends",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },
};

// ============================================================================
// ALL RESEARCH SERVERS
// ============================================================================

export const ALL_RESEARCH_SERVERS: MCPServerConfig[] = [
  WEB_SEARCH_SERVER_CONFIG,
  LINKEDIN_SERVER_CONFIG,
  REVIEW_SITES_SERVER_CONFIG,
  SOCIAL_LISTENING_SERVER_CONFIG,
  INDUSTRY_DATA_SERVER_CONFIG,
];

export const ALL_RESEARCH_TOOLS = {
  web_search: WEB_SEARCH_TOOLS,
  linkedin: LINKEDIN_TOOLS,
  reviews: REVIEW_SITES_TOOLS,
  social: SOCIAL_LISTENING_TOOLS,
  industry: INDUSTRY_DATA_TOOLS,
};

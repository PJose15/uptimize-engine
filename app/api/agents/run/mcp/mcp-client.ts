/**
 * UptimizeAI MCP (Model Context Protocol) Client Integration
 *
 * V3 Addition: Allows agents to connect to external tools/services through
 * MCP servers, giving them real capabilities to interact with:
 * - CRMs (HubSpot, Salesforce, etc.)
 * - Communication tools (Slack, Email, SMS)
 * - Databases and data stores
 * - Custom client systems
 * - File systems
 * - APIs
 *
 * MCP enables agents to:
 * 1. Call tools on MCP servers
 * 2. Read resources from MCP servers
 * 3. Use prompts defined by MCP servers
 */

import { logger } from "../logger";
import { MCPClientInterface } from "../automation/workflow-engine";

// ============================================================================
// TYPES
// ============================================================================

export interface MCPServerConfig {
  server_id: string;
  name: string;
  description: string;
  transport: "stdio" | "sse" | "websocket";

  // For stdio transport
  command?: string;
  args?: string[];
  env?: Record<string, string>;

  // For HTTP transports
  url?: string;
  headers?: Record<string, string>;

  // Capabilities
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    sampling?: boolean;
  };

  // Connection settings
  timeout_ms?: number;
  retry_config?: {
    max_retries: number;
    backoff_ms: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPToolCallResult {
  success: boolean;
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

// ============================================================================
// MCP CLIENT
// ============================================================================

export class MCPClient implements MCPClientInterface {
  private servers: Map<string, MCPServerConfig> = new Map();
  private connections: Map<string, MCPConnection> = new Map();
  private toolCache: Map<string, MCPTool[]> = new Map();
  private resourceCache: Map<string, MCPResource[]> = new Map();

  /**
   * Register an MCP server configuration
   */
  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.server_id, config);
    logger.info("MCP server registered", {}, {
      server_id: config.server_id,
      name: config.name,
      transport: config.transport
    });
  }

  /**
   * Connect to an MCP server
   */
  async connect(serverId: string): Promise<boolean> {
    const config = this.servers.get(serverId);
    if (!config) {
      logger.error("MCP server not found", {}, { server_id: serverId });
      return false;
    }

    try {
      const connection = await this.createConnection(config);
      this.connections.set(serverId, connection);

      // Initialize and cache capabilities
      if (config.capabilities.tools) {
        const tools = await this.listToolsInternal(connection);
        this.toolCache.set(serverId, tools);
      }

      if (config.capabilities.resources) {
        const resources = await this.listResourcesInternal(connection);
        this.resourceCache.set(serverId, resources);
      }

      logger.info("MCP server connected", {}, {
        server_id: serverId,
        tools_count: this.toolCache.get(serverId)?.length || 0,
        resources_count: this.resourceCache.get(serverId)?.length || 0
      });

      return true;
    } catch (error) {
      logger.error("Failed to connect to MCP server", {}, {
        server_id: serverId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (connection) {
      await connection.close();
      this.connections.delete(serverId);
      this.toolCache.delete(serverId);
      this.resourceCache.delete(serverId);
      logger.info("MCP server disconnected", {}, { server_id: serverId });
    }
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(
    serverId: string,
    toolName: string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to MCP server: ${serverId}`);
    }

    const startTime = Date.now();

    try {
      const result = await connection.callTool(toolName, params);

      logger.info("MCP tool called", {}, {
        server_id: serverId,
        tool_name: toolName,
        success: result.success,
        latency_ms: Date.now() - startTime
      });

      if (result.isError) {
        throw new Error(result.content[0]?.text || "Tool call failed");
      }

      // Extract text content as primary result
      const textContent = result.content.find(c => c.type === "text");
      if (textContent?.text) {
        try {
          return JSON.parse(textContent.text);
        } catch {
          return { result: textContent.text };
        }
      }

      return { content: result.content };
    } catch (error) {
      logger.error("MCP tool call failed", {}, {
        server_id: serverId,
        tool_name: toolName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * List available tools on an MCP server
   */
  async listTools(serverId: string): Promise<MCPTool[]> {
    // Return cached if available
    const cached = this.toolCache.get(serverId);
    if (cached) return cached;

    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to MCP server: ${serverId}`);
    }

    const tools = await this.listToolsInternal(connection);
    this.toolCache.set(serverId, tools);
    return tools;
  }

  /**
   * Get a resource from an MCP server
   */
  async getResource(serverId: string, uri: string): Promise<MCPResourceContent> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to MCP server: ${serverId}`);
    }

    return await connection.readResource(uri);
  }

  /**
   * List available resources on an MCP server
   */
  async listResources(serverId: string): Promise<MCPResource[]> {
    const cached = this.resourceCache.get(serverId);
    if (cached) return cached;

    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to MCP server: ${serverId}`);
    }

    const resources = await this.listResourcesInternal(connection);
    this.resourceCache.set(serverId, resources);
    return resources;
  }

  /**
   * Get all connected server info
   */
  getConnectedServers(): Array<{
    server_id: string;
    name: string;
    tools_count: number;
    resources_count: number;
  }> {
    const result: Array<{
      server_id: string;
      name: string;
      tools_count: number;
      resources_count: number;
    }> = [];

    for (const [serverId, connection] of this.connections) {
      const config = this.servers.get(serverId);
      result.push({
        server_id: serverId,
        name: config?.name || serverId,
        tools_count: this.toolCache.get(serverId)?.length || 0,
        resources_count: this.resourceCache.get(serverId)?.length || 0,
      });
    }

    return result;
  }

  /**
   * Get tools grouped by category for agent context
   */
  getToolsForAgentContext(): Record<string, MCPTool[]> {
    const grouped: Record<string, MCPTool[]> = {};

    for (const [serverId, tools] of this.toolCache) {
      const config = this.servers.get(serverId);
      const category = config?.name || serverId;
      grouped[category] = tools;
    }

    return grouped;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async createConnection(config: MCPServerConfig): Promise<MCPConnection> {
    // In a real implementation, this would create the appropriate transport
    // For now, we return a mock connection that logs operations
    return new MockMCPConnection(config);
  }

  private async listToolsInternal(connection: MCPConnection): Promise<MCPTool[]> {
    return await connection.listTools();
  }

  private async listResourcesInternal(connection: MCPConnection): Promise<MCPResource[]> {
    return await connection.listResources();
  }
}

// ============================================================================
// MCP CONNECTION (Abstract)
// ============================================================================

interface MCPConnection {
  callTool(name: string, params: Record<string, unknown>): Promise<MCPToolCallResult>;
  listTools(): Promise<MCPTool[]>;
  readResource(uri: string): Promise<MCPResourceContent>;
  listResources(): Promise<MCPResource[]>;
  close(): Promise<void>;
}

// ============================================================================
// MOCK CONNECTION (For Development/Testing)
// ============================================================================

class MockMCPConnection implements MCPConnection {
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async callTool(name: string, params: Record<string, unknown>): Promise<MCPToolCallResult> {
    logger.info("Mock MCP tool call", {}, { tool: name, params });

    // Return mock successful result
    return {
      success: true,
      content: [{
        type: "text",
        text: JSON.stringify({
          mock: true,
          tool: name,
          params,
          timestamp: new Date().toISOString()
        })
      }]
    };
  }

  async listTools(): Promise<MCPTool[]> {
    // Return mock tools based on server type
    return this.getMockToolsForServer();
  }

  async readResource(uri: string): Promise<MCPResourceContent> {
    return {
      uri,
      mimeType: "text/plain",
      text: `Mock resource content for ${uri}`
    };
  }

  async listResources(): Promise<MCPResource[]> {
    return [];
  }

  async close(): Promise<void> {
    logger.info("Mock MCP connection closed", {}, { server_id: this.config.server_id });
  }

  private getMockToolsForServer(): MCPTool[] {
    // Return mock tools based on server ID patterns
    const serverId = this.config.server_id.toLowerCase();

    if (serverId.includes("crm") || serverId.includes("hubspot") || serverId.includes("salesforce")) {
      return [
        {
          name: "get_contact",
          description: "Get a contact by ID or email",
          inputSchema: {
            type: "object",
            properties: {
              contact_id: { type: "string" },
              email: { type: "string" }
            }
          }
        },
        {
          name: "update_contact",
          description: "Update a contact's properties",
          inputSchema: {
            type: "object",
            properties: {
              contact_id: { type: "string" },
              properties: { type: "object" }
            },
            required: ["contact_id", "properties"]
          }
        },
        {
          name: "create_deal",
          description: "Create a new deal/opportunity",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              stage: { type: "string" },
              amount: { type: "number" },
              contact_id: { type: "string" }
            },
            required: ["name", "stage"]
          }
        },
        {
          name: "list_pipeline_stages",
          description: "List all pipeline stages",
          inputSchema: { type: "object", properties: {} }
        }
      ];
    }

    if (serverId.includes("slack")) {
      return [
        {
          name: "send_message",
          description: "Send a message to a Slack channel",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string" },
              text: { type: "string" },
              thread_ts: { type: "string" }
            },
            required: ["channel", "text"]
          }
        },
        {
          name: "create_channel",
          description: "Create a new Slack channel",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              is_private: { type: "boolean" }
            },
            required: ["name"]
          }
        }
      ];
    }

    if (serverId.includes("email") || serverId.includes("gmail") || serverId.includes("sendgrid")) {
      return [
        {
          name: "send_email",
          description: "Send an email",
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string" },
              subject: { type: "string" },
              body: { type: "string" },
              html: { type: "boolean" }
            },
            required: ["to", "subject", "body"]
          }
        },
        {
          name: "get_inbox",
          description: "Get recent inbox messages",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number" },
              unread_only: { type: "boolean" }
            }
          }
        }
      ];
    }

    if (serverId.includes("calendar") || serverId.includes("google-calendar")) {
      return [
        {
          name: "create_event",
          description: "Create a calendar event",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              attendees: { type: "array", items: { type: "string" } }
            },
            required: ["title", "start", "end"]
          }
        },
        {
          name: "get_availability",
          description: "Check availability for a time range",
          inputSchema: {
            type: "object",
            properties: {
              start: { type: "string" },
              end: { type: "string" }
            },
            required: ["start", "end"]
          }
        }
      ];
    }

    if (serverId.includes("sms") || serverId.includes("twilio")) {
      return [
        {
          name: "send_sms",
          description: "Send an SMS message",
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string" },
              body: { type: "string" }
            },
            required: ["to", "body"]
          }
        }
      ];
    }

    if (serverId.includes("database") || serverId.includes("postgres") || serverId.includes("mysql")) {
      return [
        {
          name: "query",
          description: "Execute a read-only query",
          inputSchema: {
            type: "object",
            properties: {
              sql: { type: "string" }
            },
            required: ["sql"]
          }
        },
        {
          name: "insert",
          description: "Insert a record",
          inputSchema: {
            type: "object",
            properties: {
              table: { type: "string" },
              data: { type: "object" }
            },
            required: ["table", "data"]
          }
        }
      ];
    }

    // Default tools
    return [
      {
        name: "ping",
        description: "Check server connectivity",
        inputSchema: { type: "object", properties: {} }
      }
    ];
  }
}

// ============================================================================
// COMMON MCP SERVER PRESETS
// ============================================================================

export const MCP_SERVER_PRESETS: Record<string, Partial<MCPServerConfig>> = {
  hubspot: {
    name: "HubSpot CRM",
    description: "HubSpot CRM integration for contacts, deals, and pipeline management",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  salesforce: {
    name: "Salesforce",
    description: "Salesforce CRM integration",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  slack: {
    name: "Slack",
    description: "Slack messaging and channel management",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  gmail: {
    name: "Gmail",
    description: "Gmail email integration",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  google_calendar: {
    name: "Google Calendar",
    description: "Google Calendar scheduling and availability",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  twilio: {
    name: "Twilio",
    description: "SMS and voice communication via Twilio",
    capabilities: { tools: true, resources: false, prompts: false, sampling: false },
  },

  airtable: {
    name: "Airtable",
    description: "Airtable database operations",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  notion: {
    name: "Notion",
    description: "Notion workspace and database management",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  google_sheets: {
    name: "Google Sheets",
    description: "Google Sheets spreadsheet operations",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  filesystem: {
    name: "Filesystem",
    description: "Local filesystem operations",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },

  postgres: {
    name: "PostgreSQL",
    description: "PostgreSQL database operations",
    capabilities: { tools: true, resources: true, prompts: false, sampling: false },
  },
};

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const mcpClient = new MCPClient();

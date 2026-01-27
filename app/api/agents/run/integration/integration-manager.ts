/**
 * UptimizeAI Integration Manager
 *
 * V3 Core: Ties together agents, workflow engine, and MCP clients.
 *
 * This is the central nervous system that allows:
 * 1. Agents to execute workflows directly
 * 2. Workflows to call MCP tools
 * 3. Full audit trail across all operations
 *
 * Key Principle: If client has external tools (Make, Zapier, etc.) → we can integrate via MCP
 *                If client doesn't have tools → we execute natively via WorkflowEngine
 */

import { logger } from "../logger";
import { WorkflowEngine, WorkflowDefinition, WorkflowExecutionResult, AuditEvent } from "../automation/workflow-engine";
import { MCPClient, MCPServerConfig, MCPTool, MCP_SERVER_PRESETS } from "../mcp/mcp-client";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientCapabilities {
  client_id: string;
  client_name: string;

  // What external tools do they have?
  external_tools: {
    crm?: "hubspot" | "salesforce" | "pipedrive" | "close" | "none";
    email?: "gmail" | "outlook" | "sendgrid" | "none";
    calendar?: "google" | "outlook" | "calendly" | "none";
    communication?: "slack" | "teams" | "discord" | "none";
    sms?: "twilio" | "none";
    database?: "airtable" | "notion" | "sheets" | "postgres" | "none";
    automation?: "make" | "zapier" | "n8n" | "none";
  };

  // MCP server configurations for their tools
  mcp_servers?: MCPServerConfig[];

  // What workflows are deployed for this client?
  deployed_workflows: string[];

  // Integration mode
  integration_mode: "mcp_only" | "native_only" | "hybrid";
}

export interface IntegrationContext {
  client: ClientCapabilities;
  available_tools: MCPTool[];
  available_workflows: WorkflowDefinition[];
  audit_trail: AuditEvent[];
}

export interface AgentToolkit {
  // Tools the agent can use
  tools: Array<{
    name: string;
    description: string;
    source: "mcp" | "native" | "workflow";
    server_id?: string;
    workflow_id?: string;
  }>;

  // Execute a tool
  executeTool: (toolName: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;

  // Execute a workflow
  executeWorkflow: (workflowId: string, input: Record<string, unknown>) => Promise<WorkflowExecutionResult>;

  // Log audit event
  logAudit: (event: Omit<AuditEvent, "event_id" | "timestamp">) => void;
}

// ============================================================================
// INTEGRATION MANAGER
// ============================================================================

export class IntegrationManager {
  private workflowEngine: WorkflowEngine;
  private mcpClient: MCPClient;
  private clients: Map<string, ClientCapabilities> = new Map();
  private globalAuditTrail: AuditEvent[] = [];

  constructor() {
    this.mcpClient = new MCPClient();
    this.workflowEngine = new WorkflowEngine(this.mcpClient);
  }

  // ============================================================================
  // CLIENT MANAGEMENT
  // ============================================================================

  /**
   * Register a client and set up their integrations
   */
  async registerClient(capabilities: ClientCapabilities): Promise<boolean> {
    try {
      this.clients.set(capabilities.client_id, capabilities);

      // Set up MCP servers if provided
      if (capabilities.mcp_servers) {
        for (const server of capabilities.mcp_servers) {
          this.mcpClient.registerServer(server);
          await this.mcpClient.connect(server.server_id);
        }
      }

      // Auto-configure MCP servers based on external tools
      await this.autoConfigureMCPServers(capabilities);

      logger.info("Client registered", {}, {
        client_id: capabilities.client_id,
        integration_mode: capabilities.integration_mode,
        external_tools: capabilities.external_tools
      });

      this.logGlobalAudit({
        event_type: "client_registered",
        actor: "system",
        action: "register_client",
        details: { client_id: capabilities.client_id }
      });

      return true;
    } catch (error) {
      logger.error("Failed to register client", {}, {
        client_id: capabilities.client_id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Auto-configure MCP servers based on client's external tools
   */
  private async autoConfigureMCPServers(capabilities: ClientCapabilities): Promise<void> {
    const tools = capabilities.external_tools;

    // CRM
    if (tools.crm && tools.crm !== "none") {
      const preset = MCP_SERVER_PRESETS[tools.crm];
      if (preset) {
        const config: MCPServerConfig = {
          server_id: `${capabilities.client_id}_crm`,
          transport: "stdio",
          ...preset,
          name: preset.name || tools.crm,
          description: preset.description || `CRM integration for ${capabilities.client_name}`,
          capabilities: preset.capabilities || { tools: true, resources: true, prompts: false, sampling: false }
        };
        this.mcpClient.registerServer(config);
        await this.mcpClient.connect(config.server_id);
      }
    }

    // Email
    if (tools.email && tools.email !== "none") {
      const preset = MCP_SERVER_PRESETS[tools.email] || MCP_SERVER_PRESETS.gmail;
      if (preset) {
        const config: MCPServerConfig = {
          server_id: `${capabilities.client_id}_email`,
          transport: "stdio",
          ...preset,
          name: preset.name || tools.email,
          description: preset.description || `Email integration`,
          capabilities: preset.capabilities || { tools: true, resources: true, prompts: false, sampling: false }
        };
        this.mcpClient.registerServer(config);
        await this.mcpClient.connect(config.server_id);
      }
    }

    // Slack
    if (tools.communication === "slack") {
      const preset = MCP_SERVER_PRESETS.slack;
      if (preset) {
        const config: MCPServerConfig = {
          server_id: `${capabilities.client_id}_slack`,
          transport: "stdio",
          ...preset,
          name: preset.name || "Slack",
          description: preset.description || "Slack integration",
          capabilities: preset.capabilities || { tools: true, resources: true, prompts: false, sampling: false }
        };
        this.mcpClient.registerServer(config);
        await this.mcpClient.connect(config.server_id);
      }
    }

    // Calendar
    if (tools.calendar && tools.calendar !== "none") {
      const preset = MCP_SERVER_PRESETS.google_calendar;
      if (preset) {
        const config: MCPServerConfig = {
          server_id: `${capabilities.client_id}_calendar`,
          transport: "stdio",
          ...preset,
          name: preset.name || "Calendar",
          description: preset.description || "Calendar integration",
          capabilities: preset.capabilities || { tools: true, resources: true, prompts: false, sampling: false }
        };
        this.mcpClient.registerServer(config);
        await this.mcpClient.connect(config.server_id);
      }
    }

    // SMS
    if (tools.sms === "twilio") {
      const preset = MCP_SERVER_PRESETS.twilio;
      if (preset) {
        const config: MCPServerConfig = {
          server_id: `${capabilities.client_id}_sms`,
          transport: "stdio",
          ...preset,
          name: preset.name || "Twilio",
          description: preset.description || "SMS integration",
          capabilities: preset.capabilities || { tools: true, resources: false, prompts: false, sampling: false }
        };
        this.mcpClient.registerServer(config);
        await this.mcpClient.connect(config.server_id);
      }
    }
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  /**
   * Deploy a workflow for a client
   */
  deployWorkflow(clientId: string, workflow: WorkflowDefinition): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.error("Client not found", {}, { client_id: clientId });
      return false;
    }

    this.workflowEngine.registerWorkflow(workflow);
    client.deployed_workflows.push(workflow.workflow_id);

    this.logGlobalAudit({
      event_type: "workflow_deployed",
      actor: "system",
      action: "deploy_workflow",
      details: {
        client_id: clientId,
        workflow_id: workflow.workflow_id,
        workflow_name: workflow.workflow_name
      }
    });

    logger.info("Workflow deployed", {}, {
      client_id: clientId,
      workflow_id: workflow.workflow_id
    });

    return true;
  }

  /**
   * Execute a workflow for a client
   */
  async executeWorkflow(
    clientId: string,
    workflowId: string,
    input: Record<string, unknown>
  ): Promise<WorkflowExecutionResult> {
    const client = this.clients.get(clientId);
    if (!client) {
      return {
        success: false,
        execution_id: "error",
        workflow_id: workflowId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: 0,
        error: {
          step_id: "init",
          error_type: "CLIENT_NOT_FOUND",
          message: `Client ${clientId} not found`,
          recoverable: false
        },
        audit_trail: [],
        exceptions_handled: []
      };
    }

    return await this.workflowEngine.executeWorkflow(workflowId, input, {
      actor: `client:${clientId}`
    });
  }

  // ============================================================================
  // AGENT TOOLKIT
  // ============================================================================

  /**
   * Create a toolkit for an agent to use during execution
   */
  createAgentToolkit(clientId: string): AgentToolkit {
    const client = this.clients.get(clientId);
    const tools: AgentToolkit["tools"] = [];
    const auditTrail: AuditEvent[] = [];

    // Add MCP tools
    const connectedServers = this.mcpClient.getConnectedServers();
    for (const server of connectedServers) {
      if (server.server_id.startsWith(`${clientId}_`)) {
        const serverTools = this.mcpClient.getToolsForAgentContext()[server.name] || [];
        for (const tool of serverTools) {
          tools.push({
            name: `${server.server_id}.${tool.name}`,
            description: tool.description,
            source: "mcp",
            server_id: server.server_id
          });
        }
      }
    }

    // Add deployed workflows as tools
    if (client) {
      for (const workflowId of client.deployed_workflows) {
        const workflows = this.workflowEngine.getRegisteredWorkflows();
        const workflow = workflows.find(w => w.workflow_id === workflowId);
        if (workflow) {
          tools.push({
            name: `workflow.${workflowId}`,
            description: workflow.description,
            source: "workflow",
            workflow_id: workflowId
          });
        }
      }
    }

    // Add native tools
    tools.push(
      { name: "native.log_audit", description: "Log an audit event", source: "native" },
      { name: "native.send_notification", description: "Send a human notification", source: "native" },
      { name: "native.schedule_task", description: "Schedule a task for later", source: "native" }
    );

    const self = this;

    return {
      tools,

      async executeTool(toolName: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
        const [prefix, ...rest] = toolName.split(".");
        const actualToolName = rest.join(".");

        self.logGlobalAudit({
          event_type: "tool_executed",
          actor: `agent:${clientId}`,
          action: toolName,
          details: { params }
        });

        if (prefix === "workflow") {
          const result = await self.executeWorkflow(clientId, actualToolName, params);
          return { workflow_result: result };
        }

        if (prefix === "native") {
          // Handle native tools
          switch (actualToolName) {
            case "log_audit":
              self.logGlobalAudit({
                event_type: params.event_type as string || "custom",
                actor: `agent:${clientId}`,
                action: params.action as string || "log",
                details: params.details as Record<string, unknown> || {}
              });
              return { logged: true };

            case "send_notification":
              logger.info("Notification sent", {}, { to: params.to, message: params.message });
              return { sent: true };

            case "schedule_task":
              logger.info("Task scheduled", {}, { task: params.task, delay: params.delay_ms });
              return { scheduled: true };

            default:
              return { error: "Unknown native tool" };
          }
        }

        // MCP tool
        const tool = tools.find(t => t.name === toolName);
        if (tool && tool.source === "mcp" && tool.server_id) {
          return await self.mcpClient.callTool(tool.server_id, actualToolName, params);
        }

        return { error: `Tool ${toolName} not found` };
      },

      async executeWorkflow(workflowId: string, input: Record<string, unknown>): Promise<WorkflowExecutionResult> {
        return await self.executeWorkflow(clientId, workflowId, input);
      },

      logAudit(event: Omit<AuditEvent, "event_id" | "timestamp">): void {
        const fullEvent: AuditEvent = {
          event_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          ...event
        };
        auditTrail.push(fullEvent);
        self.globalAuditTrail.push(fullEvent);
      }
    };
  }

  // ============================================================================
  // INTEGRATION CONTEXT FOR AGENTS
  // ============================================================================

  /**
   * Get full integration context for agent decision-making
   */
  getIntegrationContext(clientId: string): IntegrationContext | null {
    const client = this.clients.get(clientId);
    if (!client) return null;

    // Gather available tools from MCP
    const connectedServers = this.mcpClient.getConnectedServers();
    const availableTools: MCPTool[] = [];
    for (const server of connectedServers) {
      if (server.server_id.startsWith(`${clientId}_`)) {
        const tools = this.mcpClient.getToolsForAgentContext()[server.name] || [];
        availableTools.push(...tools);
      }
    }

    // Gather deployed workflows
    const allWorkflows = this.workflowEngine.getRegisteredWorkflows();
    const availableWorkflows = allWorkflows.filter(w =>
      client.deployed_workflows.includes(w.workflow_id)
    );

    return {
      client,
      available_tools: availableTools,
      available_workflows: availableWorkflows,
      audit_trail: this.globalAuditTrail.filter(e =>
        e.actor.includes(clientId)
      )
    };
  }

  // ============================================================================
  // AUDIT
  // ============================================================================

  private logGlobalAudit(event: Omit<AuditEvent, "event_id" | "timestamp">): void {
    const fullEvent: AuditEvent = {
      event_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.globalAuditTrail.push(fullEvent);
  }

  /**
   * Get audit trail for a client
   */
  getAuditTrail(clientId?: string): AuditEvent[] {
    if (!clientId) return this.globalAuditTrail;
    return this.globalAuditTrail.filter(e => e.actor.includes(clientId));
  }

  // ============================================================================
  // DIAGNOSTICS
  // ============================================================================

  /**
   * Get system status
   */
  getSystemStatus(): {
    registered_clients: number;
    connected_mcp_servers: number;
    registered_workflows: number;
    total_audit_events: number;
  } {
    return {
      registered_clients: this.clients.size,
      connected_mcp_servers: this.mcpClient.getConnectedServers().length,
      registered_workflows: this.workflowEngine.getRegisteredWorkflows().length,
      total_audit_events: this.globalAuditTrail.length
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const integrationManager = new IntegrationManager();

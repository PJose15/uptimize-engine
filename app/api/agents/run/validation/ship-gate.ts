/**
 * UptimizeAI Ship Gate System
 *
 * The Ship Gate is the final approval checkpoint before an agent goes to production.
 * It combines checklist validation with business and ops readiness verification.
 */

import ChecklistValidator, {
  AgentChecklist,
  ValidationReport,
  ChecklistItemStatus,
  Blocker,
  AgentType,
} from './checklist-validator';

// ============================================================================
// TYPES
// ============================================================================

export type ShipGateStatus =
  | 'not_ready' // Hasn't passed validation
  | 'ready_for_review' // Passed validation, awaiting approval
  | 'approved' // Approved by reviewer
  | 'shipped' // Deployed to production
  | 'blocked' // Has blockers preventing shipment
  | 'rolled_back'; // Was shipped but rolled back

export interface ShipGateDecision {
  decision: 'approve' | 'reject' | 'request_changes';
  reviewer: string;
  timestamp: string;
  comments?: string;
  required_changes?: string[];
}

export interface ShipGateResult {
  agent_id: string;
  agent_name: string;
  status: ShipGateStatus;
  validation_report: ValidationReport;
  can_ship: boolean;
  blocking_issues: string[];
  warnings: string[];
  decisions: ShipGateDecision[];
  readiness_summary: {
    build: { ready: boolean; score: number };
    business: { ready: boolean; score: number };
    ops_spine: { ready: boolean; score: number };
  };
  ship_date?: string;
  release_version?: string;
}

export interface ShipGateConfig {
  require_all_core_standards: boolean;
  require_all_role_standards: boolean;
  allow_warnings: boolean;
  max_allowed_warnings: number;
  require_qa_results: boolean;
  require_pricing_approval: boolean;
  require_capacity_approval: boolean;
  minimum_score: number; // 0-100
}

// Default configuration
export const DEFAULT_SHIP_GATE_CONFIG: ShipGateConfig = {
  require_all_core_standards: true,
  require_all_role_standards: true,
  allow_warnings: true,
  max_allowed_warnings: 5,
  require_qa_results: true,
  require_pricing_approval: true,
  require_capacity_approval: true,
  minimum_score: 80,
};

// ============================================================================
// SHIP GATE CLASS
// ============================================================================

export class ShipGate {
  private checklist: AgentChecklist;
  private config: ShipGateConfig;
  private decisions: ShipGateDecision[] = [];

  constructor(checklist: AgentChecklist, config?: Partial<ShipGateConfig>) {
    this.checklist = checklist;
    this.config = { ...DEFAULT_SHIP_GATE_CONFIG, ...config };
  }

  /**
   * Run the ship gate evaluation
   */
  evaluate(): ShipGateResult {
    // First, run the checklist validation
    const validator = new ChecklistValidator(this.checklist);
    const validationReport = validator.validate();

    // Evaluate each readiness area
    const buildReadiness = this.evaluateBuildReadiness(validationReport);
    const businessReadiness = this.evaluateBusinessReadiness();
    const opsSpineReadiness = this.evaluateOpsSpineReadiness();

    // Collect blocking issues and warnings
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // Check core standards
    if (this.config.require_all_core_standards && !validationReport.core_standards_passed) {
      blockingIssues.push('Core standards not met');
    }

    // Check role standards
    if (this.config.require_all_role_standards && !validationReport.role_standards_passed) {
      blockingIssues.push('Role standards not met');
    }

    // Check minimum score
    if (validationReport.overall_score < this.config.minimum_score) {
      blockingIssues.push(
        `Overall score ${validationReport.overall_score}% is below minimum ${this.config.minimum_score}%`
      );
    }

    // Check QA results
    if (this.config.require_qa_results) {
      const qaResults = this.checklist.ship_gate.build_readiness.qa_results;
      if (!qaResults) {
        blockingIssues.push('QA results not recorded');
      } else {
        if (!qaResults.happy_path_passed) {
          blockingIssues.push('Happy path QA not passed');
        }
        if (!qaResults.exception_paths_passed) {
          blockingIssues.push('Exception paths QA not passed');
        }
        if (!qaResults.tool_failures_passed) {
          blockingIssues.push('Tool failure QA not passed');
        }
      }
    }

    // Check pricing approval
    if (
      this.config.require_pricing_approval &&
      !this.checklist.ship_gate.business_readiness.pricing_approved
    ) {
      blockingIssues.push('Pricing not approved');
    }

    // Check capacity approval
    if (
      this.config.require_capacity_approval &&
      !this.checklist.ship_gate.business_readiness.capacity_approved
    ) {
      warnings.push('Capacity not approved - may impact delivery timeline');
    }

    // Check for blockers
    if (this.checklist.blockers && this.checklist.blockers.length > 0) {
      const unresolvedBlockers = this.checklist.blockers.filter(b => !b.resolved_at);
      if (unresolvedBlockers.length > 0) {
        blockingIssues.push(
          `${unresolvedBlockers.length} unresolved blockers: ${unresolvedBlockers
            .map(b => b.ticket_id)
            .join(', ')}`
        );
      }
    }

    // Check warnings count
    const totalWarnings = validationReport.category_results.reduce(
      (count, cat) => count + cat.issues.filter(i => i.severity === 'warning').length,
      0
    );
    if (totalWarnings > this.config.max_allowed_warnings) {
      warnings.push(
        `${totalWarnings} warnings exceed maximum allowed (${this.config.max_allowed_warnings})`
      );
    }

    // Determine overall status
    let status: ShipGateStatus;
    if (blockingIssues.length > 0) {
      status = 'blocked';
    } else if (this.checklist.ship_gate.final_approval?.approved) {
      status = this.checklist.status === 'shipped' ? 'shipped' : 'approved';
    } else {
      status = 'ready_for_review';
    }

    const canShip = blockingIssues.length === 0 && validationReport.is_ship_ready;

    return {
      agent_id: this.checklist.agent_id,
      agent_name: this.checklist.agent_name,
      status,
      validation_report: validationReport,
      can_ship: canShip,
      blocking_issues: blockingIssues,
      warnings,
      decisions: this.decisions,
      readiness_summary: {
        build: buildReadiness,
        business: businessReadiness,
        ops_spine: opsSpineReadiness,
      },
      ship_date: this.checklist.ship_gate.final_approval?.ship_date,
      release_version: this.checklist.checklist_version,
    };
  }

  /**
   * Record an approval decision
   */
  recordDecision(decision: ShipGateDecision): void {
    this.decisions.push(decision);
  }

  /**
   * Approve the agent for shipping
   */
  approve(reviewer: string, comments?: string): ShipGateResult {
    this.recordDecision({
      decision: 'approve',
      reviewer,
      timestamp: new Date().toISOString(),
      comments,
    });

    // Update checklist
    this.checklist.ship_gate.final_approval = {
      approved: true,
      approved_by: reviewer,
      approved_at: new Date().toISOString(),
    };
    this.checklist.status = 'approved';

    return this.evaluate();
  }

  /**
   * Reject the agent with required changes
   */
  reject(reviewer: string, requiredChanges: string[], comments?: string): ShipGateResult {
    this.recordDecision({
      decision: 'reject',
      reviewer,
      timestamp: new Date().toISOString(),
      comments,
      required_changes: requiredChanges,
    });

    return this.evaluate();
  }

  /**
   * Request changes before approval
   */
  requestChanges(reviewer: string, requiredChanges: string[], comments?: string): ShipGateResult {
    this.recordDecision({
      decision: 'request_changes',
      reviewer,
      timestamp: new Date().toISOString(),
      comments,
      required_changes: requiredChanges,
    });

    return this.evaluate();
  }

  // ============================================================================
  // PRIVATE EVALUATION METHODS
  // ============================================================================

  private evaluateBuildReadiness(
    validationReport: ValidationReport
  ): { ready: boolean; score: number } {
    const buildItems = this.checklist.ship_gate.build_readiness.items;
    const passedItems = buildItems.filter(
      i => i.status === 'passed' || i.status === 'not_applicable'
    ).length;
    const score = Math.round((passedItems / buildItems.length) * 100);

    const qaReady = this.checklist.ship_gate.build_readiness.qa_results
      ? this.checklist.ship_gate.build_readiness.qa_results.happy_path_passed &&
        this.checklist.ship_gate.build_readiness.qa_results.exception_paths_passed &&
        this.checklist.ship_gate.build_readiness.qa_results.tool_failures_passed
      : false;

    return {
      ready: score === 100 && qaReady && validationReport.core_standards_passed,
      score,
    };
  }

  private evaluateBusinessReadiness(): { ready: boolean; score: number } {
    const bizItems = this.checklist.ship_gate.business_readiness.items;
    const passedItems = bizItems.filter(
      i => i.status === 'passed' || i.status === 'not_applicable'
    ).length;
    const score = Math.round((passedItems / bizItems.length) * 100);

    const biz = this.checklist.ship_gate.business_readiness;
    const hasProofAngle = !!biz.proof_angle;
    const hasPricing = biz.pricing_approved || false;

    return {
      ready: score === 100 && hasProofAngle && hasPricing,
      score,
    };
  }

  private evaluateOpsSpineReadiness(): { ready: boolean; score: number } {
    const opsItems = this.checklist.ship_gate.ops_spine_readiness.items;
    const passedItems = opsItems.filter(
      i => i.status === 'passed' || i.status === 'not_applicable'
    ).length;
    const score = Math.round((passedItems / opsItems.length) * 100);

    const ops = this.checklist.ship_gate.ops_spine_readiness;
    const linksVerified = ops.entity_links_verified || false;
    const ticketsDefined = ops.ticket_process_defined || false;

    return {
      ready: score === 100 && linksVerified && ticketsDefined,
      score,
    };
  }
}

// ============================================================================
// SHIP GATE REGISTRY
// ============================================================================

/**
 * Central registry for tracking ship gate status across all agents
 */
export interface ShipGateRegistry {
  agents: Record<string, ShipGateResult>;
  last_updated: string;
}

export function createShipGateRegistry(): ShipGateRegistry {
  return {
    agents: {},
    last_updated: new Date().toISOString(),
  };
}

export function updateRegistry(
  registry: ShipGateRegistry,
  result: ShipGateResult
): ShipGateRegistry {
  return {
    agents: {
      ...registry.agents,
      [result.agent_id]: result,
    },
    last_updated: new Date().toISOString(),
  };
}

/**
 * Get a summary of all agents' ship readiness
 */
export function getRegistrySummary(registry: ShipGateRegistry): {
  total_agents: number;
  ready_to_ship: number;
  shipped: number;
  blocked: number;
  in_review: number;
  agents_by_status: Record<ShipGateStatus, string[]>;
} {
  const results = Object.values(registry.agents);
  const agentsByStatus: Record<ShipGateStatus, string[]> = {
    not_ready: [],
    ready_for_review: [],
    approved: [],
    shipped: [],
    blocked: [],
    rolled_back: [],
  };

  results.forEach(r => {
    agentsByStatus[r.status].push(r.agent_id);
  });

  return {
    total_agents: results.length,
    ready_to_ship: results.filter(r => r.can_ship).length,
    shipped: agentsByStatus.shipped.length,
    blocked: agentsByStatus.blocked.length,
    in_review: agentsByStatus.ready_for_review.length,
    agents_by_status: agentsByStatus,
  };
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format ship gate result as markdown
 */
export function formatShipGateResultAsMarkdown(result: ShipGateResult): string {
  const lines: string[] = [];
  const statusEmoji: Record<ShipGateStatus, string> = {
    not_ready: '⏸️',
    ready_for_review: '🔍',
    approved: '✅',
    shipped: '🚀',
    blocked: '🚫',
    rolled_back: '⬅️',
  };

  lines.push(`# Ship Gate Report: ${result.agent_name}`);
  lines.push('');
  lines.push(`**Agent ID:** ${result.agent_id}`);
  lines.push(`**Status:** ${statusEmoji[result.status]} ${result.status.toUpperCase()}`);
  lines.push(`**Can Ship:** ${result.can_ship ? '✅ YES' : '❌ NO'}`);
  lines.push(`**Overall Score:** ${result.validation_report.overall_score}%`);
  lines.push('');

  lines.push('## Readiness Summary');
  lines.push('');
  lines.push('| Area | Ready | Score |');
  lines.push('|------|-------|-------|');
  lines.push(
    `| Build | ${result.readiness_summary.build.ready ? '✅' : '❌'} | ${result.readiness_summary.build.score}% |`
  );
  lines.push(
    `| Business | ${result.readiness_summary.business.ready ? '✅' : '❌'} | ${result.readiness_summary.business.score}% |`
  );
  lines.push(
    `| Ops Spine | ${result.readiness_summary.ops_spine.ready ? '✅' : '❌'} | ${result.readiness_summary.ops_spine.score}% |`
  );
  lines.push('');

  if (result.blocking_issues.length > 0) {
    lines.push('## 🚫 Blocking Issues');
    lines.push('');
    result.blocking_issues.forEach(issue => {
      lines.push(`- ${issue}`);
    });
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('## ⚠️ Warnings');
    lines.push('');
    result.warnings.forEach(warning => {
      lines.push(`- ${warning}`);
    });
    lines.push('');
  }

  if (result.decisions.length > 0) {
    lines.push('## Decision History');
    lines.push('');
    result.decisions.forEach(decision => {
      const emoji =
        decision.decision === 'approve' ? '✅' : decision.decision === 'reject' ? '❌' : '📝';
      lines.push(`### ${emoji} ${decision.decision.toUpperCase()}`);
      lines.push(`- **Reviewer:** ${decision.reviewer}`);
      lines.push(`- **Time:** ${decision.timestamp}`);
      if (decision.comments) {
        lines.push(`- **Comments:** ${decision.comments}`);
      }
      if (decision.required_changes && decision.required_changes.length > 0) {
        lines.push('- **Required Changes:**');
        decision.required_changes.forEach(change => {
          lines.push(`  - ${change}`);
        });
      }
      lines.push('');
    });
  }

  lines.push('## Recommendations');
  lines.push('');
  result.validation_report.recommendations.forEach(rec => {
    lines.push(`- ${rec}`);
  });

  return lines.join('\n');
}

/**
 * Format registry summary as markdown
 */
export function formatRegistrySummaryAsMarkdown(
  registry: ShipGateRegistry
): string {
  const summary = getRegistrySummary(registry);
  const lines: string[] = [];

  lines.push('# Agent Ship Gate Registry');
  lines.push('');
  lines.push(`**Last Updated:** ${registry.last_updated}`);
  lines.push('');

  lines.push('## Overview');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total Agents | ${summary.total_agents} |`);
  lines.push(`| Ready to Ship | ${summary.ready_to_ship} |`);
  lines.push(`| Shipped | ${summary.shipped} |`);
  lines.push(`| Blocked | ${summary.blocked} |`);
  lines.push(`| In Review | ${summary.in_review} |`);
  lines.push('');

  lines.push('## Agents by Status');
  lines.push('');

  const statusEmoji: Record<ShipGateStatus, string> = {
    not_ready: '⏸️',
    ready_for_review: '🔍',
    approved: '✅',
    shipped: '🚀',
    blocked: '🚫',
    rolled_back: '⬅️',
  };

  Object.entries(summary.agents_by_status).forEach(([status, agents]) => {
    if (agents.length > 0) {
      lines.push(`### ${statusEmoji[status as ShipGateStatus]} ${status}`);
      agents.forEach(agent => {
        lines.push(`- ${agent}`);
      });
      lines.push('');
    }
  });

  return lines.join('\n');
}

export default ShipGate;

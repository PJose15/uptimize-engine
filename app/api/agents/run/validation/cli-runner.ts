/**
 * UptimizeAI Checklist CLI Runner
 *
 * Utility functions for running checklist validation from CLI or automation.
 * Can be used in CI/CD pipelines, pre-commit hooks, or manual validation.
 */

import * as fs from 'fs';
import * as path from 'path';
import ChecklistValidator, {
  AgentChecklist,
  ValidationReport,
  formatReportAsMarkdown,
  AgentType,
} from './checklist-validator';
import ShipGate, {
  ShipGateResult,
  ShipGateRegistry,
  createShipGateRegistry,
  updateRegistry,
  getRegistrySummary,
  formatShipGateResultAsMarkdown,
  formatRegistrySummaryAsMarkdown,
} from './ship-gate';

// ============================================================================
// TYPES
// ============================================================================

export interface CLIOptions {
  checklistsDir: string;
  outputDir?: string;
  format: 'json' | 'markdown' | 'both';
  verbose: boolean;
  failOnBlocked: boolean;
  agents?: string[]; // Specific agents to validate, or all if empty
}

export interface FullReport {
  generated_at: string;
  checklists_dir: string;
  total_agents: number;
  summary: {
    ship_ready: number;
    blocked: number;
    draft: number;
    in_review: number;
  };
  agents: Array<{
    agent_id: string;
    agent_name: string;
    status: string;
    score: number;
    can_ship: boolean;
    blocking_issues: string[];
    warnings: string[];
  }>;
  registry: ShipGateRegistry;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Load a checklist from a JSON file
 */
export function loadChecklist(filePath: string): AgentChecklist {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as AgentChecklist;
}

/**
 * Load all checklists from a directory
 */
export function loadAllChecklists(dir: string): AgentChecklist[] {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => loadChecklist(path.join(dir, f)));
}

/**
 * Run validation on a single checklist
 */
export function runChecklistValidation(checklist: AgentChecklist): ValidationReport {
  const validator = new ChecklistValidator(checklist);
  return validator.validate();
}

/**
 * Run ship gate evaluation on a single checklist
 */
export function runShipGateEvaluation(checklist: AgentChecklist): ShipGateResult {
  const shipGate = new ShipGate(checklist);
  return shipGate.evaluate();
}

/**
 * Generate a full report for all agents
 */
export function generateFullReport(options: CLIOptions): FullReport {
  const checklists = loadAllChecklists(options.checklistsDir);

  // Filter to specific agents if requested
  const filteredChecklists = options.agents?.length
    ? checklists.filter(c => options.agents!.includes(c.agent_id))
    : checklists;

  let registry = createShipGateRegistry();
  const agentResults: FullReport['agents'] = [];

  for (const checklist of filteredChecklists) {
    const result = runShipGateEvaluation(checklist);
    registry = updateRegistry(registry, result);

    agentResults.push({
      agent_id: result.agent_id,
      agent_name: result.agent_name,
      status: result.status,
      score: result.validation_report.overall_score,
      can_ship: result.can_ship,
      blocking_issues: result.blocking_issues,
      warnings: result.warnings,
    });

    if (options.verbose) {
      console.log(`Validated: ${result.agent_id} - ${result.status} (${result.validation_report.overall_score}%)`);
    }
  }

  const summary = getRegistrySummary(registry);

  return {
    generated_at: new Date().toISOString(),
    checklists_dir: options.checklistsDir,
    total_agents: filteredChecklists.length,
    summary: {
      ship_ready: summary.ready_to_ship,
      blocked: summary.blocked,
      draft: summary.agents_by_status.not_ready.length,
      in_review: summary.in_review,
    },
    agents: agentResults,
    registry,
  };
}

/**
 * Write report to files
 */
export function writeReport(report: FullReport, options: CLIOptions): void {
  const outputDir = options.outputDir || options.checklistsDir;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (options.format === 'json' || options.format === 'both') {
    const jsonPath = path.join(outputDir, 'validation-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`JSON report written to: ${jsonPath}`);
  }

  if (options.format === 'markdown' || options.format === 'both') {
    const mdContent = formatFullReportAsMarkdown(report);
    const mdPath = path.join(outputDir, 'validation-report.md');
    fs.writeFileSync(mdPath, mdContent);
    console.log(`Markdown report written to: ${mdPath}`);
  }
}

/**
 * Format full report as markdown
 */
export function formatFullReportAsMarkdown(report: FullReport): string {
  const lines: string[] = [];

  lines.push('# UptimizeAI Agent Validation Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generated_at}`);
  lines.push(`**Checklists Directory:** ${report.checklists_dir}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total Agents | ${report.total_agents} |`);
  lines.push(`| Ship Ready | ${report.summary.ship_ready} |`);
  lines.push(`| Blocked | ${report.summary.blocked} |`);
  lines.push(`| In Review | ${report.summary.in_review} |`);
  lines.push(`| Draft | ${report.summary.draft} |`);
  lines.push('');

  lines.push('## Agent Status');
  lines.push('');
  lines.push('| Agent | Status | Score | Can Ship | Issues |');
  lines.push('|-------|--------|-------|----------|--------|');

  for (const agent of report.agents) {
    const statusEmoji =
      agent.status === 'shipped'
        ? '🚀'
        : agent.status === 'approved'
          ? '✅'
          : agent.status === 'ready_for_review'
            ? '🔍'
            : agent.status === 'blocked'
              ? '🚫'
              : '⏸️';

    const canShipEmoji = agent.can_ship ? '✅' : '❌';
    const issueCount = agent.blocking_issues.length + agent.warnings.length;

    lines.push(
      `| ${agent.agent_name} | ${statusEmoji} ${agent.status} | ${agent.score}% | ${canShipEmoji} | ${issueCount} |`
    );
  }
  lines.push('');

  // Detailed issues section
  const agentsWithIssues = report.agents.filter(
    a => a.blocking_issues.length > 0 || a.warnings.length > 0
  );

  if (agentsWithIssues.length > 0) {
    lines.push('## Issues by Agent');
    lines.push('');

    for (const agent of agentsWithIssues) {
      lines.push(`### ${agent.agent_name}`);
      lines.push('');

      if (agent.blocking_issues.length > 0) {
        lines.push('**Blocking Issues:**');
        agent.blocking_issues.forEach(issue => {
          lines.push(`- 🚫 ${issue}`);
        });
        lines.push('');
      }

      if (agent.warnings.length > 0) {
        lines.push('**Warnings:**');
        agent.warnings.forEach(warning => {
          lines.push(`- ⚠️ ${warning}`);
        });
        lines.push('');
      }
    }
  }

  // Ship-ready agents
  const shipReady = report.agents.filter(a => a.can_ship);
  if (shipReady.length > 0) {
    lines.push('## Ship-Ready Agents');
    lines.push('');
    lines.push('The following agents have passed all requirements and are ready to ship:');
    lines.push('');
    shipReady.forEach(agent => {
      lines.push(`- ✅ **${agent.agent_name}** (${agent.score}%)`);
    });
    lines.push('');
  }

  // Blocked agents
  const blocked = report.agents.filter(a => a.status === 'blocked');
  if (blocked.length > 0) {
    lines.push('## Blocked Agents');
    lines.push('');
    lines.push('The following agents have blocking issues that must be resolved:');
    lines.push('');
    blocked.forEach(agent => {
      lines.push(`- 🚫 **${agent.agent_name}**`);
      agent.blocking_issues.forEach(issue => {
        lines.push(`  - ${issue}`);
      });
    });
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

/**
 * Main CLI function
 * Can be called from a script or directly
 */
export async function main(args: string[]): Promise<number> {
  const options: CLIOptions = {
    checklistsDir: './shared/checklists',
    format: 'both',
    verbose: true,
    failOnBlocked: false,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dir' || arg === '-d') {
      options.checklistsDir = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i] as 'json' | 'markdown' | 'both';
    } else if (arg === '--quiet' || arg === '-q') {
      options.verbose = false;
    } else if (arg === '--fail-on-blocked') {
      options.failOnBlocked = true;
    } else if (arg === '--agents' || arg === '-a') {
      options.agents = args[++i].split(',');
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      return 0;
    }
  }

  console.log('🔍 UptimizeAI Agent Checklist Validator');
  console.log('');

  try {
    const report = generateFullReport(options);
    writeReport(report, options);

    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total Agents: ${report.total_agents}`);
    console.log(`   Ship Ready:   ${report.summary.ship_ready}`);
    console.log(`   Blocked:      ${report.summary.blocked}`);
    console.log(`   In Review:    ${report.summary.in_review}`);
    console.log(`   Draft:        ${report.summary.draft}`);

    if (options.failOnBlocked && report.summary.blocked > 0) {
      console.log('');
      console.log('❌ Validation failed: blocked agents found');
      return 1;
    }

    console.log('');
    console.log('✅ Validation complete');
    return 0;
  } catch (error) {
    console.error('❌ Error during validation:', error);
    return 1;
  }
}

function printHelp(): void {
  console.log(`
UptimizeAI Agent Checklist Validator

Usage: npx ts-node cli-runner.ts [options]

Options:
  -d, --dir <path>       Checklists directory (default: ./shared/checklists)
  -o, --output <path>    Output directory for reports (default: same as checklists)
  -f, --format <format>  Output format: json, markdown, or both (default: both)
  -q, --quiet            Suppress verbose output
  -a, --agents <list>    Comma-separated list of agent IDs to validate
  --fail-on-blocked      Exit with code 1 if any agents are blocked
  -h, --help             Show this help message

Examples:
  npx ts-node cli-runner.ts
  npx ts-node cli-runner.ts --dir ./checklists --format markdown
  npx ts-node cli-runner.ts --agents agent-1-market-intelligence,agent-2-outbound-appointment
  npx ts-node cli-runner.ts --fail-on-blocked  # For CI/CD pipelines
`);
}

// Run if called directly
if (require.main === module) {
  main(process.argv.slice(2)).then(process.exit);
}

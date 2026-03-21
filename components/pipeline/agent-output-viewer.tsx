'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';

interface AgentOutputViewerProps {
  agentId: number;
  output: unknown;
  isOpen: boolean;
  onToggle: () => void;
}

function Agent1Summary({ output }: { output: Record<string, unknown> }) {
  const primary = Array.isArray(output.target_pack_primary) ? output.target_pack_primary : [];
  const secondary = Array.isArray(output.target_pack_secondary) ? output.target_pack_secondary : [];
  const angle = output.angle_of_the_day as Record<string, string> | undefined;
  const shadow = output.shadow_ops_insights as Record<string, unknown> | undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Primary prospects:</span>
        <span className="font-medium">{primary.length}</span>
        <span className="text-zinc-500 dark:text-zinc-400">Secondary:</span>
        <span className="font-medium">{secondary.length}</span>
      </div>
      {angle?.primary_angle && (
        <div className="text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Angle of the Day: </span>
          <span className="font-medium">{angle.primary_angle}</span>
        </div>
      )}
      {shadow && Array.isArray(shadow.top_signals_found) && shadow.top_signals_found.length > 0 && (
        <div className="text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Shadow Ops Signals: </span>
          <span className="font-medium">{(shadow.top_signals_found as string[]).slice(0, 3).join(', ')}</span>
        </div>
      )}
    </div>
  );
}

export function AgentOutputViewer({ agentId, output, isOpen, onToggle }: AgentOutputViewerProps) {
  if (!output) return null;

  return (
    <div className="mt-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        View Output
      </button>

      {isOpen && (
        <div className="mt-2 font-mono text-xs bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 max-h-96 overflow-auto">
          {agentId === 1 && typeof output === 'object' && output !== null ? (
            <Agent1Summary output={output as Record<string, unknown>} />
          ) : (
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(output, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

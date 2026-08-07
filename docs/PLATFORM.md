# UPTIMAIZE Platform

The command center — the branded product surface at `/command-center` and its
sibling pages. The pipeline engine console still lives at `/engine`.

## Layout

| Path | What it is |
| --- | --- |
| `app/(platform)/` | Every platform page. Server components; the shell is the only client boundary. |
| `components/platform/` | Shell (sidebar, topbar), panels, charts, and UI atoms. |
| `lib/platform/types.ts` | The data contract every panel reads from. |
| `lib/platform/data.ts` | The configured snapshot — the default source. |
| `lib/platform/live.ts` | Pure builders that turn database rows into those types. |
| `lib/platform/source.ts` | Chooses the source, merges, caches per request. |
| `lib/platform/scope.ts` | Narrows a payload to the partner/search scope on the URL. |

## Scope

The topbar's partner picker and search box write to the URL, and every page runs
its payload through `scopeData()` on the server:

- `?partner=<clientId>` — narrows leaks, approvals, workflows, shadow ops,
  activity and alerts to that partner, recomputes the money KPIs from the
  partner record, and apportions portfolio totals (trend, ROI, workflow runs,
  savings breakdown) by its share of the book.
- `?q=<text>` — case-insensitive match across the visible fields of every list.
- The two compose. `?leak=<id>` additionally opens the investigation drawer.

`GET /api/platform` accepts the same parameters and returns the payload.

## Data sources

Default is the snapshot in `data.ts`. Set `UPTIMAIZE_LIVE_DATA=1` to read from
the database instead; sections without a source stay on the snapshot and are
reported as `demo`, which renders a "Demo data" chip in the UI.

| Section | Source | Notes |
| --- | --- | --- |
| Agents | `SubAgentRun` | Grouped by `parentAgentId`. Tasks = runs in the trailing 24h, performance = share completed, approvals = escalations, sparkline = daily run counts. |
| Activity | `ActivityEvent` | Newest 40 in the window. `pillar` maps to the event icon. |
| Approvals | `ApprovalItem` | Pending only. `riskLevel` maps to urgency. **No monetary field exists**, so amounts render as `—`. |
| Workflows | `PipelineSession` | Session status maps to running/paused/scheduled/draft; performance counts completions and exceptions. |
| Partners | `ClientConfig` + `ClientPortfolio` | Health from `currentHealthScore` and `stage`, sparkline from `healthScoreHistory`, agent and workflow counts from related rows. **No revenue or savings figures exist**, so those render as `—`. |
| KPIs | `PortalStats`, agents, sessions | Hours reclaimed, agents active, workflows running, system health. Revenue protected and money saved have no source. |
| Revenue leaks, shadow ops, savings breakdown, ROI, trend, deliverables, alerts | — | No models exist yet. Snapshot only. |

Adding a source later means writing one builder in `live.ts` and flipping its
section in `buildLiveSections()`; no page or panel changes.

Any database error falls back to the snapshot and logs the reason — an
unmigrated or unreachable database never takes the page down.

## Tests

`npx vitest run __tests__/platform` covers the scope logic and every live
builder against plain rows, so none of it needs a database.

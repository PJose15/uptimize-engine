# Independent review and handoff — draft procedure

Input: work packet, baseline/candidate revisions, diff or artifact, acceptance criteria, execution evidence.
Output: findings ordered by consequence; evidence gaps; a precise next action.

Read the artifact independently. Check the requested outcome, regressions, data boundaries and scope. Cite file/function or artifact section for each actionable finding. Separate reproduced failures, likely defects and questions. Do not rewrite the whole implementation simply to express a preference. Check whether claimed tests actually ran and whether mock evidence is being presented as live evidence. Verify that a new session can recover the recorded state.

Use a different provider when that is the intended evaluation. Record its identity and observed run; provider-specific packet generation alone is not a cross-provider review.

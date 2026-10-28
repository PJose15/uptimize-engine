# Provider clients and shared context

Documentation checked October 28, 2026. Actual installed versions, logins and account capacity must be checked on the operator's machine.

| Provider | Working client | Official access documentation |
|---|---|---|
| OpenAI | Codex CLI / ChatGPT desktop / IDE extension | https://learn.chatgpt.com/docs/auth |
| Anthropic | Claude Code | https://code.claude.com/docs/en/authentication |
| Google | Antigravity app or agy | https://antigravity.google/docs/install?tab=cli |

Use supported native access for development work. The deployed application has a separate authentication and cost design. This packet generator reads no credentials, calls no CLIs and uses no inference.

Google's current consumer deprecation notice directs users of the former Gemini CLI Google-login service to Antigravity: https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals . Do not infer current entitlement from old setup guides.

AGENTS.md is a useful canonical project brief. Claude can import it through a small CLAUDE.md containing @AGENTS.md; Google documents AGENTS.md/GEMINI.md context in its migration guide. Existing repository instructions take precedence over a generic packet.

- OpenAI instructions: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Claude instructions: https://code.claude.com/docs/en/memory
- Google migration: https://antigravity.google/docs/cli/gcli-migration

Orca is an optional interface for arranging the native CLI clients, worktrees, terminals and diffs: https://github.com/stablyai/orca . Its documentation lists Codex, Claude Code and Antigravity. It is not required by this tool; no installation or authenticated test is claimed. OpenRig and other persistent team runtimes can be evaluated later against an observed coordination need.

Model versions and role preferences are deliberately not hardcoded. Select by the task, available tools, measured quality, account capacity and review requirements. Private chats and provider quotas do not become shared merely because the clients use a common directory.

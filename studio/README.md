# Portable studio work packets

A small, dependency-free working layer for coordinating an existing portfolio across Claude Code, Codex and Google Antigravity. It prepares a focused brief for a person to use in an official provider client. It does not call models, authenticate accounts, dispatch agents or replace the existing application runtime.

## Try the included generic example

Requires Python 3.10 or newer. Run from the repository root:

```bash
python3 studio/hub.py validate
python3 studio/hub.py list
python3 studio/hub.py packet sample-service --provider claude --role implement
python3 studio/hub.py packet sample-service --provider codex --role review
python3 studio/hub.py doctor
python3 -m unittest discover -s studio/tests -v
```

## Use a private workspace

Keep private portfolio and client context outside this public repository. A workspace contains registry.json, OPERATING_RULES.md and the brief, packet and capability files referenced by the registry. Copy the generic example into a private location or use a separately prepared private workspace. Edit its registry and documents there.

```bash
python3 studio/hub.py --workspace /path/to/private-workspace validate
python3 studio/hub.py --workspace /path/to/private-workspace list
python3 studio/hub.py --workspace /path/to/private-workspace packet project-id --provider google --role research --output /path/to/new-packet.md
```

Output files are created exclusively: an existing file is preserved. Read the generated packet before giving it to a provider. A packet contains only the chosen project and explicitly selected capabilities; it does not ingest an entire portfolio, scan a repository, or import hidden chat memory. Project repositories retain their own instructions and authority.

## The first real relay

1. Choose one unfinished outcome in an existing project. Verify its actual current state.
2. Generate an implementation packet and use it with a signed-in official client.
3. Save the actual diff/artifact and execution evidence in the target project's existing workflow.
4. Generate the corresponding review packet for another provider and include the candidate evidence.
5. Record the review, fixes and handoff. Resume in the next client from those files.

Packet generation is tested offline. A provider session, a successful cross-provider handoff and customer acceptance each need their own observed evidence. The `doctor` command checks executable presence only; it does not inspect credentials, login status or subscription allowances.

## Shared capabilities

The included capability documents are draft portable procedures. They can be evaluated in real tasks before being packaged as provider-discovered skills. No personal ChatGPT skill is installed by this change. See CAPABILITY_FORMAT.md for the contract and PROVIDERS.md for supported client documentation.

## Existing runtime boundary

This directory does not modify the app, database, provider adapters, existing integration branches or command-center surface. The operating packets can support work on those components. An eventual UI should display real task and acceptance evidence from this workflow rather than interpret generated prose as completed execution.

#!/usr/bin/env python3
"""Build portable work packets from an explicit local workspace. Python 3.10+."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit


PROVIDER_IDS = {"claude", "codex", "google"}
ROLES = {
    "implement": "Produce the bounded deliverable in the work packet and record its acceptance evidence.",
    "review": "Inspect the exact proposed artifact or revision independently; report findings and evidence.",
    "research": "Investigate the bounded question; distinguish sourced findings, interpretations, and unknowns.",
}
HANDOFF = """## Acceptance and handoff

Follow the selected work packet's finish line. Record:

- The objective and scope actually completed.
- Changed files or artifacts and their exact version or revision when available.
- Checks actually performed, their results, and supporting evidence.
- Remaining gaps, blockers, assumptions, and the next bounded step.
- Decisions requiring the project owner's judgment, with enough context to make them.

Distinguish implemented, reviewed, and accepted work. Record a pending or unrun
check as pending or unrun. Return the handoff to the selected project's records;
do not include unrelated project context in it.

This packet is context for a person or an AI assistant. The hub has not executed
an agent, authenticated a provider, or tested a model by generating this text.
"""


class WorkspaceError(ValueError):
    """A workspace or requested operation is invalid."""


def text_field(item: dict, key: str, label: str) -> str:
    value = item.get(key)
    if not isinstance(value, str) or not value.strip():
        raise WorkspaceError(f"{label}.{key} must be a nonempty string")
    return value


def read_text(root: Path, reference: str) -> str:
    """Read a regular UTF-8 file within root, rejecting traversal and symlinks."""
    if not isinstance(reference, str) or not reference or "\\" in reference or ":" in reference:
        raise WorkspaceError(f"Invalid workspace path: {reference!r}")
    relative = PurePosixPath(reference)
    if relative.is_absolute() or ".." in relative.parts or not relative.parts:
        raise WorkspaceError(f"Path must remain inside the workspace: {reference!r}")
    target = root
    for part in relative.parts:
        target = target / part
        if target.is_symlink():
            raise WorkspaceError(f"Symlinks are not allowed in workspace references: {reference!r}")
    if not target.resolve().is_relative_to(root):
        raise WorkspaceError(f"Path escapes the workspace: {reference!r}")
    if not target.is_file():
        raise WorkspaceError(f"Referenced text file is missing: {reference!r}")
    content = target.read_text(encoding="utf-8")
    if not content.strip():
        raise WorkspaceError(f"Referenced text file is empty: {reference!r}")
    return content


def records(registry: dict, name: str) -> list[dict]:
    items = registry.get(name)
    if not isinstance(items, list):
        raise WorkspaceError(f"{name} must be a list")
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            raise WorkspaceError(f"Each {name} entry must be an object")
        identifier = text_field(item, "id", name)
        if not re.fullmatch(r"[a-z][a-z0-9_-]*", identifier):
            raise WorkspaceError(f"Invalid {name} id: {identifier!r}")
        if identifier in seen:
            raise WorkspaceError(f"Duplicate {name} id: {identifier}")
        seen.add(identifier)
    return items


def load_workspace(path: Path, selected_project_id: str | None = None) -> tuple[dict, dict[str, str]]:
    root = path.expanduser().resolve()
    if not root.is_dir():
        raise WorkspaceError(f"Workspace directory is missing: {root}")
    try:
        registry = json.loads(read_text(root, "registry.json"))
    except json.JSONDecodeError as error:
        raise WorkspaceError(f"registry.json is invalid JSON: {error.msg}") from error
    if not isinstance(registry, dict) or type(registry.get("schema_version")) is not int:
        raise WorkspaceError("registry.json requires integer schema_version=1")
    if registry["schema_version"] != 1:
        raise WorkspaceError("Unsupported schema_version; expected 1")
    text_field(registry, "updated_at", "registry")
    providers = records(registry, "providers")
    if {provider["id"] for provider in providers} != PROVIDER_IDS:
        raise WorkspaceError("providers must contain exactly claude, codex, and google")
    for provider in providers:
        for key in ("name", "client", "access_note"):
            text_field(provider, key, provider["id"])
    capabilities = records(registry, "capabilities")
    for capability in capabilities:
        for key in ("name", "path", "status"):
            text_field(capability, key, capability["id"])
    capability_ids = {capability["id"] for capability in capabilities}
    projects = records(registry, "projects")
    if not projects:
        raise WorkspaceError("projects must contain at least one project")
    for project in projects:
        for key in ("name", "area", "purpose", "source_status", "brief", "next_packet"):
            text_field(project, key, project["id"])
        repository = project.get("repository")
        if repository is not None:
            if not isinstance(repository, str):
                raise WorkspaceError(f"{project['id']}.repository must be a URL or null")
            parsed = urlsplit(repository)
            if (parsed.scheme not in {"https", "http"} or not parsed.netloc
                    or parsed.username is not None or parsed.password is not None):
                raise WorkspaceError(f"{project['id']}.repository must be an HTTP(S) URL without credentials")
        selected = project.get("capabilities")
        if not isinstance(selected, list) or any(not isinstance(value, str) for value in selected):
            raise WorkspaceError(f"{project['id']}.capabilities must be a list of ids")
        if len(set(selected)) != len(selected) or not set(selected).issubset(capability_ids):
            raise WorkspaceError(f"{project['id']}.capabilities contains duplicate or unknown ids")
    if "sources" in registry and not isinstance(registry["sources"], list):
        raise WorkspaceError("sources must be a list when present")
    selected_projects = projects
    selected_capabilities = capabilities
    if selected_project_id is not None:
        selected_projects = [project for project in projects if project["id"] == selected_project_id]
        if not selected_projects:
            raise WorkspaceError(f"Unknown project: {selected_project_id}")
        wanted = set(selected_projects[0]["capabilities"])
        selected_capabilities = [capability for capability in capabilities if capability["id"] in wanted]
    texts = {"OPERATING_RULES.md": read_text(root, "OPERATING_RULES.md")}
    for project in selected_projects:
        for key in ("brief", "next_packet"):
            texts[project[key]] = read_text(root, project[key])
    for capability in selected_capabilities:
        texts[capability["path"]] = read_text(root, capability["path"])
    return registry, texts


def build_packet(registry: dict, texts: dict[str, str], project_id: str, provider_id: str, role: str) -> str:
    project = next((item for item in registry["projects"] if item["id"] == project_id), None)
    if project is None:
        raise WorkspaceError(f"Unknown project: {project_id}")
    provider = next(item for item in registry["providers"] if item["id"] == provider_id)
    sections = [
        f"# Work packet: {project['name']}",
        f"Project: {project['id']}\nArea: {project['area']}\nRole: {role}\nRegistry updated: {registry['updated_at']}",
        f"## Selected provider\n\n{provider['name']} ({provider['id']})\n\nClient: {provider['client']}\n\n{provider['access_note']}",
        f"## Source status\n\n{project['source_status']}\n\nThis records the workspace's stated status; packet generation does not verify current repository or live-service state.",
        f"## Objective\n\n{project['purpose']}\n\n{ROLES[role]}",
    ]
    if project.get("repository"):
        sections.append(f"Repository reference: {project['repository']}")
    sections.extend([
        "## Operating rules\n\n" + texts["OPERATING_RULES.md"].strip(),
        "## Project brief\n\n" + texts[project["brief"]].strip(),
        "## Next work packet\n\n" + texts[project["next_packet"]].strip(),
    ])
    by_id = {item["id"]: item for item in registry["capabilities"]}
    for capability_id in project["capabilities"]:
        capability = by_id[capability_id]
        sections.append(
            f"## Capability: {capability['name']}\n\nStatus: {capability['status']}\n\n"
            + texts[capability["path"]].strip()
        )
    sections.append(HANDOFF.strip())
    return "\n\n".join(sections) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parent / "example-workspace",
                        help="Local workspace directory (default: bundled generic example-workspace)")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("validate", help="Validate registry and referenced text files")
    commands.add_parser("list", help="List registered projects")
    commands.add_parser("doctor", help="Detect client binaries without running them")
    packet = commands.add_parser("packet", help="Emit a portable Markdown work packet")
    packet.add_argument("project")
    packet.add_argument("--provider", choices=sorted(PROVIDER_IDS), required=True)
    packet.add_argument("--role", choices=list(ROLES), required=True)
    packet.add_argument("--output", type=Path, help="Create a new file; existing files are never overwritten")
    args = parser.parse_args(argv)
    try:
        if args.command == "doctor":
            for binary in ("claude", "codex", "agy"):
                location = shutil.which(binary)
                print(f"{binary}: {location if location else 'not found on PATH'}")
            print("Detection only: not a login test, model test, or subscription check. No client was executed.")
            return 0
        registry, texts = load_workspace(args.workspace, args.project if args.command == "packet" else None)
        if args.command == "validate":
            print(f"Valid workspace: {len(registry['projects'])} projects, {len(registry['capabilities'])} capabilities, 3 providers.")
        elif args.command == "list":
            for project in registry["projects"]:
                print(f"{project['id']}: {project['name']} [{project['area']}]")
        else:
            result = build_packet(registry, texts, args.project, args.provider, args.role)
            if args.output:
                with args.output.expanduser().open("x", encoding="utf-8", newline="\n") as stream:
                    stream.write(result)
                print(f"Created packet: {args.output}")
            else:
                print(result, end="")
        return 0
    except (WorkspaceError, OSError, UnicodeError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

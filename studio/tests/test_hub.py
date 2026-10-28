"""Offline CLI acceptance tests; fixtures contain no real project context."""

import copy
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


HUB = Path(__file__).resolve().parents[1] / "hub.py"


class HubTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.script = self.root / "studio" / "hub.py"
        self.script.parent.mkdir()
        shutil.copyfile(HUB, self.script)
        self.workspace = self.script.parent / "example-workspace"
        self.registry = {
            "schema_version": 1, "updated_at": "2026-10-28",
            "providers": [{"id": item, "name": item.title(), "client": "Manual client",
                           "access_note": "Use your own supported client access."}
                          for item in ("claude", "codex", "google")],
            "projects": [
                {"id": item, "name": item.title(), "area": "example", "purpose": f"Deliver {item}",
                 "repository": None, "source_status": "Unverified fixture",
                 "brief": f"briefs/{item}.md", "next_packet": f"packets/{item}.md",
                 "capabilities": [f"{item}-cap"]} for item in ("alpha", "beta")
            ],
            "capabilities": [{"id": f"{item}-cap", "name": f"{item} capability",
                              "path": f"capabilities/{item}.md", "status": "draft"}
                             for item in ("alpha", "beta")],
        }
        self.write("OPERATING_RULES.md", "Fixture operating rules.")
        for item in ("alpha", "beta"):
            self.write(f"briefs/{item}.md", f"{item.upper()}_BRIEF_ONLY")
            self.write(f"packets/{item}.md", f"{item.upper()}_PACKET_ONLY")
            self.write(f"capabilities/{item}.md", f"{item.upper()}_CAP_ONLY")
        self.save_registry()

    def write(self, relative, content):
        target = self.workspace / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    def save_registry(self):
        self.write("registry.json", json.dumps(self.registry))

    def cli(self, *args, env=None):
        return subprocess.run([sys.executable, str(self.script), *args], capture_output=True,
                              text=True, env=env, check=False)

    def packet(self, *extra):
        return self.cli("packet", "alpha", "--provider", "google", "--role", "implement", *extra)

    def test_default_workspace_validate_and_list(self):
        result = self.cli("validate")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("2 projects", result.stdout)
        result = self.cli("list")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("alpha: Alpha [example]", result.stdout)

    def test_explicit_external_workspace(self):
        external = self.root / "private-context"
        shutil.move(self.workspace, external)
        result = self.cli("--workspace", str(external), "validate")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotEqual(self.cli("validate").returncode, 0)

    def test_packet_scopes_context_and_declares_limitations(self):
        result = self.packet()
        self.assertEqual(result.returncode, 0, result.stderr)
        for expected in ("ALPHA_BRIEF_ONLY", "ALPHA_PACKET_ONLY", "ALPHA_CAP_ONLY",
                         "Google (google)", "Unverified fixture", "Acceptance and handoff"):
            self.assertIn(expected, result.stdout)
        for unrelated in ("BETA_BRIEF_ONLY", "BETA_PACKET_ONLY", "BETA_CAP_ONLY", "Beta"):
            self.assertNotIn(unrelated, result.stdout)
        self.assertIn("does not verify current repository", result.stdout)

    def test_packet_does_not_require_unrelated_text(self):
        (self.workspace / "briefs/beta.md").unlink()
        (self.workspace / "capabilities/beta.md").unlink()
        result = self.packet()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("ALPHA_BRIEF_ONLY", result.stdout)
        self.assertEqual(self.cli("validate").returncode, 2)

    def test_packet_loader_reads_only_selected_context(self):
        spec = importlib.util.spec_from_file_location("studio_hub_test", HUB)
        hub = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(hub)
        with patch.object(hub, "read_text", wraps=hub.read_text) as reader:
            hub.load_workspace(self.workspace, selected_project_id="alpha")
        references = [call.args[1] for call in reader.call_args_list]
        self.assertEqual(references, ["registry.json", "OPERATING_RULES.md", "briefs/alpha.md",
                                      "packets/alpha.md", "capabilities/alpha.md"])

    def test_exclusive_output_and_symlink_preserve_existing_files(self):
        output = self.root / "packet.md"
        result = self.packet("--output", str(output))
        self.assertEqual(result.returncode, 0, result.stderr)
        original = output.read_bytes()
        self.assertNotEqual(self.packet("--output", str(output)).returncode, 0)
        self.assertEqual(output.read_bytes(), original)
        alias = self.root / "alias.md"
        alias.symlink_to(output)
        self.assertNotEqual(self.packet("--output", str(alias)).returncode, 0)
        self.assertEqual(output.read_bytes(), original)

    def test_malformed_registry(self):
        original = copy.deepcopy(self.registry)
        cases = [
            lambda r: r.update(schema_version=True),
            lambda r: r.update(schema_version=2),
            lambda r: r.update(updated_at=""),
            lambda r: r["projects"].append(r["projects"][0]),
            lambda r: r["providers"].pop(),
            lambda r: r["projects"][0].update(capabilities=["missing"]),
            lambda r: r["projects"][0].update(capabilities=["alpha-cap", "alpha-cap"]),
            lambda r: r["projects"][0].update(repository=123),
            lambda r: r["capabilities"].append("not an object"),
        ]
        for change in cases:
            with self.subTest(change=change):
                self.registry = copy.deepcopy(original)
                change(self.registry)
                self.save_registry()
                result = self.cli("validate")
                self.assertEqual(result.returncode, 2, result.stdout)
                self.assertNotIn("Traceback", result.stderr)
        self.write("registry.json", "{broken")
        self.assertIn("invalid JSON", self.cli("validate").stderr)

    def test_reference_paths_cannot_escape_workspace(self):
        outside = self.root / "secret.md"
        outside.write_text("OUTSIDE_SECRET", encoding="utf-8")
        for reference in ("../secret.md", str(outside), "C:\\secret.md"):
            with self.subTest(reference=reference):
                self.registry["projects"][0]["brief"] = reference
                self.save_registry()
                result = self.packet()
                self.assertEqual(result.returncode, 2)
                self.assertNotIn("OUTSIDE_SECRET", result.stdout)

    def test_credential_bearing_repository_urls_cannot_enter_packet(self):
        output = self.root / "packet.md"
        for repository in ("https://:SYNTHETIC_SECRET@example.com/repo",
                           "https://user:SYNTHETIC_SECRET@example.com/repo",
                           "https://@example.com/repo"):
            with self.subTest(repository=repository):
                self.registry["projects"][0]["repository"] = repository
                self.save_registry()
                result = self.packet("--output", str(output))
                self.assertEqual(result.returncode, 2)
                self.assertIn("without credentials", result.stderr)
                self.assertNotIn("SYNTHETIC_SECRET", result.stdout + result.stderr)
                self.assertFalse(output.exists())

    def test_symlinked_files_directories_and_registry_are_rejected(self):
        outside = self.root / "outside"
        outside.mkdir()
        (outside / "secret.md").write_text("OUTSIDE_SECRET", encoding="utf-8")
        (self.workspace / "linked-dir").symlink_to(outside, target_is_directory=True)
        (self.workspace / "linked-file.md").symlink_to(outside / "secret.md")
        for reference in ("linked-dir/secret.md", "linked-file.md"):
            self.registry["projects"][0]["brief"] = reference
            self.save_registry()
            self.assertIn("Symlinks", self.packet().stderr)
        registry_path = self.workspace / "registry.json"
        registry_path.unlink()
        registry_path.symlink_to(outside / "secret.md")
        self.assertIn("Symlinks", self.cli("validate").stderr)

    def test_missing_or_empty_text_prevents_output_creation(self):
        output = self.root / "packet.md"
        self.write("briefs/alpha.md", "   ")
        self.assertNotEqual(self.packet("--output", str(output)).returncode, 0)
        self.assertFalse(output.exists())
        (self.workspace / "briefs/alpha.md").unlink()
        self.assertIn("missing", self.packet().stderr)

    def test_doctor_detects_without_executing_clients(self):
        binaries = self.root / "bin"
        binaries.mkdir()
        marker = self.root / "should-not-exist"
        for name in ("claude", "codex", "agy"):
            binary = binaries / name
            binary.write_text(f"#!/bin/sh\ntouch '{marker}'\n", encoding="utf-8")
            binary.chmod(0o755)
        result = self.cli("doctor", env={**os.environ, "PATH": str(binaries)})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("not a login test", result.stdout)
        self.assertNotIn("not found", result.stdout)
        self.assertFalse(marker.exists())

    def test_unknown_project_is_a_clear_error(self):
        (self.workspace / "OPERATING_RULES.md").unlink()
        result = self.cli("packet", "missing", "--provider", "codex", "--role", "review")
        self.assertEqual(result.returncode, 2)
        self.assertIn("Unknown project", result.stderr)


if __name__ == "__main__":
    unittest.main()

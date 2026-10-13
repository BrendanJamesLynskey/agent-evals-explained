"""The site's parity fixtures, from the Python reference engine at the vendored commit.

    python scripts/make_fixtures.py          # write tests/fixtures/site_fixtures.json and src/data/swe.json
    python scripts/make_fixtures.py --check  # fail if either is out of date (CI)

For every chapter (src/data/chapter_configs.json), everything it animates and quotes, computed by
the reference's evals module: the runs accumulating (chapter 1), pass@k and pass^k with the bias
check (3), the benchmark repeated, coverage curves, the tie and the sample sizes (4), and the two
agents compared (5). tests/unit/frames.test.ts recomputes them with the vendored TS port
(src/lib/engine's runChapter) and requires equality; tests/e2e/frames.spec.ts checks the captions
on the page. Chapter 2's SWE-style task runs the engine's harness (which needs the tokenizer), so
the reference writes its frames to src/data/swe.json for the page to load.

The engine must be installed from git at the commit in src/lib/engine/vendor/VENDORED.json
(reference/requirements.txt pins it); this script refuses to run otherwise.
"""
from __future__ import annotations

import argparse
import importlib.metadata
import json
import sys
from pathlib import Path

from agent_loop_sim.evals import study as St
from agent_loop_sim.evals import swe as W

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tests/fixtures/site_fixtures.json"
SWE_OUT = ROOT / "src/data/swe.json"


def installed_commit() -> str:
    d = importlib.metadata.distribution("agent-loop-sim")
    info = json.loads(d.read_text("direct_url.json") or "{}")
    return info.get("vcs_info", {}).get("commit_id", "")


def run_chapter(chapter: str, cfg: dict) -> dict:
    if chapter == "loop":
        return {"study": St.loop_study()}
    if chapter == "swe":
        return {"anatomies": swe(cfg)}
    if chapter == "passk":
        return {"study": St.passk_study(), "bias": St.bias_study()}
    if chapter == "uncertainty":
        return {"studies": {f"{s}|{m}": St.uncertainty_study(s, m) for s in St.UNC["sizes"] for m in St.UNC["modes"]},
                "coverage": {str(n): St.coverage_curves(n, St.COVER["ps"]) for n in St.COVER["sizes"]},
                "tie": St.tie_study(), "sizes": St.sizes_table(), "cfg": St.UNC}
    return {"studies": {str(m): St.paired_study(m) for m in St.PAIRED["runs"]}, "cfg": St.PAIRED}


def swe(cfg: dict) -> dict:
    return {f"{p}|{t}": W.anatomy(p, t) for p in cfg["patches"] for t in cfg["tests"]}


def build() -> dict[Path, str]:
    vendored = json.loads((ROOT / "src/lib/engine/vendor/VENDORED.json").read_text())
    commit = installed_commit()
    if commit != vendored["commit"]:
        sys.exit(f"installed agent-loop-sim is at {commit[:7] or '?'}, the site vendors {vendored['commit'][:7]}: "
                 "pip install -r reference/requirements.txt")
    configs = json.loads((ROOT / "src/data/chapter_configs.json").read_text())
    out = {"commit": commit, "chapters": {ch: run_chapter(ch, cfg) for ch, cfg in configs.items()}}
    return {OUT: json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n",
            SWE_OUT: json.dumps(swe(configs["swe"]), ensure_ascii=False, separators=(",", ":")) + "\n"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    files = build()
    for path, text in files.items():
        rel = path.relative_to(ROOT)
        if a.check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                sys.exit(f"{rel} is out of date (run python scripts/make_fixtures.py)")
        else:
            path.write_text(text, encoding="utf-8")
            print(f"wrote {rel} ({len(text)} bytes)")
    if a.check:
        print("site fixtures up to date")


if __name__ == "__main__":
    main()

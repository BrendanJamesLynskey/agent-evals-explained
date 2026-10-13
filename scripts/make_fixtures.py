"""The site's parity fixtures, from the Python reference engine at the vendored commit.

    python scripts/make_fixtures.py          # write tests/fixtures/site_fixtures.json, src/data/swe.json,
                                             # src/data/trajectory.json and src/data/harness.json
    python scripts/make_fixtures.py --check  # fail if either is out of date (CI)

For every chapter (src/data/chapter_configs.json), everything it animates and quotes, computed by
the reference's evals module: the runs accumulating (chapter 1), pass@k and pass^k with the bias
check (3), the benchmark repeated, coverage curves, the tie and the sample sizes (4), and the two
agents compared (5). tests/unit/frames.test.ts recomputes them with the vendored TS port
(src/lib/engine's runChapter) and requires equality; tests/e2e/frames.spec.ts checks the captions
on the page. Chapter 2's SWE-style task, chapter 7's graded trajectories and chapter 8's scaffold study run
the engine's harness (which needs the 1.6 MB tokenizer), so the reference writes them to src/data/swe.json,
src/data/trajectory.json and src/data/harness.json for the page to load; chapter 7 replays the recorded traces
vendored in reference/traces/. Chapters 6, 9 and 10 run in the page (chapter 10 from chapter 8's summaries).

The engine must be installed from git at the commit in src/lib/engine/vendor/VENDORED.json
(reference/requirements.txt pins it); this script refuses to run otherwise.
"""
from __future__ import annotations

import argparse
import importlib.metadata
import json
import sys
from pathlib import Path

from agent_loop_sim.evals import contamination as C
from agent_loop_sim.evals import judge as J
from agent_loop_sim.evals import scaffold as F
from agent_loop_sim.evals import study as St
from agent_loop_sim.evals import swe as W
from agent_loop_sim.evals import trajectory as T

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tests/fixtures/site_fixtures.json"
SWE_OUT = ROOT / "src/data/swe.json"
TRAJ_OUT = ROOT / "src/data/trajectory.json"
HARNESS_OUT = ROOT / "src/data/harness.json"
TRACES = ["qwen-fix-test-native", "qwen-fix-test-react", "qwen-lookup-native"]
# chapter 8's example runs: one task under four scaffolds (the engine's fixtures hold the same runs)
EXAMPLES = [["small|edit|native|4", 9, 0], ["small|test|native|16", 9, 0], ["small|test|react|16", 9, 0],
            ["large|edit|native|4", 9, 0]]


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
    if chapter == "paired":
        return {"studies": {str(m): St.paired_study(m) for m in St.PAIRED["runs"]}, "cfg": St.PAIRED}
    if chapter == "judge":
        return {"study": J.judge_study(), "grading": J.grading_study()}
    if chapter == "trajectory":
        return trajectory()
    if chapter == "harness":
        h = harness()
        # the page writes each run's caption with the engine's TS captionRun (not shipped in harness.json)
        return {**h, "captions": {cid: [F.caption_run(cid, r) for r in rows] for cid, rows in h["rows"].items()}}
    if chapter == "contamination":
        return C.contamination_study()
    cost = F.cost_study(harness())
    return {"cost": cost, "frames": {a: F.cost_frames(cost, None if a == "all" else a) for a in ["all", "small", "large"]}}


def trajectory() -> dict:
    traces = {n: json.loads((ROOT / "reference/traces" / f"{n}.json").read_text(encoding="utf-8")) for n in TRACES}
    return T.trajectory_study(traces)


_HARNESS: dict | None = None


def harness() -> dict:
    global _HARNESS
    if _HARNESS is None:
        st = F.scaffold_study()
        ex = []
        for cid, t, j in EXAMPLES:
            conf = next(c for c in F.configs() if c["id"] == cid)
            r = F.run_one(conf, t, j, None, F.SCAFFOLD, True)
            ex.append({"config": cid, "caption": F.caption_run(cid, r), **r})
        _HARNESS = {"cfg": st["cfg"], "tasks": st["tasks"], "agents": st["agents"], "mu": st["mu"],
                    "configs": st["configs"], "rows": st["rows"], "spread": st["spread"],
                    "describe": {c["id"]: F.describe(c["id"]) for c in st["configs"]},
                    "paired": [F.paired_scaffolds(st, a, b) for a, b in PAIRS], "examples": ex}
    return _HARNESS


PAIRS = [["small|test|native|16", "small|edit|native|4"], ["small|test|native|16", "large|edit|native|4"],
         ["small|test|react|8", "small|test|native|8"], ["large|test|native|16", "large|test|native|4"]]


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
            SWE_OUT: json.dumps(swe(configs["swe"]), ensure_ascii=False, separators=(",", ":")) + "\n",
            TRAJ_OUT: json.dumps(trajectory(), ensure_ascii=False, separators=(",", ":")) + "\n",
            HARNESS_OUT: json.dumps(harness(), ensure_ascii=False, separators=(",", ":")) + "\n"}


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

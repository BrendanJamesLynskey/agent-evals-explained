"""The vendored engine files are the engine repository's files at the pinned commit, the reference
installed at that commit reproduces the engine's evals fixtures, and the site's chapter-2 frames
are the reference's; chapters 6-10 likewise (engine 1.9)."""
from __future__ import annotations

import hashlib
import importlib.metadata
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
VENDORED = json.loads((ROOT / "src/lib/engine/vendor/VENDORED.json").read_text())


def test_every_vendored_file_matches_its_hash():
    assert len(VENDORED["files"]) >= 40
    for path, rec in VENDORED["files"].items():
        assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == rec["sha256"], path


def test_installed_reference_is_the_vendored_commit():
    d = importlib.metadata.distribution("agent-loop-sim")
    assert json.loads(d.read_text("direct_url.json"))["vcs_info"]["commit_id"] == VENDORED["commit"]


def test_the_reference_reproduces_the_engine_fixtures():
    from agent_loop_sim.evals import stats as S
    from agent_loop_sim.evals import study as St

    fx = json.loads((ROOT / "tests/fixtures/evals_fixtures.json").read_text())
    assert fx["engine"] == "1.9.0"
    assert json.loads(json.dumps(St.loop_study())) == fx["loop"]
    assert json.loads(json.dumps(St.tie_study())) == fx["tie"]
    assert json.loads(json.dumps(St.paired_study(1))) == fx["paired"]["1"]
    for k, n, w, wi, ex in fx["stats"]["intervals"]:
        assert S.wald(k, n) == w and S.wilson(k, n) == wi and S.exact(k, n) == ex


def test_the_swe_frames_are_the_references():
    from agent_loop_sim.evals import swe as W

    swe = json.loads((ROOT / "src/data/swe.json").read_text())
    assert len(swe) == 6
    for key, a in swe.items():
        p, t = key.split("|")
        assert json.loads(json.dumps(W.anatomy(p, t))) == a, key


def test_the_reference_reproduces_the_engine_fixtures_part_2():
    from agent_loop_sim.evals import contamination as C
    from agent_loop_sim.evals import judge as J

    fx = json.loads((ROOT / "tests/fixtures/evals2_fixtures.json").read_text())
    assert fx["engine"] == "1.9.0"
    assert json.loads(json.dumps(J.grading_study())) == fx["grading"]
    assert json.loads(json.dumps(C.contamination_study()))["levels"]["0.30"] == fx["contamination"]["levels"]["0.30"]


def test_chapter_7_and_8_data_are_the_references():
    traj = json.loads((ROOT / "src/data/trajectory.json").read_text())
    fx = json.loads((ROOT / "tests/fixtures/evals2_fixtures.json").read_text())
    assert traj == fx["trajectory"]
    h = json.loads((ROOT / "src/data/harness.json").read_text())
    assert h["configs"] == fx["scaffold"]["configs"] and h["rows"] == fx["scaffold"]["rows"]
    assert h["examples"] == fx["scaffold"]["examples"]

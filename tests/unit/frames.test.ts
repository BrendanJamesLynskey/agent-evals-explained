/**
 * Every chapter's data (src/lib/engine's runChapter, what the animations draw) equals what the
 * Python reference computes at the vendored commit (tests/fixtures/site_fixtures.json, regenerated
 * in CI from the reference installed at that commit), with no tolerance; and key frames say what the
 * chapters claim they say.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import SWE from "@/data/swe.json";
import {
  CHAPTER_CONFIGS,
  E,
  runChapter,
  type Chapter,
  type Obj,
} from "@/lib/engine";

const ROOT = join(__dirname, "../..");
const fx = JSON.parse(
  readFileSync(join(ROOT, "tests/fixtures/site_fixtures.json"), "utf8"),
) as Obj;
const efx = JSON.parse(
  readFileSync(join(ROOT, "tests/fixtures/evals_fixtures.json"), "utf8"),
) as Obj;

describe("every chapter equals the Python reference", () => {
  for (const ch of Object.keys(CHAPTER_CONFIGS) as Chapter[])
    it(ch, () => expect(runChapter(ch)).toEqual(fx.chapters[ch]));
});

describe("chapter 2's frames are the engine's own", () => {
  it("swe.json equals the engine's fixtures (whose TS parity the engine's CI checks)", () => {
    for (const [k, a] of Object.entries(SWE as Obj))
      expect(a).toEqual(efx.swe[k]);
    expect(Object.keys(SWE)).toHaveLength(6);
  });
});

describe("key frames", () => {
  it("chapter 1: extra runs narrow the naive band faster than the clustered one", () => {
    const s = runChapter("loop").study as Obj;
    const T = s.cfg.tasks as number;
    const fr = s.frames as Obj[];
    const w = (iv: number[]) => iv[1]! - iv[0]!;
    const r1 = fr[T - 1]!;
    const r3 = fr[3 * T - 1]!;
    expect(w(r3.wilson) / w(r1.wilson)).toBeLessThan(
      w(r3.cluster) / w(r1.cluster),
    );
    expect(fr[0]!.cluster).toEqual([0, 1]);
    expect(fr[0]!.caption).toMatch(/^Run 1 on task 1: (pass|fail)\. /);
  });
  it("chapter 1: correlation 0 brings the two bands closer", () => {
    const at = (rho: number) => {
      const s = E.study.loopStudy({ ...E.study.LOOP, rho });
      const f = (s.frames as Obj[])[(s.frames as Obj[]).length - 1]!;
      return (f.cluster[1] - f.cluster[0]) / (f.wilson[1] - f.wilson[0]);
    };
    expect(at(0)).toBeLessThan(at(0.5));
    expect(at(0.5)).toBeLessThan(at(0.9));
  });
  it("chapter 2: weak tests pass the overfit patch, thorough ones do not", () => {
    const a = runChapter("swe").anatomies as Obj;
    expect(a["overfit|weak"].grade.resolved).toBe(true);
    expect(a["overfit|thorough"].grade.resolved).toBe(false);
    expect(a["collateral|thorough"].grade.p2p_ok).toBe(false);
    expect(a["fix|thorough"].frames.at(-1).stage).toBe("verdict");
  });
  it("chapter 3: pass@k rises and pass^k falls", () => {
    const fr = runChapter("passk").study.frames as Obj[];
    for (let i = 1; i < fr.length; i++) {
      expect(fr[i]!.pass_at_k).toBeGreaterThanOrEqual(fr[i - 1]!.pass_at_k);
      expect(fr[i]!.pass_hat_k).toBeLessThanOrEqual(fr[i - 1]!.pass_hat_k);
      expect(fr[i]!.plugin).toBeLessThanOrEqual(fr[i]!.pass_at_k);
    }
  });
  it("chapter 4: exact never undercovers; Wald does near the edges", () => {
    const c = runChapter("uncertainty").coverage as Obj;
    for (const n of Object.keys(c)) {
      expect(Math.min(...(c[n].exact as number[]))).toBeGreaterThanOrEqual(
        0.95,
      );
      expect(Math.min(...(c[n].wald as number[]))).toBeLessThan(0.9);
    }
  });
  it("chapter 5: pairing never widens the standard error, and narrows it by the end", () => {
    for (const s of Object.values(runChapter("paired").studies as Obj)) {
      const fr = (s as Obj).frames as Obj[];
      for (const f of fr)
        expect(f.compare.se_paired).toBeLessThanOrEqual(
          f.compare.se_unpaired + 1e-12,
        );
      const last = fr[fr.length - 1]!.compare;
      expect(last.se_paired).toBeLessThan(0.9 * last.se_unpaired);
      expect(last.corr).toBeGreaterThan(0);
    }
  });
});

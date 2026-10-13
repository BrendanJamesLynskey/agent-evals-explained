/**
 * The vendored Agent_Loop_Sim engine (src/lib/engine/vendor, pinned in VENDORED.json) and what
 * each chapter animates (src/data/chapter_configs.json). Every frame is computed by the engine's
 * evals module, whose statistics are tested against scipy and statsmodels in the engine's CI and
 * whose TS port reproduces the Python reference exactly. Nothing here runs a language model.
 *
 * Chapter 2's SWE-style task runs the engine's harness, which needs the 1.6 MB tokenizer: the
 * site does not load that in the browser. Its frames come from src/data/swe.json, written by the
 * Python reference (scripts/make_fixtures.py) and checked against the engine's own fixtures.
 */
import CONFIGS from "@/data/chapter_configs.json";
import SWE from "@/data/swe.json";

import * as E from "./vendor/evals/index";

export { E };
export type Obj = { [k: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

export type Chapter = keyof typeof CONFIGS;
export const CHAPTER_CONFIGS = CONFIGS as unknown as Record<Chapter, Obj>;

/** Chapters too heavy to compute in the page (chapter 4 reruns six benchmarks with bootstraps and
 * sums exact coverage; about a second of main-thread work on a slow phone): the widget loads them from
 * src/data/precomputed.json, which scripts/precompute.ts writes with this same function and
 * tests/unit/precomputed.test.ts checks. */
export const PRECOMPUTED: Chapter[] = ["uncertainty"];

/** Everything one chapter animates (and quotes). */
export function runChapter(chapter: Chapter): Obj {
  const St = E.study;
  if (chapter === "loop") return { study: St.loopStudy() };
  if (chapter === "swe") return { anatomies: SWE as Obj };
  if (chapter === "passk")
    return { study: St.passkStudy(), bias: St.biasStudy() };
  if (chapter === "uncertainty") {
    const studies: Obj = {};
    for (const size of St.UNC.sizes as number[])
      for (const mode of St.UNC.modes as string[])
        studies[`${size}|${mode}`] = St.uncertaintyStudy(size, mode);
    const coverage: Obj = {};
    for (const n of St.COVER.sizes as number[])
      coverage[String(n)] = St.coverageCurves(n, St.COVER.ps);
    return {
      studies,
      coverage,
      tie: St.tieStudy(),
      sizes: St.sizesTable(),
      cfg: St.UNC,
    };
  }
  const studies: Obj = {};
  for (const m of St.PAIRED.runs as number[])
    studies[String(m)] = St.pairedStudy(m);
  return { studies, cfg: St.PAIRED };
}

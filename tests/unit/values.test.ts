/**
 * Every <V of="…" /> in the chapters resolves to an engine value, and the numbers the prose
 * quotes are the ones the engine's recorded run (evals_results.md) has.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { E, type Obj } from "@/lib/engine";
import { formatValue, lookup, tree, type Fmt } from "@/lib/evals/values";

const DIR = join(__dirname, "../../content/chapters");
const RESULTS = readFileSync(
  join(__dirname, "../../src/data/evals_results.md"),
  "utf8",
);
const p1 = (x: number) => E.study.pct(x, 1);

describe("every quoted value resolves", () => {
  for (const f of readdirSync(DIR).filter((x) => x.endsWith(".mdx"))) {
    const src = readFileSync(join(DIR, f), "utf8");
    it(f, () => {
      const uses = [...src.matchAll(/<V of="([^"]+)"(?: fmt="([^"]+)")? \/>/g)];
      expect(uses.length).toBeGreaterThan(0);
      for (const [, path, fmt] of uses)
        expect(
          () => formatValue(lookup(path!), (fmt ?? "num") as Fmt),
          path,
        ).not.toThrow();
    });
  }
});

describe("formats and lookups", () => {
  it("formats", () => {
    expect(formatValue(1234, "int")).toBe("1,234");
    expect(formatValue(0.5, "pct")).toBe("50%");
    expect(formatValue(0.6825, "pct1")).toBe("68.3%");
    expect(formatValue(0.0726, "pp1")).toBe("7.3 points");
    expect(formatValue(1.23456, "num")).toBe("1.23");
    expect(formatValue(1.234, "f2")).toBe("1.23");
    expect(formatValue(1.2345, "f3")).toBe("1.234");
    expect(formatValue(1.23456, "f4")).toBe("1.2346");
    expect(formatValue("x", "raw")).toBe("x");
  });
  it("lookups fail loudly", () => {
    expect(() => lookup("loopx.nope")).toThrow();
    expect(() => lookup("loopx.runs.x")).toThrow();
    expect(lookup("unc.200|tasks.size")).toBe(200);
    expect(lookup("verdict.overfit|weak")).toBe("resolved");
    expect(tree()).toBe(tree());
  });
});

describe("the prose agrees with the engine's recorded results", () => {
  it("chapter 1 rounds", () => {
    const t = tree();
    for (const r of [1, 2, 3]) {
      const f = t.loopx[`round${r}`] as Obj;
      expect(RESULTS).toContain(
        `| ${f.n} | ${p1(f.p)} | ${p1(f.wilson[0])} to ${p1(f.wilson[1])} | ${p1(f.cluster[0])} to ${p1(f.cluster[1])} |`,
      );
    }
  });
  it("chapter 3 by k", () => {
    for (const f of tree().passk.study.frames as Obj[])
      expect(RESULTS).toContain(
        `| ${f.k} | ${p1(f.pass_at_k)} | ${p1(f.true_at)} | ${p1(f.plugin)} | ${p1(f.pass_hat_k)} | ${p1(f.true_hat)} |`,
      );
  });
  it("chapter 4: the tie and the sample sizes", () => {
    const t = tree();
    expect(RESULTS).toContain(
      `Tasks per agent to detect that difference at 80% power: ${t.tie.n_unpaired.toLocaleString("en-GB")} (unpaired)`,
    );
    for (const d of t.uncertainty.sizes.diffs as Obj[])
      expect(RESULTS).toContain(
        `| ${p1(d.delta)} | ${d.unpaired.toLocaleString("en-GB")} | ${d.paired.toLocaleString("en-GB")} |`,
      );
  });
});

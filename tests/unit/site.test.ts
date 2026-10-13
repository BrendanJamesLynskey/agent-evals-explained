/**
 * The small modules around the engine: number formats, the palette, the chapter catalogue and
 * the site constants.
 */
import { describe, expect, it } from "vitest";

import {
  clip,
  fmtInt,
  fmtMs,
  fmtTokens,
  fmtUsd,
  pct,
  trim,
} from "@/lib/format";
import {
  SECTIONS,
  getSectionMeta,
  isValidSlug,
  readSectionMdx,
} from "@/lib/mdx/sections";
import { ARXIV, GITHUB_URL, PAPERS, SITE_URL, repoFile } from "@/lib/site";
import {
  AGENT_COLOUR,
  METHOD_COLOUR,
  METHOD_LABEL,
  OUTCOME_COLOUR,
  PASSK_COLOUR,
} from "@/lib/viz/palette";

describe("format", () => {
  it("durations", () => {
    expect(fmtMs(0)).toBe("0 s");
    expect(fmtMs(850)).toBe("850 ms");
    expect(fmtMs(12345)).toBe("12.3 s");
    expect(fmtMs(125_000)).toBe("2 min 5 s");
    expect(fmtMs(119_800)).toBe("2 min 0 s");
  });
  it("money, counts, percentages, clipping", () => {
    expect(fmtUsd(0)).toBe("$0");
    expect(fmtUsd(0.00236)).toBe("$0.00236");
    expect(fmtUsd(1.234)).toBe("$1.23");
    expect(fmtTokens(4342)).toBe("4,342 tokens");
    expect(fmtInt(1234.4)).toBe("1,234");
    expect(pct(0.531)).toBe("53%");
    expect(trim(0)).toBe("0");
    expect(clip("short")).toBe("short");
    expect(clip("a few words that will not fit in the space", 20)).toBe(
      "a few words that…",
    );
    expect(clip("abcdefghijklmnopqrstuvwxyz", 10)).toBe("abcdefghi…");
  });
});

describe("palette", () => {
  it("every method, curve, outcome and agent has a colour", () => {
    for (const m of [METHOD_COLOUR, PASSK_COLOUR, OUTCOME_COLOUR, AGENT_COLOUR])
      for (const v of Object.values(m)) expect(v).toMatch(/^#[0-9A-F]{6}$/i);
    expect(Object.keys(METHOD_LABEL)).toEqual(Object.keys(METHOD_COLOUR));
  });
});

describe("chapters and site", () => {
  it("catalogue", async () => {
    expect(SECTIONS).toHaveLength(10);
    expect(getSectionMeta("03-pass-at-k-and-pass-hat-k").title).toBe(
      "pass@k and pass^k",
    );
    expect(isValidSlug("05-comparing-two-agents")).toBe(true);
    expect(isValidSlug("10-cost-aware-evaluation")).toBe(true);
    expect(isValidSlug("99-nope")).toBe(false);
    expect(await readSectionMdx("01-what-an-eval-is")).toMatch(
      /^<EvalLoopWidget>/,
    );
  });
  it("constants", () => {
    expect(SITE_URL).toBe("https://agent-evals-explained.vercel.app");
    expect(repoFile("README.md")).toBe(`${GITHUB_URL}/blob/main/README.md`);
    expect(ARXIV(PAPERS.swebench)).toBe("https://arxiv.org/abs/2310.06770");
  });
});

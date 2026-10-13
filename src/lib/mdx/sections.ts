/**
 * Chapter catalogue + filesystem loader for /learn content.
 *
 * MDX sources live under `/content/chapters/`, one per idea, each built
 * around an animation. Their slugs and order are defined here (single source
 * of truth); the `[slug]` route validates incoming params against this list
 * before reading from disk. Same shape as the companion sites'
 * `src/lib/mdx/sections.ts`.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const SECTIONS = [
  {
    slug: "01-what-an-eval-is",
    title: "What an eval is",
    summary:
      "Tasks, runs, a grader and a score: runs accumulate on a small benchmark and the uncertainty band shrinks, but more slowly than it seems once you count tasks, not runs, as the unit.",
  },
  {
    slug: "02-the-benchmarks",
    title: "The benchmarks",
    summary:
      "SWE-bench, τ-bench, GAIA, WebArena, OSWorld and Terminal-Bench from their papers: what each measures, how it grades, and its known problems; then one SWE-bench-style task, issue to patch to hidden tests.",
  },
  {
    slug: "03-pass-at-k-and-pass-hat-k",
    title: "pass@k and pass^k",
    summary:
      "Some one of k tries passes, or all k do: the unbiased estimators derived, and the two curves pulling apart as k grows. Why reliability, not best-of-k, is what an agent's user feels.",
  },
  {
    slug: "04-uncertainty",
    title: "Uncertainty",
    summary:
      "The benchmark rerun again and again: Wald, Wilson, exact and bootstrap intervals and which ones cover the truth; why a few tenths of a point on a 500-task benchmark is a tie; and how many tasks you need.",
  },
  {
    slug: "05-comparing-two-agents",
    title: "Comparing two agents",
    summary:
      "Two agents on the same tasks: the paired difference and McNemar's test against the unpaired comparison, the correlation that pairing exploits, and how seeds and repeated runs add or remove variance.",
  },
  {
    slug: "06-graders",
    title: "Graders",
    summary:
      "Unit tests, LLM judges and people: a simulated judge with position, length and self-preference biases, the swap test and what it cannot fix, Cohen's κ, and correcting a lenient pass/fail judge with a labelled calibration set.",
  },
  {
    slug: "07-trajectories",
    title: "Trajectories, not just outcomes",
    summary:
      "Grade the path as well as the result: wasted steps, unsafe actions run or stopped, verification and false claims, on scripted runs and on traces recorded from a small open-weights model.",
  },
  {
    slug: "08-the-harness",
    title: "The harness is part of the result",
    summary:
      "One simulated model under sixteen harness configurations (tools, call format, turn budget, model), run through the engine's harness: the same model 30 points apart, measured with paired comparisons.",
  },
  {
    slug: "09-contamination",
    title: "Contamination and leakage",
    summary:
      "Leaked benchmark tasks inflate a score; n-gram overlap finds verbatim copies and misses paraphrases, canary strings say only that something leaked, and a time split shows the score dropping at the training cutoff.",
  },
  {
    slug: "10-cost-aware-evaluation",
    title: "Cost-aware evaluation",
    summary:
      "Success against dollars per task: the Pareto front of the harness configurations, dollars per solved task, why more retries cost more per success when attempts are correlated, and why the front is itself an estimate.",
  },
] as const;

export type SectionSlug = (typeof SECTIONS)[number]["slug"];

const SLUG_SET = new Set<string>(SECTIONS.map((s) => s.slug));

export function isValidSlug(slug: string): slug is SectionSlug {
  return SLUG_SET.has(slug);
}

export function getSectionMeta(slug: SectionSlug): (typeof SECTIONS)[number] {
  return SECTIONS.find((s) => s.slug === slug) ?? SECTIONS[0];
}

/** Read the raw MDX source for a chapter, or `null` if it doesn't exist. */
export async function readSectionMdx(
  slug: SectionSlug,
): Promise<string | null> {
  const path = join(process.cwd(), "content", "chapters", `${slug}.mdx`);
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

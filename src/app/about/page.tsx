/**
 * /about: what the site is, what the engine computes and what it leaves out, how the animations are
 * driven and checked, and how the statistics are tested. Server Component, static.
 */
import Link from "next/link";

import VENDORED from "@/lib/engine/vendor/VENDORED.json";
import DATA from "@/lib/engine/vendor/evals_data.json";
import { formatValue, lookup } from "@/lib/evals/values";
import {
  ARXIV,
  CONTEXT_URL,
  DECODER_URL,
  ENGINE_URL,
  GITHUB_URL,
  HARNESSES_URL,
  INFERENCE_URL,
  ORCHESTRATION_URL,
  PAPERS,
  PAPERS_07,
  PROTOCOLS_URL,
  TRADEOFFS_URL,
  repoFile,
} from "@/lib/site";

export const metadata = {
  title: "About",
  description:
    "What Agent Evals Explained's engine computes, how its statistics are tested against scipy and statsmodels, what is illustrative, and how Python and the browser are checked to agree exactly.",
};

const A =
  "focus-ring rounded text-accent underline underline-offset-2 dark:text-indigo-300";

export default function AboutPage(): JSX.Element {
  const v = (path: string, fmt: Parameters<typeof formatValue>[1]) =>
    formatValue(lookup(path), fmt);
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent dark:text-indigo-300">
        /about
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        About this site
      </h1>
      <div className="mdx-content mt-6">
        <p>
          Agent Evals Explained is about measuring agents: what an eval is, the
          benchmarks agents are quoted on (described from their papers), pass@k
          against pass^k, the uncertainty in a score and how many tasks it takes
          to shrink it, and comparing two agents. Five more chapters (graders
          and judges, trajectories, the harness, contamination and cost) are
          coming. Every chapter is built around an animation. It is the fifth of
          a family of agent sites, after{" "}
          <a href={HARNESSES_URL} className={A}>
            Agent Harnesses Explained
          </a>
          ,{" "}
          <a href={PROTOCOLS_URL} className={A}>
            Agent Protocols Explained
          </a>
          ,{" "}
          <a href={CONTEXT_URL} className={A}>
            Agent Context Explained
          </a>{" "}
          and{" "}
          <a href={ORCHESTRATION_URL} className={A}>
            Agent Orchestration Explained
          </a>
          , next to the LLM-systems sites (the{" "}
          <a href={DECODER_URL} className={A}>
            Transformer Decoder Explainer
          </a>
          ,{" "}
          <a href={INFERENCE_URL} className={A}>
            LLM Inference Explained
          </a>
          ,{" "}
          <a href={TRADEOFFS_URL} className={A}>
            Inference Trade-offs Explained
          </a>{" "}
          and others, all in the header&apos;s menu).
        </p>

        <h2>A synthetic benchmark</h2>
        <p>
          No real agent is run. The engine draws a population of{" "}
          {v("consts.population.size", "int")} tasks, each with a difficulty and
          a discrimination, under the two-parameter logistic model of item
          response theory (applied to language-model benchmarks by{" "}
          <a href={ARXIV(PAPERS.tinybenchmarks)} className={A}>
            tinyBenchmarks
          </a>
          ); an agent is a skill; a run passes with probability{" "}
          <code>1 / (1 + exp(−a(θ − b)))</code>. Runs on one task can be
          correlated by a chosen amount. A benchmark samples tasks from the
          population, so its score estimates the population&apos;s, the view{" "}
          <a href={ARXIV(PAPERS.errorbars)} className={A}>
            Miller (2024)
          </a>{" "}
          takes. Because the truth is known, every interval can be checked
          against it. Chapter 2&apos;s task is SWE-bench&apos;s grading rule run
          on a three-function toy repository by the engine&apos;s harness with a
          scripted model.
        </p>

        <h2>The engine, and how it is tested</h2>
        <p>
          The engine is{" "}
          <a href={ENGINE_URL} className={A}>
            Agent_Loop_Sim
          </a>
          &apos;s evals module (engine {DATA.version}): a Python reference with
          a TypeScript port, vendored here at commit{" "}
          <code>{VENDORED.commit.slice(0, 7)}</code> with every file&apos;s
          SHA-256 recorded. In the engine&apos;s CI:
        </p>
        <ul>
          <li>
            the estimators are tested against scipy and statsmodels: the
            binomial and beta functions, Wald, Wilson and Clopper–Pearson
            intervals, cluster-robust standard errors (statsmodels&apos; OLS),
            McNemar&apos;s test (exact and corrected), the two-proportion test
            and the paired and Welch <em>t</em> statistics; pass@k and pass^k
            against exact combinatorics; the power formulas against simulation;
          </li>
          <li>
            the special functions underneath (exp, ln Γ, the incomplete beta
            function, the normal distribution and its quantile) are written out
            from published algorithms (fdlibm, Numerical Recipes, Marsaglia,
            Wichura&apos;s AS 241), so the browser computes every value bit for
            bit as Python does: the TS port reproduces every fixture exactly,
            with no tolerance.
          </li>
        </ul>
        <ul>
          <li>
            In this site&apos;s CI, the Python reference installed from the
            vendored commit regenerates{" "}
            <a
              href={repoFile("tests/fixtures/site_fixtures.json")}
              className={A}
            >
              this site&apos;s fixtures
            </a>{" "}
            (everything each chapter animates), and the unit tests require the
            vendored TS engine to reproduce them exactly.
          </li>
          <li>
            Every number in the prose is computed by the engine when the page is
            built, never typed in. The recorded run is on the{" "}
            <Link href="/data" className={A}>
              data page
            </Link>
            .
          </li>
          <li>
            Every code block in a chapter is cut from the vendored engine, and
            every equation compiles; end-to-end tests play, step, scrub and
            reset every animation in light and dark mode at desktop and phone
            widths, and check its captions at key steps against the Python
            reference&apos;s frames.
          </li>
        </ul>

        <h2>What is illustrative</h2>
        <ul>
          <li>
            The task population (difficulty spread{" "}
            {v("consts.population.difficulty_sd", "num")}, discrimination{" "}
            {v("consts.population.a_lo", "num")} to{" "}
            {v("consts.population.a_hi", "num")}), every agent&apos;s skill,
            every within-task correlation, the number of tasks, runs, reruns and
            bootstrap resamples. Nothing is fitted to a real benchmark or model.
          </li>
          <li>
            Chapter 2&apos;s repository, issue, patches and agent. The benchmark
            table quotes each paper at its release; benchmarks are revised, so
            check the current version before comparing.
          </li>
          <li>
            The statistics are not illustrative: they are the standard
            estimators, computed exactly under the stated assumptions.
          </li>
        </ul>

        <h2>Accessibility</h2>
        <p>
          Every animation has keyboard controls (Space plays or pauses, the
          arrow keys step), a live caption read out by screen readers, and
          starts paused when the reader prefers reduced motion. Colours come
          from Okabe and Ito&apos;s colour-blind-safe palette, and nothing is
          told by colour alone: a failed run, and an interval that misses, are
          also hatched.
        </p>

        <h2>Source</h2>
        <p>
          The site&apos;s source is on{" "}
          <a href={GITHUB_URL} className={A}>
            GitHub
          </a>{" "}
          (MIT). For the papers behind the chapters, see{" "}
          <a href={PAPERS_07} className={A}>
            Papers 07: Evaluation and Benchmarks
          </a>
          .
        </p>
      </div>
    </main>
  );
}

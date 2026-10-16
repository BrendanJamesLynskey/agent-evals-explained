import type { Route } from "next";
import Link from "next/link";

import { CheckedStrip, StartButton } from "@/components/ui/Landing";
import { SECTIONS } from "@/lib/mdx/sections";
import { formatValue, lookup } from "@/lib/evals/values";
import { ENGINE_URL } from "@/lib/site";
import { PASSK_COLOUR } from "@/lib/viz/palette";
import { ReadingOrder } from "@/components/ui/ReadingOrder";

const LINK =
  "focus-ring rounded underline decoration-accent/40 underline-offset-4 hover:decoration-accent";

/**
 * Landing page: what the site is, a picture of pass@k against pass^k (computed by the engine at
 * build time), and the ways in. Server Component with no client JavaScript of its own.
 */
export default function HomePage(): JSX.Element {
  const v = (path: string, fmt: Parameters<typeof formatValue>[1]) =>
    formatValue(lookup(path), fmt);
  const frames = (
    lookup("passk.study.frames") as { [k: string]: number }[]
  ).map((f) => ({ k: f.k!, at: f.pass_at_k!, hat: f.pass_hat_k! }));
  const W = 300;
  const H = 150;
  const x = (k: number) => 24 + ((W - 32) * (k - 1)) / (frames.length - 1);
  const y = (p: number) => 8 + (H - 30) * (1 - p);
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-accent dark:text-indigo-300">
        Agent Evals Explained
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Is the agent good, and how sure are you?
      </h1>
      <div className="mt-6 grid items-start gap-8 md:grid-cols-[1fr_minmax(0,22rem)]">
        <div>
          <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
            An interactive guide to measuring agents honestly: pass rates,
            uncertainty, comparisons and graders, on a synthetic benchmark whose
            truth is known.
          </p>
          <div className="mt-6">
            <StartButton href={`/learn/${SECTIONS[0]!.slug}` as Route} />
          </div>
        </div>
        <figure
          data-hero-figure
          className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label="pass@k rising and pass^k falling as k goes from 1 to 10."
          >
            <polyline
              points={frames.map((f) => `${x(f.k)},${y(f.at)}`).join(" ")}
              fill="none"
              stroke={PASSK_COLOUR.at}
              strokeWidth={2.5}
            />
            <polyline
              points={frames.map((f) => `${x(f.k)},${y(f.hat)}`).join(" ")}
              fill="none"
              stroke={PASSK_COLOUR.hat}
              strokeWidth={2.5}
              strokeDasharray="6 3"
            />
            <text
              x={x(frames.length)}
              y={y(frames[frames.length - 1]!.at) - 6}
              textAnchor="end"
              fontSize={13}
              className="fill-neutral-700 dark:fill-neutral-300"
            >
              pass@k
            </text>
            <text
              x={x(frames.length)}
              y={y(frames[frames.length - 1]!.hat) - 6}
              textAnchor="end"
              fontSize={13}
              className="fill-neutral-700 dark:fill-neutral-300"
            >
              pass^k
            </text>
            <text
              x={x(1)}
              y={H - 4}
              fontSize={13}
              className="fill-neutral-600 dark:fill-neutral-400"
            >
              k = 1
            </text>
            <text
              x={x(frames.length)}
              y={H - 4}
              textAnchor="end"
              fontSize={13}
              className="fill-neutral-600 dark:fill-neutral-400"
            >
              k = {frames.length}
            </text>
          </svg>
          <figcaption className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            Chapter 3: the same agent, &ldquo;some one of k tries passes&rdquo;
            against &ldquo;all k pass&rdquo; ({v("pk.10.pass_at_k", "pct")}{" "}
            against {v("pk.10.pass_hat_k", "pct")} at k = 10). Computed by the
            engine at build time.
          </figcaption>
        </figure>
      </div>
      <CheckedStrip href="/about#engine">
        The estimators are tested against scipy and statsmodels on a synthetic
        benchmark whose truth is known, and the TypeScript engine in your
        browser reproduces every Python fixture bit for bit.
      </CheckedStrip>
      <section aria-labelledby="learn-heading" className="mt-12">
        <h2 id="learn-heading" className="text-xl font-semibold tracking-tight">
          What you&apos;ll learn
        </h2>
        <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
          An agent&apos;s score is a <strong>measurement</strong>: a sample of
          tasks, a few noisy runs on each, and a grader that can be fooled. This
          site takes the measurement apart. The benchmarks agents are quoted on,
          from their papers; <em>pass@k</em> against <em>pass^k</em>, best of k
          against reliable every time; intervals and which of them keep their
          promise; why two scores a few tenths apart are a tie; how comparing
          two agents on the same tasks gives a sharper answer for free; then the
          grader itself (LLM judges and their biases, grading the whole
          trajectory), the harness the score was measured in, leaked tasks, and
          what each point of success costs.
        </p>
        <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
          The animations are driven by{" "}
          <a href={ENGINE_URL} className={LINK}>
            Agent_Loop_Sim
          </a>
          &apos;s evals module, identically in Python and in your browser: a
          synthetic benchmark under an item-response model, and the standard
          estimators, each tested against scipy and statsmodels. On a{" "}
          {v("consts.tie.n", "int")}-task benchmark, two agents run on separate
          tasks must differ by about {v("tie.mde_unpaired", "pp1")} before a
          test at 80% power reliably tells them apart; and the same simulated
          model scores from {v("spread.small.min", "pct")} to{" "}
          {v("spread.small.max", "pct")} depending only on its harness. No
          language model runs anywhere.
        </p>
      </section>
      <ReadingOrder current="evals" />
      <nav aria-label="Chapters" className="mt-12 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s, i) => (
          <Link
            key={s.slug}
            href={`/learn/${s.slug}`}
            className="focus-ring group rounded-lg border border-neutral-200 p-5 hover:border-accent dark:border-neutral-800 dark:hover:border-indigo-400"
          >
            <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-1 font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {s.summary}
            </p>
          </Link>
        ))}
      </nav>
      <p className="mt-12 text-sm text-neutral-600 dark:text-neutral-400">
        Part of a family of sixteen companion sites in four tracks, all in the
        site menu above: Foundations (
        <a
          href="https://transformer-decoder-explained.vercel.app"
          className={LINK}
        >
          Decoder
        </a>
        ,{" "}
        <a
          href="https://transformer-training-explained.vercel.app"
          className={LINK}
        >
          Training
        </a>
        ), Hardware (
        <a href="https://gpu-kernels-explained.vercel.app" className={LINK}>
          Kernels
        </a>
        ,{" "}
        <a href="https://systolic-arrays-explained.vercel.app" className={LINK}>
          Systolic
        </a>
        ,{" "}
        <a href="https://ai-accelerators-explained.vercel.app" className={LINK}>
          Accelerators
        </a>
        ,{" "}
        <a href="https://ai-racks-explained.vercel.app" className={LINK}>
          Racks
        </a>
        ), Inference (
        <a href="https://llm-inference-explained.vercel.app" className={LINK}>
          Serving
        </a>
        ,{" "}
        <a
          href="https://llm-architectures-explained.vercel.app"
          className={LINK}
        >
          Architectures
        </a>
        ,{" "}
        <a href="https://numerics-explained.vercel.app" className={LINK}>
          Numerics
        </a>
        ,{" "}
        <a
          href="https://inference-tradeoffs-explained.vercel.app"
          className={LINK}
        >
          Trade-offs
        </a>
        ) and Agents (
        <a href="https://agent-harnesses-explained.vercel.app" className={LINK}>
          Harnesses
        </a>
        ,{" "}
        <a href="https://agent-protocols-explained.vercel.app" className={LINK}>
          Protocols
        </a>
        ,{" "}
        <a href="https://agent-context-explained.vercel.app" className={LINK}>
          Context
        </a>
        ,{" "}
        <a
          href="https://agent-orchestration-explained.vercel.app"
          className={LINK}
        >
          Orchestration
        </a>
        , <strong className="font-medium">Evals</strong>,{" "}
        <a href="https://agent-security-explained.vercel.app" className={LINK}>
          Security
        </a>
        ). It is the fifth of the six agent sites. How this one was built, and
        how to check it:{" "}
        <Link href="/about" className={LINK}>
          about
        </Link>
        .
      </p>
    </main>
  );
}

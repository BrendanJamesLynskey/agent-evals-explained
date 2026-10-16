/**
 * /data: the engine's recorded run, as tables. Every value is computed by the vendored engine when
 * the page is built, the same numbers as the engine's fixtures/evals_results.md (checked in
 * tests/unit/values.test.ts). Server Component, static.
 */
import type { ReactNode } from "react";

import { MdxTable } from "@/components/ui/MdxTable";
import type { Obj } from "@/lib/engine";
import { lookup, tree } from "@/lib/evals/values";
import { fmtInt, pct } from "@/lib/format";
import { ENGINE_URL, repoFile } from "@/lib/site";
import { withShare } from "@/lib/share";

export const metadata = withShare("/data", {
  title: "Data",
  description:
    "The evals engine's recorded run: the score as runs accumulate, pass@k and pass^k by k, interval coverage over reruns, exact coverage, sample sizes, two agents compared, the SWE-style task's verdicts, the simulated judge, graded trajectories, the harness study, contamination and cost.",
});

const A =
  "focus-ring rounded text-accent underline underline-offset-2 dark:text-indigo-300";

function T({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <MdxTable>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </MdxTable>
  );
}

const iv = (x: number[]) => `${pct(x[0]!, 1)} to ${pct(x[1]!, 1)}`;

export default function DataPage(): JSX.Element {
  const t = tree();
  const loop = t.loop.study as Obj;
  const T1 = loop.cfg.tasks as number;
  const unc = t.uncertainty as Obj;
  const tie = unc.tie as Obj;
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-accent dark:text-indigo-300">
        /data
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        The recorded run
      </h1>
      <div className="mdx-content mt-6">
        <p>
          Everything the chapters quote, computed by the vendored{" "}
          <a href={ENGINE_URL} className={A}>
            engine
          </a>{" "}
          as this page was built; the engine records the same run in{" "}
          <a href={repoFile("src/data/evals_results.md")} className={A}>
            evals_results.md
          </a>{" "}
          and{" "}
          <a href={repoFile("src/data/evals2_results.md")} className={A}>
            evals2_results.md
          </a>
          . Every task, skill, bias, leak and correlation is synthetic; token
          counts and costs are the harness&apos;s own accounting.
        </p>

        <h2>Chapter 1: runs accumulating</h2>
        <T
          head={["after", "runs", "score", "Wilson 95%", "tasks as unit 95%"]}
          rows={Array.from({ length: loop.cfg.runs as number }, (_, r) => {
            const f = (loop.frames as Obj[])[(r + 1) * T1 - 1]!;
            return [
              `run ${r + 1} of every task`,
              fmtInt(f.n),
              pct(f.p, 1),
              iv(f.wilson),
              iv(f.cluster),
            ];
          })}
        />

        <h2>Chapter 2: one SWE-bench-style task</h2>
        <T
          head={[
            "patch",
            "hidden tests",
            "FAIL_TO_PASS",
            "PASS_TO_PASS",
            "verdict",
          ]}
          rows={Object.values(t.swe.anatomies as Obj).map((a: Obj) => [
            a.patch,
            a.test_patch,
            a.grade.f2p_ok ? "pass" : "fail",
            a.grade.p2p_ok ? "pass" : "fail",
            a.grade.resolved ? "resolved" : "not resolved",
          ])}
        />

        <h2>Chapter 3: pass@k and pass^k</h2>
        <T
          head={["k", "pass@k", "true", "plug-in", "pass^k", "true"]}
          rows={(t.passk.study.frames as Obj[]).map((f) => [
            f.k,
            pct(f.pass_at_k, 1),
            pct(f.true_at, 1),
            pct(f.plugin, 1),
            pct(f.pass_hat_k, 1),
            pct(f.true_hat, 1),
          ])}
        />

        <h2>Chapter 4: coverage over {unc.cfg.replicates} reruns</h2>
        <T
          head={[
            "tasks",
            "reruns draw",
            "truth",
            "Wald",
            "Wilson",
            "exact",
            "bootstrap",
          ]}
          rows={Object.values(unc.studies as Obj).map((u: Obj) => [
            u.size,
            u.mode === "tasks" ? "new tasks and runs" : "new runs only",
            pct(u.truth, 1),
            pct(u.coverage.wald),
            pct(u.coverage.wilson),
            pct(u.coverage.exact),
            pct(u.coverage.bootstrap),
          ])}
        />
        <p>Exact coverage of a nominal 95% interval, lowest over p:</p>
        <T
          head={["n", "Wald", "Wilson", "exact"]}
          rows={Object.entries(t.cover as Obj).map(([n, c]) => [
            n,
            pct((c as Obj).wald_min, 1),
            pct((c as Obj).wilson_min, 1),
            pct((c as Obj).exact_min, 1),
          ])}
        />
        <p>
          The tie: {pct(tie.test.p1, 1)} against {pct(tie.test.p2, 1)} on{" "}
          {unc.tie.cfg.n} tasks, p = {tie.test.p.toFixed(3)}; tasks per agent to
          detect it at 80% power: {fmtInt(tie.n_unpaired)}.
        </p>
        <T
          head={[
            "difference",
            "tasks per agent, unpaired",
            "shared tasks, paired",
          ]}
          rows={(unc.sizes.diffs as Obj[]).map((d) => [
            `${(d.delta * 100).toFixed(1)} points`,
            fmtInt(d.unpaired),
            fmtInt(d.paired),
          ])}
        />

        <h2>Chapter 5: two agents on the same tasks</h2>
        <T
          head={[
            "runs per task",
            "A − B",
            "paired 95%",
            "unpaired 95%",
            "McNemar p",
          ]}
          rows={Object.entries(t.pair as Obj).map(([m, p]) => [
            m,
            `${((p as Obj).delta * 100).toFixed(1)} points`,
            iv((p as Obj).ci_paired),
            iv((p as Obj).ci_unpaired),
            ((p as Obj).mcnemar.exact_p as number).toFixed(4),
          ])}
        />
        <p>
          True difference on these tasks:{" "}
          {((lookup("pair.1.truth") as number) * 100).toFixed(1)} points.
        </p>

        <h2>Chapter 6: a simulated judge</h2>
        <T
          head={[
            "biases",
            "accuracy, one order",
            "κ, one order",
            "first shown wins",
            "orders agree",
            "κ, swapped",
            "right where decided",
          ]}
          rows={Object.values(t.jd as Obj).map((r: Obj) => [
            r.setting,
            pct(r.accuracy1, 1),
            r.k1.toFixed(2),
            pct(r.first_share, 1),
            pct(r.consistency, 1),
            r.kd.toFixed(2),
            pct(r.accuracy_decided, 1),
          ])}
        />
        <p>
          Pass/fail grading: unit tests {pct(t.gr.tests_rate, 1)}, the judge{" "}
          {pct(t.gr.judge_rate, 1)}, corrected{" "}
          {pct(t.gr.corrected.corrected, 1)} (95% {iv(t.gr.corrected.ci)}).
        </p>

        <h2>Chapter 7: grading trajectories</h2>
        <T
          head={[
            "trajectory",
            "outcome",
            "self-report",
            "trajectory",
            "wasted",
            "unsafe run / stopped",
            "score",
          ]}
          rows={Object.values(t.tr as Obj).map((r: Obj) => [
            r.title,
            r.grades.outcome ? "pass" : "fail",
            r.grades.self_report ? "pass" : "fail",
            r.grades.trajectory ? "pass" : "fail",
            r.waste,
            `${r.counts.unsafe_run} / ${r.counts.unsafe_stopped}`,
            (r.score as number).toFixed(2),
          ])}
        />

        <h2>Chapter 8: one model, many harnesses</h2>
        <T
          head={[
            "model",
            "tools",
            "calls",
            "turns",
            "resolved",
            "Wilson 95%",
            "model calls",
            "$ a run",
          ]}
          rows={Object.values(t.hx as Obj).map((c: Obj) => [
            c.agent,
            c.tools === "test" ? "with a shell" : "read/edit",
            c.style,
            c.budget,
            pct(c.rate, 1),
            iv(c.wilson),
            (c.turns as number).toFixed(2),
            `$${(c.cost_per_run as number).toFixed(4)}`,
          ])}
        />

        <h2>Chapter 9: contamination</h2>
        <T
          head={[
            "leak rate",
            "leaked",
            "flagged (verbatim / paraphrase)",
            "score",
            "clean",
            "flagged dropped",
            "before − after cutoff",
          ]}
          rows={Object.entries(t.ct as Obj)
            .filter(([k]) => /^[0-9.]+$/.test(k))
            .map(([, v]) => {
              const l = v as Obj;
              return [
                pct(l.leak),
                l.leaked,
                `${l.flagged_verbatim} of ${l.verbatim} / ${l.flagged_paraphrased} of ${l.paraphrased}`,
                pct(l.rate, 1),
                pct(l.clean_rate, 1),
                pct(l.rate_kept, 1),
                `${(l.gap * 100).toFixed(1)} points (p = ${(l.split.p as number).toFixed(3)})`,
              ];
            })}
        />

        <h2>Chapter 10: cost</h2>
        <T
          head={[
            "configuration",
            "resolved",
            "$ a task",
            "$ per solved",
            "front",
          ]}
          rows={(t.cost.cost.points as Obj[]).map((q) => [
            q.id.replaceAll("|", " · "),
            pct(q.rate, 1),
            `$${(q.cost as number).toFixed(4)}`,
            `$${(q.per_solved as number).toFixed(4)}`,
            q.front ? "yes" : "",
          ])}
        />
      </div>
    </main>
  );
}

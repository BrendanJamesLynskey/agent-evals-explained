"use client";

/**
 * Chapter 2: the anatomy of one SWE-bench-style task. The issue and the repository at its base
 * commit; the agent's steps (the engine's harness with a scripted model); its patch as a diff;
 * the hidden FAIL_TO_PASS and PASS_TO_PASS tests run before and after; the verdict. Three patches
 * (the right fix, an overfit one, one that breaks another function) under two test patches
 * (thorough, weak). Frames written by the Python reference (src/data/swe.json).
 */
import { useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Segmented, Stat } from "@/components/ui/Controls";
import type { Obj } from "@/lib/engine";
import { clip } from "@/lib/format";
import { OUTCOME_COLOUR } from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const PANEL =
  "min-w-0 rounded border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-950";
const HEAD =
  "mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500 dark:text-neutral-400";

/** Pass and fail as text: darker shades of the palette's hues, for contrast (WCAG AA). */
const PASS_TEXT = "text-emerald-800 dark:text-emerald-300";
const FAIL_TEXT = "text-orange-800 dark:text-orange-300";

const PATCHES = [
  { value: "fix", label: "Right fix" },
  { value: "overfit", label: "Overfit" },
  { value: "collateral", label: "Breaks sub()" },
] as const;
const TESTS = [
  { value: "thorough", label: "Thorough" },
  { value: "weak", label: "Weak" },
] as const;

export default function SweTaskWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("swe");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Swe data={st.data}>{children}</Swe>;
}

function Mark({ ok }: { ok: boolean | undefined }): JSX.Element {
  if (ok === undefined)
    return <span className="text-neutral-400 dark:text-neutral-500">·</span>;
  return (
    <span
      className={`inline-block rounded border px-1.5 font-mono text-[0.7rem] font-semibold ${ok ? `border-solid ${PASS_TEXT}` : `border-dashed ${FAIL_TEXT}`}`}
      style={{ borderColor: ok ? OUTCOME_COLOUR.pass : OUTCOME_COLOUR.fail }}
    >
      {ok ? "pass" : "FAIL"}
    </span>
  );
}

function Swe({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const [patch, setPatch] = useState<string>("fix");
  const [tests, setTests] = useState<string>("thorough");
  const [hover, setHover] = useState<string | null>(null);
  const a = (data.anatomies as Obj)[`${patch}|${tests}`] as Obj;
  const frames = a.frames as Obj[];
  const s = useStepper(frames.length, {
    stepMs: 1300,
    resetKey: `${patch}|${tests}`,
  });
  const f = frames[s.step]!;
  const stageAt = (stage: string) => frames.findIndex((x) => x.stage === stage);
  const patchAt = stageAt("patch");
  const shownCalls =
    f.stage === "task" ? 0 : f.stage === "agent" ? f.call + 1 : a.calls.length;
  const testIdx = (t: string) => frames.findIndex((x) => x.test === t);
  const revealed = (t: string) => s.step >= testIdx(t);
  const isF2P = (t: string) => (a.fail_to_pass as string[]).includes(t);
  const hl =
    f.stage === "test"
      ? isF2P(f.test)
        ? "f2p"
        : "p2p"
      : f.stage === "verdict"
        ? "res"
        : "";
  const focus = hover ?? hl;
  const tests_ = [
    ...(a.fail_to_pass as string[]),
    ...(a.pass_to_pass as string[]),
  ];
  const g = a.grade as Obj;

  const visual = (
    <div className="grid min-w-0 gap-3 md:grid-cols-2" data-stage={f.stage}>
      <div className={PANEL} data-testid="swe-task">
        <p className={HEAD}>Issue</p>
        <p className="whitespace-pre-wrap break-words text-neutral-800 dark:text-neutral-200">
          {a.issue}
        </p>
        <p className={`${HEAD} mt-3`}>Repository at the base commit</p>
        <ul className="font-mono text-neutral-700 dark:text-neutral-300">
          {Object.keys(a.base as Obj).map((p) => (
            <li key={p}>{p}</li>
          ))}
          <li className="text-neutral-500 dark:text-neutral-400">
            test_issue.py{" "}
            <span className="font-sans">
              {s.step >= stageAt("test") ? "(added for grading)" : "(hidden)"}
            </span>
          </li>
        </ul>
      </div>
      <div className={PANEL} data-testid="swe-agent">
        <p className={HEAD}>The agent&apos;s steps</p>
        <ol className="space-y-1">
          {(a.calls as Obj[]).map((c, i) => (
            <li
              key={i}
              data-call={i}
              data-shown={i < shownCalls ? "true" : "false"}
              className={`rounded px-1 font-mono ${i < shownCalls ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-300 dark:text-neutral-700"} ${f.stage === "agent" && f.call === i ? "ring-2 ring-indigo-500" : ""}`}
            >
              {i + 1}. {c.name}
              {c.args.path
                ? ` ${c.args.path}`
                : c.args.command
                  ? ` ${c.args.command}`
                  : ""}
              {i < shownCalls && (
                <span className="block break-words pl-4 font-sans text-[0.7rem] text-neutral-500 dark:text-neutral-400">
                  → {clip(String(c.text).split("\n").slice(0, 3).join(" "), 70)}
                </span>
              )}
            </li>
          ))}
        </ol>
        {s.step >= patchAt && (
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Says: &ldquo;{a.answer}&rdquo;
          </p>
        )}
      </div>
      <div className={PANEL} data-testid="swe-patch">
        <p className={HEAD}>The patch (calc.py)</p>
        {s.step >= patchAt ? (
          <div className="font-mono">
            {(a.diff as Obj[])
              .filter((d) => d.text !== "" || d.kind !== "same")
              .map((d, i) => (
                <div
                  key={i}
                  data-diff={d.kind}
                  className={`whitespace-pre-wrap break-words ${d.kind === "add" ? PASS_TEXT : d.kind === "del" ? `${FAIL_TEXT} line-through` : ""}`}
                >
                  {d.kind === "add" ? "+ " : d.kind === "del" ? "- " : "  "}
                  {d.text}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400">
            No patch yet: the agent is still working.
          </p>
        )}
      </div>
      <div className={PANEL} data-testid="swe-tests">
        <p className={HEAD}>Hidden tests ({tests})</p>
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="text-neutral-500 dark:text-neutral-400">
              <th className="w-1/2 font-normal">test</th>
              <th className="font-normal">base</th>
              <th className="font-normal">patched</th>
            </tr>
          </thead>
          <tbody>
            {tests_.map((t) => (
              <tr
                key={t}
                data-test={t}
                data-focus={
                  (focus === "f2p" && isF2P(t)) ||
                  (focus === "p2p" && !isF2P(t))
                    ? "true"
                    : "false"
                }
                className={
                  (focus === "f2p" && isF2P(t)) ||
                  (focus === "p2p" && !isF2P(t))
                    ? "bg-indigo-50 dark:bg-indigo-950"
                    : ""
                }
              >
                <td className="break-words py-0.5 pr-1 font-mono">
                  <span className="block text-[0.65rem] text-neutral-500 dark:text-neutral-400">
                    {isF2P(t) ? "FAIL_TO_PASS" : "PASS_TO_PASS"}
                  </span>
                  {t.split("::")[1]}
                </td>
                <td>
                  <Mark ok={revealed(t) ? g.before[t] : undefined} />
                </td>
                <td>
                  <Mark ok={revealed(t) ? g.after[t] : undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {f.stage === "verdict" && (
          <p
            data-testid="verdict"
            data-resolved={g.resolved ? "true" : "false"}
            className={`mt-3 rounded border-2 px-2 py-1 font-semibold ${g.resolved ? `border-solid ${PASS_TEXT}` : `border-dashed ${FAIL_TEXT}`}`}
            style={{
              borderColor: g.resolved
                ? OUTCOME_COLOUR.pass
                : OUTCOME_COLOUR.fail,
            }}
          >
            {g.resolved ? "Resolved" : "Not resolved"}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <AnimationPanel
      testId="swe-widget"
      title="One task: issue, patch, hidden tests"
      summary="A SWE-bench-style task on a three-function repository: the agent (the engine's harness, scripted) edits the code; then tests it never saw decide. From the engine's evals module."
      stepper={s}
      stepLabel="stage"
      caption={f.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Agent steps" value={String(a.calls.length)} />
          <Stat
            label="FAIL_TO_PASS"
            value={
              s.step >= stageAt("verdict") ? (g.f2p_ok ? "pass" : "fail") : "…"
            }
          />
          <Stat
            label="PASS_TO_PASS"
            value={
              s.step >= stageAt("verdict") ? (g.p2p_ok ? "pass" : "fail") : "…"
            }
          />
          <Stat
            label="Verdict"
            value={
              s.step >= stageAt("verdict")
                ? g.resolved
                  ? "resolved"
                  : "not resolved"
                : "…"
            }
          />
        </div>
      }
      params={
        <>
          <Segmented
            label="The agent's patch"
            value={patch}
            options={PATCHES}
            onChange={setPatch}
          />
          <Segmented
            label="Hidden tests"
            value={tests}
            options={TESTS}
            onChange={setTests}
          />
        </>
      }
    />
  );
}

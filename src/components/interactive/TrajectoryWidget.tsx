"use client";

/**
 * Chapter 7: grading the path. One trajectory at a time (scripted runs and the three traces recorded
 * from Qwen2.5-1.5B, replayed through the harness), event by event: what the agent did, the grader's
 * flags (waste, unsafe actions run or stopped, retries, a false or unverified claim) and the running
 * tallies; at the end the three verdicts (outcome, self-report, trajectory) and the process score.
 * Data written by the Python reference (src/data/trajectory.json), equal to the engine's fixtures.
 */
import { useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Choice, Stat } from "@/components/ui/Controls";
import type { Obj } from "@/lib/engine";
import { OKABE_ITO, OUTCOME_COLOUR } from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const PASS_TEXT = "text-emerald-800 dark:text-emerald-300";
const FAIL_TEXT = "text-orange-800 dark:text-orange-300";
const TYPE_LABEL: Record<string, string> = {
  model_call: "model",
  tool_call: "call",
  tool_result: "result",
  retry: "retry",
  error: "error",
  run_end: "end",
};

function flagKind(
  f: string,
): "waste" | "unsafe" | "stopped" | "claim" | "info" {
  if (f.startsWith("unsafe action ran") || f.startsWith("unsafe:"))
    return "unsafe";
  if (f === "stopped by the harness" || f === "unsafe action stopped")
    return "stopped";
  if (f === "false claim" || f === "unverified claim") return "claim";
  if (f === "retry") return "info";
  return "waste";
}

const FLAG_STYLE: Record<string, string> = {
  waste:
    "border-amber-700 text-amber-900 dark:border-amber-300 dark:text-amber-200",
  unsafe:
    "border-dashed border-orange-700 text-orange-900 dark:border-orange-300 dark:text-orange-200",
  stopped:
    "border-fuchsia-800 text-fuchsia-900 dark:border-fuchsia-300 dark:text-fuchsia-200",
  claim:
    "border-dashed border-orange-700 font-semibold text-orange-900 dark:border-orange-300 dark:text-orange-200",
  info: "border-neutral-500 text-neutral-700 dark:border-neutral-400 dark:text-neutral-300",
};

export default function TrajectoryWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("trajectory");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Traj data={st.data}>{children}</Traj>;
}

function Verdict({ label, ok }: { label: string; ok: boolean }): JSX.Element {
  return (
    <div
      data-verdict={label}
      data-pass={ok ? "true" : "false"}
      className="flex items-center justify-between gap-2 rounded border bg-white px-2 py-1 text-xs dark:bg-neutral-950"
      style={{ borderColor: ok ? OUTCOME_COLOUR.pass : OUTCOME_COLOUR.fail }}
    >
      <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
      <span className={`font-mono font-semibold ${ok ? PASS_TEXT : FAIL_TEXT}`}>
        {ok ? "pass" : "fail"}
      </span>
    </div>
  );
}

function Traj({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const rows = data.rows as Obj[];
  const [id, setId] = useState<string>("qwen-react");
  const [hover, setHover] = useState<string | null>(null);
  const row = rows.find((r) => r.id === id) ?? rows[0]!;
  const frames = row.frames as Obj[];
  const s = useStepper(frames.length, { stepMs: 900, resetKey: id });
  const f = frames[s.step]!;
  const last = s.step === frames.length - 1;
  const c = f.counts as Obj;
  const shown = frames.slice(Math.max(0, s.step - 7), s.step + 1);
  const flags = f.flags as string[];
  const focus =
    hover ??
    (flags.some((x) => flagKind(x) === "unsafe")
      ? "unsafe"
      : flags.some((x) => flagKind(x) === "waste")
        ? "waste"
        : last
          ? "verify"
          : "");
  const visual = (
    <div className="grid min-w-0 gap-3 md:grid-cols-[1fr_14rem]">
      <ol
        className="min-w-0 space-y-1 font-mono text-[0.72rem]"
        data-testid="trajectory-events"
        aria-label="The trajectory so far, latest last"
      >
        {shown.map((g) => (
          <li
            key={g.seq}
            data-type={g.type}
            className={`min-w-0 rounded border px-2 py-1 ${g === f ? "border-sky-700 bg-sky-50 dark:border-sky-400 dark:bg-sky-950" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"}`}
          >
            <span className="mr-2 inline-block w-12 text-neutral-600 dark:text-neutral-400">
              {TYPE_LABEL[g.type as string]}
            </span>
            <span className="break-words text-neutral-900 dark:text-neutral-100">
              {g.label}
            </span>
            {(g.flags as string[]).length > 0 && (
              <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
                {(g.flags as string[]).map((x) => (
                  <span
                    key={x}
                    data-flag={flagKind(x)}
                    className={`rounded border px-1 font-sans text-[0.7rem] ${FLAG_STYLE[flagKind(x)]}`}
                  >
                    {x}
                  </span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="grid min-w-0 content-start gap-2">
        <div className="rounded border border-neutral-200 bg-white p-2 text-xs dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-1 text-[0.7rem] uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            Tallies so far
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-2 font-mono">
            <dt>model calls</dt>
            <dd>{c.model_calls}</dd>
            <dt>tool calls</dt>
            <dd>{c.tool_calls}</dd>
            <dt>malformed</dt>
            <dd>{c.malformed}</dd>
            <dt>failed / repeated</dt>
            <dd>
              {c.failed} / {c.repeats}
            </dd>
            <dt>unsafe run / stopped</dt>
            <dd>
              {c.unsafe_run} / {c.unsafe_stopped}
            </dd>
          </dl>
        </div>
        {last ? (
          <div className="grid gap-1" data-testid="verdicts">
            <Verdict label="Outcome" ok={row.grades.outcome} />
            <Verdict label="Self-report" ok={row.grades.self_report} />
            <Verdict label="Trajectory" ok={row.grades.trajectory} />
          </div>
        ) : (
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            The verdicts come at the end of the run.
          </p>
        )}
        <div
          className="h-2 rounded bg-neutral-200 dark:bg-neutral-800"
          aria-hidden
        >
          <div
            className="h-2 rounded"
            style={{
              width: `${((s.step + 1) / frames.length) * 100}%`,
              background: OKABE_ITO.blue,
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <AnimationPanel
      testId="trajectory-widget"
      title="Grade the path, not just the end"
      summary="A trajectory event by event, with the grader's flags and tallies, then three verdicts. Scripted runs and three traces recorded from Qwen2.5-1.5B-Instruct, replayed through the engine's harness."
      stepper={s}
      stepLabel="event"
      caption={f.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Status" value={row.status} hint={row.source} />
          <Stat
            label="Wasted steps"
            value={String(
              (c.malformed as number) +
                (c.failed as number) +
                (c.repeats as number) +
                (c.loops as number),
            )}
            hint="malformed, failed, repeated"
          />
          <Stat
            label="Verified"
            value={last ? (row.verified ? "yes" : "no") : "…"}
            hint={
              row.task === "fix"
                ? "tests after the last edit"
                : "calculator used"
            }
          />
          <Stat
            label="Process score"
            value={last ? (row.score as number).toFixed(2) : "…"}
            hint={`${(row.tokens as number).toLocaleString("en-GB")} tokens`}
          />
        </div>
      }
      params={
        <Choice
          label="Trajectory"
          value={id}
          options={rows.map((r) => ({
            value: r.id as string,
            label: r.title as string,
          }))}
          onChange={setId}
        />
      }
    />
  );
}

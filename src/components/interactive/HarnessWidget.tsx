"use client";

/**
 * Chapter 8: the harness is part of the result. One simulated model on twelve one-function bug
 * fixes, eight runs each, through the engine's harness under one scaffold (tools, call style, turn
 * budget): the runs fill in one at a time (resolved, or not, with their model calls), and beside them
 * every scaffold's success rate with its 95% interval for both models, the chosen one's estimate
 * moving as its runs come in. Data written by the Python reference (src/data/harness.json), equal to
 * the engine's fixtures; captions by the engine's `captionRun`.
 */
import { useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Choice, Segmented, Stat } from "@/components/ui/Controls";
import { useSvgFont } from "@/components/viz/useSvgFont";
import type { Obj } from "@/lib/engine";
import {
  AGENT_COLOUR,
  MUTED,
  OKABE_ITO,
  OUTCOME_COLOUR,
} from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { Hatch } from "./Hatch";
import { useEngine } from "./useEngine";

const GW = 360;
const BW = 360;
const MODELS = [
  { value: "small", label: "Smaller" },
  { value: "large", label: "Larger" },
] as const;
type Model = (typeof MODELS)[number]["value"];
const SCAFFOLDS = [
  ["edit|native|4", "Read/edit only, native calls"],
  ["edit|react|4", "Read/edit only, ReAct text"],
  ["test|native|4", "With tests, native, 4 turns"],
  ["test|native|8", "With tests, native, 8 turns"],
  ["test|native|16", "With tests, native, 16 turns"],
  ["test|react|4", "With tests, ReAct, 4 turns"],
  ["test|react|8", "With tests, ReAct, 8 turns"],
  ["test|react|16", "With tests, ReAct, 16 turns"],
] as const;
const SHORT: Record<string, string> = {
  "edit|native|4": "edit · native",
  "edit|react|4": "edit · ReAct",
  "test|native|4": "tests · native · 4",
  "test|native|8": "tests · native · 8",
  "test|native|16": "tests · native · 16",
  "test|react|4": "tests · ReAct · 4",
  "test|react|8": "tests · ReAct · 8",
  "test|react|16": "tests · ReAct · 16",
};

export default function HarnessWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("harness");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Harness data={st.data}>{children}</Harness>;
}

function Harness({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const [model, setModel] = useState<Model>("small");
  const [scaf, setScaf] = useState<string>("test|native|16");
  const [hover, setHover] = useState<string | null>(null);
  const id = `${model}|${scaf}`;
  const rows = data.rows[id] as Obj[];
  const caps = data.captions[id] as string[];
  const tasks = data.tasks as Obj[];
  const R = data.cfg.runs as number;
  const s = useStepper(rows.length, { stepMs: 260, resetKey: id });
  const r = rows[s.step]!;
  const gfont = useSvgFont(GW);
  const bfont = useSvgFont(BW);
  const by: Record<string, Obj> = {};
  for (const c of data.configs as Obj[]) by[c.id] = c;
  const conf = by[id]!;
  let k = 0;
  let cost = 0;
  for (const x of rows.slice(0, s.step + 1)) {
    k += x.resolved ? 1 : 0;
    cost += x.cost;
  }
  const n = s.step + 1;
  const focus = hover ?? (scaf.startsWith("test") ? "tries" : "mu");

  // the grid: one row per task, one column per run
  const gf = gfont.fs(10);
  const LBL = gf * 5.2;
  const cell = (GW - LBL - 4) / R;
  const top = gf + 6;
  const GH = top + tasks.length * cell + 4;

  // the bars: every scaffold, both models
  const bf = bfont.fs(10);
  const BL = bf * 8.4;
  const row = bf * 2.6;
  const btop = bf + 8;
  const BH = btop + SCAFFOLDS.length * row + bf * 2;
  const bx = (v: number) => BL + (BW - BL - bf * 1.4) * v;

  const visual = (
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
      <svg
        ref={gfont.ref}
        viewBox={`0 0 ${GW} ${GH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${n} of ${rows.length} runs: ${k} resolved. One row per task, one column per run.`}
        data-testid="run-grid"
      >
        <defs>
          <Hatch id="harness-hatch" colour={OUTCOME_COLOUR.fail} />
        </defs>
        <text
          x={0}
          y={gf}
          style={{ fontSize: gf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          task
        </text>
        <text
          x={GW}
          y={gf}
          textAnchor="end"
          style={{ fontSize: gf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          runs →
        </text>
        {tasks.map((t, i) => (
          <text
            key={t.name}
            x={0}
            y={top + i * cell + cell / 2 + gf / 3}
            style={{ fontSize: gf }}
            className="fill-neutral-700 dark:fill-neutral-300"
          >
            {t.name}
          </text>
        ))}
        {rows.slice(0, n).map((x, i) => (
          <g key={i} data-run={x.resolved ? "resolved" : "failed"}>
            <rect
              x={LBL + x.j * cell + 1}
              y={top + x.t * cell + 1}
              width={cell - 2}
              height={cell - 2}
              rx={2}
              fill={x.resolved ? OUTCOME_COLOUR.pass : "url(#harness-hatch)"}
              stroke={
                i === s.step
                  ? OKABE_ITO.black
                  : x.resolved
                    ? "none"
                    : OUTCOME_COLOUR.fail
              }
              strokeWidth={i === s.step ? 2 : 0.8}
              className={i === s.step ? "dark:stroke-white" : ""}
            />
            {cell > gf * 1.6 && (
              <text
                x={LBL + x.j * cell + cell / 2}
                y={top + x.t * cell + cell / 2 + gf / 3}
                textAnchor="middle"
                style={{ fontSize: gf }}
                className={
                  x.resolved
                    ? "fill-white"
                    : "fill-neutral-900 dark:fill-neutral-100"
                }
              >
                {x.turns}
              </text>
            )}
          </g>
        ))}
      </svg>
      <svg
        ref={bfont.ref}
        viewBox={`0 0 ${BW} ${BH}`}
        className="h-auto w-full"
        role="img"
        aria-label="Success rate with 95% interval for every scaffold and both models; the chosen scaffold's running estimate."
        data-testid="scaffold-bars"
      >
        <text
          x={BL}
          y={bf}
          style={{ fontSize: bf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          resolved, % (95% interval)
        </text>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={bx(v)}
              x2={bx(v)}
              y1={btop - 2}
              y2={btop + SCAFFOLDS.length * row}
              stroke={MUTED.light}
              strokeWidth={0.5}
            />
            <text
              x={bx(v)}
              y={btop + SCAFFOLDS.length * row + bf + 2}
              textAnchor="middle"
              style={{ fontSize: bf }}
              className="fill-neutral-600 dark:fill-neutral-400"
            >
              {v * 100}
            </text>
          </g>
        ))}
        {SCAFFOLDS.map(([sc], i) => {
          const y = btop + i * row;
          const cur = sc === scaf;
          return (
            <g
              key={sc}
              data-scaffold={sc}
              data-current={cur ? "true" : "false"}
            >
              {cur && (
                <rect
                  x={0}
                  y={y}
                  width={BW}
                  height={row}
                  fill={OKABE_ITO.sky}
                  opacity={0.15}
                />
              )}
              <text
                x={0}
                y={y + row / 2 + bf / 3}
                style={{ fontSize: bf }}
                className="fill-neutral-700 dark:fill-neutral-300"
              >
                {SHORT[sc]}
              </text>
              {(["small", "large"] as const).map((m, j) => {
                const c = by[`${m}|${sc}`]!;
                const yy = y + row * (0.28 + 0.44 * j);
                return (
                  <g key={m} data-model={m}>
                    <line
                      x1={bx(c.wilson[0])}
                      x2={bx(c.wilson[1])}
                      y1={yy}
                      y2={yy}
                      stroke={m === "small" ? AGENT_COLOUR.a : AGENT_COLOUR.b}
                      strokeWidth={2}
                      opacity={m === model ? 1 : 0.55}
                    />
                    <circle
                      cx={bx(c.rate)}
                      cy={yy}
                      r={3}
                      fill={m === "small" ? AGENT_COLOUR.a : AGENT_COLOUR.b}
                    />
                  </g>
                );
              })}
              {cur && (
                <path
                  d={`M ${bx(k / n)} ${y + 1} l -4 -0 l 4 7 l 4 -7 z`}
                  fill={OKABE_ITO.black}
                  className="dark:fill-white"
                  data-running="true"
                />
              )}
            </g>
          );
        })}
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 md:col-span-2 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: OUTCOME_COLOUR.pass }}
          />
          resolved (the number: model calls)
        </li>
        <li className="flex items-center gap-1">
          <svg width={12} height={12} aria-hidden>
            <defs>
              <Hatch id="harness-hatch-key" colour={OUTCOME_COLOUR.fail} />
            </defs>
            <rect
              width={12}
              height={12}
              fill="url(#harness-hatch-key)"
              stroke={OUTCOME_COLOUR.fail}
            />
          </svg>
          not resolved
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4"
            style={{ background: AGENT_COLOUR.a }}
          />
          smaller model
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4"
            style={{ background: AGENT_COLOUR.b }}
          />
          larger model
        </li>
        <li className="flex items-center gap-1">
          <span className="text-neutral-900 dark:text-neutral-100">▼</span>
          the chosen scaffold so far
        </li>
      </ul>
    </div>
  );

  return (
    <AnimationPanel
      testId="harness-widget"
      title="Same model, different harness, different score"
      summary="A simulated model fixes twelve bugs, eight runs each, through the engine's harness. Change the tools, the call style and the turn budget, or the model. Costs are the harness's own token accounting."
      stepper={s}
      stepLabel="run"
      caption={caps[s.step]!}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Resolved so far"
            value={`${k} of ${n}`}
            hint={`all runs ${(conf.rate * 100).toFixed(1)}%`}
          />
          <Stat
            label="Model calls a run"
            value={(conf.turns as number).toFixed(2)}
            hint={`malformed ${(conf.malformed as number).toFixed(2)}`}
          />
          <Stat
            label="$ a run"
            value={`$${(cost / n).toFixed(4)}`}
            hint={`all runs $${(conf.cost_per_run as number).toFixed(4)}`}
          />
          <Stat
            label="This run"
            value={r.resolved ? "resolved" : "not resolved"}
            hint={`${r.edits} edit${r.edits === 1 ? "" : "s"}, ${r.status}`}
          />
        </div>
      }
      params={
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Segmented
            label="Model"
            value={model}
            options={MODELS}
            onChange={setModel}
          />
          <Choice
            label="Scaffold"
            value={scaf}
            options={SCAFFOLDS.map(([value, label]) => ({ value, label }))}
            onChange={setScaf}
          />
        </div>
      }
    />
  );
}

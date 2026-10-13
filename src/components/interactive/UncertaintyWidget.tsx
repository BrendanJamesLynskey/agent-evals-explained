"use client";

/**
 * Chapter 4: the benchmark repeated. Thirty repeats of a 50-, 200- or 500-task benchmark (new
 * tasks and new runs, or the same tasks with new runs); each repeat's 95% interval by the chosen
 * method, drawn against the truth, and the scores' histogram; beside them every method's
 * coverage so far. Frames from the engine's evals `uncertaintyStudy`.
 */
import { useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Hatch } from "@/components/interactive/Hatch";
import { Segmented, Stat } from "@/components/ui/Controls";
import { useSvgFont } from "@/components/viz/useSvgFont";
import type { Obj } from "@/lib/engine";
import { pct } from "@/lib/format";
import {
  METHOD_COLOUR,
  METHOD_LABEL,
  MUTED,
  OKABE_ITO,
  OUTCOME_COLOUR,
} from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const FW = 360;
const HW = 360;
const METHODS = ["wald", "wilson", "exact", "bootstrap"] as const;

export default function UncertaintyWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("uncertainty");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Unc data={st.data}>{children}</Unc>;
}

function Unc({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const [size, setSize] = useState<string>("200");
  const [mode, setMode] = useState<string>("tasks");
  const [method, setMethod] = useState<string>("wilson");
  const [hover, setHover] = useState<string | null>(null);
  const study = (data.studies as Obj)[`${size}|${mode}`] as Obj;
  const frames = study.frames as Obj[];
  const s = useStepper(frames.length, {
    stepMs: 650,
    resetKey: `${size}|${mode}|${method}`,
  });
  const f = frames[s.step]!;
  const truth = study.truth as number;
  const focus = hover ?? (f.hit[method] ? "ci" : "miss");
  const ffont = useSvgFont(FW);
  const hfont = useSvgFont(HW);

  // a domain wide enough for every method's intervals in this study
  let lo = truth;
  let hi = truth;
  for (const g of frames)
    for (const m of METHODS) {
      lo = Math.min(lo, g.ivs[m][0]);
      hi = Math.max(hi, g.ivs[m][1]);
    }
  lo = Math.max(0, lo - 0.01);
  hi = Math.min(1, hi + 0.01);

  const ff = ffont.fs(10);
  const X0 = 4;
  const PW = FW - 8;
  const rowH = 7;
  const top = ff + 6;
  const FH = top + frames.length * rowH + ff + 8;
  const xf = (v: number) => X0 + (PW * (v - lo)) / (hi - lo);

  const hf = hfont.fs(10);
  const HX0 = hf * 7.2;
  const HPW = HW - HX0 - 8;
  const HTOP = 6;
  const HH1 = 90;
  const bins = 12;
  const counts = new Array<number>(bins).fill(0);
  for (const g of frames.slice(0, s.step + 1)) {
    const b = Math.min(
      bins - 1,
      Math.max(0, Math.floor(((g.p - lo) / (hi - lo)) * bins)),
    );
    counts[b] = counts[b]! + 1;
  }
  const maxc = Math.max(4, ...counts);
  const bw = HPW / bins;
  const covTop = HTOP + HH1 + hf * 2.6;
  const covRow = hf * 1.7;
  const HH = covTop + METHODS.length * covRow + hf + 6;
  const xh = (v: number) => HX0 + (HPW * (v - lo)) / (hi - lo);
  // coverage bars use the left 78% of the width, leaving room for the counts
  const CPW = HPW * 0.78;
  const xc = (v: number) => HX0 + CPW * v;
  const done = s.step + 1;

  const visual = (
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
      <svg
        ref={ffont.ref}
        viewBox={`0 0 ${FW} ${FH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${frames.length} repeats of a ${size}-task benchmark: each repeat's ${METHOD_LABEL[method]} interval against the truth.`}
        data-testid="forest"
      >
        <defs>
          <Hatch id="unc-miss" colour={OUTCOME_COLOUR.fail} />
        </defs>
        <text
          x={X0}
          y={ff}
          style={{ fontSize: ff }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          repeat 1 → {frames.length}
        </text>
        <text
          x={FW - 4}
          y={ff}
          textAnchor="end"
          style={{ fontSize: ff }}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          {METHOD_LABEL[method]!.split(" ")[0]}
        </text>
        {frames.slice(0, s.step + 1).map((g, i) => {
          const [a, b] = g.ivs[method] as number[];
          const hit = g.hit[method] as boolean;
          const y = top + i * rowH;
          const cur = i === s.step;
          return (
            <g key={i} data-rep={i} data-hit={hit ? "true" : "false"}>
              <rect
                x={xf(a!)}
                y={y + 1}
                width={Math.max(1, xf(b!) - xf(a!))}
                height={rowH - 2}
                fill={hit ? METHOD_COLOUR[method] : "url(#unc-miss)"}
                opacity={hit ? (focus === "ci" && cur ? 0.9 : 0.55) : 1}
                stroke={cur ? OKABE_ITO.black : "none"}
                strokeWidth={cur ? 1 : 0}
                className={cur ? "dark:stroke-neutral-100" : undefined}
              />
              <circle
                cx={xf(g.p)}
                cy={y + rowH / 2}
                r={cur && focus === "phat" ? 3 : 1.8}
                fill={OKABE_ITO.black}
                className="dark:fill-neutral-100"
              />
            </g>
          );
        })}
        <line
          x1={xf(truth)}
          x2={xf(truth)}
          y1={top - 2}
          y2={top + frames.length * rowH}
          stroke={OKABE_ITO.black}
          strokeWidth={1.5}
          strokeDasharray="3 2"
          className="dark:stroke-neutral-100"
          data-testid="truth"
        />
        <text
          x={xf(truth)}
          y={FH - 3}
          textAnchor="middle"
          style={{ fontSize: ff }}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          truth {pct(truth, 1)}
        </text>
      </svg>
      <svg
        ref={hfont.ref}
        viewBox={`0 0 ${HW} ${HH}`}
        className="h-auto w-full"
        role="img"
        aria-label="The repeats' scores as a histogram, and each interval method's coverage so far against the 95% it promises."
        data-testid="coverage-bars"
      >
        {counts.map((c, i) => (
          <rect
            key={i}
            x={HX0 + i * bw + 0.5}
            y={HTOP + HH1 - (HH1 * c) / maxc}
            width={bw - 1}
            height={(HH1 * c) / maxc}
            fill={MUTED.light}
          />
        ))}
        <line
          x1={xh(truth)}
          x2={xh(truth)}
          y1={HTOP}
          y2={HTOP + HH1}
          stroke={OKABE_ITO.black}
          strokeDasharray="3 2"
          className="dark:stroke-neutral-100"
        />
        <line
          x1={HX0}
          x2={HX0 + HPW}
          y1={HTOP + HH1}
          y2={HTOP + HH1}
          stroke={MUTED.light}
        />
        <text
          x={HX0}
          y={HTOP + HH1 + hf + 2}
          style={{ fontSize: hf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {pct(lo)}
        </text>
        <text
          x={HX0 + HPW}
          y={HTOP + HH1 + hf + 2}
          textAnchor="end"
          style={{ fontSize: hf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {pct(hi)}
        </text>
        <text
          x={0}
          y={HTOP + hf}
          style={{ fontSize: hf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          scores
        </text>
        <text
          x={0}
          y={covTop - hf * 0.6}
          style={{ fontSize: hf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          covered so far
        </text>
        {METHODS.map((m, i) => {
          const y = covTop + i * covRow;
          const c = (f.covered[m] as number) / done;
          return (
            <g key={m} data-method={m}>
              <text
                x={0}
                y={y + covRow * 0.65}
                style={{ fontSize: hf }}
                fontWeight={m === method ? 700 : 400}
                className="fill-neutral-700 dark:fill-neutral-300"
              >
                {METHOD_LABEL[m]!.split(" ")[0]}
              </text>
              <rect
                x={xc(0)}
                y={y + 2}
                width={CPW * c}
                height={covRow - 4}
                fill={METHOD_COLOUR[m]}
                opacity={m === method ? 0.9 : 0.5}
              />
              <text
                x={HX0 + HPW}
                y={y + covRow * 0.65}
                textAnchor="end"
                style={{ fontSize: hf }}
                className="fill-neutral-900 dark:fill-neutral-100"
              >
                {f.covered[m]}/{done}
              </text>
            </g>
          );
        })}
        <line
          x1={xc(0.95)}
          x2={xc(0.95)}
          y1={covTop}
          y2={covTop + METHODS.length * covRow}
          stroke={OKABE_ITO.black}
          strokeDasharray="2 2"
          className="dark:stroke-neutral-100"
        />
        <text
          x={xc(0.95)}
          y={HH - 2}
          textAnchor="end"
          style={{ fontSize: hf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          95%
        </text>
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 md:col-span-2 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-4"
            style={{ background: METHOD_COLOUR[method], opacity: 0.6 }}
          />
          interval covers the truth
        </li>
        <li className="flex items-center gap-1">
          <svg width="16" height="10" aria-hidden="true">
            <defs>
              <Hatch id="unc-miss-key" colour={OUTCOME_COLOUR.fail} />
            </defs>
            <rect width="16" height="10" fill="url(#unc-miss-key)" />
          </svg>
          interval misses it
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-black dark:border-neutral-300" />
          the truth (
          {mode === "tasks" ? "the population's score" : "these tasks' score"})
        </li>
      </ul>
    </div>
  );

  return (
    <AnimationPanel
      testId="uncertainty-widget"
      title="Thirty reruns of one benchmark: which intervals catch the truth?"
      summary="Each step reruns the benchmark and draws its 95% interval; the bars count how often each method has covered the true score so far. From the engine's evals module."
      stepper={s}
      stepLabel="repeat"
      caption={f.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="This repeat"
            value={pct(f.p, 1)}
            hint={`${f.k} of ${size}`}
          />
          <Stat
            label={`${METHOD_LABEL[method]!.split(" ")[0]} interval`}
            value={`${pct(f.ivs[method][0], 1)} – ${pct(f.ivs[method][1], 1)}`}
          />
          <Stat
            label="Covered so far"
            value={`${f.covered[method]} / ${done}`}
          />
          <Stat
            label="Mean width"
            value={pct(study.mean_width[method], 1)}
            hint={`over ${frames.length} repeats`}
          />
        </div>
      }
      params={
        <>
          <Segmented
            label="Tasks per benchmark"
            value={size}
            options={["50", "200", "500"].map((v) => ({ value: v, label: v }))}
            onChange={setSize}
          />
          <Segmented
            label="Each rerun draws"
            value={mode}
            options={[
              { value: "tasks", label: "New tasks and runs" },
              { value: "runs", label: "New runs only" },
            ]}
            onChange={setMode}
          />
          <Segmented
            label="Interval"
            value={method}
            options={METHODS.map((m) => ({
              value: m,
              label: METHOD_LABEL[m]!.split(" ")[0]!,
            }))}
            onChange={setMethod}
          />
        </>
      }
    />
  );
}

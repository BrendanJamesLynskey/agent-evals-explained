"use client";

/**
 * Chapter 9: contamination. 400 synthetic tasks by creation quarter, a training cutoff after quarter
 * 3; at a chosen leak rate, tasks from before the cutoff leak into the training data (verbatim or
 * paraphrased); an 8-gram scan flags what it can; the agent runs (leaked tasks answered from memory);
 * then the score by quarter, before and after the cutoff. Five stages, from the engine's evals
 * `contaminationStudy`.
 */
import { useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Segmented, Stat } from "@/components/ui/Controls";
import { useSvgFont } from "@/components/viz/useSvgFont";
import type { Obj } from "@/lib/engine";
import { MUTED, OKABE_ITO, OUTCOME_COLOUR } from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { Hatch } from "./Hatch";
import { useEngine } from "./useEngine";

const W = 360;
const PER_ROW = 5;
const STAGES = ["tasks", "leak", "scan", "run", "split"];
const LEAK = OKABE_ITO.purple;

export default function ContaminationWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("contamination");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Contam data={st.data}>{children}</Contam>;
}

function Contam({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const levels = data.levels as Obj;
  const keys = Object.keys(levels);
  const [leak, setLeak] = useState<string>("0.30");
  const [hover, setHover] = useState<string | null>(null);
  const lv = levels[leak] as Obj;
  const frames = lv.frames as Obj[];
  const s = useStepper(frames.length, { stepMs: 1800, resetKey: leak });
  const stage = STAGES.indexOf(frames[s.step]!.stage as string);
  const font = useSvgFont(W);
  const cfg = data.cfg as Obj;
  const Q = cfg.quarters as number;
  const rows = lv.rows as Obj[];
  const focus =
    hover ?? (stage === 1 || stage === 3 ? "mem" : stage === 2 ? "ngram" : "");

  const fs = font.fs(10);
  const gap = 6;
  const colW = (W - gap * (Q - 1)) / Q;
  const tile = colW / PER_ROW;
  const top = fs * 2 + 8;
  const byQ: Obj[][] = Array.from({ length: Q }, () => []);
  for (const r of rows) byQ[r.quarter as number]!.push(r);
  let maxRows = 0;
  for (const q of byQ)
    maxRows = Math.max(maxRows, Math.ceil(q.length / PER_ROW));
  const gridH = maxRows * tile;
  const barTop = top + gridH + fs * 1.6;
  const barH = stage >= 4 ? 110 : 0;
  const H = barTop + barH + (stage >= 4 ? fs * 2 : 0) + 4;
  const qx = (q: number) => q * (colW + gap);
  const cut = cfg.cutoff as number;
  const cutX = qx(cut) - gap / 2;
  const by = (v: number) => barTop + barH - barH * v;

  const visual = (
    <div className="grid min-w-0 gap-2">
      <svg
        ref={font.ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${rows.length} tasks by creation quarter, the training cutoff after quarter ${cut - 1}; stage: ${STAGES[stage]}.`}
        data-testid="contamination-grid"
        data-stage={STAGES[stage]}
      >
        <defs>
          <Hatch id="contam-hatch" colour={OUTCOME_COLOUR.fail} />
        </defs>
        <rect
          x={0}
          y={top - 4}
          width={cutX}
          height={gridH + 8}
          fill={OKABE_ITO.yellow}
          opacity={0.12}
        />
        <text
          x={cutX / 2}
          y={fs}
          textAnchor="middle"
          style={{ fontSize: fs }}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          before the cutoff
        </text>
        <text
          x={(cutX + W) / 2}
          y={fs}
          textAnchor="middle"
          style={{ fontSize: fs }}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          after
        </text>
        {byQ.map((_, q) => (
          <text
            key={q}
            x={qx(q) + colW / 2}
            y={fs * 2 + 2}
            textAnchor="middle"
            style={{ fontSize: fs }}
            className="fill-neutral-600 dark:fill-neutral-400"
          >
            Q{q}
          </text>
        ))}
        <line
          x1={cutX}
          x2={cutX}
          y1={2}
          y2={H - 2}
          stroke={OKABE_ITO.black}
          strokeDasharray="4 3"
          className="dark:stroke-neutral-300"
        />
        {byQ.map((qs, q) =>
          qs.map((r, i) => {
            const x = qx(q) + (i % PER_ROW) * tile;
            const y = top + Math.floor(i / PER_ROW) * tile;
            const leaked = stage >= 1 && r.leaked;
            let fill: string = MUTED.light;
            let opacity = 0.45;
            if (stage >= 3) {
              fill = r.pass ? OUTCOME_COLOUR.pass : "url(#contam-hatch)";
              opacity = 1;
            } else if (leaked) {
              fill = r.kind === "verbatim" ? LEAK : "none";
              opacity = 1;
            }
            return (
              <g
                key={r.i}
                data-task={r.kind}
                data-flagged={stage >= 2 && r.flagged ? "true" : "false"}
              >
                <rect
                  x={x + 0.6}
                  y={y + 0.6}
                  width={tile - 1.2}
                  height={tile - 1.2}
                  rx={1}
                  fill={fill}
                  opacity={opacity}
                  stroke={leaked ? LEAK : "none"}
                  strokeWidth={leaked ? 1.2 : 0}
                  strokeDasharray={
                    leaked && r.kind === "paraphrase" ? "2 1" : undefined
                  }
                />
                {stage >= 2 && r.flagged && (
                  <circle
                    cx={x + tile / 2}
                    cy={y + tile / 2}
                    r={tile / 4.5}
                    fill={OKABE_ITO.black}
                    className="dark:fill-white"
                  />
                )}
              </g>
            );
          }),
        )}
        {stage >= 4 &&
          (lv.by_quarter as Obj[]).map((b) => {
            const x = qx(b.quarter) + colW * 0.2;
            const w = colW * 0.6;
            return (
              <g key={b.quarter} data-quarter={b.quarter}>
                <rect
                  x={x}
                  y={by(b.rate)}
                  width={w}
                  height={barTop + barH - by(b.rate)}
                  fill={b.quarter < cut ? OKABE_ITO.orange : OKABE_ITO.blue}
                  opacity={0.8}
                />
                <line
                  x1={x + w / 2}
                  x2={x + w / 2}
                  y1={by(b.wilson[1])}
                  y2={by(b.wilson[0])}
                  stroke={OKABE_ITO.black}
                  strokeWidth={1.2}
                  className="dark:stroke-neutral-200"
                />
                <text
                  x={x + w / 2}
                  y={barTop + barH + fs + 2}
                  textAnchor="middle"
                  style={{ fontSize: fs }}
                  className="fill-neutral-700 dark:fill-neutral-300"
                >
                  {Math.round(b.rate * 100)}
                </text>
              </g>
            );
          })}
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span className="inline-block size-3" style={{ background: LEAK }} />
          leaked verbatim
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3 border border-dashed"
            style={{ borderColor: LEAK }}
          />
          leaked as a paraphrase
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-black dark:bg-white" />
          flagged by the 8-gram scan
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: OUTCOME_COLOUR.pass }}
          />
          passed
        </li>
        <li className="flex items-center gap-1">
          <svg width={12} height={12} aria-hidden>
            <defs>
              <Hatch id="contam-hatch-key" colour={OUTCOME_COLOUR.fail} />
            </defs>
            <rect
              width={12}
              height={12}
              fill="url(#contam-hatch-key)"
              stroke={OUTCOME_COLOUR.fail}
            />
          </svg>
          failed
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-4"
            style={{ background: OKABE_ITO.orange, opacity: 0.8 }}
          />
          score by quarter, before / after
          <span
            className="inline-block h-3 w-4"
            style={{ background: OKABE_ITO.blue, opacity: 0.8 }}
          />
        </li>
      </ul>
    </div>
  );

  return (
    <AnimationPanel
      testId="contamination-widget"
      title="Leaked tasks, and what each test can see"
      summary="400 synthetic tasks by creation date; pick a leak rate and step through the leak, an 8-gram scan, the run and the time split. From the engine's evals module."
      stepper={s}
      stepLabel="stage"
      caption={frames[s.step]!.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Score"
            value={stage >= 3 ? `${(lv.rate * 100).toFixed(1)}%` : "…"}
            hint={`clean ${(lv.clean_rate * 100).toFixed(1)}%`}
          />
          <Stat
            label="Leaked"
            value={stage >= 1 ? String(lv.leaked) : "…"}
            hint={`${lv.verbatim} verbatim, ${lv.paraphrased} paraphrased`}
          />
          <Stat
            label="Flagged"
            value={
              stage >= 2
                ? String(
                    lv.flagged_verbatim +
                      lv.flagged_paraphrased +
                      lv.flagged_clean,
                  )
                : "…"
            }
            hint={`canary ${lv.canary ? "found" : "silent"}`}
          />
          <Stat
            label="Before − after"
            value={
              stage >= 4
                ? `${((lv.pre.k / lv.pre.n - lv.post.k / lv.post.n) * 100).toFixed(1)} points`
                : "…"
            }
            hint={
              stage >= 4
                ? `p = ${(lv.split.p as number).toFixed(3)}`
                : "the time split"
            }
          />
        </div>
      }
      params={
        <Segmented
          label="Leak rate"
          value={leak}
          options={keys.map((k) => ({
            value: k,
            label: `${Math.round(Number(k) * 100)}%`,
          }))}
          onChange={setLeak}
        />
      }
    />
  );
}

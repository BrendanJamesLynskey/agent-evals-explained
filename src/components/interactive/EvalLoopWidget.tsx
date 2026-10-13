"use client";

/**
 * Chapter 1, the hero: tasks → runs → grader → score. Forty tasks drawn from the synthetic
 * population, each run three times; every step is one run, graded pass or fail. Beside it the
 * score so far with two 95% bands: Wilson's, which treats every run as independent, and the
 * cluster-robust one, which treats tasks as the unit. Frames from the engine's evals `loopStudy`.
 */
import { useMemo, useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Hatch } from "@/components/interactive/Hatch";
import { Segmented, Stat } from "@/components/ui/Controls";
import { useSvgFont } from "@/components/viz/useSvgFont";
import { E, type Obj } from "@/lib/engine";
import { pct } from "@/lib/format";
import {
  METHOD_COLOUR,
  MUTED,
  OKABE_ITO,
  OUTCOME_COLOUR,
} from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const GW = 360;
const CW = 360;
const COLS = 8;
const CLUSTER = OKABE_ITO.purple;

export default function EvalLoopWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("loop");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Loop data={st.data}>{children}</Loop>;
}

function Loop({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const base = data.study as Obj;
  const cfg = base.cfg as Obj;
  const [rho, setRho] = useState<string>(String(cfg.rho));
  const [hover, setHover] = useState<string | null>(null);
  const study = useMemo(
    () =>
      Number(rho) === cfg.rho
        ? base
        : E.study.loopStudy({ ...cfg, rho: Number(rho) }),
    [base, cfg, rho],
  );
  const frames = study.frames as Obj[];
  const T = cfg.tasks as number;
  const M = cfg.runs as number;
  const s = useStepper(frames.length, { stepMs: 260, resetKey: rho });
  const f = frames[s.step]!;
  const hl = f.n > T ? "cluster" : "naive";
  const focus = hover ?? hl;
  const gfont = useSvgFont(GW);
  const cfont = useSvgFont(CW);

  // the task grid: tiles of M run cells
  const gf = gfont.fs(10);
  const rows = Math.ceil(T / COLS);
  const tileW = GW / COLS;
  const tileH = 30;
  const gtop = gf + 6;
  const GH = gtop + rows * tileH + 4;
  const done = (t: number, j: number) => j * T + t <= s.step;

  // the score chart
  const cf = cfont.fs(10);
  const X0 = cf * 3;
  const Y0 = 6;
  const PW = CW - X0 - 8;
  const PH = 160;
  const CH = Y0 + PH + cf * 2.8;
  const lo = 0.2;
  const xs = (n: number) => X0 + (PW * n) / frames.length;
  const ys = (v: number) => Y0 + PH - (PH * (Math.max(lo, v) - lo)) / (1 - lo);
  const seen = frames.slice(0, s.step + 1);
  const band = (key: "wilson" | "cluster") =>
    seen.map((g) => `${xs(g.n)},${ys(g[key][1])}`).join(" ") +
    " " +
    [...seen]
      .reverse()
      .map((g) => `${xs(g.n)},${ys(g[key][0])}`)
      .join(" ");
  const line = (key: "wilson" | "cluster", i: 0 | 1) =>
    seen.map((g) => `${xs(g.n)},${ys(g[key][i])}`).join(" ");

  const visual = (
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
      <svg
        ref={gfont.ref}
        viewBox={`0 0 ${GW} ${GH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${T} tasks, ${M} runs each: each run graded pass or fail.`}
        data-testid="task-grid"
      >
        <defs>
          <Hatch id="loop-fail" colour={OUTCOME_COLOUR.fail} />
        </defs>
        <text
          x={0}
          y={gf}
          style={{ fontSize: gf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {T} tasks × {M} runs
        </text>
        <text
          x={GW}
          y={gf}
          textAnchor="end"
          style={{ fontSize: gf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {f.k} pass
        </text>
        {Array.from({ length: T }, (_, t) => {
          const cx = (t % COLS) * tileW;
          const cy = gtop + Math.floor(t / COLS) * tileH;
          const cw = (tileW - 6) / M;
          return (
            <g key={t} data-task={t}>
              <rect
                x={cx + 1}
                y={cy + 1}
                width={tileW - 2}
                height={tileH - 2}
                rx={3}
                fill="none"
                stroke={MUTED.light}
                strokeWidth={0.6}
              />
              {Array.from({ length: M }, (_, j) => {
                const x = (study.runs as number[][])[t]![j]!;
                const on = done(t, j);
                const cur = f.task === t && f.run === j;
                return (
                  <rect
                    key={j}
                    data-cell={`${t}-${j}`}
                    data-outcome={on ? (x ? "pass" : "fail") : "pending"}
                    x={cx + 3 + j * cw}
                    y={cy + 4}
                    width={cw - 1.5}
                    height={tileH - 8}
                    rx={1.5}
                    fill={
                      !on
                        ? "transparent"
                        : x
                          ? OUTCOME_COLOUR.pass
                          : "url(#loop-fail)"
                    }
                    opacity={on && x ? 0.7 : 1}
                    stroke={cur ? OKABE_ITO.black : "none"}
                    strokeWidth={cur ? 1.6 : 0}
                    className={cur ? "dark:stroke-neutral-100" : undefined}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <svg
        ref={cfont.ref}
        viewBox={`0 0 ${CW} ${CH}`}
        className="h-auto w-full"
        role="img"
        aria-label="The score after each run with two 95% bands: runs as the unit, and tasks as the unit."
        data-testid="score-chart"
      >
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke={MUTED.light} />
        <line
          x1={X0}
          x2={X0 + PW}
          y1={Y0 + PH}
          y2={Y0 + PH}
          stroke={MUTED.light}
        />
        {[0.2, 0.6, 1].map((v) => (
          <text
            key={v}
            x={X0 - 3}
            y={ys(v) + cf / 3}
            textAnchor="end"
            style={{ fontSize: cf }}
            className="fill-neutral-600 dark:fill-neutral-400"
          >
            {pct(v)}
          </text>
        ))}
        {Array.from({ length: M }, (_, r) => (r + 1) * T).map((n) => (
          <g key={n}>
            <line
              x1={xs(n)}
              x2={xs(n)}
              y1={Y0}
              y2={Y0 + PH}
              stroke={MUTED.light}
              strokeDasharray="2 3"
              strokeWidth={0.6}
            />
            <text
              x={xs(n)}
              y={Y0 + PH + cf + 2}
              textAnchor="end"
              style={{ fontSize: cf }}
              className="fill-neutral-600 dark:fill-neutral-400"
            >
              {n}
            </text>
          </g>
        ))}
        <polygon
          points={band("wilson")}
          fill={METHOD_COLOUR.wilson}
          opacity={focus === "naive" ? 0.45 : 0.25}
          data-band="wilson"
          data-focus={focus === "naive" ? "true" : "false"}
        />
        {([0, 1] as const).map((i) => (
          <polyline
            key={i}
            points={line("cluster", i)}
            fill="none"
            stroke={CLUSTER}
            strokeWidth={focus === "cluster" ? 2.2 : 1.2}
            strokeDasharray="5 3"
            data-band="cluster"
            data-focus={focus === "cluster" ? "true" : "false"}
          />
        ))}
        <line
          x1={X0}
          x2={X0 + PW}
          y1={ys(study.truth_population)}
          y2={ys(study.truth_population)}
          stroke={OKABE_ITO.black}
          strokeDasharray="1 3"
          className="dark:stroke-neutral-300"
        />
        <polyline
          points={seen.map((g) => `${xs(g.n)},${ys(g.p)}`).join(" ")}
          fill="none"
          stroke={OKABE_ITO.black}
          strokeWidth={1.4}
          className="dark:stroke-neutral-100"
        />
        <text
          x={X0 + PW / 2}
          y={CH - 2}
          textAnchor="middle"
          style={{ fontSize: cf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          runs graded
        </text>
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 md:col-span-2 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: OUTCOME_COLOUR.pass, opacity: 0.7 }}
          />
          pass
        </li>
        <li className="flex items-center gap-1">
          <svg width="16" height="10" aria-hidden="true">
            <defs>
              <Hatch id="loop-fail-key" colour={OUTCOME_COLOUR.fail} />
            </defs>
            <rect width="16" height="10" fill="url(#loop-fail-key)" />
          </svg>
          fail
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-4"
            style={{ background: METHOD_COLOUR.wilson, opacity: 0.35 }}
          />
          95% band, runs independent (Wilson)
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-0 w-4 border-t-2 border-dashed"
            style={{ borderColor: CLUSTER }}
          />
          95% band, tasks as the unit
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-dotted border-black dark:border-neutral-300" />
          population&apos;s true score
        </li>
      </ul>
    </div>
  );

  return (
    <AnimationPanel
      testId="loop-widget"
      title="Runs accumulate; the band shrinks, but not as fast as it looks"
      summary="Forty tasks from a synthetic benchmark, three runs each, graded one run at a time; the score with a 95% band that counts runs and one that counts tasks. From the engine's evals module."
      stepper={s}
      stepLabel="run"
      caption={f.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Score" value={pct(f.p, 1)} hint={`${f.k} / ${f.n}`} />
          <Stat
            label="Band, runs as unit"
            value={`± ${pct((f.wilson[1] - f.wilson[0]) / 2, 1)}`}
          />
          <Stat
            label="Band, tasks as unit"
            value={`± ${pct((f.cluster[1] - f.cluster[0]) / 2, 1)}`}
          />
          <Stat
            label="True score"
            value={pct(study.truth_population, 1)}
            hint={`these ${T} tasks: ${pct(study.truth_tasks, 1)}`}
          />
        </div>
      }
      params={
        <Segmented
          label="Correlation within a task"
          value={rho}
          options={["0", "0.5", "0.9"].map((v) => ({ value: v, label: v }))}
          onChange={setRho}
        />
      }
    />
  );
}

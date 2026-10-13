"use client";

/**
 * Chapter 10: cost-aware evaluation. Chapter 8's configurations (two models × tools × call style ×
 * turn budget) placed on the cost–success plane one at a time, cheapest first, each with its 95%
 * interval; the Pareto front of the points placed so far is redrawn at every step. From the engine's
 * evals `costStudy` and `costFrames` over chapter 8's runs.
 */
import { useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Segmented, Stat } from "@/components/ui/Controls";
import { useSvgFont } from "@/components/viz/useSvgFont";
import type { Obj } from "@/lib/engine";
import { AGENT_COLOUR, MUTED, OKABE_ITO } from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const W = 360;
const H = 270;
const WHICH = [
  { value: "all", label: "Both models" },
  { value: "small", label: "Smaller" },
  { value: "large", label: "Larger" },
] as const;
type Which = (typeof WHICH)[number]["value"];

export default function CostWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("cost");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Cost data={st.data}>{children}</Cost>;
}

function Cost({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const [which, setWhich] = useState<Which>("all");
  const [hover, setHover] = useState<string | null>(null);
  const frames = data.frames[which] as Obj[];
  const s = useStepper(frames.length, { stepMs: 900, resetKey: which });
  const f = frames[s.step]!;
  const font = useSvgFont(W);
  const pts: Record<string, Obj> = {};
  for (const p of data.cost.points as Obj[]) pts[p.id] = p;
  const p = pts[f.id]!;
  const focus = hover ?? (f.on ? "front" : "solved");

  const fs = font.fs(10);
  const X0 = fs * 3.2;
  const Y0 = 8;
  const PW = W - X0 - fs * 1.8;
  const PH = H - Y0 - fs * 3.4;
  let cmax = 0;
  for (const q of data.cost.points as Obj[]) cmax = Math.max(cmax, q.cost);
  cmax = Math.ceil(cmax * 1000 + 1) / 1000;
  const ylo = 0.3;
  const xs = (v: number) => X0 + (PW * v) / cmax;
  const ys = (v: number) =>
    Y0 + PH - (PH * (Math.max(ylo, v) - ylo)) / (1 - ylo);
  const placed = frames.slice(0, s.step + 1).map((g) => pts[g.id]!);
  const front = (f.front as string[]).map((id) => pts[id]!);
  const xt: number[] = [];
  for (let v = 0; v <= cmax + 1e-12; v += 0.005) xt.push(v);

  const visual = (
    <svg
      ref={font.ref}
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto h-auto w-full max-w-xl"
      role="img"
      aria-label={`${placed.length} configurations on the plane of cost per task against success rate; ${front.length} on the Pareto front so far.`}
      data-testid="cost-plane"
    >
      {[0.4, 0.6, 0.8, 1].map((v) => (
        <g key={v}>
          <line
            x1={X0}
            x2={X0 + PW}
            y1={ys(v)}
            y2={ys(v)}
            stroke={MUTED.light}
            strokeWidth={0.4}
          />
          <text
            x={X0 - 3}
            y={ys(v) + fs / 3}
            textAnchor="end"
            style={{ fontSize: fs }}
            className="fill-neutral-600 dark:fill-neutral-400"
          >
            {Math.round(v * 100)}
          </text>
        </g>
      ))}
      {xt.map((v) => (
        <text
          key={v}
          x={xs(v)}
          y={Y0 + PH + fs + 2}
          textAnchor="middle"
          style={{ fontSize: fs }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {v === 0 ? "$0" : `$${v.toFixed(3)}`}
        </text>
      ))}
      <text
        x={X0 + PW}
        y={Y0 + PH + 2.3 * fs + 2}
        textAnchor="end"
        style={{ fontSize: fs }}
        className="fill-neutral-600 dark:fill-neutral-400"
      >
        dollars a task →
      </text>
      <text
        x={X0 + 4}
        y={Y0 + fs}
        style={{ fontSize: fs }}
        className="fill-neutral-700 dark:fill-neutral-300"
      >
        resolved, %
      </text>
      <polyline
        points={front.map((q) => `${xs(q.cost)},${ys(q.rate)}`).join(" ")}
        fill="none"
        stroke={OKABE_ITO.black}
        strokeWidth={1.6}
        className="dark:stroke-neutral-200"
        data-front={front.length}
      />
      {placed.map((q) => {
        const col = q.agent === "small" ? AGENT_COLOUR.a : AGENT_COLOUR.b;
        const cur = q.id === f.id;
        return (
          <g
            key={q.id}
            data-point={q.id}
            data-on={(f.front as string[]).includes(q.id) ? "true" : "false"}
          >
            <line
              x1={xs(q.cost)}
              x2={xs(q.cost)}
              y1={ys(q.wilson[1])}
              y2={ys(q.wilson[0])}
              stroke={col}
              strokeWidth={1}
              opacity={0.6}
            />
            {q.tools === "edit" ? (
              <rect
                x={xs(q.cost) - 4}
                y={ys(q.rate) - 4}
                width={8}
                height={8}
                fill={col}
                stroke={cur ? OKABE_ITO.black : "none"}
                strokeWidth={2}
              />
            ) : (
              <circle
                cx={xs(q.cost)}
                cy={ys(q.rate)}
                r={cur ? 5.5 : 4.5}
                fill={col}
                stroke={cur ? OKABE_ITO.black : "none"}
                strokeWidth={2}
              />
            )}
          </g>
        );
      })}
    </svg>
  );

  return (
    <AnimationPanel
      testId="cost-widget"
      title="What each point of success costs"
      summary="Chapter 8's sixteen configurations, cheapest first, on the plane of dollars per task against success, with 95% intervals and the Pareto front. Squares have no shell; circles run the tests. From the engine's evals module."
      stepper={s}
      stepLabel="config"
      caption={f.caption}
      visual={
        <div className="grid min-w-0 gap-2">
          {visual}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 dark:text-neutral-300">
            <li className="flex items-center gap-1">
              <span
                className="inline-block size-3 rounded-full"
                style={{ background: AGENT_COLOUR.a }}
              />
              smaller model
            </li>
            <li className="flex items-center gap-1">
              <span
                className="inline-block size-3 rounded-full"
                style={{ background: AGENT_COLOUR.b }}
              />
              larger model
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block size-3 bg-neutral-500" />
              read/edit only
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-black dark:bg-neutral-200" />
              Pareto front
            </li>
          </ul>
        </div>
      }
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Resolved"
            value={`${(p.rate * 100).toFixed(1)}%`}
            hint={`${(p.wilson[0] * 100).toFixed(1)} to ${(p.wilson[1] * 100).toFixed(1)}`}
          />
          <Stat label="$ a task" value={`$${(p.cost as number).toFixed(4)}`} />
          <Stat
            label="$ per solved"
            value={`$${(p.per_solved as number).toFixed(4)}`}
          />
          <Stat
            label="On the front"
            value={`${front.length} of ${placed.length}`}
            hint={f.on ? "this one is" : "this one is not"}
          />
        </div>
      }
      params={
        <Segmented
          label="Configurations"
          value={which}
          options={WHICH}
          onChange={setWhich}
        />
      }
    />
  );
}

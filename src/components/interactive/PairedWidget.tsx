"use client";

/**
 * Chapter 5: two agents on the same tasks. Tasks arrive ten at a time; each tile is one task's
 * first-run pair (both pass, only A, only B, both fail), so the discordant tiles McNemar's test
 * uses stand out; beside it the estimated difference with its paired and unpaired 95% intervals,
 * and the variance of the difference split into the part from the tasks and the part from the
 * runs. Frames from the engine's evals `pairedStudy`.
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

const GW = 360;
const CW = 360;
const COLS = 20;
const PAIR_FILL: Record<string, string> = {
  "11": "#737373",
  "10": AGENT_COLOUR.a,
  "01": AGENT_COLOUR.b,
  "00": "transparent",
};

export default function PairedWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("paired");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Paired data={st.data}>{children}</Paired>;
}

function Paired({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const [m, setM] = useState<string>("1");
  const [hover, setHover] = useState<string | null>(null);
  const study = (data.studies as Obj)[m] as Obj;
  const frames = study.frames as Obj[];
  const T = study.cfg.tasks as number;
  const s = useStepper(frames.length, { stepMs: 600, resetKey: m });
  const f = frames[s.step]!;
  const c = f.compare as Obj;
  const tab = f.table as Obj;
  const focus = hover ?? (s.step % 2 === 0 ? "disc" : "cov");
  const gfont = useSvgFont(GW);
  const cfont = useSvgFont(CW);
  const a1 = study.a1 as number[];
  const b1 = study.b1 as number[];

  const gf = gfont.fs(10);
  const tile = GW / COLS;
  const gtop = gf + 6;
  const rows = Math.ceil(T / COLS);
  const GH = gtop + rows * tile + 4;

  const cf = cfont.fs(10);
  const X0 = cf * 3.4;
  const Y0 = 6;
  const PW = CW - X0 - 8;
  const PH = 140;
  // the domain fits the intervals once a sixth of the tasks are in; earlier, wider ones are clipped
  let lo = -0.05;
  let hi = 0.15;
  for (const g of frames)
    if (g.t >= T / 6) {
      lo = Math.min(lo, g.compare.ci_unpaired[0]);
      hi = Math.max(hi, g.compare.ci_unpaired[1]);
    }
  const xs = (t: number) => X0 + (PW * t) / T;
  const ys = (v: number) =>
    Y0 + PH - (PH * (Math.min(hi, Math.max(lo, v)) - lo)) / (hi - lo);
  const seen = frames.slice(0, s.step + 1);
  const bandPts =
    seen.map((g) => `${xs(g.t)},${ys(g.compare.ci_paired[1])}`).join(" ") +
    " " +
    [...seen]
      .reverse()
      .map((g) => `${xs(g.t)},${ys(g.compare.ci_paired[0])}`)
      .join(" ");
  const sp = study.split as Obj;
  const VTOP = Y0 + PH + cf * 3.6;
  const vRow = cf * 1.6;
  const vmax = sp.tasks_unpaired + sp.runs;
  const VX0 = X0 + cf * 4;
  const VW = CW - VX0 - 8;
  const vx = (v: number) => (VW * v) / vmax;
  const CH = VTOP + 2 * vRow + cf * 1.6;

  const visual = (
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
      <svg
        ref={gfont.ref}
        viewBox={`0 0 ${GW} ${GH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${f.t} of ${T} tasks: each tile is a task's first runs, both pass, only A, only B or both fail.`}
        data-testid="pair-grid"
      >
        <text
          x={0}
          y={gf}
          style={{ fontSize: gf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {f.t} tasks
        </text>
        <text
          x={GW}
          y={gf}
          textAnchor="end"
          style={{ fontSize: gf }}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          A only {tab.n10} · B only {tab.n01}
        </text>
        {Array.from({ length: f.t as number }, (_, t) => {
          const key = `${a1[t]}${b1[t]}`;
          const disc = key === "10" || key === "01";
          return (
            <rect
              key={t}
              data-pair={key}
              x={(t % COLS) * tile + 1}
              y={gtop + Math.floor(t / COLS) * tile + 1}
              width={tile - 2}
              height={tile - 2}
              rx={2}
              fill={PAIR_FILL[key]}
              opacity={disc ? (focus === "disc" ? 1 : 0.75) : 0.35}
              stroke={key === "00" ? MUTED.light : "none"}
              strokeWidth={0.8}
            />
          );
        })}
      </svg>
      <svg
        ref={cfont.ref}
        viewBox={`0 0 ${CW} ${CH}`}
        className="h-auto w-full"
        role="img"
        aria-label="The difference A − B against the number of tasks, with paired and unpaired 95% intervals, and the variance split between tasks and runs."
        data-testid="diff-chart"
      >
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke={MUTED.light} />
        <line
          x1={X0}
          x2={X0 + PW}
          y1={ys(0)}
          y2={ys(0)}
          stroke={MUTED.dark}
          strokeWidth={1}
        />
        {[lo, 0, hi].map((v) => (
          <text
            key={v}
            x={X0 - 3}
            y={ys(v) + cf / 3}
            textAnchor="end"
            style={{ fontSize: cf }}
            className="fill-neutral-600 dark:fill-neutral-400"
          >
            {v > 0 ? "+" : ""}
            {(v * 100).toFixed(0)}
          </text>
        ))}
        <polygon
          points={bandPts}
          fill={AGENT_COLOUR.a}
          opacity={focus === "cov" ? 0.4 : 0.2}
          data-band="paired"
          data-focus={focus === "cov" ? "true" : "false"}
        />
        {([0, 1] as const).map((i) => (
          <polyline
            key={i}
            points={seen
              .map((g) => `${xs(g.t)},${ys(g.compare.ci_unpaired[i])}`)
              .join(" ")}
            fill="none"
            stroke={AGENT_COLOUR.b}
            strokeDasharray="5 3"
            strokeWidth={1.4}
            data-band="unpaired"
          />
        ))}
        <line
          x1={X0}
          x2={X0 + PW}
          y1={ys(study.truth)}
          y2={ys(study.truth)}
          stroke={OKABE_ITO.black}
          strokeDasharray="1 3"
          className="dark:stroke-neutral-300"
        />
        <polyline
          points={seen
            .map((g) => `${xs(g.t)},${ys(g.compare.delta)}`)
            .join(" ")}
          fill="none"
          stroke={OKABE_ITO.black}
          strokeWidth={1.4}
          className="dark:stroke-neutral-100"
        />
        <text
          x={X0 + PW}
          y={Y0 + PH + cf + 2}
          textAnchor="end"
          style={{ fontSize: cf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          tasks → {T}
        </text>
        <text
          x={0}
          y={VTOP - cf * 0.5}
          style={{ fontSize: cf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          SE² of A − B: tasks | runs
        </text>
        {(
          [
            ["paired", sp.tasks_paired],
            ["unpaired", sp.tasks_unpaired],
          ] as const
        ).map(([label, tv], i) => {
          const y = VTOP + i * vRow;
          return (
            <g key={label} data-split={label}>
              <text
                x={0}
                y={y + vRow * 0.7}
                style={{ fontSize: cf }}
                className="fill-neutral-700 dark:fill-neutral-300"
              >
                {label}
              </text>
              <rect
                x={VX0}
                y={y + 2}
                width={Math.max(0.5, vx(tv))}
                height={vRow - 4}
                fill={OKABE_ITO.purple}
              />
              <rect
                x={VX0 + vx(tv)}
                y={y + 2}
                width={vx(sp.runs)}
                height={vRow - 4}
                fill={OKABE_ITO.sky}
              />
            </g>
          );
        })}
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 md:col-span-2 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: AGENT_COLOUR.a }}
          />
          only A passes
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: AGENT_COLOUR.b }}
          />
          only B passes
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: "#737373", opacity: 0.35 }}
          />
          both pass
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block size-3 border border-neutral-400" />
          both fail
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-4"
            style={{ background: AGENT_COLOUR.a, opacity: 0.35 }}
          />
          paired 95%
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-0 w-4 border-t-2 border-dashed"
            style={{ borderColor: AGENT_COLOUR.b }}
          />
          unpaired 95%
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: OKABE_ITO.purple }}
          />
          from the tasks
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: OKABE_ITO.sky }}
          />
          from the runs
        </li>
      </ul>
    </div>
  );

  return (
    <AnimationPanel
      testId="paired-widget"
      title="Same tasks, paired: the interval you get for free"
      summary="Agents A and B on the same 300 tasks, ten tasks a step: the discordant tasks, the difference with paired and unpaired 95% intervals, and where its variance comes from. From the engine's evals module."
      stepper={s}
      stepLabel="batch"
      caption={f.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="A − B"
            value={`${(c.delta * 100).toFixed(1)} points`}
            hint={`true ${(study.truth * 100).toFixed(1)}`}
          />
          <Stat
            label="SE, paired"
            value={`${(c.se_paired * 100).toFixed(2)} points`}
            hint={`unpaired ${(c.se_unpaired * 100).toFixed(2)}`}
          />
          <Stat
            label="Correlation A, B"
            value={c.corr.toFixed(2)}
            hint="per-task scores"
          />
          <Stat
            label="McNemar p"
            value={f.mcnemar.exact_p.toFixed(4)}
            hint={`${f.mcnemar.discordant} discordant`}
          />
        </div>
      }
      params={
        <Segmented
          label="Runs per task"
          value={m}
          options={Object.keys(data.studies as Obj).map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={setM}
        />
      }
    />
  );
}

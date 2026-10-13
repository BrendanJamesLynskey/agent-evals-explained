"use client";

/**
 * Chapter 3: pass@k against pass^k. Thirty tasks, ten samples each (the grid, tasks sorted by how
 * many samples pass); for k = 1 … 10, each task's unbiased pass@k and pass^k (the bars), and
 * their means against the generator's true curves (the chart). The two pull apart as k grows.
 * Frames from the engine's evals `passkStudy`.
 */
import { useMemo, useState, type ReactNode } from "react";

import { AnimationPanel } from "@/components/anim/AnimationPanel";
import { useStepper } from "@/components/anim/useStepper";
import { Hatch } from "@/components/interactive/Hatch";
import { Segmented, Stat } from "@/components/ui/Controls";
import { useSvgFont } from "@/components/viz/useSvgFont";
import { E, type Obj } from "@/lib/engine";
import { pct } from "@/lib/format";
import { MUTED, OUTCOME_COLOUR, PASSK_COLOUR } from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const GW = 360;
const CW = 360;

export default function PassKWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("passk");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <PassK data={st.data}>{children}</PassK>;
}

function PassK({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const base = data.study as Obj;
  const cfg = base.cfg as Obj;
  const [rho, setRho] = useState<string>(String(cfg.rho));
  const [theta, setTheta] = useState<string>(String(cfg.theta));
  const [hover, setHover] = useState<string | null>(null);
  const study = useMemo(
    () =>
      Number(rho) === cfg.rho && Number(theta) === cfg.theta
        ? base
        : E.study.passkStudy({
            ...cfg,
            rho: Number(rho),
            theta: Number(theta),
          }),
    [base, cfg, rho, theta],
  );
  const frames = study.frames as Obj[];
  const n = cfg.n as number;
  const s = useStepper(frames.length, {
    stepMs: 1100,
    resetKey: `${rho}|${theta}`,
  });
  const f = frames[s.step]!;
  const focus = hover ?? "";
  const gfont = useSvgFont(GW);
  const cfont = useSvgFont(CW);

  const c = study.c as number[];
  const order = c.map((_, i) => i).sort((x, y) => c[y]! - c[x]! || x - y);
  const runs = study.runs as number[][];

  const gf = gfont.fs(10);
  const rowH = 6;
  const top = gf + 6;
  const cellsW = 190;
  const cellW = cellsW / n;
  const barX = { at: 200, hat: 282 };
  const barW = 74;
  const GH = top + order.length * rowH + 4;

  const cf = cfont.fs(10);
  const X0 = cf * 3;
  const Y0 = 6;
  const PW = CW - X0 - 10;
  const PH = 170;
  const CH = Y0 + PH + cf * 2.8;
  const xk = (k: number) => X0 + (PW * (k - 1)) / (n - 1);
  const yv = (v: number) => Y0 + PH - PH * v;
  const curve = (key: string, upto = n) =>
    frames
      .slice(0, upto)
      .map((g) => `${xk(g.k)},${yv(g[key])}`)
      .join(" ");

  const visual = (
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
      <svg
        ref={gfont.ref}
        viewBox={`0 0 ${GW} ${GH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${order.length} tasks, ${n} samples each, with each task's pass@k and pass^k at k = ${f.k}.`}
        data-testid="sample-grid"
      >
        <defs>
          <Hatch id="pk-fail" colour={OUTCOME_COLOUR.fail} />
        </defs>
        <text
          x={0}
          y={gf}
          style={{ fontSize: gf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {n} samples per task
        </text>
        <rect
          x={barX.at}
          y={gf * 0.25}
          width={gf * 0.7}
          height={gf * 0.7}
          fill={PASSK_COLOUR.at}
        />
        <text
          x={barX.at + gf}
          y={gf}
          style={{ fontSize: gf }}
          fontWeight={focus === "at" ? 700 : 400}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          pass@{f.k}
        </text>
        <rect
          x={barX.hat}
          y={gf * 0.25}
          width={gf * 0.7}
          height={gf * 0.7}
          fill={PASSK_COLOUR.hat}
        />
        <text
          x={barX.hat + gf}
          y={gf}
          style={{ fontSize: gf }}
          fontWeight={focus === "hat" ? 700 : 400}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          pass^{f.k}
        </text>
        {order.map((t, r) => {
          const y = top + r * rowH;
          return (
            <g key={t} data-task={t}>
              {runs[t]!.map((x, j) => (
                <rect
                  key={j}
                  x={j * cellW + 0.4}
                  y={y + 0.5}
                  width={cellW - 0.8}
                  height={rowH - 1}
                  fill={x ? OUTCOME_COLOUR.pass : "url(#pk-fail)"}
                  opacity={x ? 0.7 : 1}
                />
              ))}
              <rect
                x={barX.at}
                y={y + 0.5}
                width={barW * f.at[t]}
                height={rowH - 1}
                fill={PASSK_COLOUR.at}
                opacity={focus === "hat" ? 0.35 : 0.85}
                data-bar="at"
              />
              <rect
                x={barX.hat}
                y={y + 0.5}
                width={barW * f.hat[t]}
                height={rowH - 1}
                fill={PASSK_COLOUR.hat}
                opacity={focus === "at" ? 0.35 : 0.85}
                data-bar="hat"
              />
            </g>
          );
        })}
      </svg>
      <svg
        ref={cfont.ref}
        viewBox={`0 0 ${CW} ${CH}`}
        className="h-auto w-full"
        role="img"
        aria-label="pass@k and pass^k against k: estimates as dots, the true curves as lines."
        data-testid="passk-chart"
      >
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke={MUTED.light} />
        <line
          x1={X0}
          x2={X0 + PW}
          y1={Y0 + PH}
          y2={Y0 + PH}
          stroke={MUTED.light}
        />
        {[0, 0.5, 1].map((v) => (
          <text
            key={v}
            x={X0 - 3}
            y={yv(v) + cf / 3}
            textAnchor="end"
            style={{ fontSize: cf }}
            className="fill-neutral-600 dark:fill-neutral-400"
          >
            {pct(v)}
          </text>
        ))}
        {frames.map((g) =>
          cfont.narrow && g.k % 3 !== 1 ? null : (
            <text
              key={g.k}
              x={xk(g.k)}
              y={Y0 + PH + cf + 2}
              textAnchor="middle"
              style={{ fontSize: cf }}
              className="fill-neutral-600 dark:fill-neutral-400"
            >
              {g.k}
            </text>
          ),
        )}
        <polyline
          points={curve("true_at")}
          fill="none"
          stroke={PASSK_COLOUR.at}
          strokeWidth={focus === "at" ? 2.4 : 1.4}
          opacity={0.7}
          data-curve="true_at"
        />
        <polyline
          points={curve("true_hat")}
          fill="none"
          stroke={PASSK_COLOUR.hat}
          strokeWidth={focus === "hat" ? 2.4 : 1.4}
          opacity={0.7}
          data-curve="true_hat"
        />
        <polyline
          points={curve("plugin", s.step + 1)}
          fill="none"
          stroke={PASSK_COLOUR.plugin}
          strokeDasharray="4 3"
          strokeWidth={focus === "plug" ? 2 : 1.2}
          data-curve="plugin"
        />
        {frames.slice(0, s.step + 1).map((g) => (
          <g key={g.k}>
            <circle
              cx={xk(g.k)}
              cy={yv(g.pass_at_k)}
              r={g.k === f.k ? 4.5 : 3}
              fill={PASSK_COLOUR.at}
            />
            <rect
              x={xk(g.k) - 3}
              y={yv(g.pass_hat_k) - 3}
              width={6}
              height={6}
              fill={PASSK_COLOUR.hat}
            />
          </g>
        ))}
        <text
          x={X0 + PW / 2}
          y={CH - 2}
          textAnchor="middle"
          style={{ fontSize: cf }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          k (tries)
        </text>
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 md:col-span-2 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3 rounded-full"
            style={{ background: PASSK_COLOUR.at }}
          />
          pass@k (some one of k passes)
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: PASSK_COLOUR.hat }}
          />
          pass^k (all k pass)
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-neutral-500" />
          true curve (lines)
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-neutral-500" />
          naive plug-in 1 − (1 − c/n)^k
        </li>
      </ul>
    </div>
  );

  return (
    <AnimationPanel
      testId="passk-widget"
      title="pass@k climbs, pass^k falls"
      summary="Thirty tasks, ten samples each; for each k, every task's unbiased pass@k and pass^k, and their means against the true curves of the synthetic benchmark. From the engine's evals module."
      stepper={s}
      stepLabel="k ="
      caption={f.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label={`pass@${f.k}`}
            value={pct(f.pass_at_k, 1)}
            hint={`true ${pct(f.true_at, 1)}`}
            plain
          />
          <Stat
            label={`pass^${f.k}`}
            value={pct(f.pass_hat_k, 1)}
            hint={`true ${pct(f.true_hat, 1)}`}
            plain
          />
          <Stat
            label="Plug-in pass@k"
            value={pct(f.plugin, 1)}
            hint="biased low"
          />
          <Stat
            label="Gap"
            value={`${((f.pass_at_k - f.pass_hat_k) * 100).toFixed(1)} points`}
          />
        </div>
      }
      params={
        <>
          <Segmented
            label="Correlation within a task"
            value={rho}
            options={["0", "0.3", "0.8"].map((v) => ({ value: v, label: v }))}
            onChange={setRho}
          />
          <Segmented
            label="Agent skill"
            value={theta}
            options={[
              { value: "-1", label: "−1 (weak)" },
              { value: "-0.2", label: "−0.2" },
              { value: "1", label: "1 (strong)" },
            ]}
            onChange={setTheta}
          />
        </>
      }
    />
  );
}

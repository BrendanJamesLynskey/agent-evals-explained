"use client";

/**
 * Chapter 6: what a lenient pass/fail judge reports for each true pass rate (the line
 * π·Se + (1 − π)(1 − Sp) against the diagonal), the weak agent's three scores (unit tests, the judge,
 * the judge corrected with a labelled calibration set, with its 95% interval). From the engine's
 * evals `gradingStudy`.
 */
import { useSvgFont } from "@/components/viz/useSvgFont";
import type { Obj } from "@/lib/engine";
import { MUTED, OKABE_ITO } from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const W = 360;
const H = 250;

export default function CorrectionChart(): JSX.Element {
  const st = useEngine("judge");
  const font = useSvgFont(W);
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  const g = st.data.grading as Obj;
  const fs = font.fs(10);
  const X0 = fs * 3;
  const Y0 = 8;
  const PW = W - X0 - 10;
  const PH = H - Y0 - fs * 3.2;
  const xs = (v: number) => X0 + PW * v;
  const ys = (v: number) => Y0 + PH * (1 - v);
  const curve = g.curve as Obj[];
  const c = g.corrected as Obj;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <figure
      className="my-6 rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="correction-chart"
    >
      <svg
        ref={font.ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`A judge with sensitivity ${g.cfg.se} and specificity ${g.cfg.sp} reports more than the true pass rate below about one half. The weak agent: unit tests ${(g.tests_rate * 100).toFixed(1)}%, judge ${(g.judge_rate * 100).toFixed(1)}%, corrected ${(c.corrected * 100).toFixed(1)}%.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={xs(0)}
              x2={xs(1)}
              y1={ys(t)}
              y2={ys(t)}
              stroke={MUTED.light}
              strokeWidth={0.4}
            />
            <text
              x={X0 - 3}
              y={ys(t) + fs / 3}
              textAnchor="end"
              style={{ fontSize: fs }}
              className="fill-neutral-600 dark:fill-neutral-400"
            >
              {t * 100}
            </text>
            <text
              x={xs(t)}
              y={Y0 + PH + fs + 2}
              textAnchor="middle"
              style={{ fontSize: fs }}
              className="fill-neutral-600 dark:fill-neutral-400"
            >
              {t * 100}
            </text>
          </g>
        ))}
        <text
          x={xs(1)}
          y={Y0 + PH + 2.2 * fs + 2}
          textAnchor="end"
          style={{ fontSize: fs }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          true pass rate, % →
        </text>
        <line
          x1={xs(0)}
          y1={ys(0)}
          x2={xs(1)}
          y2={ys(1)}
          stroke={MUTED.dark}
          strokeDasharray="3 3"
        />
        <polyline
          points={curve.map((p) => `${xs(p.pi)},${ys(p.observed)}`).join(" ")}
          fill="none"
          stroke={OKABE_ITO.vermillion}
          strokeWidth={2}
          data-line="judge"
        />
        <line
          x1={xs(c.ci[0])}
          x2={xs(c.ci[1])}
          y1={ys(g.judge_rate)}
          y2={ys(g.judge_rate)}
          stroke={OKABE_ITO.blue}
          strokeWidth={3}
          data-ci="corrected"
        />
        <circle
          cx={xs(g.tests_rate)}
          cy={ys(g.judge_rate)}
          r={4.5}
          fill={OKABE_ITO.green}
          data-point="tests"
        />
        <rect
          x={xs(c.corrected) - 4}
          y={ys(g.judge_rate) - 4}
          width={8}
          height={8}
          fill="none"
          stroke={OKABE_ITO.blue}
          strokeWidth={2}
          data-point="corrected"
        />
        <text
          x={X0 + 4}
          y={Y0 + fs}
          style={{ fontSize: fs }}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          judge reports, %
        </text>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4"
            style={{ background: OKABE_ITO.vermillion }}
          />
          what the judge reports
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t border-dashed border-neutral-600" />
          a perfect grader
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3 rounded-full"
            style={{ background: OKABE_ITO.green }}
          />
          the agent by unit tests
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3 border-2"
            style={{ borderColor: OKABE_ITO.blue }}
          />
          corrected, with its 95% interval
        </li>
      </ul>
      <figcaption className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
        A judge with sensitivity {g.cfg.se} and specificity {g.cfg.sp} on{" "}
        {g.cfg.tasks} tasks; calibration on {g.calibration.n} tasks labelled
        both ways. From the engine&apos;s evals module.
      </figcaption>
    </figure>
  );
}

"use client";

/**
 * Chapter 4: the exact coverage of a nominal 95% interval, P(the interval covers p) when the
 * score is Binomial(n, p), for every p on a grid: Wald dips far below 95% near 0 and 1, Wilson
 * stays close, and the exact interval never drops below. Computed by the engine's
 * `coverageCurves` (a sum over every possible score, not a simulation).
 */
import { useState } from "react";

import { Segmented } from "@/components/ui/Controls";
import { useSvgFont } from "@/components/viz/useSvgFont";
import type { Obj } from "@/lib/engine";
import { pct } from "@/lib/format";
import {
  METHOD_COLOUR,
  METHOD_LABEL,
  MUTED,
  OKABE_ITO,
} from "@/lib/viz/palette";

import { EngineStatus } from "../agent/EngineStatus";
import { useEngine } from "./useEngine";

const W = 560;
const METHODS = ["wald", "wilson", "exact"] as const;

export default function CoverageChart(): JSX.Element {
  const st = useEngine("uncertainty");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Chart data={st.data} />;
}

function Chart({ data }: { data: Obj }): JSX.Element {
  const sizes = Object.keys(data.coverage as Obj);
  const [n, setN] = useState<string>(sizes[0]!);
  const c = (data.coverage as Obj)[n] as Obj;
  const ps = c.ps as number[];
  const font = useSvgFont(W);
  const f = font.fs(11);
  const X0 = f * 3.2;
  const Y0 = 8;
  const PW = W - X0 - 10;
  const PH = 220;
  const H = Y0 + PH + f * 3;
  const lo = 0.3;
  const x = (p: number) => X0 + PW * p;
  const y = (v: number) => Y0 + PH - (PH * (Math.max(lo, v) - lo)) / (1 - lo);
  return (
    <figure
      data-testid="coverage-chart"
      className="my-8 min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <figcaption>
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          How often does a &ldquo;95%&rdquo; interval cover the truth?
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Exact coverage against the true rate p, for a benchmark of n tasks (a
          sum over every possible score, from the engine).
        </p>
      </figcaption>
      <svg
        ref={font.ref}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-label={`Coverage of the Wald, Wilson and exact intervals against p for n = ${n}.`}
      >
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke={MUTED.light} />
        <line
          x1={X0}
          x2={X0 + PW}
          y1={Y0 + PH}
          y2={Y0 + PH}
          stroke={MUTED.light}
        />
        {[0.4, 0.6, 0.8, 1].map((v) => (
          <text
            key={v}
            x={X0 - 3}
            y={y(v) + f / 3}
            textAnchor="end"
            style={{ fontSize: f }}
            className="fill-neutral-600 dark:fill-neutral-400"
          >
            {pct(v)}
          </text>
        ))}
        {[0, 0.5, 1].map((v) => (
          <text
            key={v}
            x={x(v)}
            y={Y0 + PH + f + 2}
            textAnchor={v === 0 ? "start" : v === 1 ? "end" : "middle"}
            style={{ fontSize: f }}
            className="fill-neutral-600 dark:fill-neutral-400"
          >
            p = {v}
          </text>
        ))}
        <line
          x1={X0}
          x2={X0 + PW}
          y1={y(0.95)}
          y2={y(0.95)}
          stroke={OKABE_ITO.black}
          strokeDasharray="3 3"
          className="dark:stroke-neutral-100"
        />
        {METHODS.map((m) => (
          <polyline
            key={m}
            data-method={m}
            points={ps
              .map((p, i) => `${x(p)},${y((c[m] as number[])[i]!)}`)
              .join(" ")}
            fill="none"
            stroke={METHOD_COLOUR[m]}
            strokeWidth={2}
            strokeDasharray={m === "exact" ? "6 3" : undefined}
          />
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 dark:text-neutral-300">
        {METHODS.map((m) => (
          <li key={m} className="flex items-center gap-1">
            <span
              className="inline-block h-0.5 w-4"
              style={{ background: METHOD_COLOUR[m] }}
            />
            {METHOD_LABEL[m]} (lowest {pct(Math.min(...(c[m] as number[])), 1)})
          </li>
        ))}
        <li className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-black dark:border-neutral-300" />
          the promised 95%
        </li>
      </ul>
      <div className="mt-3 max-w-xs">
        <Segmented
          label="Tasks n"
          value={n}
          options={sizes.map((v) => ({ value: v, label: v }))}
          onChange={setN}
        />
      </div>
    </figure>
  );
}

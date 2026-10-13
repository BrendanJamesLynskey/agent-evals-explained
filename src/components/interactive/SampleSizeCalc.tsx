"use client";

/**
 * Chapter 4: how many tasks? Three questions, each answered by the engine's power and
 * sample-size functions (normal approximations; tested against simulation in the engine): the
 * tasks for a given margin of error, the tasks per agent to detect a difference when each agent
 * runs its own tasks, and the shared tasks when both run the same ones (McNemar, Connor 1987).
 */
import { useState } from "react";

import { Segmented, Slider, Stat } from "@/components/ui/Controls";
import { E } from "@/lib/engine";
import { fmtInt, pct } from "@/lib/format";

export default function SampleSizeCalc(): JSX.Element {
  const S = E.stats;
  const [p, setP] = useState(0.6);
  const [h, setH] = useState(0.03);
  const [d, setD] = useState(0.05);
  const [psi, setPsi] = useState(0.2);
  const [alpha, setAlpha] = useState<string>("0.05");
  const [power, setPower] = useState<string>("0.8");
  const a = Number(alpha);
  const pw = Number(power);
  const margin = S.nForMargin(p, h, a);
  const p2 = Math.max(0.001, Math.min(0.999, p + d));
  const unpaired = S.nUnpaired(p2, p, a, pw);
  const okPsi = psi > d;
  const paired = okPsi
    ? S.nPaired(psi / 2 + d / 2, psi / 2 - d / 2, a, pw)
    : NaN;
  return (
    <figure
      data-testid="sample-size"
      className="my-8 min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <figcaption>
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          Sample-size calculator
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Computed live by the engine&apos;s power functions (normal
          approximations, one run per task).
        </p>
      </figcaption>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        <Slider
          label="Baseline score p"
          value={p}
          min={0.1}
          max={0.9}
          step={0.01}
          onChange={setP}
          format={(v) => pct(v)}
        />
        <Slider
          label="Margin of error ±"
          value={h}
          min={0.005}
          max={0.1}
          step={0.005}
          onChange={setH}
          format={(v) => pct(v, 1)}
        />
        <Slider
          label="Difference to detect"
          value={d}
          min={0.01}
          max={0.2}
          step={0.005}
          onChange={setD}
          format={(v) => `${(v * 100).toFixed(1)} points`}
        />
        <Slider
          label="Discordance ψ (paired)"
          value={psi}
          min={0.02}
          max={0.6}
          step={0.01}
          onChange={setPsi}
          format={(v) => pct(v)}
        />
        <Segmented
          label="Significance level"
          value={alpha}
          options={["0.05", "0.01"].map((v) => ({ value: v, label: v }))}
          onChange={setAlpha}
        />
        <Segmented
          label="Power"
          value={power}
          options={["0.8", "0.9"].map((v) => ({ value: v, label: v }))}
          onChange={setPower}
        />
      </div>
      <div
        className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
        aria-live="polite"
      >
        <Stat
          label={`Tasks for ± ${pct(h, 1)}`}
          value={fmtInt(margin)}
          hint={`${pct(1 - a)} interval near ${pct(p)}`}
        />
        <Stat
          label="Tasks per agent, unpaired"
          value={fmtInt(unpaired)}
          hint={`${pct(p2)} vs ${pct(p)}`}
        />
        <Stat
          label="Shared tasks, paired"
          value={okPsi ? fmtInt(paired) : "—"}
          hint={
            okPsi
              ? `ψ = ${pct(psi)} discordant`
              : "ψ must exceed the difference"
          }
        />
      </div>
    </figure>
  );
}

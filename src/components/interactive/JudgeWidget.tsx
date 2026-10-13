"use client";

/**
 * Chapter 6: a simulated LLM judge and the swap test. Each step judges one pair of responses twice,
 * A shown first and then B shown first; the panel shows the two responses (quality, length, whether
 * the judge's own model family wrote it), both verdicts and the truth; a strip of every pair so far
 * (agreeing and right, agreeing and wrong, order-dependent); and the running agreement tables with
 * Cohen's κ for one order and for the swapped verdicts. Five bias settings. Frames from the engine's
 * evals `judgeStudy`.
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

const SW = 360;
const COLS = 25;
const SETTINGS = [
  { value: "fair", label: "No bias" },
  { value: "position", label: "Position" },
  { value: "verbosity", label: "Length" },
  { value: "self", label: "Own family" },
  { value: "all", label: "All three" },
] as const;
type Setting = (typeof SETTINGS)[number]["value"];
const LABELS = ["A", "B", "tie"];
const PASS_TEXT = "text-emerald-800 dark:text-emerald-300";
const FAIL_TEXT = "text-orange-800 dark:text-orange-300";

export default function JudgeWidget({
  children,
}: {
  children?: ReactNode;
}): JSX.Element {
  const st = useEngine("judge");
  if (st.status !== "ready")
    return (
      <EngineStatus error={st.status === "error" ? st.error : undefined} />
    );
  return <Judge data={st.data}>{children}</Judge>;
}

function Response({
  name,
  r,
  first,
  scale,
}: {
  name: string;
  r: Obj;
  first: boolean;
  scale: number;
}): JSX.Element {
  // quality is a z-score: draw it from -3 to 3
  const q = Math.max(0, Math.min(1, (r.q + 3) / 6));
  const len = Math.max(0, Math.min(1, r.tokens / scale));
  return (
    <div
      data-response={name}
      className="min-w-0 rounded border border-neutral-200 bg-white p-2 text-xs dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
          Response {name}
        </span>
        {r.own === 1 && (
          <span className="rounded border border-sky-700 px-1 text-[0.7rem] text-sky-800 dark:border-sky-300 dark:text-sky-200">
            judge&apos;s own family
          </span>
        )}
        {first && (
          <span className="text-[0.7rem] text-neutral-600 dark:text-neutral-400">
            shown first
          </span>
        )}
      </div>
      <div className="grid grid-cols-[4.5rem_1fr] items-center gap-x-2 gap-y-1">
        <span className="text-neutral-600 dark:text-neutral-400">quality</span>
        <span className="h-3 rounded bg-neutral-100 dark:bg-neutral-800">
          <span
            className="block h-3 rounded"
            style={{ width: `${q * 100}%`, background: OKABE_ITO.blue }}
          />
        </span>
        <span className="text-neutral-600 dark:text-neutral-400">
          {r.tokens} tokens
        </span>
        <span className="h-3 rounded bg-neutral-100 dark:bg-neutral-800">
          <span
            className="block h-3 rounded"
            style={{ width: `${len * 100}%`, background: OKABE_ITO.purple }}
          />
        </span>
      </div>
    </div>
  );
}

function Table({
  title,
  t,
  kappa,
  testId,
}: {
  title: string;
  t: number[][];
  kappa: number;
  testId: string;
}): JSX.Element {
  return (
    <div className="min-w-0" data-testid={testId}>
      <div className="mb-1 text-[0.7rem] tracking-wide text-neutral-600 dark:text-neutral-400">
        {title}: κ {kappa.toFixed(2)}
      </div>
      <table className="w-full border-collapse font-mono text-[0.7rem]">
        <thead>
          <tr>
            <th className="p-0.5 text-left font-normal text-neutral-600 dark:text-neutral-400">
              truth ↓ judge →
            </th>
            {LABELS.map((l) => (
              <th
                key={l}
                className="p-0.5 font-normal text-neutral-600 dark:text-neutral-400"
              >
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LABELS.map((r, i) => (
            <tr key={r}>
              <th className="p-0.5 text-left font-normal text-neutral-600 dark:text-neutral-400">
                {r}
              </th>
              {LABELS.map((c, j) => (
                <td
                  key={c}
                  className={`p-0.5 text-center ${i === j ? "bg-emerald-50 font-semibold text-neutral-900 dark:bg-emerald-950 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"}`}
                >
                  {t[i]![j]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function confusion(truth: string[], judged: string[]): number[][] {
  const t = LABELS.map(() => LABELS.map(() => 0));
  truth.forEach((x, i) => {
    t[LABELS.indexOf(x)]![LABELS.indexOf(judged[i]!)]! += 1;
  });
  return t;
}

function Judge({
  data,
  children,
}: {
  data: Obj;
  children?: ReactNode;
}): JSX.Element {
  const [setting, setSetting] = useState<Setting>("position");
  const [hover, setHover] = useState<string | null>(null);
  const study = data.study as Obj;
  const pairs = study.pairs as Obj[];
  const res = study.settings[setting] as Obj;
  const frames = res.frames as Obj[];
  const s = useStepper(frames.length, { stepMs: 450, resetKey: setting });
  const f = frames[s.step]!;
  const pair = pairs[s.step]!;
  const font = useSvgFont(SW);
  const bias = res.bias as Obj;
  const active = ["position", "verbosity", "self"].filter((k) => bias[k] > 0);
  const hlKey: Record<string, string> = {
    position: "pos",
    verbosity: "len",
    self: "self",
  };
  const focus =
    hover ?? (active.length ? active.map((k) => hlKey[k]).join(" ") : "kappa");
  const seen = frames.slice(0, s.step + 1);
  const truth = pairs.slice(0, s.step + 1).map((p) => p.truth as string);
  const t1 = confusion(
    truth,
    seen.map((g) => g.v1 as string),
  );
  const td = confusion(
    truth,
    seen.map((g) => g.debiased as string),
  );
  let maxTok = 0;
  for (const p of pairs)
    maxTok = Math.max(maxTok, p.A.tokens as number, p.B.tokens as number);

  const fs = font.fs(10);
  const tile = SW / COLS;
  const top = fs + 6;
  const rows = Math.ceil(frames.length / COLS);
  const SH = top + rows * tile + 4;
  const verdictOk = (v: string) => v === pair.truth;

  const visual = (
    <div className="grid min-w-0 gap-3">
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <Response name="A" r={pair.A} first scale={maxTok} />
        <Response name="B" r={pair.B} first={false} scale={maxTok} />
      </div>
      <div
        className="grid min-w-0 gap-1 rounded border border-neutral-200 bg-white p-2 text-xs sm:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="verdicts"
      >
        <div>
          <span className="text-neutral-600 dark:text-neutral-400">
            A first →{" "}
          </span>
          <span
            className={`font-mono font-semibold ${verdictOk(f.v1) ? PASS_TEXT : FAIL_TEXT}`}
          >
            picks {f.v1}
          </span>
        </div>
        <div>
          <span className="text-neutral-600 dark:text-neutral-400">
            B first →{" "}
          </span>
          <span
            className={`font-mono font-semibold ${verdictOk(f.v2) ? PASS_TEXT : FAIL_TEXT}`}
          >
            picks {f.v2}
          </span>
        </div>
        <div>
          <span className="text-neutral-600 dark:text-neutral-400">truth </span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {pair.truth}
          </span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {" "}
            · swapped verdict{" "}
          </span>
          <span
            className={`font-mono font-semibold ${f.debiased === "tie" ? "text-neutral-700 dark:text-neutral-300" : verdictOk(f.debiased) ? PASS_TEXT : FAIL_TEXT}`}
          >
            {f.debiased}
          </span>
        </div>
      </div>
      <svg
        ref={font.ref}
        viewBox={`0 0 ${SW} ${SH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${s.step + 1} of ${frames.length} pairs judged in both orders: agreeing and right, agreeing and wrong, or order-dependent.`}
        data-testid="pair-strip"
      >
        <defs>
          <Hatch id="judge-hatch" colour={OUTCOME_COLOUR.fail} />
        </defs>
        <text
          x={0}
          y={fs}
          style={{ fontSize: fs }}
          className="fill-neutral-600 dark:fill-neutral-400"
        >
          {s.step + 1} pairs
        </text>
        <text
          x={SW}
          y={fs}
          textAnchor="end"
          style={{ fontSize: fs }}
          className="fill-neutral-700 dark:fill-neutral-300"
        >
          order-dependent {s.step + 1 - (f.consistent as number)}
        </text>
        {seen.map((g, i) => {
          const tr = pairs[i]!.truth;
          const kind = g.v1 !== g.v2 ? "flip" : g.v1 === tr ? "right" : "wrong";
          return (
            <rect
              key={i}
              data-kind={kind}
              x={(i % COLS) * tile + 1}
              y={top + Math.floor(i / COLS) * tile + 1}
              width={tile - 2}
              height={tile - 2}
              rx={2}
              fill={
                kind === "right"
                  ? OUTCOME_COLOUR.pass
                  : kind === "wrong"
                    ? "url(#judge-hatch)"
                    : MUTED.light
              }
              stroke={kind === "wrong" ? OUTCOME_COLOUR.fail : "none"}
              strokeWidth={0.8}
              opacity={i === s.step ? 1 : 0.8}
            />
          );
        })}
      </svg>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Table
          title="One order (A first)"
          t={t1}
          kappa={f.kappa1}
          testId="table-one"
        />
        <Table
          title="Both orders (ties when they differ)"
          t={td}
          kappa={f.kappa_d}
          testId="table-swap"
        />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700 dark:text-neutral-300">
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: OUTCOME_COLOUR.pass }}
          />
          both orders agree, right
        </li>
        <li className="flex items-center gap-1">
          <svg width={12} height={12} aria-hidden>
            <defs>
              <Hatch id="judge-hatch-key" colour={OUTCOME_COLOUR.fail} />
            </defs>
            <rect
              width={12}
              height={12}
              fill="url(#judge-hatch-key)"
              stroke={OUTCOME_COLOUR.fail}
            />
          </svg>
          both agree, wrong
        </li>
        <li className="flex items-center gap-1">
          <span
            className="inline-block size-3"
            style={{ background: MUTED.light }}
          />
          the verdict follows the order (a tie)
        </li>
      </ul>
    </div>
  );

  return (
    <AnimationPanel
      testId="judge-widget"
      title="The swap test: judge every pair twice"
      summary="A simulated judge compares 200 pairs of responses, each in both orders. Pick its biases and watch the order-dependent verdicts and the agreement with the truth. From the engine's evals module."
      stepper={s}
      stepLabel="pair"
      caption={f.caption}
      visual={visual}
      equation={children}
      hl={focus}
      onEquationHover={setHover}
      stats={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="First shown wins"
            value={`${(res.first_share * 100).toFixed(1)}%`}
            hint="all 200 pairs, both orders"
          />
          <Stat
            label="Orders agree"
            value={`${f.consistent} of ${s.step + 1}`}
            hint={`all pairs ${(res.consistency * 100).toFixed(1)}%`}
          />
          <Stat
            label="κ, one order"
            value={(f.kappa1 as number).toFixed(2)}
            hint={`final ${res.kappa1.kappa.toFixed(2)}`}
            plain
          />
          <Stat
            label="κ, swapped"
            value={(f.kappa_d as number).toFixed(2)}
            hint={`final ${res.kappa_d.kappa.toFixed(2)}`}
            plain
          />
        </div>
      }
      params={
        <Segmented
          label="Judge's biases"
          value={setting}
          options={SETTINGS}
          onChange={setSetting}
        />
      }
    />
  );
}

/**
 * This site's favicon glyph (src/app/icon.svg) and its card's graphic.
 * Glyph: the bubble of the Agents track, the letter E, #d97706.
 */
import { lookup } from "@/lib/evals/values";
import { PASSK_COLOUR } from "@/lib/viz/palette";

export function Glyph({ size }: { size: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="0.5" y="1" width="31" height="24" rx="6" fill="#d97706" />
      <path d="M6 23v8.5l8.5-8.5z" fill="#d97706" />
      <path
        d="M20.03 20H11.97V6H20.03V8.43H14.93V11.51H19.68V13.94H14.93V17.55H20.03Z"
        fill="#fff"
      />
    </svg>
  );
}

/**
 * The landing hero's curves: pass@k rising and pass^k falling as k goes from 1 to 10, from the
 * engine at build time.
 */
export function Motif(): JSX.Element {
  const frames = (
    lookup("passk.study.frames") as { [k: string]: number }[]
  ).map((f) => ({
    k: f.k!,
    at: f.pass_at_k!,
    hat: f.pass_hat_k!,
  }));
  const x = (k: number) => 30 + (380 * (k - 1)) / (frames.length - 1);
  const y = (p: number) => 20 + 370 * (1 - p);
  const line = (key: "at" | "hat") =>
    frames.map((f) => `${x(f.k)},${y(f[key])}`).join(" ");
  return (
    <svg width="440" height="420" viewBox="0 0 440 420">
      <line
        x1={30}
        y1={390}
        x2={410}
        y2={390}
        stroke="#475569"
        strokeWidth={3}
      />
      <line x1={30} y1={20} x2={30} y2={390} stroke="#475569" strokeWidth={3} />
      <polyline
        points={line("at")}
        fill="none"
        stroke={PASSK_COLOUR.at}
        strokeWidth={8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={line("hat")}
        fill="none"
        stroke={PASSK_COLOUR.hat}
        strokeWidth={8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {frames.map((f) => (
        <g key={f.k}>
          <circle cx={x(f.k)} cy={y(f.at)} r={9} fill={PASSK_COLOUR.at} />
          <circle cx={x(f.k)} cy={y(f.hat)} r={9} fill={PASSK_COLOUR.hat} />
        </g>
      ))}
    </svg>
  );
}

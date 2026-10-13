/**
 * The family's visual language (explained_sites_visual_standard.md §3): Okabe and Ito's
 * colour-blind-safe palette, the same in light and dark mode. On the Evals site:
 *
 * - a passing run is green; a failing one is the warning hue plus a hatch, never colour alone;
 * - one colour per interval method (Wald, Wilson, exact, bootstrap) and per curve (pass@k, pass^k);
 * - agent A is blue and agent B orange wherever two agents are compared.
 *
 * Okabe, M. and Ito, K. (2008), "Color Universal Design (CUD): how to make figures and
 * presentations that are friendly to colorblind people", https://jfly.uni-koeln.de/color/
 */

export const OKABE_ITO = {
  black: "#000000",
  orange: "#E69F00",
  sky: "#56B4E9",
  green: "#009E73",
  yellow: "#F0E442",
  blue: "#0072B2",
  vermillion: "#D55E00",
  purple: "#CC79A7",
} as const;

export const STATE_COLOUR = {
  active: OKABE_ITO.blue,
  stalled: OKABE_ITO.vermillion,
  ok: OKABE_ITO.green,
  paused: OKABE_ITO.purple,
} as const;

/** Muted ("done", "idle") greys: Tailwind neutral-400 and neutral-600. */
export const MUTED = { light: "#a3a3a3", dark: "#525252" } as const;

/** A run that passes, and one that fails (the warning hue, drawn with a hatch). */
export const OUTCOME_COLOUR = {
  pass: OKABE_ITO.green,
  fail: OKABE_ITO.vermillion,
} as const;

/** One colour per interval method, used in every chart and legend. */
export const METHOD_COLOUR: Record<string, string> = {
  wald: OKABE_ITO.orange,
  wilson: OKABE_ITO.blue,
  exact: OKABE_ITO.purple,
  bootstrap: OKABE_ITO.sky,
};

export const METHOD_LABEL: Record<string, string> = {
  wald: "Wald",
  wilson: "Wilson",
  exact: "Exact (Clopper–Pearson)",
  bootstrap: "Bootstrap",
};

/** pass@k and pass^k. */
export const PASSK_COLOUR = {
  at: OKABE_ITO.blue,
  hat: OKABE_ITO.orange,
  plugin: "#737373",
} as const;

/** Agent A and agent B in chapter 5. */
export const AGENT_COLOUR = {
  a: OKABE_ITO.blue,
  b: OKABE_ITO.orange,
} as const;

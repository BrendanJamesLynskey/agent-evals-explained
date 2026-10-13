/** The pages and animations every e2e spec walks. */
export const PAGES = [
  "/",
  "/learn",
  "/data",
  "/about",
  "/learn/01-what-an-eval-is",
  "/learn/02-the-benchmarks",
  "/learn/03-pass-at-k-and-pass-hat-k",
  "/learn/04-uncertainty",
  "/learn/05-comparing-two-agents",
  "/learn/06-graders",
  "/learn/07-trajectories",
  "/learn/08-the-harness",
  "/learn/09-contamination",
  "/learn/10-cost-aware-evaluation",
] as const;

export const ANIMATIONS = [
  ["/learn/01-what-an-eval-is", "loop-widget"],
  ["/learn/02-the-benchmarks", "swe-widget"],
  ["/learn/03-pass-at-k-and-pass-hat-k", "passk-widget"],
  ["/learn/04-uncertainty", "uncertainty-widget"],
  ["/learn/05-comparing-two-agents", "paired-widget"],
  ["/learn/06-graders", "judge-widget"],
  ["/learn/07-trajectories", "trajectory-widget"],
  ["/learn/08-the-harness", "harness-widget"],
  ["/learn/09-contamination", "contamination-widget"],
  ["/learn/10-cost-aware-evaluation", "cost-widget"],
] as const;

/** The engine runs in the page after it loads: allow for a slow runner. */
export const ENGINE_TIMEOUT = 45_000;

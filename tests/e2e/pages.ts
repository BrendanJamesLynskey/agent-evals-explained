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
] as const;

export const ANIMATIONS = [
  ["/learn/01-what-an-eval-is", "loop-widget"],
  ["/learn/02-the-benchmarks", "swe-widget"],
  ["/learn/03-pass-at-k-and-pass-hat-k", "passk-widget"],
  ["/learn/04-uncertainty", "uncertainty-widget"],
  ["/learn/05-comparing-two-agents", "paired-widget"],
] as const;

/** The engine runs in the page after it loads: allow for a slow runner. */
export const ENGINE_TIMEOUT = 45_000;

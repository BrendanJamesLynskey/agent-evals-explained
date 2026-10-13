/**
 * Site-wide constants: this site's URL, its companion sites, the engine, the owner's slide
 * series it links into, the primary sources, and its repository.
 */

/** This site (production). */
export const SITE_URL = "https://agent-evals-explained.vercel.app";

/** The companion sites. */
export const DECODER_URL = "https://transformer-decoder-explained.vercel.app";
export const TRAINING_URL = "https://transformer-training-explained.vercel.app";
export const INFERENCE_URL = "https://llm-inference-explained.vercel.app";
export const KERNELS_URL = "https://gpu-kernels-explained.vercel.app";
export const TRADEOFFS_URL = "https://inference-tradeoffs-explained.vercel.app";
export const HARNESSES_URL = "https://agent-harnesses-explained.vercel.app";
export const PROTOCOLS_URL = "https://agent-protocols-explained.vercel.app";
export const CONTEXT_URL = "https://agent-context-explained.vercel.app";
export const ORCHESTRATION_URL =
  "https://agent-orchestration-explained.vercel.app";

export const GITHUB_URL =
  "https://github.com/BrendanJamesLynskey/agent-evals-explained";
export const ENGINE_URL =
  "https://github.com/BrendanJamesLynskey/Agent_Loop_Sim";

/** Primary sources (checked at export.arxiv.org or opened 2026-10-13). */
export const ARXIV = (id: string) => `https://arxiv.org/abs/${id}`;
export const PAPERS = {
  humaneval: "2107.03374",
  swebench: "2310.06770",
  taubench: "2406.12045",
  tau2bench: "2506.07982",
  gaia: "2311.12983",
  webarena: "2307.13854",
  osworld: "2404.07972",
  terminalbench: "2601.11868",
  errorbars: "2411.00640",
  tinybenchmarks: "2402.14992",
  swebenchplus: "2410.06992",
  swebenchlive: "2505.23419",
  memory: "2512.10218",
  judge: "2306.05685",
} as const;

/** The owner's slides the chapters link into ("go deeper"). */
export const PAPERS_07 =
  "https://brendanjameslynskey.github.io/Papers_07_Evaluation_and_Benchmarks/";
export const CODING_AGENTS_HUB =
  "https://brendanjameslynskey.github.io/LLM_Hub_Coding_Agents/";
export const AGENTS_HUB =
  "https://brendanjameslynskey.github.io/LLM_Hub_Agents/";

/** A file in this site's repository on GitHub. */
export function repoFile(path: string): string {
  return `${GITHUB_URL}/blob/main/${path}`;
}

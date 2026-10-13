/**
 * Every number the chapters quote comes from here: a path into what the engine computes for each
 * chapter (the same data the animations draw, src/lib/engine's runChapter), e.g.
 * "loopx.round3.p" or "unc.200|tasks.coverage.wilson". The MDX writes <V of="…" fmt="…" />, so
 * prose cannot drift from the tested engine (tests/unit/values.test.ts checks every path the
 * chapters use resolves, and that key numbers equal the engine's recorded results).
 */
import {
  CHAPTER_CONFIGS,
  E,
  PRICES,
  runChapter,
  type Chapter,
  type Obj,
} from "@/lib/engine";
import { fmtInt, pct, trim } from "@/lib/format";

export type Fmt =
  | "int"
  | "pct"
  | "pct1"
  | "num"
  | "f2"
  | "f3"
  | "f4"
  | "raw"
  | "pp1"
  | "usd";

let TREE: Obj | null = null;

function minOf(xs: number[]): number {
  let m = Infinity;
  for (const x of xs) if (x < m) m = x;
  return m;
}

export function tree(): Obj {
  if (TREE) return TREE;
  const t: Obj = {};
  for (const ch of Object.keys(CHAPTER_CONFIGS) as Chapter[])
    t[ch] = runChapter(ch);
  const pop = E.generator.POPULATION;
  t.consts = {
    population: pop,
    loop: E.study.LOOP,
    passk: E.study.PASSK,
    bias: E.study.BIAS,
    unc: E.study.UNC,
    paired: E.study.PAIRED,
    sizes: E.study.SIZES,
    tie: E.study.TIE,
  };
  // chapter 1: the state after each round of runs
  const ls = t.loop.study as Obj;
  const T = ls.cfg.tasks as number;
  const fr = ls.frames as Obj[];
  const last = fr[fr.length - 1]!;
  t.loopx = {
    truth_tasks: ls.truth_tasks,
    truth_population: ls.truth_population,
    design_effect: (last.se / last.naive_se) ** 2,
    runs: fr.length,
  };
  for (let r = 1; r <= (ls.cfg.runs as number); r++) {
    const f = fr[r * T - 1]!;
    t.loopx[`round${r}`] = {
      ...f,
      wilson_width: f.wilson[1] - f.wilson[0],
      cluster_width: f.cluster[1] - f.cluster[0],
    };
  }
  // chapter 3: pass@k and pass^k by k
  t.pk = {};
  for (const f of t.passk.study.frames as Obj[]) t.pk[String(f.k)] = f;
  // chapter 4
  t.unc = t.uncertainty.studies;
  t.cover = {};
  for (const [n, c] of Object.entries(t.uncertainty.coverage as Obj)) {
    t.cover[n] = {
      wald_min: minOf(c.wald),
      wilson_min: minOf(c.wilson),
      exact_min: minOf(c.exact),
    };
  }
  t.tie = t.uncertainty.tie;
  t.margin = {};
  for (const m of t.uncertainty.sizes.margins as Obj[])
    t.margin[`${m.p}|${m.h}`] = m.n;
  t.diff = {};
  for (const d of t.uncertainty.sizes.diffs as Obj[])
    t.diff[String(d.delta)] = d;
  // chapter 5: each design's final frame
  t.pair = {};
  for (const [m, s] of Object.entries(t.paired.studies as Obj)) {
    const st = s as Obj;
    const f = (st.frames as Obj[])[(st.frames as Obj[]).length - 1]!;
    t.pair[m] = {
      ...f.compare,
      table: f.table,
      mcnemar: f.mcnemar,
      split: st.split,
      truth: st.truth,
      ratio: f.compare.se_paired / f.compare.se_unpaired,
      // the share of the difference's variance that comes from which tasks were drawn
      task_share_paired:
        st.split.tasks_paired / (st.split.tasks_paired + st.split.runs),
      task_share_unpaired:
        st.split.tasks_unpaired / (st.split.tasks_unpaired + st.split.runs),
    };
  }
  // chapter 2: each patch's verdict
  t.verdict = {};
  for (const [k, a] of Object.entries(t.swe.anatomies as Obj))
    t.verdict[k] = (a as Obj).grade.resolved ? "resolved" : "not resolved";
  // chapter 6: each judge setting's summary, and the pass/fail grading
  t.consts.judge = E.judge.JUDGE;
  t.consts.grading = E.judge.GRADING;
  t.jd = {};
  for (const [k, r] of Object.entries(t.judge.study.settings as Obj)) {
    const x = { ...(r as Obj) };
    delete x.frames;
    x.k1 = x.kappa1.kappa;
    x.kd = x.kappa_d.kappa;
    x.flipped = 1 - x.consistency;
    t.jd[k] = x;
  }
  const gr = t.judge.grading as Obj;
  t.gr = {
    tests_rate: gr.tests_rate,
    judge_rate: gr.judge_rate,
    inflation: gr.judge_rate - gr.tests_rate,
    kappa: gr.kappa.kappa,
    calibration: gr.calibration,
    corrected: gr.corrected,
  };
  // chapter 7: each trajectory's grades
  t.tr = {};
  for (const r of t.trajectory.rows as Obj[]) {
    const x = { ...r };
    delete x.frames;
    x.n_unsafe = (r.unsafe as Obj[]).length;
    t.tr[r.id] = x;
  }
  t.consts.tr_n = (t.trajectory.rows as Obj[]).length;
  t.trx = t.trajectory.agree_with_outcome;
  // chapter 8: each configuration, the spread, the paired comparisons, the example runs
  t.hx = {};
  for (const c of t.harness.configs as Obj[]) t.hx[c.id] = c;
  t.spread = t.harness.spread;
  t.pairs8 = {};
  for (const p of t.harness.paired as Obj[]) t.pairs8[`${p.a} vs ${p.b}`] = p;
  t.ex8 = {};
  for (const e of t.harness.examples as Obj[]) {
    const x = { ...e };
    delete x.events;
    delete x.files;
    t.ex8[e.config] = x;
  }
  t.consts.scaffold = E.scaffold.SCAFFOLD;
  t.consts.agents = {};
  for (const a of E.scaffold.AGENTS) t.consts.agents[a.id] = a;
  t.consts.prices = {};
  for (const a of E.scaffold.AGENTS) {
    const pr = PRICES[a.price as string] as Obj;
    t.consts.prices[a.id] = pr;
  }
  t.consts.tasks = E.scaffold.TASKS.length;
  // chapter 9: each leak level (without its rows)
  t.consts.contam = E.contamination.CONTAM;
  t.ct = {
    survive: t.contamination.survive,
    cutoff_q: (E.contamination.CONTAM.cutoff as number) - 1,
  };
  for (const [k, lv] of Object.entries(t.contamination.levels as Obj)) {
    const x = { ...(lv as Obj) };
    delete x.rows;
    delete x.frames;
    x.pre_rate = x.pre.k / x.pre.n;
    x.post_rate = x.post.k / x.post.n;
    x.gap = x.pre_rate - x.post_rate;
    x.residual = x.rate_kept - x.clean_rate;
    t.ct[k] = x;
  }
  // chapter 10
  t.cx = { ...t.cost.cost, n_front: (t.cost.cost.front as string[]).length };
  t.px = {};
  for (const p of t.cost.cost.points as Obj[]) t.px[p.id] = p;
  TREE = t;
  return t;
}

export function lookup(path: string): unknown {
  // keys may contain dots or bars: at each level take the shortest run of segments that names a key
  const parts = path.split(".");
  let v: unknown = tree();
  let i = 0;
  while (i < parts.length) {
    if (v === null || typeof v !== "object")
      throw new Error(`no value at "${path}"`);
    let j = i + 1;
    while (j <= parts.length && !(parts.slice(i, j).join(".") in (v as Obj)))
      j++;
    if (j > parts.length) throw new Error(`no value at "${path}"`);
    v = (v as Obj)[parts.slice(i, j).join(".")];
    i = j;
  }
  if (v === undefined || v === null) throw new Error(`no value at "${path}"`);
  return v;
}

export function formatValue(v: unknown, fmt: Fmt): string {
  if (fmt === "raw") return String(v);
  const n = v as number;
  switch (fmt) {
    case "int":
      return fmtInt(n);
    case "pct":
      return pct(n);
    case "pct1":
      return pct(n, 1);
    case "pp1":
      return `${(n * 100).toFixed(1)} points`;
    case "num":
      return trim(n);
    case "f2":
      return n.toFixed(2);
    case "f3":
      return n.toFixed(3);
    case "f4":
      return n.toFixed(4);
    case "usd":
      return `$${n.toFixed(4)}`;
  }
}

/**
 * Frame tests on the page (visual standard §4): set key frames of every animation and require
 * the caption on screen to be the caption of the Python reference's frame
 * (tests/fixtures/site_fixtures.json): the engine writes the captions, in both languages.
 */
import { expect, test, type Locator } from "@playwright/test";

import fx from "../fixtures/site_fixtures.json";

import type { Obj } from "@/lib/engine";

import { ENGINE_TIMEOUT } from "./pages";

// No autoplay (reduced motion): the test sets each frame itself.
test.use({ contextOptions: { reducedMotion: "reduce" } });

const CH = (fx as Obj).chapters as Obj;

async function change(fig: Locator, act: () => Promise<void>): Promise<void> {
  const before = (await fig.getAttribute("data-key")) ?? "";
  await act();
  await expect(fig).not.toHaveAttribute("data-key", before);
}

async function frame(fig: Locator, i: number, want: string): Promise<void> {
  await fig.getByTestId("scrub").fill(String(i));
  await expect(fig).toHaveAttribute("data-step", String(i));
  await expect(fig.getByTestId("caption")).toHaveText(want);
}

function keySteps(n: number): number[] {
  return [...new Set([0, 1, Math.floor(n / 2), n - 1])];
}

type Case = {
  path: string;
  id: string;
  name: string;
  captions: string[];
  choose?: (fig: Locator) => Promise<void>;
};

const radio =
  (...names: string[]) =>
  async (fig: Locator) => {
    for (const n of names)
      await change(fig, async () => {
        await fig.getByRole("radio", { name: n, exact: true }).click();
      });
  };

const caps = (frames: Obj[]) => frames.map((f) => f.caption as string);
const P1 = "/learn/01-what-an-eval-is";
const P2 = "/learn/02-the-benchmarks";
const P3 = "/learn/03-pass-at-k-and-pass-hat-k";
const P4 = "/learn/04-uncertainty";
const P5 = "/learn/05-comparing-two-agents";
const P6 = "/learn/06-graders";
const P7 = "/learn/07-trajectories";
const P8 = "/learn/08-the-harness";
const P9 = "/learn/09-contamination";
const P10 = "/learn/10-cost-aware-evaluation";
const JUDGE = CH.judge.study.settings as Obj;
const TRAJ = Object.fromEntries(
  (CH.trajectory.rows as Obj[]).map((r) => [r.id, r]),
) as Obj;
const HCAP = CH.harness.captions as Obj;
const CONTAM = CH.contamination.levels as Obj;
const COST = CH.cost.frames as Obj;

const select = (label: string, value: string) => async (fig: Locator) =>
  change(fig, async () => {
    await fig.getByLabel(label).selectOption(value);
  });
const SWE = CH.swe.anatomies as Obj;
const UNC = CH.uncertainty.studies as Obj;
const PAIR = CH.paired.studies as Obj;

const CASES: Case[] = [
  {
    path: P1,
    id: "loop-widget",
    name: "runs accumulating (default)",
    captions: caps(CH.loop.study.frames),
  },
  {
    path: P2,
    id: "swe-widget",
    name: "the right fix, thorough tests",
    captions: caps(SWE["fix|thorough"].frames),
  },
  {
    path: P2,
    id: "swe-widget",
    name: "the overfit patch, weak tests",
    captions: caps(SWE["overfit|weak"].frames),
    choose: radio("Overfit", "Weak"),
  },
  {
    path: P2,
    id: "swe-widget",
    name: "the patch that breaks sub()",
    captions: caps(SWE["collateral|thorough"].frames),
    choose: radio("Breaks sub()"),
  },
  {
    path: P3,
    id: "passk-widget",
    name: "pass@k and pass^k by k",
    captions: caps(CH.passk.study.frames),
  },
  {
    path: P4,
    id: "uncertainty-widget",
    name: "200 tasks, new tasks and runs",
    captions: caps(UNC["200|tasks"].frames),
  },
  {
    path: P4,
    id: "uncertainty-widget",
    name: "50 tasks, new runs only",
    captions: caps(UNC["50|runs"].frames),
    choose: radio("50", "New runs only"),
  },
  {
    path: P4,
    id: "uncertainty-widget",
    name: "500 tasks",
    captions: caps(UNC["500|tasks"].frames),
    choose: radio("500"),
  },
  {
    path: P5,
    id: "paired-widget",
    name: "one run per task",
    captions: caps(PAIR["1"].frames),
  },
  {
    path: P5,
    id: "paired-widget",
    name: "five runs per task",
    captions: caps(PAIR["5"].frames),
    choose: radio("5"),
  },
  {
    path: P6,
    id: "judge-widget",
    name: "position bias (default)",
    captions: caps(JUDGE.position.frames),
  },
  {
    path: P6,
    id: "judge-widget",
    name: "all three biases",
    captions: caps(JUDGE.all.frames),
    choose: radio("All three"),
  },
  {
    path: P7,
    id: "trajectory-widget",
    name: "the recorded ReAct run (default)",
    captions: caps(TRAJ["qwen-react"].frames),
  },
  {
    path: P7,
    id: "trajectory-widget",
    name: "the sandboxed run",
    captions: caps(TRAJ.guarded.frames),
    choose: select("Trajectory", "guarded"),
  },
  {
    path: P8,
    id: "harness-widget",
    name: "smaller model, tests, native, 16 turns (default)",
    captions: HCAP["small|test|native|16"] as string[],
  },
  {
    path: P8,
    id: "harness-widget",
    name: "larger model, read/edit only",
    captions: HCAP["large|edit|native|4"] as string[],
    choose: async (fig) => {
      await radio("Larger")(fig);
      await select("Scaffold", "edit|native|4")(fig);
    },
  },
  {
    path: P9,
    id: "contamination-widget",
    name: "30% leak (default)",
    captions: caps(CONTAM["0.30"].frames),
  },
  {
    path: P9,
    id: "contamination-widget",
    name: "60% leak",
    captions: caps(CONTAM["0.60"].frames),
    choose: radio("60%"),
  },
  {
    path: P10,
    id: "cost-widget",
    name: "both models (default)",
    captions: caps(COST.all),
  },
  {
    path: P10,
    id: "cost-widget",
    name: "the larger model",
    captions: caps(COST.large),
    choose: radio("Larger"),
  },
];

for (const c of CASES) {
  test(`${c.id} (${c.name}): key frames are the reference's`, async ({
    page,
  }) => {
    await page.goto(c.path);
    const fig = page.getByTestId(c.id);
    await expect(fig).toBeVisible({ timeout: ENGINE_TIMEOUT });
    await fig.scrollIntoViewIfNeeded();
    if (c.choose) await c.choose(fig);
    for (const i of keySteps(c.captions.length))
      await frame(fig, i, c.captions[i]!);
  });
}

test("chapter 2: the verdict badge agrees with the reference's grade", async ({
  page,
}) => {
  await page.goto(P2);
  const fig = page.getByTestId("swe-widget");
  await expect(fig).toBeVisible({ timeout: ENGINE_TIMEOUT });
  await radio("Overfit", "Weak")(fig);
  const max = await fig.getByTestId("scrub").getAttribute("max");
  await fig.getByTestId("scrub").fill(max!);
  await expect(fig.getByTestId("verdict")).toHaveAttribute(
    "data-resolved",
    SWE["overfit|weak"].grade.resolved ? "true" : "false",
  );
});

test("chapter 7: the verdicts at the end are the reference's", async ({
  page,
}) => {
  await page.goto(P7);
  const fig = page.getByTestId("trajectory-widget");
  await expect(fig).toBeVisible({ timeout: ENGINE_TIMEOUT });
  const max = await fig.getByTestId("scrub").getAttribute("max");
  await fig.getByTestId("scrub").fill(max!);
  const g = TRAJ["qwen-react"].grades as Obj;
  for (const [label, key] of [
    ["Outcome", "outcome"],
    ["Self-report", "self_report"],
    ["Trajectory", "trajectory"],
  ] as const)
    await expect(fig.locator(`[data-verdict='${label}']`)).toHaveAttribute(
      "data-pass",
      g[key] ? "true" : "false",
    );
});

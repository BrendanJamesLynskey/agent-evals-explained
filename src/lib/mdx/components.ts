/**
 * MDX components map (as on the companion sites). The animations come through `lazy.tsx`, so
 * each chapter loads only its own widget's code; `Eq` renders an equation with KaTeX on the
 * server (pass it as a widget's child); `V` prints a number from the engine.
 */
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

import { Layer } from "@/components/interactive/Layer";
import {
  ContaminationWidget,
  CorrectionChart,
  CostWidget,
  CoverageChart,
  EvalLoopWidget,
  HarnessWidget,
  JudgeWidget,
  PairedWidget,
  PassKWidget,
  SampleSizeCalc,
  SweTaskWidget,
  TrajectoryWidget,
  UncertaintyWidget,
} from "@/components/interactive/lazy";
import { CheckYourself } from "@/components/learn/CheckYourself";
import { Keep, Remember } from "@/components/learn/Remember";
import { Check } from "@/components/mdx/Check";
import { Eq } from "@/components/mdx/Eq";
import { V } from "@/components/mdx/V";
import { Callout } from "@/components/ui/Callout";
import { MdxPre, MdxTable } from "@/components/ui/MdxTable";

export const mdxComponents: NonNullable<MDXRemoteProps["components"]> = {
  table: MdxTable,
  pre: MdxPre,
  Layer,
  Callout,
  CheckYourself,
  Check,
  Remember,
  Keep,
  Eq,
  V,
  EvalLoopWidget,
  SweTaskWidget,
  PassKWidget,
  UncertaintyWidget,
  PairedWidget,
  CoverageChart,
  SampleSizeCalc,
  JudgeWidget,
  CorrectionChart,
  TrajectoryWidget,
  HarnessWidget,
  ContaminationWidget,
  CostWidget,
};

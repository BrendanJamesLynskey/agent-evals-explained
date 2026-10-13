"use client";

/**
 * Code-split client widgets: each loads its own chunk after the page shell, so pages stay
 * light (the pattern of the companion sites' lazy.tsx). Each widget takes its equation as
 * server-rendered children.
 */
import dynamic from "next/dynamic";

function Placeholder({ what }: { what: string }): JSX.Element {
  return (
    <p
      data-pending-widget
      className="my-8 min-h-96 text-sm text-neutral-600 dark:text-neutral-400"
    >
      Loading the {what}…
    </p>
  );
}

const loading = (what: string) =>
  function Loading(): JSX.Element {
    return <Placeholder what={what} />;
  };

export const EvalLoopWidget = dynamic(() => import("./EvalLoopWidget"), {
  ssr: false,
  loading: loading("animation"),
});
export const SweTaskWidget = dynamic(() => import("./SweTaskWidget"), {
  ssr: false,
  loading: loading("animation"),
});
export const PassKWidget = dynamic(() => import("./PassKWidget"), {
  ssr: false,
  loading: loading("animation"),
});
export const UncertaintyWidget = dynamic(() => import("./UncertaintyWidget"), {
  ssr: false,
  loading: loading("animation"),
});
export const PairedWidget = dynamic(() => import("./PairedWidget"), {
  ssr: false,
  loading: loading("animation"),
});
export const CoverageChart = dynamic(() => import("./CoverageChart"), {
  ssr: false,
  loading: loading("chart"),
});
export const SampleSizeCalc = dynamic(() => import("./SampleSizeCalc"), {
  ssr: false,
  loading: loading("calculator"),
});

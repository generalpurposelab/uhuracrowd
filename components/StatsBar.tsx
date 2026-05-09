"use client";

import { useEffect, useState } from "react";
import { Language } from "@/types";

interface StatsBarProps {
  languages: Language[];
}

function useCountUp(target: number, duration = 700, startDelay = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    let startTime: number | null = null;

    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic — decelerates into the final value
        const eased = 1 - (1 - progress) ** 3;
        setValue(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, startDelay]);

  return value;
}

export default function StatsBar({ languages }: StatsBarProps) {
  const total           = languages.length;
  const withBenchmark   = languages.filter((l) => l.hasBenchmark).length;
  const missing         = total - withBenchmark;
  const totalBenchmarks = languages.reduce((sum, l) => sum + l.benchmarks.length, 0);
  const pct             = Math.round((withBenchmark / total) * 100);

  const countTotal      = useCountUp(total,           1800,   80);
  const countWith       = useCountUp(withBenchmark,   1800,  160);
  const countMissing    = useCountUp(missing,          1800,  240);
  const countBenchmarks = useCountUp(totalBenchmarks,  1800,  320);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <Stat value={countTotal}      label="languages tracked"  color="#F0EDE8" />
      <Stat value={countWith}       label="have benchmarks"    color="#22c55e" />
      <Stat value={countMissing}    label="need benchmarks"    color="#ef4444" />
      <Stat value={countBenchmarks} label="benchmarks mapped"  color="#9A8B7A" />

      <div className="hidden sm:flex items-center gap-2 ml-auto">
        <div className="text-xs" style={{ color: "#6B5F52" }}>{pct}% covered</div>
        <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: "#2A2420" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "#22c55e",
              transformOrigin: "left center",
              animation: "barFill 900ms cubic-bezier(0.25, 0, 0, 1) 400ms both",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-2xl font-bold tabular-nums"
        style={{ color, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
      <span className="text-xs" style={{ color: "#6B5F52" }}>{label}</span>
    </div>
  );
}

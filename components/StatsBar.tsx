"use client";

import { useEffect, useState } from "react";
import { Language } from "@/types";

interface StatsBarProps {
  languages: Language[];
}

function useCountUp(target: number, duration = 1800, startDelay = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    let startTime: number | null = null;

    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
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
  const total         = languages.length;
  const withBenchmark = languages.filter((l) => l.hasBenchmark).length;
  const pct           = Math.round((withBenchmark / total) * 100);

  const countWith  = useCountUp(withBenchmark, 1800,  80);
  const countTotal = useCountUp(total,         1800, 160);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums" style={{ color: "#22c55e" }}>{countWith}</span>
        <span className="text-2xl font-bold" style={{ color: "#3D3028" }}>/</span>
        <span className="text-2xl font-bold tabular-nums" style={{ color: "#F0EDE8" }}>{countTotal}</span>
        <span className="text-xs ml-1" style={{ color: "#6B5F52" }}>languages benchmarked</span>
        <span className="text-xs ml-2" style={{ color: "#3D3028" }}>1M+ speakers</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="text-xs" style={{ color: "#6B5F52" }}>{pct}%</div>
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

"use client";

import { Language } from "@/types";

interface StatsBarProps {
  languages: Language[];
}

export default function StatsBar({ languages }: StatsBarProps) {
  const total = languages.length;
  const withBenchmark = languages.filter((l) => l.hasBenchmark).length;
  const missing = total - withBenchmark;
  const pct = Math.round((withBenchmark / total) * 100);

  const totalBenchmarks = languages.reduce(
    (sum, l) => sum + l.benchmarks.length,
    0
  );

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <Stat value={total} label="languages tracked" />
      <Stat
        value={withBenchmark}
        label="have benchmarks"
        color="text-green-400"
      />
      <Stat
        value={missing}
        label="need benchmarks"
        color="text-orange-400"
      />
      <Stat value={totalBenchmarks} label="benchmarks mapped" color="text-amber-400" />

      <div className="hidden sm:flex items-center gap-2 ml-auto">
        <div className="text-xs text-slate-500">{pct}% covered</div>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  color = "text-white",
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>
        {value}
      </span>
      <span className="text-slate-500 text-xs">{label}</span>
    </div>
  );
}

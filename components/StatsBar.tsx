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
  const totalBenchmarks = languages.reduce((sum, l) => sum + l.benchmarks.length, 0);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <Stat value={total} label="languages tracked" color="#F0EDE8" />
      <Stat value={withBenchmark} label="have benchmarks" color="#22c55e" />
      <Stat value={missing} label="need benchmarks" color="#E07832" />
      <Stat value={totalBenchmarks} label="benchmarks mapped" color="#9A8B7A" />

      <div className="hidden sm:flex items-center gap-2 ml-auto">
        <div className="text-xs" style={{ color: "#6B5F52" }}>{pct}% covered</div>
        <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: "#2A2420" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#22c55e" }} />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: "#6B5F52" }}>{label}</span>
    </div>
  );
}

"use client";

import { Language } from "@/types";

interface LanguageCardProps {
  language: Language;
  isSelected: boolean;
  onClick: () => void;
}

function formatSpeakers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function LanguageCard({
  language,
  isSelected,
  onClick,
}: LanguageCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
        isSelected
          ? "border-amber-500 bg-amber-950/30"
          : "border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                language.hasBenchmark ? "bg-green-500" : "bg-orange-500"
              }`}
            />
            <span className="font-medium text-white text-sm truncate">
              {language.name}
            </span>
            {language.nativeName && language.nativeName !== language.name && (
              <span className="text-slate-500 text-xs truncate">
                {language.nativeName}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            <span>{language.subregion || language.region}</span>
            <span>·</span>
            <span>{formatSpeakers(language.speakers)} speakers</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          {language.hasBenchmark ? (
            <span className="text-xs font-medium text-green-400">
              {language.benchmarks.length}{" "}
              {language.benchmarks.length === 1 ? "benchmark" : "benchmarks"}
            </span>
          ) : (
            <span className="text-xs text-orange-400/70">none yet</span>
          )}
        </div>
      </div>
    </button>
  );
}

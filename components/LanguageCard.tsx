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

export default function LanguageCard({ language, isSelected, onClick }: LanguageCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-lg border transition-all"
      style={
        isSelected
          ? { borderColor: "#E07832", background: "rgba(224,120,50,0.08)" }
          : { borderColor: "var(--border)", background: "var(--bg-surface)" }
      }
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "var(--text-faint)";
          e.currentTarget.style.background = "var(--bg-elevated)";
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--bg-surface)";
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: language.hasBenchmark ? "#22c55e" : "#ef4444" }}
            />
            <span className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {language.name}
            </span>
            {language.nativeName && language.nativeName !== language.name && (
              <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {language.nativeName}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>{language.subregion || language.region}</span>
            <span>·</span>
            <span>{formatSpeakers(language.speakers)} speakers</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          {language.hasBenchmark ? (
            <span className="text-xs font-medium" style={{ color: "#22c55e" }}>
              {language.benchmarks.length} {language.benchmarks.length === 1 ? "benchmark" : "benchmarks"}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>none yet</span>
          )}
        </div>
      </div>
    </button>
  );
}

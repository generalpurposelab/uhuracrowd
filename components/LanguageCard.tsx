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
          : { borderColor: "#2A2420", background: "#1A1512" }
      }
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "#3D3028";
          e.currentTarget.style.background = "#221D18";
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "#2A2420";
          e.currentTarget.style.background = "#1A1512";
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: language.hasBenchmark ? "#22c55e" : "#E07832" }}
            />
            <span className="font-medium text-sm truncate" style={{ color: "#F0EDE8" }}>
              {language.name}
            </span>
            {language.nativeName && language.nativeName !== language.name && (
              <span className="text-xs truncate" style={{ color: "#6B5F52" }}>
                {language.nativeName}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: "#6B5F52" }}>
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
            <span className="text-xs" style={{ color: "#6B5F52" }}>none yet</span>
          )}
        </div>
      </div>
    </button>
  );
}

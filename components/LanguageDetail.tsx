"use client";

import { Language } from "@/types";

interface LanguageDetailProps {
  language: Language;
  onClose: () => void;
  onSubmitBenchmark: () => void;
}

function formatSpeakers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function LanguageDetail({ language, onClose, onSubmitBenchmark }: LanguageDetailProps) {
  return (
    <div className="rounded-xl border flex flex-col gap-4 overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      {/* Header strip */}
      <div className="dot-grid-faint px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-lg leading-tight" style={{ color: "var(--text-primary)" }}>
              {language.name}
            </h2>
            {language.nativeName && language.nativeName !== language.name && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{language.nativeName}</p>
            )}
          </div>
          <button onClick={onClose} className="text-lg leading-none transition-colors" style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ×
          </button>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-5">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <MetaCell label="Region" value={language.subregion || language.region} />
          <MetaCell label="Speakers" value={formatSpeakers(language.speakers)} />
          <div className="col-span-2">
            <MetaCell label="Language family" value={language.family} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>LLM Benchmarks</h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={
                language.hasBenchmark
                  ? { background: "rgba(34,197,94,0.1)", color: "#22c55e" }
                  : { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
              }
            >
              {language.hasBenchmark ? `${language.benchmarks.length} found` : "None yet"}
            </span>
          </div>

          {language.benchmarks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {language.benchmarks.map((b, i) => (
                <a
                  key={i}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg p-3 border transition-all group"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#22c55e")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium transition-colors" style={{ color: "var(--text-primary)" }}>
                        {b.name}
                      </p>
                      {b.authors && (
                        <p className="text-xs mt-0.5">
                          {b.authorUrl ? (
                            <a
                              href={b.authorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ color: "#E07832", textDecoration: "underline", textUnderlineOffset: "2px", textDecorationColor: "rgba(224,120,50,0.35)" }}
                              onMouseEnter={e => (e.currentTarget.style.textDecorationColor = "#E07832")}
                              onMouseLeave={e => (e.currentTarget.style.textDecorationColor = "rgba(224,120,50,0.35)")}
                            >
                              {b.authors}
                            </a>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>{b.authors}</span>
                          )}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {b.tasks.map((t) => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{b.year}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-lg p-4 text-center border" style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.15)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No benchmark exists yet for {language.name}.
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Know of one? Help us map it.</p>
            </div>
          )}
        </div>

        <button
          onClick={onSubmitBenchmark}
          className="w-full py-2 px-4 text-sm font-semibold rounded-lg transition-colors"
          style={{ background: "#E07832", color: "#13100D" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#F08942")}
          onMouseLeave={e => (e.currentTarget.style.background = "#E07832")}
        >
          + Submit a benchmark for {language.name}
        </button>
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-base)" }}>
      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

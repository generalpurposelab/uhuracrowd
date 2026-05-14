"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import languagesData from "@/data/languages.json";
import { Language } from "@/types";
import LanguageList from "@/components/LanguageList";
import LanguageDetail from "@/components/LanguageDetail";
import StatsBar from "@/components/StatsBar";
import SubmitForm, { SubmissionData } from "@/components/SubmitForm";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

const languages = languagesData as Language[];

type View = "map" | "list";
type MapFilter = "all" | "benchmarked" | "partial" | "none";

export default function Home() {
  const [view, setView] = useState<View>("map");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [mapFilter, setMapFilter] = useState<MapFilter>("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const handleSelectLanguage = useCallback((lang: Language) => {
    setSelectedLanguage((prev) => (prev?.id === lang.id ? null : lang));
  }, []);

  const handleSubmit = useCallback((data: SubmissionData) => {
    setSubmissions((s) => [...s, data]);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      data-theme={theme}
    >

      {/* Header */}
      <header className="dot-grid border-b px-6 py-5" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            {/* Dot-grid logo mark */}
            <DotMark />
            <div>
              <div className="flex items-baseline gap-3">
                <span
                  className="font-black uppercase tracking-tight leading-none"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    fontSize: "1.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Uhura
                </span>
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#E07832" }}
                >
                  by General Purpose
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                A crowdsourced atlas of LLM benchmarks for low-resource languages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                position: "relative",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: theme === "dark" ? 3 : 23,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#E07832",
                  transition: "left 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {theme === "dark" ? (
                  /* Sun icon */
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#13100D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  /* Moon icon */
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#13100D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b px-6 py-3" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="max-w-screen-xl mx-auto">
          <StatsBar languages={languages} />
        </div>
      </div>

      {/* View toggle */}
      <div className="px-6 pt-4 pb-0">
        <div className="max-w-screen-xl mx-auto">
          <div
            className="flex gap-0.5 rounded-lg p-0.5 w-fit border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {(["map", "list"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize"
                style={
                  view === v
                    ? { background: "var(--bg-elevated)", color: "var(--text-primary)" }
                    : { color: "var(--text-muted)" }
                }
              >
                {v === "map" ? "Map view" : "List view"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 px-6 py-4">
        <div className="max-w-screen-xl mx-auto">
          {view === "map" ? (
            <div className="flex gap-4 flex-col lg:flex-row">
              <div className="flex-1 min-w-0">
                <WorldMap
                  languages={languages}
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                  mapFilter={mapFilter}
                />
              </div>
              <div className="w-full lg:w-80 flex-shrink-0">
                {selectedLanguage ? (
                  <LanguageDetail
                    language={selectedLanguage}
                    onClose={() => setSelectedLanguage(null)}
                    onSubmitBenchmark={() => setShowSubmit(true)}
                  />
                ) : (
                  <EmptyPanel
                    languages={languages}
                    mapFilter={mapFilter}
                    onFilterChange={setMapFilter}
                    onSubmit={() => setShowSubmit(true)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <LanguageList
                  languages={languages}
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                />
              </div>
              <div>
                {selectedLanguage ? (
                  <LanguageDetail
                    language={selectedLanguage}
                    onClose={() => setSelectedLanguage(null)}
                    onSubmitBenchmark={() => setShowSubmit(true)}
                  />
                ) : (
                  <div
                    className="rounded-xl p-5 text-center sticky top-4 border"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Select a language to see its benchmarks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 mt-4" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Built by{" "}
            <a
              href="https://generalpurpose.ai"
              className="transition-colors"
              style={{ color: "var(--text-muted)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              General Purpose
            </a>
            {" "}· Celebrating researchers tackling low-resource languages worldwide.
          </p>
          {submissions.length > 0 && (
            <span className="text-xs" style={{ color: "#E07832" }}>
              {submissions.length} submission{submissions.length !== 1 ? "s" : ""} this session
            </span>
          )}
        </div>
      </footer>

      {showSubmit && (
        <SubmitForm
          languages={languages}
          preselectedLanguage={selectedLanguage}
          onClose={() => setShowSubmit(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

/* ── Small dot-grid logo mark ── */
function DotMark() {
  const cols = 7;
  const rows = 7;
  const gap = 4;
  const r = 1;
  const size = (cols - 1) * gap;
  return (
    <svg width={size + r * 2} height={size + r * 2} viewBox={`0 0 ${size + r * 2} ${size + r * 2}`}>
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={r + col * gap}
            cy={r + row * gap}
            r={r}
            fill="#E07832"
            opacity={0.7}
          />
        ))
      )}
    </svg>
  );
}

/* ── Empty map side panel ── */
function EmptyPanel({
  languages,
  mapFilter,
  onFilterChange,
  onSubmit,
}: {
  languages: Language[];
  mapFilter: MapFilter;
  onFilterChange: (f: MapFilter) => void;
  onSubmit: () => void;
}) {
  const filters: { key: MapFilter; color: string; label: string }[] = [
    { key: "benchmarked", color: "#22c55e", label: "Benchmarked"      },
    { key: "none",        color: "#ef4444", label: "No benchmark yet" },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className="p-5 flex flex-col gap-2">
        {filters.map(({ key, color, label }) => {
          const active = mapFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(active ? "all" : key)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-all"
              style={{
                background: active ? `rgba(${color === "#22c55e" ? "34,197,94" : color === "#f59e0b" ? "245,158,11" : "239,68,68"},0.08)` : "var(--bg-base)",
                border: `1px solid ${active ? color : "var(--border)"}`,
                outline: "none",
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="flex-1 text-xs font-medium" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{label}</span>
              {active && <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>×</span>}
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onSubmit}
          className="w-full py-2 text-sm font-semibold rounded-lg transition-colors"
          style={{ background: "var(--bg-elevated)", color: "#E07832", border: "1px solid var(--text-faint)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--text-faint)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
        >
          Submit a benchmark
        </button>
      </div>
    </div>
  );
}

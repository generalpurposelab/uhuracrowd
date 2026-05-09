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

  const handleSelectLanguage = useCallback((lang: Language) => {
    setSelectedLanguage((prev) => (prev?.id === lang.id ? null : lang));
  }, []);

  const handleSubmit = useCallback((data: SubmissionData) => {
    setSubmissions((s) => [...s, data]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#13100D", color: "#F0EDE8" }}>

      {/* Header */}
      <header className="dot-grid border-b px-6 py-5" style={{ borderColor: "#2A2420" }}>
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
                    color: "#F0EDE8",
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
              <p className="text-xs mt-0.5" style={{ color: "#6B5F52" }}>
                A crowdsourced atlas of LLM benchmarks for low-resource languages
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSubmit(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            style={{ background: "#E07832", color: "#13100D" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F08942")}
            onMouseLeave={e => (e.currentTarget.style.background = "#E07832")}
          >
            + Submit a benchmark
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b px-6 py-3" style={{ borderColor: "#2A2420", background: "#1A1512" }}>
        <div className="max-w-screen-xl mx-auto">
          <StatsBar languages={languages} />
        </div>
      </div>

      {/* View toggle */}
      <div className="px-6 pt-4 pb-0">
        <div className="max-w-screen-xl mx-auto">
          <div
            className="flex gap-0.5 rounded-lg p-0.5 w-fit border"
            style={{ background: "#1A1512", borderColor: "#2A2420" }}
          >
            {(["map", "list"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize"
                style={
                  view === v
                    ? { background: "#2A2420", color: "#F0EDE8" }
                    : { color: "#6B5F52" }
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
                    style={{ background: "#1A1512", borderColor: "#2A2420" }}
                  >
                    <p className="text-sm" style={{ color: "#6B5F52" }}>
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
      <footer className="border-t px-6 py-4 mt-4" style={{ borderColor: "#2A2420" }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs" style={{ color: "#3D3028" }}>
            Built by{" "}
            <a
              href="https://generalpurpose.ai"
              className="transition-colors"
              style={{ color: "#6B5F52" }}
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
    { key: "benchmarked", color: "#22c55e", label: "All benchmarked"   },
    { key: "partial",     color: "#f59e0b", label: "Partially covered" },
    { key: "none",        color: "#ef4444", label: "No benchmarks yet" },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1512", borderColor: "#2A2420" }}>
      <div className="p-5 flex flex-col gap-2">
        {filters.map(({ key, color, label }) => {
          const active = mapFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(active ? "all" : key)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-all"
              style={{
                background: active ? `rgba(${color === "#22c55e" ? "34,197,94" : color === "#f59e0b" ? "245,158,11" : "239,68,68"},0.08)` : "#13100D",
                border: `1px solid ${active ? color : "#2A2420"}`,
                outline: "none",
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="flex-1 text-xs font-medium" style={{ color: active ? "#F0EDE8" : "#9A8B7A" }}>{label}</span>
              {active && <span className="text-xs font-bold" style={{ color: "#6B5F52" }}>×</span>}
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "#2A2420" }}>
        <button
          onClick={onSubmit}
          className="w-full py-2 text-sm font-semibold rounded-lg transition-colors"
          style={{ background: "#2A2420", color: "#E07832", border: "1px solid #3D3028" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#3D3028")}
          onMouseLeave={e => (e.currentTarget.style.background = "#2A2420")}
        >
          Submit a benchmark
        </button>
      </div>
    </div>
  );
}

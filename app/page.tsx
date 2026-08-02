"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import languagesData from "@/data/languages.json";
import { Language, MapFilter } from "@/types";
import LanguageList from "@/components/LanguageList";
import LanguageDetail from "@/components/LanguageDetail";
import StatsBar from "@/components/StatsBar";
import SubmitForm, { SubmissionData } from "@/components/SubmitForm";
import GPLogotype from "@/components/GPLogotype";

// Globe pulls in cobe (WebGL) — dynamic + ssr:false keeps it out of the
// server bundle and avoids trying to touch `canvas`/WebGL during SSR.
const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

const languages = languagesData as Language[];

type View = "map" | "list";

export default function Home() {
  const [view, setView] = useState<View>("map");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [mapFilter, setMapFilter] = useState<MapFilter>("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Theme follows the OS/browser color-scheme preference live — there used
  // to be a manual sun/moon toggle in the header; it was dropped in favor
  // of just respecting the system setting (product decision, not a bug).
  // `theme` still drives a `data-theme` attribute below because the Globe's
  // canvas palette (colors, glow, brightness) can't be swapped via CSS —
  // it's plain JS state passed down as a prop, in parallel with the CSS
  // variable overrides in globals.css that everything else reads.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = (e: MediaQueryList | MediaQueryListEvent) => setTheme(e.matches ? "light" : "dark");
    applyTheme(query);
    query.addEventListener("change", applyTheme);
    return () => query.removeEventListener("change", applyTheme);
  }, []);

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

      {/* Header. Title font is IBM Plex Sans Bold, not the brand guide's
          "Exposure" headline serif — Exposure is a licensed Klim Type
          Foundry face with no web-font source available, and IBM Plex reads
          more cohesively with the rest of the GP-branded chrome (footer
          logo, body copy) than an unrelated substitute serif did. */}
      <header className="dot-grid border-b px-6 py-5" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-screen-xl mx-auto">
          <span
            className="font-bold uppercase tracking-tight leading-none block"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "1.625rem",
              color: "var(--text-primary)",
            }}
          >
            Uhura
          </span>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            A crowdsourced atlas of LLM benchmarks for low-resource languages
          </p>
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
                <Globe
                  languages={languages}
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                  mapFilter={mapFilter}
                  theme={theme}
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
          <div className="flex items-center gap-4">
            <a
              href="https://generalpurpose.io"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="General Purpose"
              className="transition-opacity hover:opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              <GPLogotype style={{ height: 40, width: "auto", display: "block" }} />
            </a>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Celebrating researchers tackling low-resource languages worldwide.
            </p>
          </div>
          {submissions.length > 0 && (
            <span className="text-xs" style={{ color: "#FD7804" }}>
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
  const withBenchmark = languages.filter((l) => l.hasBenchmark).length;
  const withoutBenchmark = languages.length - withBenchmark;

  const filters: { key: MapFilter; color: string; label: string; count: number }[] = [
    { key: "benchmarked", color: "#016EFD", label: "Benchmarked",      count: withBenchmark    },
    { key: "none",        color: "#FD7804", label: "No benchmark yet", count: withoutBenchmark },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className="p-5 flex flex-col gap-2">
        {filters.map(({ key, color, label, count }) => {
          const active = mapFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(active ? "all" : key)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-all"
              style={{
                background: active ? `rgba(${color === "#016EFD" ? "1,110,253" : "253,120,4"},0.08)` : "var(--bg-base)",
                border: `1px solid ${active ? color : "var(--border)"}`,
                outline: "none",
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="flex-1 text-xs font-medium" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{label}</span>
              <span className="text-xs tabular-nums" style={{ color: active ? "var(--text-muted)" : "var(--text-faint)" }}>{count.toLocaleString()}</span>
              {active && <span className="text-xs font-bold ml-1" style={{ color: "var(--text-muted)" }}>×</span>}
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onSubmit}
          className="w-full py-2 text-sm font-semibold rounded-lg transition-colors"
          style={{ background: "var(--bg-elevated)", color: "#FD7804", border: "1px solid var(--text-faint)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--text-faint)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
        >
          Submit a benchmark
        </button>
      </div>
    </div>
  );
}

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

export default function Home() {
  const [view, setView] = useState<View>("map");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);

  const handleSelectLanguage = useCallback((lang: Language) => {
    setSelectedLanguage((prev) => (prev?.id === lang.id ? null : lang));
  }, []);

  const handleSubmit = useCallback((data: SubmissionData) => {
    setSubmissions((s) => [...s, data]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-lg tracking-tight">
                Uhura
              </span>
              <span className="text-slate-500 text-sm">by General Purpose</span>
              <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                Language Map
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              A crowdsourced atlas of LLM benchmarks for low-resource languages
            </p>
          </div>
          <button
            onClick={() => setShowSubmit(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            + Submit a benchmark
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-slate-800 px-6 py-3">
        <div className="max-w-screen-xl mx-auto">
          <StatsBar languages={languages} />
        </div>
      </div>

      {/* View toggle */}
      <div className="px-6 pt-4 pb-0">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
            {(["map", "list"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  view === v
                    ? "bg-slate-700 text-white"
                    : "text-slate-500 hover:text-white"
                }`}
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
              {/* Map */}
              <div className="flex-1 min-w-0">
                <WorldMap
                  languages={languages}
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                />
              </div>

              {/* Side panel */}
              <div className="w-full lg:w-80 flex-shrink-0">
                {selectedLanguage ? (
                  <LanguageDetail
                    language={selectedLanguage}
                    onClose={() => setSelectedLanguage(null)}
                    onSubmitBenchmark={() => setShowSubmit(true)}
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                    <div className="text-3xl mb-3">🌍</div>
                    <p className="text-slate-400 text-sm">
                      Click any dot on the map to explore a language and its
                      benchmarks.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 text-left">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                        Green dots have at least one LLM benchmark
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                        Orange dots have no benchmarks yet
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                        Yellow = currently selected
                      </div>
                    </div>
                  </div>
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
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center sticky top-4">
                    <p className="text-slate-500 text-sm">
                      Select a language from the list to see its benchmarks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-4 mt-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-slate-600 text-xs">
            Built by{" "}
            <a
              href="https://generalpurpose.ai"
              className="text-slate-500 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              General Purpose
            </a>
            {" "}alongside the Uhura benchmark. Celebrating researchers tackling low-resource languages.
          </p>
          {submissions.length > 0 && (
            <span className="text-xs text-amber-500">
              {submissions.length} submission{submissions.length !== 1 ? "s" : ""} in this session
            </span>
          )}
        </div>
      </footer>

      {showSubmit && (
        <SubmitForm
          languages={languages}
          preselectedLanguage={selectedLanguage}
          onClose={() => setShowSubmit(false)}
          onSubmit={(data) => {
            handleSubmit(data);
          }}
        />
      )}
    </div>
  );
}

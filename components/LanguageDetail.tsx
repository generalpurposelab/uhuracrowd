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

export default function LanguageDetail({
  language,
  onClose,
  onSubmitBenchmark,
}: LanguageDetailProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-white font-semibold text-lg leading-tight">
            {language.name}
          </h2>
          {language.nativeName && language.nativeName !== language.name && (
            <p className="text-slate-400 text-sm">{language.nativeName}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-0.5">Region</p>
          <p className="text-white">{language.subregion || language.region}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-0.5">Speakers</p>
          <p className="text-white">{formatSpeakers(language.speakers)}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 col-span-2">
          <p className="text-slate-500 text-xs mb-0.5">Language family</p>
          <p className="text-white">{language.family}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-300">
            LLM Benchmarks
          </h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              language.hasBenchmark
                ? "bg-green-900/50 text-green-400"
                : "bg-orange-900/50 text-orange-400"
            }`}
          >
            {language.hasBenchmark
              ? `${language.benchmarks.length} found`
              : "None yet"}
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
                className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-700 rounded-lg p-3 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white text-sm font-medium group-hover:text-green-400 transition-colors">
                      {b.name}
                    </p>
                    {b.authors && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        {b.authors}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {b.tasks.map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs flex-shrink-0">
                    {b.year}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-orange-950/20 border border-orange-900/40 rounded-lg p-4 text-center">
            <p className="text-orange-300/80 text-sm">
              No LLM evaluation benchmark exists yet for {language.name}.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Know of one? Help us map it.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onSubmitBenchmark}
        className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors"
      >
        + Submit a benchmark for {language.name}
      </button>
    </div>
  );
}

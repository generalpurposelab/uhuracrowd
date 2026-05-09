"use client";

import { useState } from "react";
import { Language } from "@/types";

interface SubmitFormProps {
  languages: Language[];
  preselectedLanguage?: Language | null;
  onClose: () => void;
  onSubmit: (data: SubmissionData) => void;
}

export interface SubmissionData {
  languageId: string;
  benchmarkName: string;
  url: string;
  tasks: string;
  year: string;
  authors: string;
}

const COMMON_TASKS = [
  "ARC-Easy",
  "TruthfulQA",
  "MMLU",
  "NER",
  "Machine Translation",
  "Sentiment Analysis",
  "QA",
  "NLI",
  "Language Modeling",
  "Visual QA",
];

export default function SubmitForm({
  languages,
  preselectedLanguage,
  onClose,
  onSubmit,
}: SubmitFormProps) {
  const [form, setForm] = useState<SubmissionData>({
    languageId: preselectedLanguage?.id ?? "",
    benchmarkName: "",
    url: "",
    tasks: "",
    year: new Date().getFullYear().toString(),
    authors: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof SubmissionData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleTask = (task: string) => {
    const current = form.tasks
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const next = current.includes(task)
      ? current.filter((t) => t !== task)
      : [...current, task];
    setForm((f) => ({ ...f, tasks: next.join(", ") }));
  };

  const selectedTasks = form.tasks
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setSubmitted(true);
  };

  const isValid =
    form.languageId && form.benchmarkName && form.url && form.tasks;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-white text-xl font-semibold mb-2">
            Thanks for contributing!
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Your submission for{" "}
            <span className="text-amber-400">
              {languages.find((l) => l.id === form.languageId)?.name}
            </span>{" "}
            has been recorded. The Uhura map grows with every contribution.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
          >
            Back to map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white text-lg font-semibold">
              Submit a benchmark
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Help map LLM research for low-resource languages
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Language *
            </label>
            <select
              value={form.languageId}
              onChange={set("languageId")}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">Select a language...</option>
              {[...languages]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.nativeName && l.nativeName !== l.name
                      ? ` (${l.nativeName})`
                      : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Benchmark name *
            </label>
            <input
              type="text"
              value={form.benchmarkName}
              onChange={set("benchmarkName")}
              required
              placeholder="e.g. AfriMMLU, IndicGLUE, XQuAD..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              URL / Paper link *
            </label>
            <input
              type="url"
              value={form.url}
              onChange={set("url")}
              required
              placeholder="https://arxiv.org/... or GitHub URL"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Tasks covered *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TASKS.map((task) => (
                <button
                  type="button"
                  key={task}
                  onClick={() => toggleTask(task)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTasks.includes(task)
                      ? "bg-amber-500 border-amber-500 text-black font-medium"
                      : "border-slate-600 text-slate-400 hover:border-slate-400"
                  }`}
                >
                  {task}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.tasks}
              onChange={set("tasks")}
              placeholder="Or type tasks manually (comma-separated)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={set("year")}
                min="2018"
                max="2030"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Authors / org
              </label>
              <input
                type="text"
                value={form.authors}
                onChange={set("authors")}
                placeholder="e.g. Adelani et al."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors"
            >
              Submit benchmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

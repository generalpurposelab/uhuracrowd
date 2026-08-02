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
  authorUrl: string;
}

const COMMON_TASKS = [
  "ARC-Easy", "TruthfulQA", "MMLU", "NER", "Machine Translation",
  "Sentiment Analysis", "QA", "NLI", "Language Modeling", "Visual QA",
];

const inputStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: "0.5rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
};

export default function SubmitForm({ languages, preselectedLanguage, onClose, onSubmit }: SubmitFormProps) {
  const [form, setForm] = useState<SubmissionData>({
    languageId: preselectedLanguage?.id ?? "",
    benchmarkName: "",
    url: "",
    tasks: "",
    year: new Date().getFullYear().toString(),
    authors: "",
    authorUrl: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof SubmissionData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleTask = (task: string) => {
    const current = form.tasks.split(",").map((t) => t.trim()).filter(Boolean);
    const next = current.includes(task) ? current.filter((t) => t !== task) : [...current, task];
    setForm((f) => ({ ...f, tasks: next.join(", ") }));
  };

  const selectedTasks = form.tasks.split(",").map((t) => t.trim()).filter(Boolean);
  const isValid = form.languageId && form.benchmarkName && form.url && form.tasks;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(253,120,4,0.1)" }}>
            <span style={{ color: "#FD7804", fontSize: "1.5rem" }}>✓</span>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Thanks for contributing!</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Your submission for{" "}
            <span style={{ color: "#FD7804" }}>
              {languages.find((l) => l.id === form.languageId)?.name}
            </span>{" "}
            has been recorded. The map grows with every contribution.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 font-semibold rounded-lg"
            style={{ background: "#FD7804", color: "#303030" }}
          >
            Back to map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Submit a benchmark</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Help map LLM research for low-resource languages</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Language *">
            <select value={form.languageId} onChange={set("languageId")} required style={inputStyle}>
              <option value="">Select a language...</option>
              {[...languages].sort((a, b) => a.name.localeCompare(b.name)).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}{l.nativeName && l.nativeName !== l.name ? ` (${l.nativeName})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Benchmark name *">
            <input type="text" value={form.benchmarkName} onChange={set("benchmarkName")} required
              placeholder="e.g. AfriMMLU, IndicGLUE, XQuAD..." style={inputStyle} />
          </Field>

          <Field label="URL / Paper link *">
            <input type="url" value={form.url} onChange={set("url")} required
              placeholder="https://arxiv.org/..." style={inputStyle} />
          </Field>

          <Field label="Tasks covered *">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TASKS.map((task) => (
                <button
                  type="button"
                  key={task}
                  onClick={() => toggleTask(task)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  style={
                    selectedTasks.includes(task)
                      ? { background: "#FD7804", borderColor: "#FD7804", color: "#303030", fontWeight: 600 }
                      : { borderColor: "var(--border)", color: "var(--text-secondary)" }
                  }
                >
                  {task}
                </button>
              ))}
            </div>
            <input type="text" value={form.tasks} onChange={set("tasks")}
              placeholder="Or type tasks manually (comma-separated)" style={inputStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <input type="number" value={form.year} onChange={set("year")} min="2018" max="2030" style={inputStyle} />
            </Field>
            <Field label="Authors / org">
              <input type="text" value={form.authors} onChange={set("authors")}
                placeholder="e.g. Adelani et al." style={inputStyle} />
            </Field>
          </div>

          <Field label="Your profile link (optional)">
            <input type="url" value={form.authorUrl} onChange={set("authorUrl")}
              placeholder="GitHub, personal site, Google Scholar..."
              style={inputStyle} />
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              Shown on the benchmark card — makes you discoverable to collaborators.
            </p>
          </Field>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2 px-4 text-sm font-medium rounded-lg"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={!isValid}
              className="flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-colors"
              style={{ background: isValid ? "#FD7804" : "var(--bg-elevated)", color: isValid ? "#303030" : "var(--text-muted)", cursor: isValid ? "pointer" : "not-allowed" }}
            >
              Submit benchmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

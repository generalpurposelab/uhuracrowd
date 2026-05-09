"use client";

import { useState, useMemo } from "react";
import { Language } from "@/types";
import LanguageCard from "./LanguageCard";

interface LanguageListProps {
  languages: Language[];
  selectedLanguage: Language | null;
  onSelectLanguage: (lang: Language) => void;
}

type Filter = "all" | "benchmarked" | "missing";
type SortKey = "name" | "speakers" | "benchmarks";

export default function LanguageList({
  languages,
  selectedLanguage,
  onSelectLanguage,
}: LanguageListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = languages;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.nativeName?.toLowerCase().includes(q) ||
          l.region.toLowerCase().includes(q) ||
          l.family.toLowerCase().includes(q)
      );
    }

    if (filter === "benchmarked") list = list.filter((l) => l.hasBenchmark);
    if (filter === "missing") list = list.filter((l) => !l.hasBenchmark);

    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "speakers") return b.speakers - a.speakers;
      if (sort === "benchmarks")
        return b.benchmarks.length - a.benchmarks.length;
      return 0;
    });
  }, [languages, filter, sort, search]);

  const filterBtn = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        filter === f
          ? "bg-amber-500 text-black"
          : "bg-slate-800 text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <input
        type="text"
        placeholder="Search languages, regions, families..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5">
          {filterBtn("all", "All")}
          {filterBtn("benchmarked", "Has benchmark")}
          {filterBtn("missing", "Needs benchmark")}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-slate-800 text-slate-300 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none"
        >
          <option value="name">Sort: A–Z</option>
          <option value="speakers">Sort: Speakers</option>
          <option value="benchmarks">Sort: Benchmarks</option>
        </select>
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} language{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 320px)" }}>
        {filtered.map((lang) => (
          <LanguageCard
            key={lang.id}
            language={lang}
            isSelected={selectedLanguage?.id === lang.id}
            onClick={() => onSelectLanguage(lang)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">
            No languages match your search.
          </p>
        )}
      </div>
    </div>
  );
}

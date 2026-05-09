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

export default function LanguageList({ languages, selectedLanguage, onSelectLanguage }: LanguageListProps) {
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
      if (sort === "benchmarks") return b.benchmarks.length - a.benchmarks.length;
      return 0;
    });
  }, [languages, filter, sort, search]);

  const filterBtn = (f: Filter, label: string) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
      style={
        filter === f
          ? { background: "#E07832", color: "#13100D" }
          : { background: "#2A2420", color: "#9A8B7A" }
      }
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
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
        style={{
          background: "#1A1512",
          border: "1px solid #2A2420",
          color: "#F0EDE8",
        }}
        onFocus={e => (e.currentTarget.style.borderColor = "#E07832")}
        onBlur={e => (e.currentTarget.style.borderColor = "#2A2420")}
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
          className="text-xs rounded px-2 py-1 focus:outline-none"
          style={{ background: "#2A2420", color: "#9A8B7A", border: "1px solid #3D3028" }}
        >
          <option value="name">Sort: A–Z</option>
          <option value="speakers">Sort: Speakers</option>
          <option value="benchmarks">Sort: Benchmarks</option>
        </select>
      </div>

      <p className="text-xs" style={{ color: "#6B5F52" }}>
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
          <p className="text-sm text-center py-8" style={{ color: "#6B5F52" }}>
            No languages match your search.
          </p>
        )}
      </div>
    </div>
  );
}

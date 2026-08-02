export interface Benchmark {
  name: string;
  url: string;
  tasks: string[];
  year: number;
  authors?: string;
  authorUrl?: string;
}

export interface Language {
  id: string;
  name: string;
  nativeName?: string;
  iso639_3: string;
  region: string;
  subregion?: string;
  family: string;
  familyGroup: string;
  speakers: number;
  // [longitude, latitude] for map placement
  coordinates: [number, number];
  hasBenchmark: boolean;
  benchmarks: Benchmark[];
}

// Shared by app/page.tsx (view state) and components/Globe.tsx (marker
// filtering) — kept here so the two don't drift out of sync. "partial" was
// dropped: nothing ever set it (no UI offered a third filter state), and the
// per-language data model has no concept of a partially-benchmarked
// language anyway — that would only make sense at a language-family level.
export type MapFilter = "all" | "benchmarked" | "none";

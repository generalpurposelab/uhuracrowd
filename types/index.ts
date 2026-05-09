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

export interface FamilyGroup {
  name: string;
  centroid: [number, number];
  languages: Language[];
  benchmarkedCount: number;
}

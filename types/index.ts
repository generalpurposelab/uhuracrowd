export interface Benchmark {
  name: string;
  url: string;
  tasks: string[];
  year: number;
  authors?: string;
}

export interface Language {
  id: string;
  name: string;
  nativeName?: string;
  iso639_3: string;
  region: string;
  subregion?: string;
  family: string;
  speakers: number;
  // [longitude, latitude] for map placement
  coordinates: [number, number];
  hasBenchmark: boolean;
  benchmarks: Benchmark[];
}

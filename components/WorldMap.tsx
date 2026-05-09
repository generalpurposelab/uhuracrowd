"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Geography as GeographyType,
} from "react-simple-maps";
import type { MouseEvent } from "react";
import { Language } from "@/types";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  languages: Language[];
  onSelectLanguage: (lang: Language) => void;
  selectedLanguage: Language | null;
}

export default function WorldMap({
  languages,
  onSelectLanguage,
  selectedLanguage,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    content: string;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.content}
        </div>
      )}

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 160 }}
        style={{ width: "100%", height: "100%" }}
        height={500}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={6}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeographyType[] }) =>
              geographies.map((geo: GeographyType) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#273549" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {languages.map((lang) => {
            const isSelected = selectedLanguage?.id === lang.id;
            const hasBenchmark = lang.hasBenchmark;

            return (
              <Marker
                key={lang.id}
                coordinates={lang.coordinates}
                onClick={() => onSelectLanguage(lang)}
                onMouseEnter={(e: MouseEvent<SVGGElement>) => {
                  const svg = (e.target as SVGElement).closest("svg");
                  const rect = svg?.getBoundingClientRect();
                  const svgContainer = svg?.parentElement?.getBoundingClientRect();
                  if (rect && svgContainer) {
                    setTooltip({
                      content: lang.name,
                      x: e.clientX - svgContainer.left,
                      y: e.clientY - svgContainer.top,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  r={isSelected ? 8 : 5}
                  fill={
                    isSelected
                      ? "#f59e0b"
                      : hasBenchmark
                      ? "#22c55e"
                      : "#f97316"
                  }
                  stroke={isSelected ? "#fbbf24" : "rgba(0,0,0,0.4)"}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={0.9}
                  style={{
                    transition: "all 0.15s ease",
                    filter: isSelected
                      ? "drop-shadow(0 0 6px #f59e0b)"
                      : hasBenchmark
                      ? "drop-shadow(0 0 3px #16a34a)"
                      : "drop-shadow(0 0 3px #ea580c)",
                  }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-3 left-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          Has benchmark
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
          No benchmark yet
        </span>
      </div>
    </div>
  );
}

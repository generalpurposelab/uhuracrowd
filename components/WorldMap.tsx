"use client";

import { useState, useMemo, useCallback } from "react";
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

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type MapFilter = "all" | "benchmarked" | "partial" | "none";

interface WorldMapProps {
  languages: Language[];
  onSelectLanguage: (lang: Language) => void;
  selectedLanguage: Language | null;
  mapFilter?: MapFilter;
}

// Deterministic jitter so stacked same-centroid languages spread out
// without changing on re-render
function seededJitter(seed: string, range: number): [number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const a = ((h >>> 0) / 0xffffffff) * 2 - 1;
  const b = (((h * 1664525 + 1013904223) >>> 0) / 0xffffffff) * 2 - 1;
  return [a * range, b * range];
}

function langMatchesFilter(lang: Language, filter: MapFilter): boolean {
  if (filter === "all") return true;
  if (filter === "benchmarked") return lang.hasBenchmark;
  if (filter === "none") return !lang.hasBenchmark;
  // "partial" — no direct language-level concept; show all
  return true;
}

export default function WorldMap({
  languages,
  onSelectLanguage,
  selectedLanguage,
  mapFilter = "all",
}: WorldMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

  const getMousePos = useCallback((e: MouseEvent<SVGGElement>) => {
    const rect = (e.target as SVGElement).closest("svg")?.parentElement?.getBoundingClientRect();
    return rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null;
  }, []);

  // Pre-compute jitter offsets so they're stable across renders
  const jittered = useMemo(() =>
    languages.map((lang) => {
      const [jx, jy] = seededJitter(lang.iso639_3, 1.8);
      return {
        ...lang,
        coordinates: [lang.coordinates[0] + jx, lang.coordinates[1] + jy] as [number, number],
      };
    }),
  [languages]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border"
      style={{ background: "#0D0B09", borderColor: "var(--border)" }}
    >
      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 32,
            background: "rgba(13,11,9,0.92)",
            color: "#F0EDE8",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            letterSpacing: "0.01em",
          }}
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
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeographyType[] }) =>
              geographies.map((geo: GeographyType) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1a2332"
                  stroke="#243044"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {jittered.map((lang) => {
            const isSelected = selectedLanguage?.id === lang.id;
            const isHovered = hoveredId === lang.id;
            const matches = langMatchesFilter(lang, mapFilter);
            const dimmed = !matches && mapFilter !== "all";

            const r = isSelected ? 5.5 : isHovered ? 4.5 : 3;
            const fill = lang.hasBenchmark ? "#22c55e" : "#ef4444";
            const opacity = dimmed ? 0.08 : isSelected || isHovered ? 1 : 0.75;

            return (
              <Marker
                key={lang.id}
                coordinates={lang.coordinates}
                onClick={() => !dimmed && onSelectLanguage(lang)}
                onMouseEnter={(e: MouseEvent<SVGGElement>) => {
                  if (dimmed) return;
                  setHoveredId(lang.id);
                  const pos = getMousePos(e);
                  if (pos) setTooltip({ content: lang.name, ...pos });
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  setTooltip(null);
                }}
                style={{ cursor: dimmed ? "default" : "pointer" }}
              >
                <circle
                  r={r}
                  fill={isSelected ? "#F0EDE8" : fill}
                  fillOpacity={opacity}
                  stroke={isSelected ? "#E07832" : isHovered ? fill : "none"}
                  strokeWidth={isSelected ? 1.5 : isHovered ? 1 : 0}
                  strokeOpacity={0.8}
                  style={{
                    transition: "r 120ms ease, fill-opacity 120ms ease",
                    filter: isSelected
                      ? "drop-shadow(0 0 4px #E07832)"
                      : isHovered && lang.hasBenchmark
                      ? "drop-shadow(0 0 3px #22c55e)"
                      : isHovered
                      ? "drop-shadow(0 0 3px #ef4444)"
                      : "none",
                  }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Bottom legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5" style={{ color: "rgba(203,213,225,0.5)" }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#22c55e", opacity: 0.85 }} />
          benchmarked
        </span>
        <span className="flex items-center gap-1.5" style={{ color: "rgba(203,213,225,0.5)" }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#ef4444", opacity: 0.85 }} />
          no benchmark yet
        </span>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-3 right-3 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
        scroll to zoom · click to explore
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Geography as GeographyType,
} from "react-simple-maps";
import type { MouseEvent } from "react";
import { Language, FamilyGroup } from "@/types";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  languages: Language[];
  onSelectLanguage: (lang: Language) => void;
  selectedLanguage: Language | null;
}

function computeFamilyGroups(languages: Language[]): FamilyGroup[] {
  const groups: Record<string, Language[]> = {};
  languages.forEach((lang) => {
    if (!groups[lang.familyGroup]) groups[lang.familyGroup] = [];
    groups[lang.familyGroup].push(lang);
  });
  return Object.entries(groups).map(([name, langs]) => {
    const lng = langs.reduce((s, l) => s + l.coordinates[0], 0) / langs.length;
    const lat = langs.reduce((s, l) => s + l.coordinates[1], 0) / langs.length;
    return {
      name,
      centroid: [lng, lat] as [number, number],
      languages: langs,
      benchmarkedCount: langs.filter((l) => l.hasBenchmark).length,
    };
  });
}

function familyColor(group: FamilyGroup): string {
  if (group.benchmarkedCount === 0) return "#f97316";
  if (group.benchmarkedCount === group.languages.length) return "#22c55e";
  return "#f59e0b";
}

function familyRadius(group: FamilyGroup): number {
  return Math.max(10, Math.min(22, 8 + group.languages.length * 1.2));
}

export default function WorldMap({
  languages,
  onSelectLanguage,
  selectedLanguage,
}: WorldMapProps) {
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    content: string;
    x: number;
    y: number;
  } | null>(null);

  const familyGroups = useMemo(() => computeFamilyGroups(languages), [languages]);

  const handleFamilyClick = (name: string) => {
    setExpandedFamily((prev) => (prev === name ? null : name));
    setTooltip(null);
  };

  const getMousePos = (e: MouseEvent<SVGGElement>) => {
    const svgContainer = (e.target as SVGElement)
      .closest("svg")
      ?.parentElement?.getBoundingClientRect();
    return svgContainer
      ? { x: e.clientX - svgContainer.left, y: e.clientY - svgContainer.top }
      : null;
  };

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.content}
        </div>
      )}

      {expandedFamily && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white">
          <span className="text-amber-400 font-medium">{expandedFamily}</span>
          <button
            onClick={() => setExpandedFamily(null)}
            className="text-slate-400 hover:text-white transition-colors ml-1"
          >
            ← all families
          </button>
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

          {expandedFamily === null
            ? /* ── Family bubble markers ── */
              familyGroups.map((group) => {
                const r = familyRadius(group);
                const color = familyColor(group);
                return (
                  <Marker
                    key={group.name}
                    coordinates={group.centroid}
                    onClick={() => handleFamilyClick(group.name)}
                    onMouseEnter={(e: MouseEvent<SVGGElement>) => {
                      const pos = getMousePos(e);
                      if (pos)
                        setTooltip({
                          content: `${group.name} — ${group.languages.length} languages, ${group.benchmarkedCount} benchmarked`,
                          ...pos,
                        });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      r={r}
                      fill={color}
                      fillOpacity={0.85}
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth={1}
                      style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                    />
                    <text
                      textAnchor="middle"
                      y={r + 10}
                      style={{
                        fontSize: 8,
                        fill: "#cbd5e1",
                        pointerEvents: "none",
                        fontFamily: "sans-serif",
                      }}
                    >
                      {group.name}
                    </text>
                    {group.benchmarkedCount > 0 && (
                      <text
                        textAnchor="middle"
                        y={4}
                        style={{
                          fontSize: 8,
                          fill: "#fff",
                          fontWeight: "bold",
                          pointerEvents: "none",
                          fontFamily: "sans-serif",
                        }}
                      >
                        {group.benchmarkedCount}/{group.languages.length}
                      </text>
                    )}
                  </Marker>
                );
              })
            : /* ── Expanded: individual language markers for selected family, dim bubbles for others ── */
              familyGroups.map((group) => {
                if (group.name !== expandedFamily) {
                  const r = familyRadius(group);
                  const color = familyColor(group);
                  return (
                    <Marker
                      key={group.name}
                      coordinates={group.centroid}
                      onClick={() => handleFamilyClick(group.name)}
                      onMouseEnter={(e: MouseEvent<SVGGElement>) => {
                        const pos = getMousePos(e);
                        if (pos)
                          setTooltip({ content: group.name, ...pos });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        r={r * 0.7}
                        fill={color}
                        fillOpacity={0.3}
                        stroke={color}
                        strokeWidth={1}
                        strokeOpacity={0.4}
                      />
                    </Marker>
                  );
                }

                return group.languages.map((lang) => {
                  const isSelected = selectedLanguage?.id === lang.id;
                  return (
                    <Marker
                      key={lang.id}
                      coordinates={lang.coordinates}
                      onClick={() => onSelectLanguage(lang)}
                      onMouseEnter={(e: MouseEvent<SVGGElement>) => {
                        const pos = getMousePos(e);
                        if (pos)
                          setTooltip({ content: lang.name, ...pos });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        r={isSelected ? 8 : 5}
                        fill={
                          isSelected
                            ? "#f59e0b"
                            : lang.hasBenchmark
                            ? "#22c55e"
                            : "#f97316"
                        }
                        stroke={isSelected ? "#fbbf24" : "rgba(0,0,0,0.4)"}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{
                          filter: isSelected
                            ? "drop-shadow(0 0 6px #f59e0b)"
                            : lang.hasBenchmark
                            ? "drop-shadow(0 0 3px #16a34a)"
                            : "drop-shadow(0 0 3px #ea580c)",
                          transition: "all 0.15s ease",
                        }}
                      />
                      <text
                        textAnchor="middle"
                        y={-8}
                        style={{
                          fontSize: 7,
                          fill: "#cbd5e1",
                          pointerEvents: "none",
                          fontFamily: "sans-serif",
                        }}
                      >
                        {lang.name}
                      </text>
                    </Marker>
                  );
                });
              })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-3 left-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          All benchmarked
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
          Partial
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
          None yet
        </span>
      </div>

      <div className="absolute bottom-3 right-3 text-xs text-slate-600">
        {expandedFamily ? "Click a language dot to explore" : "Click a family bubble to expand"}
      </div>
    </div>
  );
}

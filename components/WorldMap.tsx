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

function radialLabel(
  langCoords: [number, number],
  centroid: [number, number],
  dist = 18
): { lx: number; ly: number; anchor: "start" | "end" | "middle" } {
  const dx = langCoords[0] - centroid[0];
  const dy = -(langCoords[1] - centroid[1]); // flip: lat up = SVG y down
  const len = Math.sqrt(dx * dx + dy * dy);
  // If too close to centroid, default to above
  if (len < 0.5) return { lx: 0, ly: -dist, anchor: "middle" };
  const lx = (dx / len) * dist;
  const ly = -(dy / len) * dist; // back to SVG space
  const anchor: "start" | "end" | "middle" =
    lx > 4 ? "start" : lx < -4 ? "end" : "middle";
  return { lx, ly, anchor };
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
    <div className="relative w-full rounded-xl overflow-hidden border" style={{ background: "#0D0B09", borderColor: "#2A2420" }}>
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.content}
        </div>
      )}

      {expandedFamily && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs" style={{ background: "rgba(26,21,18,0.95)", border: "1px solid #2A2420", color: "#F0EDE8" }}>
          <span className="font-medium" style={{ color: "#E07832" }}>{expandedFamily}</span>
          <button
            onClick={() => setExpandedFamily(null)}
            className="ml-1 transition-colors"
            style={{ color: "#6B5F52" }}
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
                  const { lx, ly, anchor } = radialLabel(
                    lang.coordinates,
                    group.centroid,
                    20
                  );
                  const dotR = isSelected ? 8 : 5;
                  // Leader line starts at dot edge, ends near label
                  const lineLen = Math.sqrt(lx * lx + ly * ly);
                  const x1 = (lx / lineLen) * (dotR + 1);
                  const y1 = (ly / lineLen) * (dotR + 1);
                  const x2 = lx * 0.75;
                  const y2 = ly * 0.75;

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
                        r={dotR}
                        fill={
                          isSelected
                            ? "#F0EDE8"
                            : lang.hasBenchmark
                            ? "#22c55e"
                            : "#E07832"
                        }
                        stroke={isSelected ? "#E07832" : "rgba(0,0,0,0.4)"}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{
                          filter: isSelected
                            ? "drop-shadow(0 0 6px #E07832)"
                            : lang.hasBenchmark
                            ? "drop-shadow(0 0 3px #16a34a)"
                            : "drop-shadow(0 0 3px #E07832)",
                          transition: "all 0.15s ease",
                        }}
                      />
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#475569"
                        strokeWidth={0.8}
                        strokeLinecap="round"
                      />
                      <text
                        x={lx}
                        y={ly + 3}
                        textAnchor={anchor}
                        style={{
                          fontSize: 7.5,
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
        {[
          { color: "#22c55e", label: "All benchmarked" },
          { color: "#E07832", label: "Partial" },
          { color: "#f97316", label: "None yet" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5" style={{ color: "#9A8B7A" }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 text-xs" style={{ color: "#3D3028" }}>
        {expandedFamily ? "Click a dot to explore" : "Click a bubble to expand"}
      </div>
    </div>
  );
}

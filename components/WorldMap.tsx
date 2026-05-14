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

type MapFilter = "all" | "benchmarked" | "partial" | "none";

interface WorldMapProps {
  languages: Language[];
  onSelectLanguage: (lang: Language) => void;
  selectedLanguage: Language | null;
  mapFilter?: MapFilter;
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
  if (group.benchmarkedCount === 0) return "#ef4444";
  if (group.benchmarkedCount === group.languages.length) return "#22c55e";
  return "#f59e0b";
}

function familyRadius(group: FamilyGroup): number {
  return Math.max(10, Math.min(22, 8 + group.languages.length * 1.2));
}


function familyMatchesFilter(group: FamilyGroup, filter: MapFilter): boolean {
  if (filter === "all") return true;
  if (filter === "benchmarked") return group.benchmarkedCount === group.languages.length;
  if (filter === "partial") return group.benchmarkedCount > 0 && group.benchmarkedCount < group.languages.length;
  return group.benchmarkedCount === 0; // "none"
}

export default function WorldMap({
  languages,
  onSelectLanguage,
  selectedLanguage,
  mapFilter = "all",
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
    <div className="relative w-full rounded-xl overflow-hidden border" style={{ background: "#0D0B09", borderColor: "var(--border)" }}>
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
        >
          {tooltip.content}
        </div>
      )}

      {expandedFamily && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
          <span className="font-medium" style={{ color: "#E07832" }}>{expandedFamily}</span>
          <button
            onClick={() => setExpandedFamily(null)}
            className="ml-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
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
                const dimmed = !familyMatchesFilter(group, mapFilter);
                return (
                  <Marker
                    key={group.name}
                    coordinates={group.centroid}
                    onClick={() => !dimmed && handleFamilyClick(group.name)}
                    onMouseEnter={(e: MouseEvent<SVGGElement>) => {
                      if (dimmed) return;
                      const pos = getMousePos(e);
                      if (pos)
                        setTooltip({
                          content: `${group.name} — ${group.languages.length} languages, ${group.benchmarkedCount} benchmarked`,
                          ...pos,
                        });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: dimmed ? "default" : "pointer" }}
                  >
                    <circle
                      r={r}
                      fill={color}
                      fillOpacity={dimmed ? 0.12 : 0.85}
                      stroke={color}
                      strokeOpacity={dimmed ? 0.08 : 0}
                      strokeWidth={1}
                      style={dimmed ? {} : { filter: `drop-shadow(0 0 4px ${color})` }}
                    />
                    {!dimmed && (
                      <>
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
                      </>
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

                // Pre-compute max distance once per group for stagger normalisation
                const maxDist = Math.max(
                  ...group.languages.map((l) => {
                    const ldx = l.coordinates[0] - group.centroid[0];
                    const ldy = l.coordinates[1] - group.centroid[1];
                    return Math.sqrt(ldx * ldx + ldy * ldy);
                  }),
                  1
                );

                return group.languages.map((lang) => {
                  const isSelected = selectedLanguage?.id === lang.id;
                  const dotR = isSelected ? 8 : 5;

                  // Distance-based stagger: centroid-closest dots bloom first
                  const dx = lang.coordinates[0] - group.centroid[0];
                  const dy = lang.coordinates[1] - group.centroid[1];
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const staggerMs = Math.round((dist / maxDist) * 260);

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
                            : "#ef4444"
                        }
                        stroke={isSelected ? "#E07832" : "rgba(0,0,0,0.4)"}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{
                          animation: `dotReveal 480ms cubic-bezier(0.34, 1.56, 0.64, 1) ${staggerMs}ms both`,
                          transformBox: "fill-box",
                          transformOrigin: "50% 50%",
                          filter: isSelected
                            ? "drop-shadow(0 0 6px #E07832)"
                            : lang.hasBenchmark
                            ? "drop-shadow(0 0 3px #16a34a)"
                            : "drop-shadow(0 0 3px #ef4444)",
                          transition: "r 0.15s ease, filter 0.15s ease",
                        }}
                      />
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
          { color: "#ef4444", label: "None yet" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 text-xs" style={{ color: "var(--text-faint)" }}>
        {expandedFamily ? "Click a dot to explore" : "Click a bubble to expand"}
      </div>
    </div>
  );
}

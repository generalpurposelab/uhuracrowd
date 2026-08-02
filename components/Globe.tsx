// Renders the language map as a WebGL globe via cobe (https://cobe.vercel.app)
// instead of the flat SVG map (react-simple-maps) this replaced. Two things
// make this file bigger than a typical cobe integration:
//
// 1. cobe v2 dropped the v1 `onRender` callback — the caller now owns the
//    render loop and pushes state via `globe.update()` every frame (see the
//    `tick()` function below). That's also where idle auto-rotate and fling
//    momentum are integrated.
// 2. cobe has no hit-testing/picking API — it just rasterizes to a <canvas>.
//    Click-to-select and hover tooltips are implemented by hand in
//    `projectMarker()`, which reimplements cobe's internal marker-projection
//    shader math in JS (reverse-engineered from cobe's source, since it
//    isn't part of the public API). It must stay in sync with the
//    createGlobe() options below — see the comment on GLOBE_RADIUS.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe, { type Marker } from "cobe";
import { Language, MapFilter } from "@/types";

type Theme = "dark" | "light";

interface GlobeProps {
  languages: Language[];
  onSelectLanguage: (lang: Language) => void;
  selectedLanguage: Language | null;
  mapFilter?: MapFilter;
  theme?: Theme;
}

function langMatchesFilter(lang: Language, filter: MapFilter): boolean {
  if (filter === "all") return true;
  if (filter === "benchmarked") return lang.hasBenchmark;
  return !lang.hasBenchmark; // filter === "none"
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Brand status colors: Signal Blue = benchmarked, Warm Orange = no benchmark
// yet (per the GP brand guide's two "highlight/emphasis" colors — see
// app/globals.css for the full palette). Selection uses GP Silver rather
// than a third accent color: orange is already the app's general
// interactive/active accent (buttons, links, filter pills), so reusing it
// for "no benchmark" status would make a selected-but-unbenchmarked marker
// indistinguishable from an ordinary unbenchmarked one.
const COLOR_BENCHMARKED = hexToRgb01("#016EFD");
const COLOR_NONE = hexToRgb01("#FD7804");
const COLOR_SELECTED = hexToRgb01("#A8ACB5");

// ── Marker projection, replicated from cobe's internal shader math so we can
// hit-test markers in screen space (cobe itself only rasterizes to a canvas
// and exposes no picking API). Must stay in sync with GLOBE_RADIUS /
// MARKER_ELEVATION / scale passed to createGlobe below.
const GLOBE_RADIUS = 0.8;
const MARKER_ELEVATION = 0.05;
const GLOBE_SCALE = 1;

function locationToVec3(lat: number, lng: number): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);
  return [-cosLat * Math.cos(lngRad), Math.sin(latRad), cosLat * Math.sin(lngRad)];
}

function projectMarker(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  aspect: number,
): { x: number; y: number; visible: boolean } {
  const r = GLOBE_RADIUS + MARKER_ELEVATION;
  const [ux, uy, uz] = locationToVec3(lat, lng);
  const tx = ux * r, ty = uy * r, tz = uz * r;

  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);

  const c = cosPhi * tx + sinPhi * tz;
  const s = sinPhi * sinTheta * tx + cosTheta * ty - cosPhi * sinTheta * tz;
  const zTest = -sinPhi * cosTheta * tx + sinTheta * ty + cosPhi * cosTheta * tz;
  const visible = zTest >= 0 || c * c + s * s >= 0.64;

  const x = (c / aspect) * GLOBE_SCALE / 2 + 0.5;
  const y = (-s * GLOBE_SCALE) / 2 + 0.5;
  return { x, y, visible };
}

// Direction note: positive AUTO_ROTATE_SPEED (increasing phi) is the
// physically-correct rotation direction for a north-up view of Earth —
// verified against real rotation (west-to-east / counterclockwise viewed
// from the North Pole), not just picked to "look right." Don't flip the
// sign without re-checking that against a real reference.
const AUTO_ROTATE_SPEED = 0.0022; // rad/frame @ ~60fps
const INITIAL_THETA = 0.32;
const THETA_LIMIT = 1.1; // rad — stop short of flipping over the poles
const DRAG_SENS = 0.005; // rad per px of drag
const VELOCITY_SMOOTHING = 0.35; // blend factor for per-event fling samples
// Higher = more friction, i.e. a fling decays back to the idle drift faster.
// 0.07 ≈ settles in a quarter-second; tuned down from an initial 0.012 which
// felt "floaty."
const RETURN_RATE = 0.07;
const DRAG_CLICK_THRESHOLD = 4; // px — below this, pointerup counts as a click
const HIT_RADIUS = 14; // px — how close a click/hover needs to be to a marker

const clampTheta = (t: number) => Math.max(-THETA_LIMIT, Math.min(THETA_LIMIT, t));

export default function Globe({
  languages,
  onSelectLanguage,
  selectedLanguage,
  mapFilter = "all",
  theme = "dark",
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(INITIAL_THETA);
  const velocityRef = useRef({ phi: AUTO_ROTATE_SPEED, theta: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

  const pointerState = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastT: 0,
  });

  const visible = useMemo(
    () =>
      languages.filter(
        (lang) => mapFilter === "all" || langMatchesFilter(lang, mapFilter) || selectedLanguage?.id === lang.id,
      ),
    [languages, mapFilter, selectedLanguage],
  );

  const markers: Marker[] = useMemo(
    () =>
      visible.map((lang) => {
        const isSelected = selectedLanguage?.id === lang.id;
        const isHovered = hoveredId === lang.id;
        return {
          location: [lang.coordinates[1], lang.coordinates[0]] as [number, number],
          size: isSelected ? 0.075 : isHovered ? 0.06 : 0.045,
          color: isSelected ? COLOR_SELECTED : lang.hasBenchmark ? COLOR_BENCHMARKED : COLOR_NONE,
        };
      }),
    [visible, selectedLanguage, hoveredId],
  );

  const palette = useMemo(() => {
    return theme === "dark"
      ? {
          baseColor: hexToRgb01("#A8ACB5"),
          glowColor: hexToRgb01("#FD7804"),
          markerColor: hexToRgb01("#FD7804"),
          dark: 1,
          mapBrightness: 3.2,
          diffuse: 1.2,
        }
      : {
          // White sphere, cobe.vercel.app-style. "dark:1" leaves the ocean
          // black with only landmass dots lit — the opposite of what we
          // want here — so use "dark:0" to wash the whole sphere in
          // ambient baseColor, landmass just a touch brighter.
          baseColor: hexToRgb01("#FFFFFF"),
          glowColor: hexToRgb01("#E8F0FF"),
          markerColor: hexToRgb01("#FD7804"),
          dark: 0,
          mapBrightness: 5,
          diffuse: 1.2,
        };
  }, [theme]);

  // Resize observer keeps the canvas (and our hit-test aspect ratio) synced
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height: height || width });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const markersRef = useRef(markers);
  const paletteRef = useRef(palette);
  // `visible` also needs a ref, not just a closure capture: findMarkerAt()
  // (defined inside the size-scoped effect below) used to read `visible`
  // directly from render scope, which went stale after a mapFilter or
  // selectedLanguage change that didn't also change canvas size — so a
  // click could hit-test against an outdated filtered set.
  const visibleRef = useRef(visible);
  useEffect(() => {
    markersRef.current = markers;
    paletteRef.current = palette;
    visibleRef.current = visible;
  }, [markers, palette, visible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size.width * dpr,
      height: size.height * dpr,
      phi: phiRef.current,
      theta: thetaRef.current,
      scale: GLOBE_SCALE,
      mapSamples: 16000,
      mapBrightness: paletteRef.current.mapBrightness,
      baseColor: paletteRef.current.baseColor,
      markerColor: paletteRef.current.markerColor,
      glowColor: paletteRef.current.glowColor,
      diffuse: paletteRef.current.diffuse,
      dark: paletteRef.current.dark,
      markers: markersRef.current,
      markerElevation: MARKER_ELEVATION,
      opacity: 0.95,
    });

    // cobe v2 has no onRender hook — we own the render loop and push state
    // via globe.update() every frame.
    let raf = 0;
    const tick = () => {
      if (!pointerState.current.dragging) {
        // Fling momentum: keep spinning at release velocity, easing back to
        // the idle drift (phi) / to rest (theta).
        const v = velocityRef.current;
        v.phi += (AUTO_ROTATE_SPEED - v.phi) * RETURN_RATE;
        v.theta += (0 - v.theta) * RETURN_RATE * 2;
        phiRef.current += v.phi;
        thetaRef.current = clampTheta(thetaRef.current + v.theta);
      }
      globe.update({
        phi: phiRef.current,
        theta: thetaRef.current,
        width: size.width * dpr,
        height: size.height * dpr,
        markers: markersRef.current,
        baseColor: paletteRef.current.baseColor,
        markerColor: paletteRef.current.markerColor,
        glowColor: paletteRef.current.glowColor,
        mapBrightness: paletteRef.current.mapBrightness,
        diffuse: paletteRef.current.diffuse,
        dark: paletteRef.current.dark,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onPointerDown = (e: PointerEvent) => {
      pointerState.current.dragging = true;
      pointerState.current.startX = e.clientX;
      pointerState.current.startY = e.clientY;
      pointerState.current.lastX = e.clientX;
      pointerState.current.lastY = e.clientY;
      pointerState.current.lastT = e.timeStamp;
      // Grabbing the globe arrests any in-flight spin
      velocityRef.current.phi = 0;
      velocityRef.current.theta = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const findMarkerAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const aspect = rect.width / rect.height;
      let closest: { lang: Language; dist: number } | null = null;
      for (const lang of visibleRef.current) {
        const { x, y, visible: onFront } = projectMarker(
          lang.coordinates[1],
          lang.coordinates[0],
          phiRef.current,
          thetaRef.current,
          aspect,
        );
        if (!onFront) continue;
        const sx = x * rect.width;
        const sy = y * rect.height;
        const dist = Math.hypot(sx - px, sy - py);
        if (dist <= HIT_RADIUS && (!closest || dist < closest.dist)) {
          closest = { lang, dist };
        }
      }
      return closest?.lang ?? null;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerState.current.dragging) {
        const dx = e.clientX - pointerState.current.lastX;
        const dy = e.clientY - pointerState.current.lastY;
        const dPhi = dx * DRAG_SENS;
        const dTheta = dy * DRAG_SENS;
        phiRef.current += dPhi;
        thetaRef.current = clampTheta(thetaRef.current + dTheta);
        // Normalize per-event deltas to per-frame velocity (move events can
        // outpace rAF), then smooth so release momentum tracks fling speed.
        const dt = Math.max(e.timeStamp - pointerState.current.lastT, 1);
        const frameScale = Math.min(16.7 / dt, 3);
        const v = velocityRef.current;
        v.phi = v.phi * (1 - VELOCITY_SMOOTHING) + dPhi * frameScale * VELOCITY_SMOOTHING;
        v.theta = v.theta * (1 - VELOCITY_SMOOTHING) + dTheta * frameScale * VELOCITY_SMOOTHING;
        pointerState.current.lastX = e.clientX;
        pointerState.current.lastY = e.clientY;
        pointerState.current.lastT = e.timeStamp;
        setTooltip(null);
        setHoveredId(null);
        return;
      }
      const hit = findMarkerAt(e.clientX, e.clientY);
      canvas.style.cursor = hit ? "pointer" : "grab";
      if (hit) {
        const rect = canvas.getBoundingClientRect();
        setHoveredId(hit.id);
        setTooltip({ content: hit.name, x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setHoveredId(null);
        setTooltip(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      pointerState.current.dragging = false;
      // Held still before release → no fling; momentum only carries a live throw
      if (e.timeStamp - pointerState.current.lastT > 100) {
        velocityRef.current.phi = 0;
        velocityRef.current.theta = 0;
      }
      canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = "grab";
      const totalMoved = Math.hypot(e.clientX - pointerState.current.startX, e.clientY - pointerState.current.startY);
      if (totalMoved < DRAG_CLICK_THRESHOLD) {
        const hit = findMarkerAt(e.clientX, e.clientY);
        if (hit) onSelectLanguage(hit);
      }
    };

    const onPointerLeave = () => {
      setHoveredId(null);
      setTooltip(null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
    // Deliberately scoped to [size.width, size.height]: this effect creates
    // the WebGL context and event listeners once per canvas size, not once
    // per render — adding markers/palette/visible here would tear down and
    // recreate the whole globe (visible flicker, lost rotation state) on
    // every marker color or selection change. Fresh values instead flow in
    // through markersRef/paletteRef/visibleRef, kept current by the effect
    // above. onSelectLanguage is read directly from closure (not ref'd) —
    // fine today since page.tsx's handleSelectLanguage is useCallback'd
    // with a stable identity, but a caller passing an inline/changing
    // callback would get a stale one until the canvas next resizes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  const withBenchmark = languages.filter((l) => l.hasBenchmark).length;
  const withoutBenchmark = languages.length - withBenchmark;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden border"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      {size.width > 0 && (
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", contain: "layout paint size" }}
        />
      )}

      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-mono"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 32,
            background: "rgba(48,48,48,0.92)",
            color: "var(--gp-offwhite)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            letterSpacing: "0.02em",
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Bottom legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs pointer-events-none">
        <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#016EFD", opacity: 0.85 }} />
          benchmarked · {withBenchmark.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#FD7804", opacity: 0.85 }} />
          no benchmark yet · {withoutBenchmark.toLocaleString()}
        </span>
      </div>

      {/* Drag hint — hidden on narrow viewports where it collides with the legend */}
      <div className="absolute bottom-3 right-3 text-xs pointer-events-none hidden md:block" style={{ color: "var(--text-faint)" }}>
        drag to rotate · click a dot to explore
      </div>
    </div>
  );
}

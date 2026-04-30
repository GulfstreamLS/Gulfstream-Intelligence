"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

/*
 * Bundled locally — zero CDN requests, loads instantly, works offline.
 * 50m resolution has noticeably smoother coastlines than 110m.
 */
import worldTopology from "world-atlas/countries-50m.json";

/* ISO 3166-1 numeric codes to exclude */
const EXCLUDE_IDS = new Set(["010"]); // Antarctica

type Pin = { key: string; coords: [number, number] };

/* ── Location dot ─────────────────────────────────────────────── */
function Pin() {
  return (
    <g>
      {/* soft glow behind the dot */}
      <circle r="8" fill="#1E40AF" opacity="0.15" />
      {/* solid navy dot */}
      <circle r="5" fill="#1E40AF" />
      {/* white centre highlight */}
      <circle r="2" fill="white" />
    </g>
  );
}

/* ── Main map ──────────────────────────────────────────────────────
 * Projection notes:
 *   • geoNaturalEarth1 — same as the reference design
 *   • scale 153 — all inhabited continents visible, no clipping
 *   • center [5, 14] — shifts globe 14° north (Antarctica exits the
 *       bottom) and 5° east (balances Americas vs Asia)
 *   • width/height 800×420 — 1.9:1 aspect matches the reference card
 * ─────────────────────────────────────────────────────────────── */
export default function WorldDotMap({ pins = [] }: { pins?: Pin[] }) {
  return (
    <ComposableMap
      width={800}
      height={420}
      projection="geoNaturalEarth1"
      projectionConfig={{ scale: 153, center: [5, 14] }}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        {/*
         * Dot grid: 4×4 px cells, each cell has one 2.6 px-diameter dot.
         * Colour #93C5FD (blue-300) matches the reference stipple.
         */}
        <pattern
          id="ld"
          x="0" y="0"
          width="4" height="4"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.5" cy="1.5" r="1.3" fill="#93C5FD" />
        </pattern>
      </defs>

      <Geographies geography={worldTopology}>
        {({ geographies }) =>
          geographies
            .filter((geo) => !EXCLUDE_IDS.has(geo.id as string))
            .map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="url(#ld)"
                stroke="none"
                strokeWidth={0}
                style={{
                  default: { outline: "none" },
                  hover:   { outline: "none", fill: "url(#ld)" },
                  pressed: { outline: "none" },
                }}
              />
            ))
        }
      </Geographies>

      {pins.map((pin) => (
        <Marker key={pin.key} coordinates={pin.coords}>
          <Pin />
        </Marker>
      ))}
    </ComposableMap>
  );
}

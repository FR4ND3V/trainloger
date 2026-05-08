"use client";

import { useEffect, useState, useRef } from "react";
import type { Activity, HRZone, PowerZone } from "@/app/types";
import {
  X, Bike, Footprints, Waves, Activity as ActivityIcon,
  Heart, Zap, Mountain, Clock, Route, Flame, TrendingUp,
  Gauge, Wind, RotateCcw, Map as MapIcon
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────

function fmt(val: number | null | undefined, decimals = 0, suffix = ""): string {
  if (val == null) return "—";
  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(val)}${suffix}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatDistance(meters: number, type: string): string {
  if (type === "Swim") return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── HR Zone config ────────────────────────────────────────────────

const HR_ZONE_CONFIG = [
  { zone: 1, name: "Recuperación", color: "#4A9E5C" },
  { zone: 2, name: "Aeróbico base", color: "#5B9BF6" },
  { zone: 3, name: "Tempo", color: "#D4A843" },
  { zone: 4, name: "Umbral", color: "#E8742A" },
  { zone: 5, name: "VO2Max", color: "#D71921" },
];

const POWER_ZONE_CONFIG = [
  { zone: 1, name: "Activa Recovery", color: "#4A9E5C" },
  { zone: 2, name: "Endurance", color: "#5B9BF6" },
  { zone: 3, name: "Tempo", color: "#A78BFA" },
  { zone: 4, name: "Threshold", color: "#D4A843" },
  { zone: 5, name: "VO2Max", color: "#E8742A" },
  { zone: 6, name: "Anaerobic", color: "#D71921" },
  { zone: 7, name: "Neuromuscular", color: "#FF4DFF" },
];

// ─── Sport config ──────────────────────────────────────────────────

const sportConfig: Record<string, { icon: any; label: string; color: string }> = {
  Run: { icon: Footprints, label: "Running", color: "var(--success)" },
  Swim: { icon: Waves, label: "Swimming", color: "var(--interactive)" },
  Ride: { icon: Bike, label: "Cycling", color: "var(--warning)" },
  Core: { icon: ActivityIcon, label: "Core / Pilates", color: "var(--text-secondary)" },
  Strength: { icon: ActivityIcon, label: "Strength", color: "var(--text-secondary)" },
  Other: { icon: ActivityIcon, label: "Other", color: "var(--text-disabled)" },
};

// ─── Sub-components ────────────────────────────────────────────────

function MetricBox({ label, value, icon, color }: {
  label: string; value: string; icon?: React.ReactNode; color?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-[12px] bg-[var(--surface-raised)] border border-[var(--border)]">
      <div className="flex items-center gap-2">
        {icon && <span style={{ color: color || "var(--text-disabled)" }}>{icon}</span>}
        <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-disabled)]">{label}</span>
      </div>
      <span className="font-mono text-[18px] font-bold text-[var(--text-display)]" style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  );
}

function ZoneBar({ label, name, color, percentage, seconds }: {
  label: string; name: string; color: string; percentage: number; seconds: number;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  const timeStr = mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[var(--text-disabled)]">{label}</span>
          <span className="text-[var(--text-secondary)]">{name}</span>
        </div>
        <div className="flex items-center gap-3 text-[var(--text-disabled)]">
          <span>{timeStr}</span>
          <span className="text-[var(--text-primary)] font-bold">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Lazy Map Component ────────────────────────────────────────────

function ActivityMap({ polyline }: { polyline: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !polyline) return;

    let map: any;
    const initMap = async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        // Decode polyline
        const decode = (encoded: string) => {
          const coords: [number, number][] = [];
          let index = 0, lat = 0, lng = 0;
          while (index < encoded.length) {
            let b, shift = 0, result = 0;
            do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lat += (result & 1) ? ~(result >> 1) : result >> 1;
            shift = 0; result = 0;
            do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lng += (result & 1) ? ~(result >> 1) : result >> 1;
            coords.push([lat / 1e5, lng / 1e5]);
          }
          return coords;
        };

        const coords = decode(polyline);
        if (coords.length === 0) { setError(true); return; }

        map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: "© OpenStreetMap © CARTO",
        }).addTo(map);

        const route = L.polyline(coords, { color: "#D71921", weight: 3, opacity: 0.9 }).addTo(map);
        map.fitBounds(route.getBounds(), { padding: [16, 16] });

        // Start / End markers
        const dot = (color: string) => L.divIcon({
          html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
          className: "", iconAnchor: [5, 5],
        });
        L.marker(coords[0], { icon: dot("#4A9E5C") }).addTo(map);
        L.marker(coords[coords.length - 1], { icon: dot("#D71921") }).addTo(map);
      } catch {
        setError(true);
      }
    };

    initMap();
    return () => { if (map) map.remove(); };
  }, [polyline]);

  if (error) return null;

  return (
    <div className="mt-2 rounded-[12px] overflow-hidden border border-[var(--border-visible)]" style={{ height: 260 }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────

interface ActivityModalProps {
  activity: Activity | null;
  onClose: () => void;
}

export default function ActivityModal({ activity, onClose }: ActivityModalProps) {
  const [zones, setZones] = useState<{ hr?: HRZone[]; power?: PowerZone[] } | null>(null);
  const [zonesLoading, setZonesLoading] = useState(false);

  // Lock body scroll
  useEffect(() => {
    if (activity) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activity]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Fetch zones from API
  useEffect(() => {
    if (!activity) { setZones(null); return; }
    if (!activity.id) return;
    setZonesLoading(true);
    fetch(`/api/activity/${activity.id}/zones`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { 
        console.log(`[ActivityModal] Received zones for ${activity.id}:`, data);
        if (data) setZones(data); 
      })
      .catch((err) => { console.error(`[ActivityModal] Zones fetch error:`, err); })
      .finally(() => setZonesLoading(false));
  }, [activity]);

  if (!activity) return null;

  const config = sportConfig[activity.type] || sportConfig.Other;
  const Icon = config.icon;
  const hrZones = zones?.hr || activity.hrZones;
  const powerZones = zones?.power || activity.powerZones;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-2xl max-h-[95dvh] overflow-y-auto
          bg-[var(--surface)] border border-[var(--border-visible)]
          rounded-t-[24px] sm:rounded-[24px] shadow-2xl
          animate-slide-up"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-5
            border-b border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border"
              style={{ borderColor: `${config.color}55`, background: `${config.color}11` }}
            >
              <Icon className="h-5 w-5" style={{ color: config.color }} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: config.color }}>
                {config.label} · {formatDate(activity.date)}
              </p>
              <h2 className="text-[15px] font-bold uppercase text-[var(--text-display)] leading-tight">
                {activity.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-visible)]
              text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]
              transition-all duration-200"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* ── Summary Row ─────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <MetricBox
              label="Distancia"
              value={formatDistance(activity.distance, activity.type)}
              icon={<Route className="h-3.5 w-3.5" strokeWidth={1.5} />}
            />
            <MetricBox
              label="Duración"
              value={formatDuration(activity.duration)}
              icon={<Clock className="h-3.5 w-3.5" strokeWidth={1.5} />}
            />
            {activity.calories != null ? (
              <MetricBox
                label="Calorías"
                value={fmt(activity.calories, 0, " kcal")}
                icon={<Flame className="h-3.5 w-3.5" strokeWidth={1.5} />}
                color="var(--accent)"
              />
            ) : activity.trainingLoad != null ? (
              <MetricBox
                label="Carga (TSS)"
                value={fmt(activity.trainingLoad, 0)}
                icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />}
              />
            ) : (
              <MetricBox label="Elevación" value={fmt(activity.elevationGain, 0, " m")} icon={<Mountain className="h-3.5 w-3.5" strokeWidth={1.5} />} />
            )}
          </div>

          {/* ── HR Metrics ──────────────────────────────── */}
          {(activity.avgHR || activity.maxHR) && (
            <section>
              <h3 className="text-label text-[var(--text-disabled)] mb-3">Frecuencia Cardíaca</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activity.avgHR && (
                  <MetricBox label="FC Media" value={`${activity.avgHR} BPM`}
                    icon={<Heart className="h-3.5 w-3.5" strokeWidth={1.5} />} color="var(--accent)" />
                )}
                {activity.maxHR && (
                  <MetricBox label="FC Máxima" value={`${activity.maxHR} BPM`}
                    icon={<Heart className="h-3.5 w-3.5" strokeWidth={1.5} />} color="#FF4444" />
                )}
              </div>
            </section>
          )}

          {/* ── Sport-Specific Metrics ───────────────────── */}

          {/* RUN */}
          {activity.type === "Run" && (
            <section>
              <h3 className="text-label text-[var(--text-disabled)] mb-3">Métricas Running</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activity.pace && (
                  <MetricBox label="Ritmo" value={activity.pace}
                    icon={<Gauge className="h-3.5 w-3.5" strokeWidth={1.5} />} color="var(--success)" />
                )}
                {activity.gap && (
                  <MetricBox label="Ritmo GAP" value={activity.gap}
                    icon={<Mountain className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.efficiencyFactor != null && (
                  <MetricBox label="Efficiency Factor" value={fmt(activity.efficiencyFactor, 2)}
                    icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.aerobicDecoupling != null && (
                  <MetricBox label="Decoupling Pa:Hr" value={`${fmt(activity.aerobicDecoupling, 1)}%`}
                    icon={<Wind className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    color={activity.aerobicDecoupling > 5 ? "var(--accent)" : "var(--success)"} />
                )}
                {activity.avgCadence != null && (
                  <MetricBox label="Cadencia" value={`${activity.avgCadence} spm`}
                    icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.elevationGain != null && (
                  <MetricBox label="Desnivel +" value={`+${Math.round(activity.elevationGain)} m`}
                    icon={<Mountain className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
              </div>
            </section>
          )}

          {/* RIDE */}
          {activity.type === "Ride" && (
            <section>
              <h3 className="text-label text-[var(--text-disabled)] mb-3">Métricas Ciclismo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activity.avgSpeed != null && (
                  <MetricBox label="Velocidad Media" value={`${activity.avgSpeed.toFixed(1)} km/h`}
                    icon={<Gauge className="h-3.5 w-3.5" strokeWidth={1.5} />} color="var(--warning)" />
                )}
                {activity.avgPower != null && (
                  <MetricBox label="Potencia Media" value={`${activity.avgPower} W`}
                    icon={<Zap className="h-3.5 w-3.5" strokeWidth={1.5} />} color="var(--warning)" />
                )}
                {activity.normalizedPower != null && (
                  <MetricBox label="Potencia Norm. (NP)" value={`${activity.normalizedPower} W`}
                    icon={<Zap className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.maxPower != null && (
                  <MetricBox label="Potencia Máx." value={`${activity.maxPower} W`}
                    icon={<Zap className="h-3.5 w-3.5" strokeWidth={1.5} />} color="#FF4444" />
                )}
                {activity.intensityFactor != null && (
                  <MetricBox label="Intensity Factor (IF)" value={fmt(activity.intensityFactor, 2)}
                    icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    color={activity.intensityFactor > 0.9 ? "var(--accent)" : "var(--text-primary)"} />
                )}
                {activity.tss != null && (
                  <MetricBox label="Training Stress (TSS)" value={fmt(activity.tss, 0)}
                    icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.avgCadenceBike != null && (
                  <MetricBox label="Cadencia" value={`${activity.avgCadenceBike} rpm`}
                    icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.elevationGain != null && (
                  <MetricBox label="Desnivel +" value={`+${Math.round(activity.elevationGain)} m`}
                    icon={<Mountain className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
              </div>
            </section>
          )}

          {/* SWIM */}
          {activity.type === "Swim" && (
            <section>
              <h3 className="text-label text-[var(--text-disabled)] mb-3">Métricas Natación</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activity.swimPace && (
                  <MetricBox label="Ritmo (100m)" value={activity.swimPace}
                    icon={<Gauge className="h-3.5 w-3.5" strokeWidth={1.5} />} color="var(--interactive)" />
                )}
                {activity.swolf != null && (
                  <MetricBox label="SWOLF" value={fmt(activity.swolf, 0)}
                    icon={<Wind className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.laps != null && (
                  <MetricBox label="Largos" value={fmt(activity.laps, 0)}
                    icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
                {activity.strokeCount != null && activity.laps != null && (
                  <MetricBox label="Brazadas/Largo" value={fmt(activity.strokeCount / activity.laps, 1)}
                    icon={<Route className="h-3.5 w-3.5" strokeWidth={1.5} />} />
                )}
              </div>
            </section>
          )}

          {/* ── HR Zones ─────────────────────────────────── */}
          {(hrZones && hrZones.length > 0) ? (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={1.5} />
                <h3 className="text-label text-[var(--text-disabled)]">Zonas de Frecuencia Cardíaca</h3>
              </div>
              <div className="space-y-3">
                {hrZones.map((z) => {
                  const cfg = HR_ZONE_CONFIG[z.zone - 1];
                  return (
                    <ZoneBar
                      key={z.zone}
                      label={`Z${z.zone}`}
                      name={cfg?.name || z.name}
                      color={cfg?.color || "#999"}
                      percentage={z.percentage}
                      seconds={z.seconds}
                    />
                  );
                })}
              </div>
            </section>
          ) : !zonesLoading && activity.avgHR ? (
            <section className="opacity-50">
               <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest text-center py-2">
                 [ NO SE HAN ENCONTRADO TIEMPOS EN ZONAS DE FC ]
               </p>
            </section>
          ) : null}
          {zonesLoading && (
            <div className="text-center py-4">
              <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest animate-pulse">
                [ CARGANDO ZONAS... ]
              </p>
            </div>
          )}

          {/* ── Power Zones ───────────────────────────────── */}
          {activity.type === "Ride" && (
            (powerZones && powerZones.length > 0) ? (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-3.5 w-3.5 text-[var(--warning)]" strokeWidth={1.5} />
                  <h3 className="text-label text-[var(--text-disabled)]">Zonas de Potencia</h3>
                </div>
                <div className="space-y-3">
                  {powerZones.map((z) => {
                    const cfg = POWER_ZONE_CONFIG[z.zone - 1];
                    return (
                      <ZoneBar
                        key={z.zone}
                        label={`Z${z.zone}`}
                        name={cfg?.name || z.name}
                        color={cfg?.color || "#999"}
                        percentage={z.percentage}
                        seconds={z.seconds}
                      />
                    );
                  })}
                </div>
              </section>
            ) : !zonesLoading && activity.avgPower ? (
              <section className="opacity-50">
                 <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest text-center py-2">
                   [ NO SE HAN ENCONTRADO TIEMPOS EN ZONAS DE POTENCIA ]
                 </p>
              </section>
            ) : null
          )}

          {/* ── Map ────────────────────────────────────────── */}
          {activity.mapPolyline && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MapIcon className="h-3.5 w-3.5 text-[var(--text-disabled)]" strokeWidth={1.5} />
                <h3 className="text-label text-[var(--text-disabled)]">Recorrido</h3>
              </div>
              <ActivityMap polyline={activity.mapPolyline} />
            </section>
          )}

          {/* ── Footer ─────────────────────────────────────── */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <p className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">
              ID: {activity.id}
            </p>
            <p className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">
              {new Date(activity.date).toLocaleString("es-ES")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

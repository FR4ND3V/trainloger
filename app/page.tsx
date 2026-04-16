"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Activity as ActivityIcon, 
  TrendingUp, 
  Droplets, 
  Heart, 
  Moon, 
  Zap, 
  Trophy,
  History,
  Info,
  Calendar,
  ChevronDown,
  BarChart3,
  LineChart as LineChartIcon,
  Download
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

import MetricCard from "./components/MetricCard";
import ActivityItem from "./components/ActivityItem";
import CoachPanel from "./components/CoachPanel";
import SyncButton from "./components/SyncButton";
import SegmentedProgressBar from "./components/SegmentedProgressBar";
import type { DashboardData, CoachAnalysis } from "./types";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// ─── Utility: Professional Formatting ─────────────────────────────

const formatNum = (val: number | null | undefined, decimals = 0): string => {
  if (val == null) return "—";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(val);
};

const formatPace = (seconds: number | string | undefined): string => {
    if (!seconds) return "—";
    if (typeof seconds === "string") return seconds; // already formatted
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")} min/km`;
};

// ─── Component: Custom Chart Tooltip ─────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#09090b]/90 p-4 backdrop-blur-md shadow-2xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {new Date(label).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-zinc-400">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-zinc-100">
                {entry.name.includes("Distancia") ? `${formatNum(entry.value / 1000, 1)} km` : formatNum(entry.value, 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());

  async function fetchData(isSync = false) {
    try {
      if (!isSync) setLoading(true);
      const params = new URLSearchParams({
        view,
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });
      const res = await fetch(`/api/stats?${params}`);
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      if (!isSync) setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedMonth]);

  const handleExport = () => {
    if (!data) return;
    
    const exportPayload = {
      metadata: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        viewMode: view,
        dateRange: data.weekRange,
      },
      analysis: coachAnalysis,
      wellness: data.wellness,
      summary: data.summary,
      activities: data.activities,
      charts: data.chartData
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const fileName = `entrenamiento-${view}-${data.weekRange.start}-al-${data.weekRange.end}.json`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const coachAnalysis = useMemo((): CoachAnalysis | null => {
    if (!data) return null;
    const tsb = view === "monthly" ? (data.summary?.avgTSB ?? 0) : (data.wellness.tsb ?? 0);
    if (tsb > 5) return { status: "peak", title: "Pico de Forma", message: "Preparado para competir.", emoji: "🚀" };
    if (tsb > -10) return { status: "optimal", title: "Consistencia", message: "Entrenamiento sólido.", emoji: "⚖️" };
    if (tsb > -30) return { status: "fatigued", title: "Carga Alta", message: "Cuida la recuperación.", emoji: "🔋" };
    return { status: "critical", title: "Sobreentrenamiento", message: "Riesgo extremo. Descansa.", emoji: "⚠️" };
  }, [data, view]);

  const runMetrics = useMemo(() => {
    if (!data) return null;
    const runs = data.activities.filter(a => a.type === "Run" && a.efficiencyFactor);
    if (!runs.length) return null;
    const avgEF = runs.reduce((sum, a) => sum + (a.efficiencyFactor || 0), 0) / runs.length;
    const avgDecoupling = runs.reduce((sum, a) => sum + (a.aerobicDecoupling || 0), 0) / runs.length;
    const latestGap = runs[0]?.gap;
    return { avgEF, avgDecoupling, latestGap };
  }, [data]);

  const swimMetrics = useMemo(() => {
    if (!data) return null;
    const swims = data.activities.filter(a => a.type === "Swim" && a.swolf);
    if (!swims.length) return null;
    const avgSwolf = swims.reduce((sum, a) => sum + (a.swolf || 0), 0) / swims.length;
    const latestPace = swims[0]?.swimPace;
    const avgStrokes = swims.reduce((sum, a) => sum + ((a.strokeCount || 0) / (a.laps || 1)), 0) / swims.length;
    return { avgSwolf, latestPace, avgStrokes };
  }, [data]);

  return (
    <div className="min-h-screen bg-black">
      <div className="space-y-24 py-20">
        
        {/* Header: Layer 1 (Metadata) & Layer 2 (Display Title) */}
        <header className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between animate-fade-in mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[var(--text-disabled)] tracking-[0.2em]">
              <Trophy className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-label">ATLETA ELITE // 01</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-display-lg text-[var(--text-display)] uppercase leading-tight">
                {view === "weekly" ? "TrainLogger" : MONTHS[selectedMonth]}
              </h1>
              <p className="text-label text-[var(--text-secondary)]">PERFORMANCE DATA // CORE SYSTEMS</p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {/* Segmented Control - Nothing Style */}
              <div className="inline-flex p-1 border border-[var(--border-visible)] rounded-[8px] bg-[var(--surface)]">
                {(["weekly", "monthly"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-6 py-2 text-label transition-all duration-200 rounded-[4px] min-h-[36px] ${
                      view === v 
                        ? "bg-[var(--text-display)] text-black font-bold" 
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {v === "weekly" ? "Semanal" : "Mensual"}
                  </button>
                ))}
              </div>

              {view === "monthly" && (
                <div className="relative group">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="appearance-none bg-[var(--surface)] border border-[var(--border-visible)] text-[var(--text-primary)] font-mono text-[11px] uppercase tracking-wider px-5 py-2.5 pr-10 rounded-[8px] cursor-pointer hover:border-[var(--text-secondary)]"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx} className="bg-black">{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)] pointer-events-none" strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={loading || !data}
              className="group btn-nothing btn-secondary"
              title="Descargar reporte detallado para análisis de IA"
            >
              <Download className="h-4 w-4" strokeWidth={1.5} />
              <span>Exportar JSON</span>
            </button>
            <SyncButton state={syncState} onClick={() => fetchData(true)} lastSync={data?.syncedAt} />
          </div>
        </header>


        {/* Bento Grid de Estado: Layer 2 */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 animate-fade-in-up">
          <MetricCard
            title="Aptitud (CTL)"
            value={formatNum(data?.wellness.ctl)}
            unit="pts"
            icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} />}
            subtitle="Fitness global"
            progress={data?.wellness.ctl ?? 0}
            maxProgress={150}
          />
          <MetricCard
            title="Fatiga (ATL)"
            value={formatNum(data?.wellness.atl)}
            unit="pts"
            icon={<Zap className="h-4 w-4" strokeWidth={1.5} />}
            subtitle="Fatiga acumulada"
            progress={data?.wellness.atl ?? 0}
            maxProgress={150}
          />
          <MetricCard
            title="Forma (TSB)"
            value={formatNum(view === "weekly" ? data?.wellness.tsb : data?.summary?.avgTSB)}
            unit="pts"
            icon={<ActivityIcon className="h-4 w-4" strokeWidth={1.5} />}
            subtitle="Recuperación y pico"
            status={(data?.wellness.tsb ?? 0) < -15 ? "warning" : (data?.wellness.tsb ?? 0) > 5 ? "success" : "neutral"}
          />
          <MetricCard
            title="Running"
            value={formatNum((data?.summary?.totalDistanceRun ?? 0) / 1000, 1)}
            unit="km"
            icon={<ActivityIcon className="h-4 w-4" strokeWidth={1.5} />}
            subtitle="Distancia running"
          />
          <MetricCard
            title="Natación"
            value={formatNum(data?.summary?.totalDistanceSwim ?? 0, 0)}
            unit="m"
            icon={<Droplets className="h-4 w-4" strokeWidth={1.5} />}
            subtitle="Distancia natación"
          />
          <MetricCard
            title="Carga Semanal"
            value={formatNum(data?.summary?.totalTrainingLoad, 0)}
            unit="TSS"
            icon={<Trophy className="h-4 w-4" strokeWidth={1.5} />}
            subtitle="Training Load (Load)"
          />
        </section>

        {/* Labs: Running & Swimming Analytics */}
        {(runMetrics || swimMetrics) && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in-up">
            {runMetrics && (
              <div className="nothing-card p-6">
                  <div className="mb-6 flex items-center justify-between">
                      <div>
                          <h3 className="text-label text-[var(--text-display)]">Running Lab</h3>
                          <p className="text-label text-[var(--text-disabled)] mt-1">Eficiencia y Biomecánica</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-[var(--interactive)]" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                      <span className="text-label text-[var(--text-secondary)]">Efficiency Factor (EF)</span>
                      <span className="font-mono text-[var(--text-primary)]">{formatNum(runMetrics.avgEF, 2)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                      <span className="text-label text-[var(--text-secondary)]">Ritmo GAP</span>
                      <span className="font-mono text-[var(--text-display)]">{runMetrics.latestGap || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label text-[var(--text-secondary)]">Decoupling (Pa:Hr)</span>
                      <span className="font-mono text-[var(--text-primary)]">{formatNum(runMetrics.avgDecoupling, 1)}%</span>
                    </div>
                  </div>
              </div>
            )}
            
            {swimMetrics && (
              <div className="nothing-card p-6">
                  <div className="mb-6 flex items-center justify-between">
                      <div>
                          <h3 className="text-label text-[var(--text-display)]">Swim Analytics</h3>
                          <p className="text-label text-[var(--text-disabled)] mt-1">Eficiencia de Nado</p>
                      </div>
                      <Droplets className="h-4 w-4 text-[var(--interactive)]" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                      <span className="text-label text-[var(--text-secondary)]">SWOLF Medio</span>
                      <span className="font-mono text-[var(--text-primary)]">{formatNum(swimMetrics.avgSwolf, 0)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                      <span className="text-label text-[var(--text-secondary)]">Ritmo Nado (100m)</span>
                      <span className="font-mono text-[var(--text-display)]">{swimMetrics.latestPace || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label text-[var(--text-secondary)]">Brazadas/Largo</span>
                      <span className="font-mono text-[var(--text-primary)]">{formatNum(swimMetrics.avgStrokes, 1)}</span>
                    </div>
                  </div>
              </div>
            )}
          </section>
        )}

        {/* Charts: Layer 2 (Visualization) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fade-in-up">
            
            {/* Area Chart: Performance History */}
            <div className="lg:col-span-2 nothing-card p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h3 className="text-label text-[var(--text-display)]">Tendencia de Rendimiento</h3>
                        <p className="text-label text-[var(--text-disabled)] mt-1">Evolución de Forma (TSB) vs Fitness (CTL)</p>
                    </div>
                    <LineChartIcon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                tickFormatter={(str) => new Date(str).toLocaleDateString("es-ES", { day: 'numeric' })}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}
                            />
                            <YAxis 
                                fontSize={10} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }} 
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                name="Fatiga (ATL)" 
                                type="stepAfter" 
                                dataKey="atl" 
                                stroke="var(--text-display)" 
                                fill="transparent" 
                                strokeWidth={2} 
                            />
                            <Area 
                                name="Forma (TSB)" 
                                type="stepAfter" 
                                dataKey="tsb" 
                                stroke="var(--accent)" 
                                fill="transparent" 
                                strokeWidth={2} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bar Chart: Volume Distribution */}
            <div className="nothing-card p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h3 className="text-label text-[var(--text-display)]">Distribución de Volumen</h3>
                        <p className="text-label text-[var(--text-disabled)] mt-1">Kilómetros por deporte</p>
                    </div>
                    <BarChart3 className="h-4 w-4 text-[var(--interactive)]" strokeWidth={1.5} />
                </div>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                tickFormatter={(str) => new Date(str).toLocaleDateString("es-ES", { day: 'numeric' })}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}
                            />
                            <YAxis 
                                fontSize={10} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }} 
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar name="Running" dataKey="runDistance" fill="var(--text-display)" radius={0} />
                            <Bar name="Swimming" dataKey="swimDistance" fill="var(--border-visible)" radius={0} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>

        {/* Coach & Activities Row: Layer 3 (Detail/Body) */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10 animate-fade-in-up">
            <CoachPanel analysis={coachAnalysis} loading={loading} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-[var(--text-disabled)]" strokeWidth={1.5} />
                        <h2 className="text-display-md text-[24px] uppercase tracking-tight text-[var(--text-display)]">Actividades</h2>
                    </div>
                </div>
                <div className="space-y-4">
                    {loading ? (
                      <div className="nothing-card p-12 flex flex-col items-center justify-center gap-2">
                        <span className="text-label text-[11px] text-[var(--text-disabled)] animate-pulse">
                          [ LOADING ACTIVITIES ]
                        </span>
                        <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-[0.2em]">
                          FETCHING RECENT SESSIONS...
                        </span>
                      </div>
                    ) : 
                    data?.activities.map((a) => <ActivityItem key={a.id} activity={a} />)}
                </div>

            </div>
          </div>

          <aside className="space-y-8 animate-fade-in-up">
            <section className="nothing-card p-6">
              <h3 className="text-label text-[var(--text-secondary)]">Salud & Recuperación</h3>
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Moon className="h-4 w-4 text-[var(--interactive)]" strokeWidth={1.5} />
                        <span className="text-[13px] font-mono uppercase text-[var(--text-primary)]">Calidad Sueño</span>
                    </div>
                    <span className="text-[13px] font-mono text-[var(--success)]">{formatNum(data?.wellness.sleepScore)}%</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-6">
                    <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
                        <span className="text-[13px] font-mono uppercase text-[var(--text-primary)]">FC Reposo</span>
                    </div>
                    <span className="text-[13px] font-mono text-[var(--text-display)]">{formatNum(data?.wellness.restingHR)} BPM</span>
                </div>
              </div>
            </section>

            <section className="nothing-card p-6 overflow-hidden relative">
              <h3 className="text-label text-[var(--accent)]">PRÓXIMA META</h3>
              <div className="mt-6 flex flex-col gap-2">
                <p className="text-[20px] font-sans font-bold text-[var(--text-display)] tracking-tight uppercase">Maratón de Valencia</p>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-[48px] font-display text-[var(--text-display)] leading-none tracking-tight">42</span>
                  <span className="text-label text-[var(--text-secondary)]">DÍAS</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

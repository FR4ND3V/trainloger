"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Droplets, 
  Activity,
  Calendar,
  ChevronDown,
  BarChart3,
  LineChart as LineChartIcon,
  Zap
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

import MetricCard from "../components/MetricCard";
import SyncButton from "../components/SyncButton";
import type { DashboardData } from "../types";

const formatNum = (val: number | null | undefined, decimals = 0): string => {
  if (val == null) return "—";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(val);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[var(--border-visible)] bg-[var(--surface)]/90 p-4 backdrop-blur-md shadow-2xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {new Date(label).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-[var(--text-secondary)]">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {entry.name.includes("Distancia") || entry.name.includes("Running") || entry.name.includes("Swimming") || entry.name.includes("Ciclismo") ? `${formatNum(entry.value / 1000, 1)} km` : formatNum(entry.value, 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function TrendsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setMounted(true);
  }, []);
  const YEARS = [2023, 2024, 2025, 2026];

  async function fetchData(isSync = false) {
    try {
      if (!isSync) setLoading(true);
      const params = new URLSearchParams({
        view: "yearly",
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
  }, [selectedYear]);

  // Aggregate data by month for the Volume Bar Chart
  const monthlyChartData = useMemo(() => {
    if (!data?.chartData) return [];
    
    const monthlyMap: Record<string, { date: string, runDistance: number, swimDistance: number, rideDistance: number }> = {};
    
    data.chartData.forEach(entry => {
      const dateObj = new Date(entry.date);
      // Valid date check
      if (isNaN(dateObj.getTime())) return;
      
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-01`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { date: monthKey, runDistance: 0, swimDistance: 0, rideDistance: 0 };
      }
      
      monthlyMap[monthKey].runDistance += (entry.runDistance || 0);
      monthlyMap[monthKey].swimDistance += (entry.swimDistance || 0);
      monthlyMap[monthKey].rideDistance += (entry.rideDistance || 0);
    });
    
    return Object.values(monthlyMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <div className="min-h-screen bg-[var(--black)]">
      <div className="space-y-24 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between animate-fade-in mt-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[var(--text-disabled)] tracking-[0.2em]">
              <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-label">MACRO ANALYTICS // YEARLY</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-display-lg text-[var(--text-display)] uppercase leading-tight">
                Trends {selectedYear}
              </h1>
              <p className="text-label text-[var(--text-secondary)]">YEAR IN REVIEW // ATHLETE DATA</p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="relative group">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="appearance-none bg-[var(--surface)] border border-[var(--border-visible)] text-[var(--text-primary)] font-mono text-[11px] uppercase tracking-wider px-5 py-2.5 pr-10 rounded-[8px] cursor-pointer hover:border-[var(--text-secondary)]"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="bg-black">{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)] pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {mounted && data?.syncedAt && (
               <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest hidden md:block">
                 Última Sincro: {new Date(data.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
             )}
             <SyncButton variant="dashboard" onSyncComplete={() => fetchData(true)} />
          </div>
        </header>

        {/* Loading States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span className="text-label text-[11px] text-[var(--text-disabled)] animate-pulse">
                  [ AGGREGATING YEARLY DATA ]
              </span>
              <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-[0.2em]">
                  THIS MIGHT TAKE A FEW SECONDS...
              </span>
          </div>
        )}
        
        {/* Error Handling & Configuration Prompt */}
        {error && !loading && (
          <section className="animate-fade-in">
            <div className="nothing-card p-8 border-[var(--accent)]/30 bg-[var(--accent)]/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[var(--accent)]">
                  <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
                  <span className="text-label font-bold uppercase tracking-widest">Macro Analysis Error</span>
                </div>
                <p className="text-[14px] font-mono text-[var(--text-primary)] uppercase tracking-wide">
                  {error}
                </p>
              </div>
              {error.includes("configuration") || error.includes("credentials") ? (
                <Link 
                  href="/settings"
                  className="btn-nothing btn-primary whitespace-nowrap"
                >
                  Configurar Credenciales
                </Link>
              ) : (
                <button 
                  onClick={() => fetchData()}
                  className="btn-nothing btn-secondary whitespace-nowrap"
                >
                  Reintentar Conexión
                </button>
              )}
            </div>
          </section>
        )}

        {/* Dashboard Content */}
        {!loading && !error && data && (
          <>
            {/* KPI Grid */}
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 animate-fade-in-up">
              <MetricCard
                title="Running"
                value={formatNum((data.summary?.totalDistanceRun ?? 0) / 1000, 1)}
                unit="km"
                icon={<Activity className="h-4 w-4" strokeWidth={1.5} />}
                subtitle="Distancia Anual"
              />
              <MetricCard
                title="Ciclismo"
                value={formatNum((data.summary?.totalDistanceRide ?? 0) / 1000, 1)}
                unit="km"
                icon={<Zap className="h-4 w-4" strokeWidth={1.5} />}
                subtitle="Distancia Anual"
              />
              <MetricCard
                title="Natación"
                value={formatNum((data.summary?.totalDistanceSwim ?? 0) / 1000, 1)}
                unit="km"
                icon={<Droplets className="h-4 w-4" strokeWidth={1.5} />}
                subtitle="Distancia Anual"
              />
              <MetricCard
                title="Carga Anual"
                value={formatNum(data.summary?.totalTrainingLoad, 0)}
                unit="TSS"
                icon={<BarChart3 className="h-4 w-4" strokeWidth={1.5} />}
                subtitle="Training Stress Score"
              />
              <MetricCard
                title="Sesiones"
                value={formatNum(data.activities?.length, 0)}
                unit="acts"
                icon={<Calendar className="h-4 w-4" strokeWidth={1.5} />}
                subtitle="Total de Actividades"
              />
            </section>


            {/* Charts Grid */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in-up">
                
                {/* Area Chart: Fitness & Fatigue Over Year */}
                <div className="nothing-card p-6">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-label text-[var(--text-display)]">Macro Forma & Fatiga</h3>
                            <p className="text-label text-[var(--text-disabled)] mt-1">TSB vs ATL vs CTL Diario</p>
                        </div>
                        <LineChartIcon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
                    </div>
                    <div className="h-[350px] w-full flex items-center justify-center overflow-hidden">
                        {mounted && data?.chartData && (
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis 
                                    dataKey="date" 
                                    fontSize={10} 
                                    tickFormatter={(str) => {
                                      const d = new Date(str);
                                      return (d.getDate() === 1 || d.getDate() === 15) ? d.toLocaleDateString("es-ES", { month: 'short' }) : '';
                                    }}
                                    interval={"preserveStartEnd"}
                                    minTickGap={30}
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
                                    type="monotone" 
                                    dataKey="atl" 
                                    stroke="var(--text-display)" 
                                    fill="transparent" 
                                    strokeWidth={1.5} 
                                    dot={false}
                                />
                                <Area 
                                    name="Forma (TSB)" 
                                    type="monotone" 
                                    dataKey="tsb" 
                                    stroke="#D71921" 
                                    fill="transparent" 
                                    strokeWidth={1.5} 
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Bar Chart: Monthly Volume Distribution */}
                <div className="nothing-card p-6">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-label text-[var(--text-display)]">Volumen Mensual</h3>
                            <p className="text-label text-[var(--text-disabled)] mt-1">Kilómetros acumulados por mes</p>
                        </div>
                        <BarChart3 className="h-4 w-4 text-[var(--interactive)]" strokeWidth={1.5} />
                    </div>
                    <div className="h-[350px] w-full flex items-center justify-center overflow-hidden">
                        {mounted && monthlyChartData.length > 0 && (
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                  <XAxis 
                                      dataKey="date" 
                                      fontSize={10} 
                                      tickFormatter={(str) => new Date(str).toLocaleDateString("es-ES", { month: 'short' })}
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
                                  <Bar name="Running (km)" dataKey="runDistance" stackId="a" fill="#10B981" radius={0} />
                                  <Bar name="Ciclismo (km)" dataKey="rideDistance" stackId="a" fill="#F59E0B" radius={0} />
                                  <Bar name="Swimming (km)" dataKey="swimDistance" stackId="a" fill="#3B82F6" radius={0} />
                              </BarChart>
                          </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </section>
          </>
        )}
      </div>
    </div>
  );
}

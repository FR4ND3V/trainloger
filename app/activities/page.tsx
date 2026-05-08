"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Activity as ActivityIcon,
  Search,
  Filter,
  Calendar,
  Zap,
  Heart,
  Droplets,
  Trophy,
  ArrowUpRight
} from "lucide-react";

import ActivityModal from "../components/ActivityModal";
import SyncButton from "../components/SyncButton";
import type { Activity } from "../types";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch a larger range for the activities page (last 90 days)
      const res = await fetch(`/api/stats?view=monthly&month=${new Date().getMonth()}&year=${new Date().getFullYear()}`);
      const result = await res.json();
      
      if (result.error) throw new Error(result.error);
      
      setActivities(result.activities || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial de actividades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                           a.type.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedType === "All" || a.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [activities, search, selectedType]);

  const stats = useMemo(() => {
    const totalDist = activities.reduce((s, a) => s + (a.distance || 0), 0) / 1000;
    const totalTime = activities.reduce((s, a) => s + (a.duration || 0), 0) / 3600;
    return { totalDist, totalTime, count: activities.length };
  }, [activities]);

  const getSportIcon = (type: string) => {
    switch (type) {
      case "Ride": return <Zap className="h-4 w-4 text-[#F59E0B]" strokeWidth={1.5} />;
      case "Run": return <ActivityIcon className="h-4 w-4 text-[#10B981]" strokeWidth={1.5} />;
      case "Swim": return <Droplets className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />;
      default: return <ActivityIcon className="h-4 w-4 text-[var(--text-disabled)]" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--black)]">
      <div className="space-y-16 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between animate-fade-in mt-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[var(--text-disabled)] tracking-[0.2em]">
              <Trophy className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-label uppercase">Activity Log // History</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-display-lg text-[var(--text-display)] uppercase leading-tight">
                Actividades
              </h1>
              <p className="text-label text-[var(--text-secondary)]">INSPECCIÓN TÉCNICA // REGISTRO COMPLETO</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 pb-2">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">VOLUMEN REGISTRADO</span>
                <span className="text-[18px] font-mono text-[var(--text-primary)]">{stats.totalDist.toFixed(1)} <span className="text-[10px] text-[var(--text-disabled)]">KM</span></span>
             </div>
             <SyncButton variant="dashboard" onSyncComplete={fetchData} />
          </div>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)] group-focus-within:text-[var(--text-primary)] transition-colors" />
              <input 
                type="text"
                placeholder="BUSCAR POR NOMBRE O TIPO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border-visible)] rounded-[12px] pl-12 pr-4 py-4 text-xs font-mono tracking-widest uppercase focus:border-[var(--text-secondary)] focus:outline-none transition-all"
              />
           </div>

           <div className="flex gap-2">
              {["All", "Run", "Ride", "Swim"].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-6 py-4 rounded-[12px] border text-[10px] font-mono tracking-widest uppercase transition-all ${
                    selectedType === type 
                      ? "bg-[var(--text-display)] border-[var(--text-display)] text-black font-bold" 
                      : "bg-[var(--surface)] border-[var(--border-visible)] text-[var(--text-disabled)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {type === "All" ? "TODAS" : type}
                </button>
              ))}
           </div>
        </div>

        {/* List Content */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
           {loading ? (
             <div className="py-20 text-center">
                <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-[0.3em] animate-pulse">
                   [ RECUPERANDO REGISTROS... ]
                </p>
             </div>
           ) : error ? (
             <div className="nothing-card p-12 text-center border-[var(--error)]/30">
                <p className="text-sm font-mono text-[var(--error)]">{error}</p>
             </div>
           ) : filteredActivities.length === 0 ? (
             <div className="nothing-card p-12 text-center opacity-50">
                <p className="text-label uppercase tracking-widest text-[var(--text-disabled)]">No se han encontrado actividades</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-2">
                {filteredActivities.map((a, idx) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedActivity(a)}
                    className="nothing-card group flex items-center gap-6 p-5 hover:bg-[var(--surface-raised)] transition-all text-left animate-slide-up"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <div className="h-12 w-12 flex items-center justify-center rounded-[12px] bg-[var(--surface)] border border-[var(--border-visible)] group-hover:border-[var(--text-secondary)] transition-colors">
                       {getSportIcon(a.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">
                             {new Date(a.date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[8px] text-[var(--border-visible)]">•</span>
                          <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">
                             {a.type}
                          </span>
                       </div>
                       <h4 className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-tight truncate group-hover:text-[var(--text-display)] transition-colors">
                          {a.name}
                       </h4>
                    </div>

                    <div className="hidden md:flex items-center gap-12 text-right">
                       <div className="space-y-1">
                          <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">DISTANCIA</p>
                          <p className="text-sm font-mono text-[var(--text-primary)]">{(a.distance / 1000).toFixed(2)} <span className="text-[9px] text-[var(--text-disabled)]">KM</span></p>
                       </div>
                       <div className="space-y-1 min-w-[80px]">
                          <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">CARGA</p>
                          <p className="text-sm font-mono text-[var(--text-primary)]">{Math.round(a.trainingLoad || 0)} <span className="text-[9px] text-[var(--text-disabled)]">TSS</span></p>
                       </div>
                       <div className="h-8 w-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight className="h-4 w-4 text-[var(--text-display)]" />
                       </div>
                    </div>
                  </button>
                ))}
             </div>
           )}
        </div>

        {selectedActivity && (
          <ActivityModal 
            activity={selectedActivity} 
            onClose={() => setSelectedActivity(null)} 
          />
        )}
      </div>
    </div>
  );
}

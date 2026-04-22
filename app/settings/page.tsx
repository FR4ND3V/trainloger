import { getSettings, updateSettings } from './actions'
import { Settings, Shield, Cpu, Activity, Save, RefreshCw } from 'lucide-react'
import SettingsForm from './SettingsForm'
import SyncButton from '../components/SyncButton'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex justify-center">
      <div className="w-full max-w-4xl space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-end justify-between border-b border-[var(--border-visible)] pb-6">
          <div className="space-y-1">
            <h1 className="text-display-md text-[var(--text-display)] uppercase tracking-tight flex items-center gap-3">
              <Settings className="h-8 w-8 text-[var(--accent)]" /> Configuración
            </h1>
            <p className="text-label text-[var(--text-secondary)]">CORE SYSTEM // DATA INTEGRATIONS</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-[0.2em]">
              Status: [ ENCRYPTED_CHANNEL_ACTIVE ]
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Information Sidebar */}
          <div className="space-y-6">
            <div className="nothing-card p-6 space-y-4">
              <div className="flex items-center gap-3 text-[var(--accent)]">
                <Shield className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Seguridad</span>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed">
                Tus credenciales de Intervals.icu se cifran mediante AES-256 antes de ser almacenadas en la base de datos.
              </p>
            </div>

            <div className="nothing-card p-6 space-y-4 opacity-50">
              <div className="flex items-center gap-3 text-[var(--text-disabled)]">
                <Cpu className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest font-mono">System Info</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-[9px] uppercase">
                  <span>Version</span>
                  <span>v1.0.4-beta</span>
                </div>
                <div className="flex justify-between font-mono text-[9px] uppercase">
                  <span>Region</span>
                  <span>EU-WEST-1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Settings Form */}
          <div className="lg:col-span-2 space-y-8">
            <SettingsForm initialSettings={settings} />

             {/* Support Boxes: Syncing */}
             <div className="space-y-4">
                <div className="p-6 border border-dashed border-[var(--border-visible)] rounded-2xl flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                    <div className="space-y-1">
                      <p className="text-[11px] font-mono font-bold uppercase tracking-wider">¿Necesitas sincronizar ahora?</p>
                      <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Sincronización manual de datos recientes (90 días)</p>
                    </div>
                    <SyncButton />
                </div>

                <div className="p-6 border border-[var(--accent)]/20 bg-[var(--accent)]/5 rounded-2xl flex items-center justify-between group hover:border-[var(--accent)]/40 transition-all">
                    <div className="space-y-1">
                      <p className="text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">¿Desde el principio de los tiempos?</p>
                      <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Sincronización total de tu historial completo (10 años)</p>
                    </div>
                    <SyncButton isFull={true} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

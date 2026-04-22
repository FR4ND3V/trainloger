'use client'

import { useState } from 'react'
import { Activity, Save, RefreshCw, Check, AlertCircle, Calendar, LogOut } from 'lucide-react'
import { updateSettings, testConnection } from './actions'
import { signOut } from '@/app/login/actions'

interface SettingsFormProps {
  initialSettings: any
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [athleteId, setAthleteId] = useState(initialSettings?.intervals_athlete_id || '')
  const [apiKey, setApiKey] = useState(initialSettings?.intervals_api_key || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [calendarUrl, setCalendarUrl] = useState(initialSettings?.calendar_ics_url || '')

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testConnection(athleteId, apiKey)
      setTestResult(result)
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      await updateSettings(formData)
      alert("Configuración guardada correctamente")
    } catch (err) {
      console.error(err)
      alert("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="nothing-card-raised p-1">
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 mb-6">
            <Activity className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] font-mono">Intervals.icu Integration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label 
                className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em]" 
                htmlFor="athlete_id"
              >
                Athlete ID (Intervals.icu)
              </label>
              <input
                id="athlete_id"
                name="athlete_id"
                type="text"
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                placeholder="i12345"
                className="w-full bg-black/30 border-b border-[var(--border-visible)] py-3 px-1 text-[13px] font-mono focus:border-[var(--accent)] outline-none transition-all placeholder:opacity-20"
              />
              <p className="text-[8px] font-mono text-[var(--text-disabled)] italic">
                Tu identificador único de atleta.
              </p>
            </div>

            <div className="space-y-2">
              <label 
                className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em]" 
                htmlFor="api_key"
              >
                API Key (Intervals.icu)
              </label>
              <input
                id="api_key"
                name="api_key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-black/30 border-b border-[var(--border-visible)] py-3 px-1 text-[13px] font-mono focus:border-[var(--accent)] outline-none transition-all placeholder:opacity-20 font-password"
              />
              <p className="text-[8px] font-mono text-[var(--text-disabled)] italic">
                Clave de acceso desde Intervals.icu Settings.
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Integration */}
        <div className="space-y-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] font-mono">External Calendar Integration</h2>
          </div>

          <div className="space-y-2">
            <label 
              className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em]" 
              htmlFor="calendar_ics_url"
            >
              iCal Feed URL (Google / Apple Calendar)
            </label>
            <input
              id="calendar_ics_url"
              name="calendar_ics_url"
              type="text"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              className="w-full bg-black/30 border-b border-[var(--border-visible)] py-3 px-1 text-[13px] font-mono focus:border-[var(--accent)] outline-none transition-all placeholder:opacity-20"
            />
            {calendarUrl.includes('/embed') && (
              <p className="text-[9px] font-mono text-[var(--accent)] mt-2 uppercase animate-pulse">
                ⚠️ Estás usando un enlace de "Insertar" (HTML). Debes usar el "Enlace secreto en formato iCal" que termina en .ics
              </p>
            )}
            <p className="text-[8px] font-mono text-[var(--text-disabled)] italic mt-1">
              Pega aquí el enlace secreto de tu calendario en formato iCal (.ics).
            </p>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
            testResult.success 
              ? 'bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]' 
              : 'bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]'
          }`}>
            {testResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-[11px] font-mono uppercase tracking-wider">
              {testResult.success ? 'Conexión Exitosa: Credenciales verificadas' : `Error: ${testResult.error}`}
            </span>
          </div>
        )}

        <div className="pt-8 mt-4 border-t border-[var(--border-visible)] flex flex-col sm:flex-row justify-between gap-4">
          <button 
            type="button"
            onClick={() => signOut()}
            className="btn-nothing text-[var(--accent)] hover:bg-[var(--accent)]/5 px-6 py-4 text-[11px] font-bold border border-[var(--accent)]/20 flex items-center justify-center gap-3 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={handleTest}
              disabled={testing || !athleteId || !apiKey}
              className="btn-nothing btn-secondary px-6 py-4 text-[11px] font-bold border-dashed disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Test Connection
            </button>
            
            <button 
              type="submit"
              disabled={isSaving}
              className="btn-nothing btn-primary px-8 py-4 text-[11px] font-bold transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

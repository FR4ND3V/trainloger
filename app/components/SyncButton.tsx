'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { triggerManualSync } from '../settings/actions'

interface SyncButtonProps {
  variant?: 'minimal' | 'dashboard' | 'settings'
  isFull?: boolean
  onSyncComplete?: () => void
}

export default function SyncButton({ variant = 'minimal', isFull = false, onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const handleSync = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    setLastMessage(isFull ? 'Sincronizando Historial...' : 'Sincronizando...')
    
    try {
      const result = await triggerManualSync(isFull)
      if (result.success) {
        setLastMessage(isFull ? '✓ Historial Completo' : '✓ Completado')
        if (onSyncComplete) onSyncComplete()
        setTimeout(() => setLastMessage(null), 3000)
      } else {
        setLastMessage(`Error: ${result.error}`)
        // If missing keys, specifically guide the user
        if (result.error.includes('Missing')) {
           setLastMessage('⚠️ Error Config.')
        }
      }
    } catch (err) {
      setLastMessage('Error de red')
    } finally {
      setIsSyncing(false)
    }
  }

  if (variant === 'dashboard') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`btn-nothing ${isSyncing ? 'opacity-70 bg-white/5' : 'btn-secondary'}`}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-[var(--accent)]' : ''}`} strokeWidth={1.5} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
        {lastMessage && (
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] animate-pulse px-2">
            {lastMessage}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button 
        onClick={handleSync}
        disabled={isSyncing}
        className={`p-3 bg-[var(--surface)] rounded-full border border-[var(--border-visible)] hover:border-[var(--accent)] transition-all ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Sincronizar ahora"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
      </button>
      {lastMessage && (
        <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent)] animate-pulse">
          {lastMessage}
        </span>
      )}
    </div>
  )
}

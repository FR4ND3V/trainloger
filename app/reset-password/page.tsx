import { updatePassword } from './actions'
import { Lock, ShieldCheck } from 'lucide-react'

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-10 animate-fade-in">
        
        {/* Header Section */}
        <div className="space-y-6 text-center">
           <div className="flex justify-center">
             <div className="p-4 border border-[var(--border-visible)] rounded-2xl bg-[var(--surface)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity" />
               <ShieldCheck className="h-8 w-8 text-[var(--accent)] relative z-10" strokeWidth={1.5} />
             </div>
           </div>
           <div className="space-y-2">
             <h1 className="text-display-md text-[var(--text-display)] uppercase tracking-tight">
               Nueva Clave
             </h1>
             <p className="text-label text-[var(--text-secondary)]">TRAINLOGGER // SECURITY OVERRIDE</p>
           </div>
        </div>

        {/* Form Section */}
        <div className="nothing-card p-1 pb-1 overflow-hidden bg-black/40 border-[var(--border-visible)]">
          <form action={updatePassword} className="p-8 space-y-8">
            <div className="space-y-6">
              <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest leading-relaxed text-center">
                Establece una nueva clave de transmisión para tu sistema.
              </p>
              
              <div className="space-y-2 group">
                <label className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2" htmlFor="password">
                  <Lock className="h-3 w-3" /> Nueva Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/50 border-b border-[var(--border-visible)] py-4 px-2 text-[13px] font-mono focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-disabled)]/30"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2" htmlFor="confirm">
                  <Lock className="h-3 w-3" /> Confirmar Contraseña
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/50 border-b border-[var(--border-visible)] py-4 px-2 text-[13px] font-mono focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-disabled)]/30"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                className="w-full btn-nothing btn-primary py-5 text-[11px] font-bold tracking-[0.3em] uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Actualizar Clave
              </button>
            </div>

            {(searchParams.message || searchParams.error) && (
              <div className={`mt-6 p-4 border font-mono text-[10px] tracking-widest uppercase text-center animate-fade-in ${
                searchParams.error ? "border-[var(--accent)]/50 bg-[var(--accent)]/5 text-[var(--accent)]" : "border-[var(--success)]/50 bg-[var(--success)]/5 text-[var(--success)]"
              }`}>
                {searchParams.error || searchParams.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

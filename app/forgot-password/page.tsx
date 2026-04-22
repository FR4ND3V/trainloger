import { requestPasswordReset } from './actions'
import { KeyRound, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default async function ForgotPasswordPage(props: {
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
               <KeyRound className="h-8 w-8 text-[var(--accent)] relative z-10" strokeWidth={1.5} />
             </div>
           </div>
           <div className="space-y-2">
             <h1 className="text-display-md text-[var(--text-display)] uppercase tracking-tight">
               Recuperar Clave
             </h1>
             <p className="text-label text-[var(--text-secondary)]">TRAINLOGGER // RESET SEQUENCE</p>
           </div>
        </div>

        {/* Form Section */}
        <div className="nothing-card p-1 pb-1 overflow-hidden bg-black/40 border-[var(--border-visible)]">
          <form action={requestPasswordReset} className="p-8 space-y-8">
            <div className="space-y-6">
              <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest leading-relaxed">
                Ingresa tu email para recibir un enlace de recuperación de una sola sesión.
              </p>
              
              <div className="space-y-2 group">
                <label className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2" htmlFor="email">
                  <Mail className="h-3 w-3" /> Email Registrado
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="EMAIL@DOMAIN.COM"
                  className="w-full bg-black/50 border-b border-[var(--border-visible)] py-4 px-2 text-[13px] font-mono focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-disabled)]/30"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                className="w-full btn-nothing btn-primary py-5 text-[11px] font-bold tracking-[0.3em] uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Enviar Enlace
              </button>

              <Link
                href="/login"
                className="w-full btn-nothing btn-secondary py-5 text-[11px] font-bold tracking-[0.3em] uppercase rounded-xl transition-all block text-center flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-3 w-3" /> Volver al Inicio
              </Link>
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

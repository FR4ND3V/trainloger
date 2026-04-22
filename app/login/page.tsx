import { login, signup } from './actions'
import { Trophy, ArrowRight, Mail, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string; mode?: string }>
}) {
  const searchParams = await props.searchParams;
  const isSignUp = searchParams.mode === 'signup';

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-10 animate-fade-in">
        
        {/* Header Section */}
        <div className="space-y-6 text-center">
           <div className="flex justify-center">
             <div className="p-4 border border-[var(--border-visible)] rounded-2xl bg-[var(--surface)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity" />
               <Trophy className="h-8 w-8 text-[var(--accent)] relative z-10" strokeWidth={1.5} />
             </div>
           </div>
           <div className="space-y-2">
             <h1 className="text-display-md text-[var(--text-display)] uppercase tracking-tight">
               {isSignUp ? 'Crear Cuenta' : 'Sistema de Acceso'}
             </h1>
             <p className="text-label text-[var(--text-secondary)]">TRAINLOGGER // {isSignUp ? 'REGISTRATION' : 'SECURE GATEWAY'}</p>
           </div>
        </div>

        {/* Form Section */}
        <div className="nothing-card p-1 pb-1 overflow-hidden bg-black/40 border-[var(--border-visible)]">
          <form className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2" htmlFor="email">
                  <Mail className="h-3 w-3" /> Identificación de Usuario
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

              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2" htmlFor="password">
                    <Lock className="h-3 w-3" /> Código de Transmisión
                  </label>
                  {!isSignUp && (
                    <Link 
                      href="/forgot-password" 
                      className="text-[9px] font-mono text-[var(--text-disabled)] hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
                    >
                      ¿Olvidaste la clave?
                    </Link>
                  )}
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/50 border-b border-[var(--border-visible)] py-4 px-2 text-[13px] font-mono focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-disabled)]/30"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                formAction={isSignUp ? signup : login}
                className="w-full btn-nothing btn-primary py-5 text-[11px] font-bold tracking-[0.3em] uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {isSignUp ? 'Registrar Cuenta' : 'Iniciar Sesión'}
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[var(--border)]"></div>
                <span className="flex-shrink mx-4 text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">O</span>
                <div className="flex-grow border-t border-[var(--border)]"></div>
              </div>

              <Link
                href={isSignUp ? '/login' : '/login?mode=signup'}
                className="w-full btn-nothing btn-secondary py-5 text-[11px] font-bold tracking-[0.3em] uppercase rounded-xl transition-all block text-center"
              >
                {isSignUp ? 'Ya tengo cuenta' : 'Crear nueva cuenta'}
              </Link>
            </div>

            {(searchParams.message || searchParams.error) && (
              <div className={`mt-6 p-4 border font-mono text-[10px] tracking-widest uppercase text-center animate-fade-in ${
                searchParams.error ? "border-[var(--accent)]/50 bg-[var(--accent)]/5 text-[var(--accent)]" : "border-[var(--success)]/50 bg-[var(--success)]/5 text-[var(--success)]"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  {searchParams.error || searchParams.message}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4 opacity-20">
            <div className="h-px w-8 bg-[var(--text-primary)] self-center" />
            <span className="text-label text-[9px] tracking-[0.4em] uppercase">
              Secure Auth Terminal
            </span>
            <div className="h-px w-8 bg-[var(--text-primary)] self-center" />
          </div>
          <p className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-[0.2em] opacity-40">
            [ SUPABASE_ENCRYPTION_ACTIVE // NODE_{process.env.NODE_ENV?.toUpperCase()} ]
          </p>
        </div>
      </div>
    </div>
  )
}

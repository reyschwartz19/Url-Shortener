import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import GlobeVisualizer from './GlobeVisualizer';
import { useLogin, useRegister } from '../hooks/useAuth';
import { RateLimitError } from '../types/api';

interface AuthPageProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'analytics') => void;
  setUserEmail: (email: string) => void;
}

export default function AuthPage({ setView, setUserEmail }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all credentials fields.');
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password });
      setSuccess(true);
      setTimeout(() => {
        setUserEmail(email.split('@')[0]);
        setView('dashboard');
      }, 1000);
    } catch (err) {
      if (err instanceof RateLimitError) {
        const retryMsg = err.retryAfter
          ? ` Try again in ${err.retryAfter} seconds.`
          : '';
        setError(`${err.message}${retryMsg}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all signup requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await registerMutation.mutateAsync({ email, password });
      setSuccess(true);
      setTimeout(() => {
        setUserEmail(email.split('@')[0]);
        setView('dashboard');
      }, 1200);
    } catch (err) {
      if (err instanceof RateLimitError) {
        const retryMsg = err.retryAfter
          ? ` Try again in ${err.retryAfter} seconds.`
          : '';
        setError(`${err.message}${retryMsg}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-on-surface font-sans selection:bg-primary/20 selection:text-primary">
      
      {/* Back button */}
      <button
        onClick={() => setView('landing')}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-on-surface-variant hover:text-white bg-white/5 backdrop-blur px-3 py-2 rounded-none border border-white/10 transition-all cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      {/* Left Column - Tech details & Globe (40% width on Desktop) */}
      <aside className="relative w-full md:w-[40%] bg-white/3 flex flex-col justify-between p-8 md:p-12 overflow-hidden border-r border-white/10 shrink-0">
        
        {/* Globe interactive layer */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none scale-110">
          <GlobeVisualizer />
        </div>

        {/* Brand Top */}
        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-8 h-8 border border-primary flex items-center justify-center text-primary font-serif text-lg italic">
            R
          </div>
          <span className="font-sans text-[11px] tracking-[0.4em] uppercase font-bold text-white">Relay</span>
        </div>

        {/* Bold Typography */}
        <div className="relative z-10 max-w-sm my-16 md:my-0">
          <h1 className="text-4xl lg:text-5xl leading-[1.1] tracking-tight text-white mb-6 font-serif italic">
            Built for <br />
            <span className="text-primary">internet</span> <br />
            scale.
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
            The global infrastructure for URL delivery, enterprise link management, and low-latency redirects.
          </p>
        </div>

        {/* Stats Grid at Bottom */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
          <div>
            <div className="font-serif text-primary text-xl">99.99%</div>
            <div className="text-[9px] tracking-wider font-bold text-outline uppercase">Uptime</div>
          </div>
          <div>
            <div className="font-serif text-primary text-xl">47</div>
            <div className="text-[9px] tracking-wider font-bold text-outline uppercase">Regions</div>
          </div>
          <div>
            <div className="font-serif text-primary text-xl">12M+</div>
            <div className="text-[9px] tracking-wider font-bold text-outline uppercase">Redirects</div>
          </div>
        </div>
      </aside>

      {/* Right Column - Authentication Forms (60% width on Desktop) */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px] relative z-10">
          
          {/* Animated success wrapper */}
          {success ? (
            <div className="bg-white/3 border border-white/10 p-8 rounded-none flex flex-col items-center text-center gap-4 shadow-2xl animate-scaleIn">
              <div className="w-12 h-12 border border-secondary flex items-center justify-center text-secondary shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif italic text-white">Secure Gateway Authorized</h3>
                <p className="text-xs text-on-surface-variant">Syncing credentials with global edge nodes...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Login View */}
              {!isSignUp ? (
                <div className="bg-white/3 p-8 rounded-none border border-white/10 flex flex-col gap-6 shadow-2xl">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic text-white">Sign In</h2>
                    <p className="text-xs text-on-surface-variant">Access your global infrastructure dashboard.</p>
                  </div>

                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] tracking-wider font-bold text-outline uppercase">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full h-11 bg-black border border-white/10 rounded-none px-4 text-xs font-mono text-white focus:outline-none focus:border-primary transition-all placeholder:text-outline/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] tracking-wider font-bold text-outline uppercase">Password</label>
                        <button
                          type="button"
                          onClick={() => setError('Contact infrastructure ops team to reset keys.')}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Forgot?
                        </button>
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 bg-black border border-white/10 rounded-none px-4 text-xs font-mono text-white focus:outline-none focus:border-primary transition-all placeholder:text-outline/30"
                      />
                    </div>

                    {error && (
                      <div className="bg-error/5 border border-red-500/20 rounded-none p-3 text-xs text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-none border-white/10 bg-black text-primary focus:ring-primary/20"
                      />
                      <label htmlFor="remember" className="text-xs text-on-surface-variant cursor-pointer select-none">
                        Remember this device
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-11 bg-primary text-background text-[10px] tracking-[0.2em] uppercase font-bold rounded-none hover:brightness-110 active:scale-98 transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Authenticating...' : 'Sign In'}
                    </button>
                  </form>

                  <div className="pt-4 border-t border-white/10 text-center">
                    <button onClick={() => { setIsSignUp(true); setError(null); }} className="text-xs text-on-surface-variant">
                      Don't have an account? <span className="text-primary font-bold hover:underline">Create one.</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Sign Up View */
                <div className="bg-white/3 p-8 rounded-none border border-white/10 flex flex-col gap-6 shadow-2xl">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic text-white">Create your Relay account</h2>
                    <p className="text-xs text-on-surface-variant">Start building resilient internet infrastructure.</p>
                  </div>

                  <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] tracking-wider font-bold text-outline uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full h-11 bg-black border border-white/10 rounded-none px-4 text-xs font-mono text-white focus:outline-none focus:border-primary transition-all placeholder:text-outline/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] tracking-wider font-bold text-outline uppercase">Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-11 bg-black border border-white/10 rounded-none px-4 text-xs font-mono text-white focus:outline-none focus:border-primary transition-all placeholder:text-outline/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] tracking-wider font-bold text-outline uppercase">Confirm</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-11 bg-black border border-white/10 rounded-none px-4 text-xs font-mono text-white focus:outline-none focus:border-primary transition-all placeholder:text-outline/30"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-error/5 border border-red-500/20 rounded-none p-3 text-xs text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="p-3 bg-white/5 border border-white/10 rounded-none">
                      <p className="text-[10px] text-on-surface-variant/75 leading-relaxed">
                        By creating an account, you agree to our <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-11 bg-primary text-background text-[10px] tracking-[0.2em] uppercase font-bold rounded-none hover:brightness-110 active:scale-98 transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>

                  <div className="pt-4 border-t border-white/10 text-center">
                    <button onClick={() => { setIsSignUp(false); setError(null); }} className="text-xs text-on-surface-variant">
                      Already have an account? <span className="text-primary font-bold hover:underline">Sign In.</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Links */}
          <footer className="mt-8 flex justify-center gap-6 text-[9px] text-outline uppercase tracking-wider font-semibold">
            <span className="hover:text-primary cursor-pointer">Documentation</span>
            <span className="hover:text-primary cursor-pointer">API Reference</span>
            <span className="hover:text-primary cursor-pointer">System Status</span>
          </footer>

        </div>
      </main>

    </div>
  );
}

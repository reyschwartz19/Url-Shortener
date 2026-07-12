import React, { useState } from 'react';
import { ArrowRight, Copy, ExternalLink, Globe, LineChart, Lock, ShieldCheck, Activity, Zap, Check } from 'lucide-react';
import GlobeVisualizer from './GlobeVisualizer';
import { useCreateLink } from '../hooks/useLinks';

interface LandingPageProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'analytics') => void;
}

export default function LandingPage({ setView }: LandingPageProps) {
  const [longUrl, setLongUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentShort, setRecentShort] = useState<{ original: string; short: string; ago: string } | null>({
    original: 'https://github.com/relay-infrastructure/core-sdk/releases/tag/v2.4.1',
    short: 'https://relay.dev/v7x2p',
    ago: '8s ago'
  });

  const { mutate: createLink } = useCreateLink();

  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    let formatted = longUrl.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
    }

    createLink(
      { originalUrl: formatted },
      {
        onSuccess: (data) => {
          setRecentShort({
            original: data.originalUrl,
            short: `${window.location.protocol}//${window.location.host}/api/links/${data.shortCode}`,
            ago: 'Just now',
          });
          setLongUrl('');
        },
        onError: () => {
          setView('auth');
        },
      }
    );
  };

  const copyToClipboard = () => {
    if (!recentShort) return;
    navigator.clipboard.writeText(recentShort.short);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-background text-on-surface flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 bg-background/90 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-6 lg:px-12">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-8 h-8 border border-primary flex items-center justify-center text-primary font-serif text-lg italic">
            R
          </div>
          <span className="font-sans text-[11px] tracking-[0.4em] uppercase font-bold text-white">Relay</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => setView('landing')} className="text-primary font-bold border-b border-primary pb-0.5 text-[10px] tracking-[0.2em] uppercase font-semibold transition-all">Product</button>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary transition-colors text-[10px] tracking-[0.2em] uppercase font-semibold">GitHub</a>
          <button onClick={() => setView('analytics')} className="text-on-surface-variant hover:text-primary transition-colors text-[10px] tracking-[0.2em] uppercase font-semibold">NOC Status</button>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => setView('auth')} className="text-on-surface-variant hover:text-primary text-[10px] tracking-[0.2em] uppercase font-semibold transition-colors px-3 py-2">Login</button>
          <button onClick={() => setView('auth')} className="bg-primary text-background text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 rounded-none font-bold active:scale-95 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]">Get Started</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-16">
        
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-4rem)] flex items-center px-6 lg:px-12 relative overflow-hidden">
          {/* Ambient vector glow background */}
          <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-secondary/10 opacity-10 blur-[100px] rounded-full pointer-events-none z-0" />
          
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left Content Column */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div className="space-y-4">
                <span className="text-[11px] tracking-[0.3em] uppercase text-primary block">
                  Infrastructure V2.4 is Live
                </span>
                <h1 className="text-5xl sm:text-6xl leading-[1.1] tracking-tight font-serif italic text-white">
                  A Legacy of<br />Quiet Growth.
                </h1>
                <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                  Enterprise-grade link management infrastructure designed for global scale, zero-latency routing, and real-time observability. Consolidated in one unified vision.
                </p>
              </div>

              {/* URL Input Form */}
              <div className="flex flex-col gap-4">
                <form onSubmit={handleShorten} className="flex h-[54px] bg-white/5 backdrop-blur-md border border-white/10 rounded-none overflow-hidden focus-within:border-primary transition-all p-1">
                  <input
                    type="text"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    placeholder="Enter long URL to relay..."
                    className="flex-grow bg-transparent border-none text-white font-mono text-xs focus:ring-0 px-4 placeholder:text-outline/40"
                  />
                  <button type="submit" className="bg-primary text-background px-6 rounded-none font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                    Shorten
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Animated Output Card */}
                {recentShort && (
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-none border-dashed flex items-center justify-between group animate-fadeIn">
                    <div className="flex items-center gap-3 overflow-hidden mr-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      <span className="font-mono text-xs text-primary truncate hover:underline cursor-pointer" onClick={() => window.open(recentShort.short, '_blank')}>
                        {recentShort.short}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={copyToClipboard}
                        className={`p-2 rounded-none transition-colors flex items-center justify-center ${copied ? 'bg-secondary/15 text-secondary' : 'hover:bg-white/5 text-on-surface-variant'}`}
                        title="Copy"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => window.open(recentShort.original, '_blank')}
                        className="p-2 hover:bg-white/5 rounded-none transition-colors text-on-surface-variant"
                        title="Open Source Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-outline uppercase tracking-wider pl-1">{recentShort.ago}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-xl font-serif text-primary">12M+</span>
                  <span className="text-[9px] tracking-[0.15em] uppercase text-on-surface-variant font-medium mt-1">Links Created</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-serif text-primary">1.2ms</span>
                  <span className="text-[9px] tracking-[0.15em] uppercase text-on-surface-variant font-medium mt-1">Avg Latency</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-serif text-primary">99.99%</span>
                  <span className="text-[9px] tracking-[0.15em] uppercase text-on-surface-variant font-medium mt-1">Global Uptime</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Globe Column */}
            <div className="lg:col-span-7 h-[450px] sm:h-[550px] relative flex items-center justify-center overflow-hidden">
              <GlobeVisualizer />
            </div>

          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 mb-16">
            <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-bold">The Backbone of Your Links</span>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-white tracking-tight">Managing complexity through refined intuition.</h2>
            <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Deploy enterprise link infrastructure in seconds. Every link is powered by a globally distributed network designed for security, scale, and zero-latency routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Global Edge Network */}
            <div className="md:col-span-2 bg-white/3 border border-white/10 p-8 rounded-none flex flex-col justify-between min-h-[320px] hover:bg-white/5 transition-all duration-300 group">
              <div>
                <div className="w-10 h-10 border border-primary flex items-center justify-center mb-6 text-primary">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif italic text-white mb-2">Global Edge Network</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Your links are replicated across 200+ edge locations worldwide for sub-millisecond redirection speeds.
                </p>
              </div>
              <div className="mt-8 overflow-hidden bg-[#050505] border border-white/5 h-24 relative flex items-center justify-center">
                {/* SVG Packet Travel paths */}
                <div className="absolute inset-0 w-full h-full opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_100%]" />
                <svg className="w-full h-full overflow-visible absolute inset-0" preserveAspectRatio="none">
                  {/* Wire line */}
                  <path d="M 0 48 Q 120 12, 240 48 T 480 48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <path d="M 0 32 Q 160 80, 320 32 T 480 32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  
                  {/* Fast glow packets */}
                  <path d="M 0 48 Q 120 12, 240 48 T 480 48" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="30 180" className="animate-dash" />
                  <path d="M 0 32 Q 160 80, 320 32 T 480 32" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="40 160" className="animate-dash-reverse" />
                  
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
                      <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Observability */}
            <div className="bg-white/3 border border-white/10 p-8 rounded-none flex flex-col justify-between hover:bg-white/5 transition-all duration-300 group">
              <div>
                <div className="w-10 h-10 border border-primary flex items-center justify-center mb-6 text-primary">
                  <LineChart className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif italic text-white mb-2">Observability</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  Real-time click tracking, geolocation heatmaps, and deep referrer analysis.
                </p>
              </div>
              <div className="mt-auto flex items-end gap-1.5 h-16 w-full">
                <div className="flex-grow bg-primary/10 h-[40%] animate-pulse" />
                <div className="flex-grow bg-primary/20 h-[60%] animate-pulse duration-1000" />
                <div className="flex-grow bg-primary/5 h-[30%] animate-pulse" />
                <div className="flex-grow bg-primary/30 h-[90%] animate-pulse duration-700" />
                <div className="flex-grow bg-primary/40 h-[75%] animate-pulse duration-1000" />
              </div>
            </div>

            {/* Privacy First */}
            <div className="bg-white/3 border border-white/10 p-8 rounded-none flex flex-col justify-between hover:bg-white/5 transition-all duration-300 group">
              <div>
                <div className="w-10 h-10 border border-primary flex items-center justify-center mb-6 text-primary">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif italic text-white mb-2">Privacy First</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Zero-knowledge analytics and PII encryption by default. Fully GDPR/CCPA compliant routing.
                </p>
              </div>
              <div className="mt-auto flex items-center justify-center py-4">
                <div className="w-12 h-12 border border-white/10 flex items-center justify-center text-primary/30 group-hover:text-primary transition-all">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Real-Time Throughput */}
            <div className="md:col-span-4 bg-white/3 border border-white/10 p-8 rounded-none grid grid-cols-1 md:grid-cols-3 gap-8 items-center hover:bg-white/5 transition-all duration-300">
              <div>
                <h3 className="text-lg font-serif italic text-white mb-2">Real-Time Throughput</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Monitor infrastructure performance with millisecond precision at any scale.
                </p>
              </div>
              <div className="md:col-span-2 grid grid-cols-3 items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] tracking-widest font-bold text-outline uppercase">Ingress</span>
                  <span className="text-base font-mono font-bold text-white">14.8 GB/s</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] tracking-widest font-bold text-outline uppercase">Resolution</span>
                  <span className="text-base font-mono font-bold text-secondary">0.42ms</span>
                </div>
                <div className="relative h-1 bg-white/5 w-full">
                  <div className="absolute top-0 left-0 h-full bg-primary w-[75%]" />
                  <div className="absolute top-1/2 left-[75%] -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#D4AF37] animate-ping" />
                  <div className="absolute top-1/2 left-[75%] -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#D4AF37]" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Dynamic CTA */}
        <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="bg-white/3 border border-white/10 rounded-none p-12 relative overflow-hidden flex flex-col items-center text-center gap-6">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]" />
            
            <h2 className="text-3xl sm:text-4xl font-serif italic text-white tracking-tight z-10">Ready to relay?</h2>
            <p className="text-sm text-on-surface-variant max-w-xl z-10 leading-relaxed">
              Start for free with 1,000 links per month. No credit card required. Experience the future of link infrastructure today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 z-10 pt-4">
              <button onClick={() => setView('auth')} className="bg-primary text-background text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-none font-bold hover:brightness-115 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                Create Free Account
              </button>
              <button onClick={() => setView('dashboard')} className="bg-white/5 text-on-surface text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-none font-bold border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
                View API Docs
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-white/10 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <div className="w-5 h-5 border border-white/15 rounded-none flex items-center justify-center">
                <Zap className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Relay Infrastructure</span>
            </div>
            <p className="text-[11px] text-outline/60">© 2026 Relay Infrastructure. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] tracking-[0.1em] uppercase text-on-surface-variant font-semibold">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">GitHub</a>
            <button onClick={() => setView('auth')} className="hover:text-primary transition-colors">Login</button>
            <button onClick={() => setView('analytics')} className="hover:text-primary transition-colors">API Status</button>
            <button onClick={() => setView('analytics')} className="hover:text-primary transition-colors">System Network Map</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  Activity,
  BarChart2,
  Copy,
  LogOut,
  Globe,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import GlobeVisualizer from './GlobeVisualizer';
import { useLinks } from '../hooks/useLinks';
import { useLinkAnalytics } from '../hooks/useAnalytics';
import { useLogout } from '../hooks/useAuth';

interface AnalyticsPageProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'analytics') => void;
  activeLinkId: string | null;
  userEmail: string;
}

export default function AnalyticsPage({ setView, activeLinkId, userEmail }: AnalyticsPageProps) {
  const [activeUrlId, setActiveUrlId] = useState(activeLinkId);
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);

  const { data: links = [] } = useLinks();
  
  useEffect(() => {
    if (!activeUrlId && links.length > 0) {
      setActiveUrlId(links[0].linkId);
    }
  }, [activeUrlId, links]);

  const { data: analytics, isLoading } = useLinkAnalytics(activeUrlId);
  const logoutMutation = useLogout();

  const activeLink = links.find(l => l.linkId === activeUrlId);

  // Copy button handler
  const handleCopy = () => {
    if (!activeLink) return;
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    navigator.clipboard.writeText(`http://${host}/api/links/${activeLink.shortCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setView('landing');
    } catch {
      setView('landing');
    }
  };

  const clickCount = analytics?.totalCount ?? 0;
  const countries = analytics?.clicksByCountry ?? [];
  const overTime = analytics?.clicksOverTime ?? [];

  return (
    <div className="h-screen bg-background text-on-surface flex font-sans selection:bg-primary/20 selection:text-primary overflow-hidden">
      
      {/* Side Navigation Bar */}
      <aside className="hidden md:flex flex-col h-full py-6 w-64 bg-white/3 border-r border-white/10 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-8 h-8 border border-primary flex items-center justify-center text-primary font-serif text-lg italic">
            R
          </div>
          <div>
            <h1 className="text-sm font-serif italic text-white leading-tight">Relay</h1>
            <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-primary">Quiet Growth</p>
          </div>
        </div>

        {/* Create Link triggers */}
        <div className="px-6 mb-6">
          <button
            onClick={() => setView('dashboard')}
            className="w-full bg-primary text-background py-2 rounded-none font-mono text-[10px] uppercase tracking-wider font-bold hover:brightness-110 transition-all cursor-pointer"
          >
            + Create Link Node
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow space-y-1 px-3">
          <button
            onClick={() => setView('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-on-surface-variant hover:bg-white/5 hover:text-white transition-all text-xs tracking-wider uppercase font-semibold"
          >
            <LinkIcon className="w-4 h-4" />
            Workspace
          </button>
          
          <button
            onClick={() => setView('analytics')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none bg-white/5 text-primary border-r border-primary transition-all text-xs tracking-wider uppercase font-semibold"
          >
            <BarChart2 className="w-4 h-4" />
            NOC Analytics
          </button>

          <button
            onClick={() => setView('landing')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-on-surface-variant hover:bg-white/5 hover:text-white transition-all text-xs tracking-wider uppercase font-semibold"
          >
            <Activity className="w-4 h-4" />
            Public Home
          </button>
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="px-3 pt-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-on-surface-variant hover:bg-red-950/20 hover:text-red-400 transition-all text-xs tracking-wider uppercase font-semibold cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col overflow-y-auto bg-background relative select-none noc-grid-bg">
        {/* Subtle decorative grid background and scanning line */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#D4AF37_1px,transparent_1px),linear-gradient(to_bottom,#D4AF37_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-primary/25 animate-scanline pointer-events-none" />

        {/* NOC Top Header Panel */}
        <header className="p-6 border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Active URL selector or text node */}
            <div className="flex items-center gap-3 group">
              <div className="bg-white/3 px-4 py-2.5 border border-white/10 rounded-none group-hover:border-primary/40 transition-colors flex items-center gap-2 max-w-sm overflow-hidden">
                <Globe className="w-4 h-4 text-primary shrink-0 animate-spin-slow" />
                <span className="font-mono text-sm font-bold text-primary tracking-tight select-all truncate">
                  {activeLink?.shortCode || 'Select a link'}
                </span>
              </div>
              <button
                onClick={handleCopy}
                disabled={!activeLink}
                className="p-2 text-on-surface-variant hover:text-white bg-white/5 rounded-none border border-white/10 hover:border-white/20 transition-colors shrink-0 disabled:opacity-50"
                title="Copy short link"
              >
                {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
              </button>
              
              {/* Quick Dropdown selector of links */}
              {links.length > 0 && (
                <select
                  value={activeUrlId || ''}
                  onChange={(e) => setActiveUrlId(e.target.value)}
                  className="bg-black border border-white/10 text-xs font-mono text-white rounded-none px-2 py-1.5 focus:outline-none focus:border-primary shrink-0"
                >
                  <option value="" disabled>Select Link</option>
                  {links.map(l => (
                    <option key={l.linkId} value={l.linkId}>{l.shortCode}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick Metrics right aligned */}
            <div className="flex gap-8 overflow-x-auto pb-2 md:pb-0 select-all shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] tracking-wider font-bold text-outline uppercase mb-1">Total Clicks</span>
                <span className="font-serif text-xl font-extrabold text-[#F5F5F5] tabular-nums">
                  {isLoading ? '...' : clickCount.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] tracking-wider font-bold text-outline uppercase mb-1">Avg Latency</span>
                <span className="font-serif text-xl font-bold text-primary tabular-nums">
                  12ms
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] tracking-wider font-bold text-outline uppercase mb-1">Reach Nodes</span>
                <span className="font-serif text-xl font-extrabold text-[#F5F5F5] tabular-nums">
                  {countries.length}
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* Map Visualization Viewport Section */}
        <section className="relative w-full h-[380px] lg:h-[450px] flex items-center justify-center overflow-hidden border-b border-white/10 bg-black/40">
          <div className="absolute inset-0 w-full h-full opacity-60">
            <GlobeVisualizer />
          </div>

          {/* Overlay HUD Control Elements */}
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              
              <div className="bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded-none select-none shadow-2xl">
                <p className="text-[9px] font-extrabold text-outline uppercase tracking-widest mb-3">System Metrics</p>
                <div className="space-y-2 font-mono text-xs text-white">
                    Currently tracking real-time analytics for <span className="text-primary">{activeLink?.shortCode}</span>.
                </div>
              </div>

              {/* Status and Pause triggers */}
              <div className="flex flex-col items-end gap-2">
                <div className="bg-black/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-none flex items-center gap-2 shadow-xl">
                  <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white">System_Online</span>
                </div>
                
                {/* Simulation button */}
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="pointer-events-auto p-2 bg-black/90 border border-white/10 hover:border-primary/40 rounded-none text-on-surface-variant hover:text-white transition-all shadow-md flex items-center gap-1 cursor-pointer text-[10px]"
                >
                  {isSimulating ? (
                    <>
                      <Pause className="w-3 h-3 text-primary" />
                      Pause Map Animation
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-primary animate-pulse" />
                      Resume Map Animation
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Simulated navigation triggers at bottom */}
            <div className="flex justify-center">
              <div className="flex gap-2 bg-black/90 border border-white/10 px-4 py-1.5 rounded-none backdrop-blur pointer-events-auto shadow-2xl text-on-surface-variant hover:text-white transition-colors cursor-pointer text-[10px] font-bold">
                <ZoomIn className="w-3.5 h-3.5" />
                <ZoomOut className="w-3.5 h-3.5 border-l border-white/10 pl-2" />
                <RotateCw className="w-3.5 h-3.5 border-l border-white/10 pl-2 animate-spin-slow" />
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Panel Section: Traffic + Log feed */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-white/10 bg-black/20">
          
          {/* Traffic by Country (Bars - 1/3) */}
          <div className="lg:col-span-4 bg-[#0a0a0a] p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div>
              <h3 className="text-[9px] tracking-widest font-bold text-outline uppercase mb-6 flex items-center justify-between">
                Traffic by Origin
                <Globe className="w-3.5 h-3.5 text-primary" />
              </h3>
              <div className="space-y-4">
                {countries.length === 0 ? (
                    <div className="text-xs text-on-surface-variant font-mono text-center">No origin data available yet.</div>
                ) : countries.map((country, idx) => {
                    const pct = clickCount > 0 ? ((country.count / clickCount) * 100).toFixed(1) : '0';
                    return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-3 bg-white/5 rounded-none flex items-center justify-center text-[8px] font-bold border border-white/10">{country.country || 'UNK'}</span>
                        {country.country || 'Unknown'}
                      </span>
                      <span className="text-primary font-bold">{pct}% ({country.count})</span>
                    </div>
                    <div className="h-1 bg-white/5 w-full rounded-none overflow-hidden">
                      <div className="h-full bg-primary rounded-none transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>

          {/* Clicks over time */}
          <div className="lg:col-span-8 bg-[#0a0a0a]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-[9px] tracking-widest font-bold text-outline uppercase flex items-center gap-2">
                Daily Ingress Timeline
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              </h3>
            </div>
            
            <div className="overflow-x-auto p-6">
                 {overTime.length === 0 ? (
                    <div className="text-xs text-on-surface-variant font-mono text-center">No timeline data available yet.</div>
                ) : (
                    <table className="w-full text-left font-mono text-[11px]">
                        <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-outline font-semibold">
                            <th className="p-3 pl-6">Date</th>
                            <th className="p-3">Total Clicks</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {overTime.map((stat, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors h-[42px]">
                                <td className="p-3 pl-6 text-on-surface-variant">{stat.date}</td>
                                <td className="p-3 text-primary font-bold">{stat.count}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
          </div>

        </section>

        {/* Dashboard Footer */}
        <footer className="bg-background border-t border-white/10 mt-auto">
          <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto text-xs text-on-surface-variant">
            <p>© 2026 Relay Infrastructure Operations</p>
            <div className="flex gap-6 font-bold text-[10px] uppercase tracking-wider">
              <span className="hover:text-primary cursor-pointer">API Status</span>
              <span className="hover:text-primary cursor-pointer">Cluster Status</span>
              <span className="hover:text-primary cursor-pointer">Security Audits</span>
            </div>
          </div>
        </footer>

      </main>

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Search,
  Bell,
  Plus,
  Filter,
  Copy,
  BarChart2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Link as LinkIcon,
  LogOut,
  Check,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  X
} from 'lucide-react';
import { useLinks, useCreateLink, useDeleteLink } from '../hooks/useLinks';
import { useLogout } from '../hooks/useAuth';
import { RateLimitError } from '../types/api';

interface DashboardProps {
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'analytics') => void;
  userEmail: string;
  setSelectedLinkId: (id: string) => void;
}

export default function Dashboard({
  setView,
  userEmail,
  setSelectedLinkId
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOriginalUrl, setNewOriginalUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: links = [], isLoading } = useLinks();
  const createMutation = useCreateLink();
  const deleteMutation = useDeleteLink();
  const logoutMutation = useLogout();

  // Filter links by search query
  const filteredLinks = useMemo(() => {
    return links.filter(
      (link) =>
        link.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [links, searchQuery]);

  // Toast Queue
  const [toasts, setToasts] = useState<Array<{ id: string; msg: string; type?: 'success' | 'error' }>>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleCopy = (shortCode: string, id: string) => {
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    navigator.clipboard.writeText(`http://${host}/api/links/${shortCode}`);
    setCopiedId(id);
    showToast(`Copied short code to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriginalUrl) return;

    let formatted = newOriginalUrl.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = 'https://' + formatted;
    }

    try {
      await createMutation.mutateAsync({ originalUrl: formatted });
      showToast(`Successfully created short link!`);
      setNewOriginalUrl('');
      setIsModalOpen(false);
    } catch (err) {
      if (err instanceof RateLimitError) {
        showToast(`${err.message}${err.retryAfter ? ` Retry after ${err.retryAfter}s.` : ''}`, 'error');
      } else if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('An unexpected error occurred.', 'error');
      }
    }
  };

  const handleDelete = async (id: string, shortCode: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showToast(`Link ${shortCode} removed.`, 'success');
    } catch (err) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleViewAnalytics = (id: string) => {
    setSelectedLinkId(id);
    setView('analytics');
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setView('landing');
    } catch (err) {
      setView('landing');
    }
  };

  return (
    <div className="h-screen flex bg-background text-on-surface font-sans selection:bg-primary/20 selection:text-primary overflow-hidden">
      
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

        {/* Navigation Items */}
        <div className="flex-grow px-3 space-y-1">
          <button
            onClick={() => setView('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none bg-white/5 text-primary border-r border-primary transition-all text-xs tracking-wider uppercase font-semibold"
          >
            <LinkIcon className="w-4 h-4" />
            Workspace
          </button>
          
          <button
            onClick={() => {
              if (links.length > 0) setSelectedLinkId(links[0].linkId);
              setView('analytics');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-on-surface-variant hover:bg-white/5 hover:text-white transition-all text-xs tracking-wider uppercase font-semibold"
          >
            <BarChart2 className="w-4 h-4" />
            NOC Analytics
          </button>

        </div>

        {/* Create Link quick trigger */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mx-6 mb-6 flex items-center justify-center gap-2 bg-primary text-background py-2.5 rounded-none font-bold text-xs tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Link
        </button>

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

      {/* Main Workspace Frame */}
      <main className="flex-grow flex flex-col min-w-0 bg-background relative">
        
        {/* Top Header Controls */}
        <header className="h-16 flex justify-between items-center px-6 lg:px-8 border-b border-white/10 bg-black/60 backdrop-blur-md shrink-0">
          
          {/* Quick Search Bar */}
          <div className="flex-grow max-w-md">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active infrastructure..."
                className="w-full bg-black border border-white/10 rounded-none py-2 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-primary transition-colors placeholder:text-outline/40"
              />
            </div>
          </div>

          {/* User Info & Avatar */}
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:text-primary transition-colors p-2 relative">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary" />
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{userEmail || 'dev_relay_admin'}</p>
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4e0QPAXIfuY9lRGic-vizXwtAtQhbyxTeDE4-w9wBaL4d_Z9Y4Q4YcUnNVP_ChOq5-qRzGSe-URVommhPlOdDShBdmiohOq9dQs9T2F8wQ0fOck2mc8mOWtO2XJZEnvcPR8B84ZR6gHqwPdb1m137OaslsrlfB5TFKz8z6SAddJ-tizqiVdWUeo7BjVc5OLu5-TT0rcVUx2QI_4NwDvGs0BpkH1tDMdwI0BogB6K8VXQ9kz7Wj6Vt"
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-none border border-white/20 bg-white/5 object-cover"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Contents Area */}
        <div className="flex-grow overflow-y-auto p-6 lg:p-8 space-y-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Title Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-serif italic text-white tracking-tight">Active Nodes</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Manage and monitor your global URL redirection entries.</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-none text-xs font-bold text-on-surface-variant hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-primary text-background rounded-none text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(212,175,55,0.1)] cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" />
                  New Link
                </button>
              </div>
            </div>

            {/* Statistics Widgets Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Active Links count */}
              <div className="bg-white/3 p-5 rounded-none border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] tracking-wider font-bold text-outline uppercase">Active Infrastructure</span>
                  <LinkIcon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-serif text-primary tracking-tight">{isLoading ? '...' : links.length}</p>
                  <p className="text-xs text-on-surface-variant mt-2">Distributed globally</p>
                </div>
              </div>

              {/* Avg Latency status */}
              <div className="bg-white/3 p-5 rounded-none border border-white/10 hover:border-white/20 transition-all col-span-1 sm:col-span-2 lg:col-span-2 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] tracking-wider font-bold text-outline uppercase">Redirection Latency</span>
                  <Activity className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-serif text-primary tracking-tight">1.2ms</p>
                  <p className="text-xs font-medium text-secondary mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Optimal routing performant
                  </p>
                </div>
              </div>

            </div>

            {/* Links Data Table Grid */}
            {isLoading ? (
               <div className="bg-white/3 border border-white/10 rounded-none py-16 text-center text-white font-mono text-xs animate-pulse">
                Loading infrastructure nodes...
               </div>
            ) : filteredLinks.length === 0 ? (
              <div className="bg-white/3 border border-white/10 border-dashed rounded-none flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="mb-6 relative w-20 h-20 flex items-center justify-center">
                  <LinkIcon className="w-10 h-10 text-outline-variant/40" />
                  <div className="absolute inset-0 border border-dashed border-white/10 rounded-none animate-pulse" />
                </div>
                <h3 className="text-lg font-serif italic text-white mb-1">No links matched</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mb-6">Create a new routing entry or update your search filters to begin tracking statistics.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2.5 bg-primary text-background rounded-none text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
                >
                  Create a new route
                </button>
              </div>
            ) : (
              <div className="bg-white/3 rounded-none border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-4 text-[9px] tracking-widest font-bold text-outline uppercase">Short Code</th>
                        <th className="px-6 py-4 text-[9px] tracking-widest font-bold text-outline uppercase">Destination Address</th>
                        <th className="px-6 py-4 text-[9px] tracking-widest font-bold text-outline uppercase">Deploy Age</th>
                        <th className="px-6 py-4 text-[9px] tracking-widest font-bold text-outline uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {filteredLinks.map((link) => (
                        <tr key={link.linkId} className="group hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-primary font-bold bg-primary-container/10 border border-primary/15 px-2.5 py-1 rounded-none select-all cursor-pointer">
                              {link.shortCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate">
                            <span className="text-on-surface-variant font-sans select-all" title={link.originalUrl}>
                              {link.originalUrl}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant font-sans">
                            {new Date(link.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {/* Hover Actions inside row */}
                            <div className="flex justify-end gap-1 relative opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleCopy(link.shortCode, link.linkId)}
                                className={`p-1.5 rounded-none hover:bg-white/10 transition-colors ${copiedId === link.linkId ? 'text-secondary' : 'text-primary'}`}
                                title="Copy shortened URL"
                              >
                                {copiedId === link.linkId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleViewAnalytics(link.linkId)}
                                className="p-1.5 hover:bg-white/10 rounded-none text-on-surface hover:text-primary transition-colors"
                                title="View live monitoring map"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(link.linkId, link.shortCode)}
                                className="p-1.5 hover:bg-red-950/20 rounded-none text-red-400 hover:text-red-300 transition-colors"
                                title="Decommission route"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center bg-black/45 text-xs text-on-surface-variant select-none">
                  <p>Showing <span className="font-bold text-white">{filteredLinks.length}</span> of <span className="font-bold text-white">{links.length}</span> routing links</p>
                  <div className="flex gap-1.5">
                    <button className="p-1.5 border border-white/10 rounded-none hover:bg-white/5 hover:text-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 border border-white/10 rounded-none hover:bg-white/5 hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Interactive Modal Overlay for creating new links */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur effect */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-[#0c0c0c] border border-white/10 rounded-none max-w-md w-full p-6 relative z-10 shadow-2xl animate-scaleIn">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1 mb-5">
              <h3 className="text-lg font-serif italic text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Register Redirection Route
              </h3>
              <p className="text-xs text-on-surface-variant">Deploy high-performance edge nodes with instant DNS propagation.</p>
            </div>

            <form onSubmit={handleCreateLinkSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] tracking-wider font-bold text-outline uppercase">Destination URL</label>
                <input
                  type="text"
                  required
                  value={newOriginalUrl}
                  onChange={(e) => setNewOriginalUrl(e.target.value)}
                  placeholder="e.g. github.com/relay/infrastructure"
                  className="w-full h-10 bg-black border border-white/10 rounded-none px-3.5 text-xs font-mono text-white focus:outline-none focus:border-primary transition-all placeholder:text-outline/30"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full h-10 bg-primary text-background font-bold text-xs uppercase tracking-wider rounded-none hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Deploying...' : 'Deploy URL Node'}
                  {!createMutation.isPending && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animated Floating Toast Stack (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between gap-6 px-4 py-3 bg-[#0a0a0a] border ${toast.type === 'error' ? 'border-red-500/50' : 'border-white/15'} rounded-none shadow-2xl pointer-events-auto min-w-[280px] select-none animate-fadeIn`}
          >
            <span className={`text-xs font-medium ${toast.type === 'error' ? 'text-red-400' : 'text-white'}`}>{toast.msg}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

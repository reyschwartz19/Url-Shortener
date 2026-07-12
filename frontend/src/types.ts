export interface LinkItem {
  id: string;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
  countries: string[];
  created: string;
}

export interface RequestLog {
  id: string;
  timestamp: string;
  country: string;
  countryCode: string;
  browser: string;
  device: string;
  referrer: string;
  latency: number;
}

export interface SystemStats {
  totalClicks: string;
  activeLinks: number;
  avgLatency: string;
  uptime: string;
  regionsCount: number;
}

export type ViewType = 'landing' | 'auth' | 'dashboard' | 'analytics';

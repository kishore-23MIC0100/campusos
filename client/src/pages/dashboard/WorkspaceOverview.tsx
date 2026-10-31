import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, RefreshCw, AlertCircle, Inbox, Clock3, type LucideIcon } from 'lucide-react';

type RecordData = Record<string, any>;
export function useWorkspaceData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void load().then(result => { if (active) setData(result); }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Your workspace could not be loaded.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, attempt]);
  return { data, loading, error, refresh };
}

export function DashboardHeader({ eyebrow, title, description, action, refresh, loading }: { eyebrow: string; title: string; description: string; action?: ReactNode; refresh: () => void; loading: boolean }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  return <header className="overview-header"><div><div className="overview-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="overview-header-actions"><span className="overview-date"><CalendarDays size={15} />{today}</span><div><button className="workspace-secondary overview-refresh" disabled={loading} onClick={refresh} aria-label="Refresh dashboard"><RefreshCw size={15} className={loading ? 'is-refreshing' : ''} /><span>Refresh</span></button>{action}</div></div></header>;
}

export function DashboardFeedback({ loading, error, refresh, children }: { loading: boolean; error: string; refresh: () => void; children: ReactNode }) {
  if (loading) return <div className="overview-loading" role="status" aria-label="Loading dashboard"><div className="overview-loading-stats">{[0, 1, 2, 3].map(item => <div key={item}><span /><strong /><small /></div>)}</div><div className="overview-loading-panels"><div /><div /></div><span className="sr-only">Loading your workspace...</span></div>;
  if (error) return <div className="overview-error" role="alert"><AlertCircle size={28} /><h2>We couldn't load your workspace</h2><p>{error}</p><button className="workspace-primary" onClick={refresh}>Try again <RefreshCw size={15} /></button></div>;
  return <>{children}</>;
}

export function MetricGrid({ items }: { items: { label: string; value: ReactNode; detail: string; icon: LucideIcon; featured?: boolean }[] }) {
  return <section className="overview-metrics" aria-label="Workspace summary">{items.map(({ label, value, detail, icon: Icon, featured }) => <article key={label} className={`overview-metric ${featured ? 'is-featured' : ''}`}><div><span>{label}</span><Icon size={18} strokeWidth={1.7} /></div><strong>{value ?? 'N/A'}</strong><small>{detail}</small></article>)}</section>;
}

export function Panel({ title, description, to, linkLabel = 'View all', children, className = '' }: { title: string; description?: string; to?: string; linkLabel?: string; children: ReactNode; className?: string }) {
  return <section className={`overview-panel ${className}`}><div className="overview-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{to && <Link to={to}>{linkLabel}<ArrowUpRight size={14} /></Link>}</div>{children}</section>;
}

export function EmptyState({ title, description, icon: Icon = Inbox }: { title: string; description: string; icon?: LucideIcon }) {
  return <div className="overview-empty"><span><Icon size={23} strokeWidth={1.5} /></span><h3>{title}</h3><p>{description}</p></div>;
}

export function QuickLinks({ links }: { links: { to: string; title: string; description: string; icon: LucideIcon }[] }) {
  return <div className="overview-quicklinks">{links.map(({ to, title, description, icon: Icon }) => <Link key={to} to={to}><span className="overview-link-icon"><Icon size={19} strokeWidth={1.7} /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowUpRight size={17} /></Link>)}</div>;
}

export function Notices({ notices }: { notices: RecordData[] }) {
  if (!notices.length) return <EmptyState title="No announcements yet" description="School updates will appear here when published." />;
  return <div className="overview-notices">{notices.slice(0, 4).map(item => <Link key={item.id} to="/announcements"><div><span className={`overview-tag ${item.priority === 'URGENT' ? 'is-warning' : ''}`}>{String(item.category || 'Campus').replaceAll('_', ' ')}</span><span>{formatDate(item.published_at || item.created_at || item.date)}</span></div><h3>{item.title}</h3><p>{String(item.content || item.message || item.description || '').slice(0, 130)}</p><span className="overview-notice-author">{item.author_name || item.author || 'School office'}<ArrowUpRight size={14} /></span></Link>)}</div>;
}

export function EventsList({ events }: { events: RecordData[] }) {
  const upcoming = events.filter(item => {
    const date = item.start_date || item.date || item.event_date;
    return date && new Date(`${String(date).slice(0, 10)}T23:59:59+05:30`).getTime() >= Date.now();
  }).sort((a, b) => String(a.start_date || a.date || a.event_date).localeCompare(String(b.start_date || b.date || b.event_date))).slice(0, 4);
  if (!upcoming.length) return <EmptyState icon={CalendarDays} title="No upcoming events" description="The next campus event will appear here once scheduled." />;
  return <div className="overview-events">{upcoming.map(item => {
    const date = new Date(item.start_date || item.date || item.event_date);
    return <Link key={item.id} to="/events"><span className="overview-event-date"><small>{date.toLocaleDateString('en-IN', { month: 'short' })}</small><strong>{date.getDate()}</strong></span><span><strong>{item.title}</strong><small>{item.location || item.venue || 'Venue to be confirmed'}</small><small><Clock3 size={12} />{item.start_time || item.time || 'See event details'}</small></span><ArrowUpRight size={15} /></Link>;
  })}</div>;
}

export function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function attendanceRate(records: RecordData[]) {
  return records.length ? `${(records.filter(item => item.status === 'PRESENT' || item.status === 'LATE').length / records.length * 100).toFixed(1)}%` : 'N/A';
}

export function averageScore(records: RecordData[]) {
  const valid = records.filter(item => Number(item.max_marks) > 0 && item.marks_obtained !== null && item.marks_obtained !== undefined);
  return valid.length ? `${(valid.reduce((total, item) => total + Number(item.marks_obtained) / Number(item.max_marks) * 100, 0) / valid.length).toFixed(1)}%` : 'N/A';
}

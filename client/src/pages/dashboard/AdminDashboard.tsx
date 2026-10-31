import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, GraduationCap, CheckSquare, Clock3, ArrowUpRight, ShieldCheck, CalendarDays, BookOpen, FileText, UserRoundPlus } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardFeedback, DashboardHeader, EmptyState, EventsList, MetricGrid, Notices, Panel, QuickLinks, formatDate, useWorkspaceData } from './WorkspaceOverview';

export function AdminDashboard() {
  const { user } = useAuth();
  const load = useCallback(async () => {
    const [report, approvals, attendance, notices, events, audit] = await Promise.all([
      api.getInstitutionalReport(), api.getUsers({ status: 'PENDING' }), api.getAttendanceAnalytics(),
      api.getAnnouncements(), api.getEvents(), api.getAuditLogs({ limit: 5 }),
    ]);
    return { report, approvals: approvals.users, attendance: attendance.trends, notices: notices.announcements, events: events.events, audit: audit.logs };
  }, []);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const metrics = data?.report.metrics;
  const attendance = data?.attendance || [];
  return <div className="workspace-overview">
    <DashboardHeader eyebrow="Institution overview" title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Administrator'}.`} description="A clear view of your people, priorities and campus activity." refresh={refresh} loading={loading} action={<Link className="workspace-primary" to="/reports">View reports <ArrowUpRight size={15} /></Link>} />
    <DashboardFeedback loading={loading} error={error} refresh={refresh}>
      <MetricGrid items={[
        { label: 'Enrolled students', value: metrics?.totalStudents?.toLocaleString('en-IN'), detail: 'Students in your institution', icon: Users, featured: true },
        { label: 'Faculty members', value: metrics?.totalTeachers?.toLocaleString('en-IN'), detail: 'Teaching faculty on record', icon: GraduationCap },
        { label: "Today's attendance", value: metrics?.attendanceRate == null ? 'N/A' : `${metrics.attendanceRate}%`, detail: metrics?.presentToday == null ? 'No attendance recorded today' : `${metrics.presentToday} recorded present today`, icon: CheckSquare },
        { label: 'Access requests', value: data?.approvals.length ?? 0, detail: 'Accounts awaiting your review', icon: Clock3 },
      ]} />
      <div className="overview-grid overview-grid-main">
        <Panel title="Attendance overview" description="Attendance rates from recorded campus registers" to="/attendance" linkLabel="Open attendance" className="overview-attendance-panel">
          {attendance.length ? <><div className="overview-chart-caption"><span className="overview-chart-key" /> Recorded attendance <strong>{attendance.length} days</strong></div><div className="overview-chart" role="img" aria-label={`Recorded attendance across ${attendance.length} days. Latest rate ${attendance[attendance.length - 1]?.attendanceRate} percent.`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={attendance} margin={{ top: 15, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="attendance-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--workspace-accent)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--workspace-accent)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--workspace-line)" strokeDasharray="4 4" /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: 'var(--workspace-muted)', fontSize: 11 }} tickFormatter={value => /^\d{4}-/.test(value) ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : value} minTickGap={18} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--workspace-muted)', fontSize: 11 }} tickFormatter={value => `${value}%`} /><Tooltip contentStyle={{ border: '1px solid var(--workspace-line)', borderRadius: 10, fontSize: 12, background: 'var(--workspace-surface)', color: 'var(--workspace-ink)' }} formatter={value => [`${value}%`, 'Attendance']} /><Area type="monotone" dataKey="attendanceRate" stroke="var(--workspace-accent)" strokeWidth={2.5} fill="url(#attendance-fill)" isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></> : <EmptyState title="Your first attendance insights" description="Mark student attendance to start seeing daily trends here." icon={CheckSquare} />}
        </Panel>
        <Panel title="Make things happen" description="Your most-used campus tools"><QuickLinks links={[
          { to: '/students', title: 'Student directory', description: 'Manage student records', icon: Users },
          { to: '/admin/users', title: 'Review access requests', description: `${data?.approvals.length || 0} accounts awaiting approval`, icon: UserRoundPlus },
          { to: '/timetable', title: 'Plan the timetable', description: 'Classes, rooms and faculty', icon: CalendarDays },
          { to: '/reports', title: 'Institution reports', description: 'Review campus performance', icon: FileText },
        ]} /></Panel>
      </div>
      <div className="overview-grid overview-grid-main">
        <Panel title="Campus announcements" description="The latest updates for your school community" to="/announcements"><Notices notices={data?.notices || []} /></Panel>
        <Panel title="Coming up on campus" description="Events on your campus calendar" to="/events"><EventsList events={data?.events || []} /></Panel>
      </div>
      <Panel title="Recent account activity" description="A traceable record of institutional actions" to="/admin/audit-logs" linkLabel="View audit log">
        {data?.audit.length ? <div className="overview-audit">{data.audit.slice(0, 5).map(item => <div key={item.id}><span className="overview-audit-icon"><ShieldCheck size={17} /></span><div><strong>{String(item.action || 'Account activity').replaceAll('_', ' ').toLowerCase()}</strong><p>{item.details || item.description || item.user_name || 'Campus account activity'}</p></div><time>{formatDate(item.timestamp || item.created_at)}</time></div>)}</div> : <EmptyState title="No activity recorded" description="Account and campus actions will appear here as your team uses Scholaxys." icon={ShieldCheck} />}
      </Panel>
    </DashboardFeedback>
  </div>;
}

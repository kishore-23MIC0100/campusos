import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, User } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Users, GraduationCap, HeartHandshake, CheckSquare, Clock, Calendar,
  Megaphone, TrendingUp, Shield, ShieldAlert, Sparkles, CheckCircle2,
  XCircle, ArrowRight, Building2, Eye, Award, AlertTriangle, RefreshCw,
  Activity, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      const [rep, usersRes, logsRes, facRes] = await Promise.all([
        api.getInstitutionalReport(),
        api.getUsers({ status: 'PENDING' }),
        api.getAuditLogs({ limit: 6 }),
        api.getFacilities(),
      ]);

      setReportData(rep.metrics);
      setPendingUsers(usersRes.users || []);
      setAuditLogs(logsRes.logs || []);
      setFacilities(facRes.facilities || []);
    } catch (err) {
      console.error('[Dashboard Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleApproveUser = async (id: string, name: string) => {
    try {
      await api.approveUser(id);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setActionMessage(`Approved access for ${name}. Account is now active.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to approve account.');
    }
  };

  const handleRejectUser = async (id: string, name: string) => {
    const reason = prompt(`Provide reason for declining ${name}'s access request:`);
    if (reason === null) return;
    try {
      await api.rejectUser(id, reason);
      setActionMessage(`Declined access request for ${name}.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject account.');
    }
  };

  const attendanceTrends = [
    { day: 'Mon', attendance: 96.2, baseline: 95 },
    { day: 'Tue', attendance: 97.4, baseline: 95 },
    { day: 'Wed', attendance: 95.8, baseline: 95 },
    { day: 'Thu', attendance: 98.1, baseline: 95 },
    { day: 'Fri', attendance: 97.1, baseline: 95 },
  ];

  const subjectPerformance = [
    { subject: 'Mathematics', score: 92, benchmark: 85 },
    { subject: 'Physics', score: 94, benchmark: 85 },
    { subject: 'Chemistry', score: 89, benchmark: 85 },
    { subject: 'Life Sciences', score: 96, benchmark: 85 },
    { subject: 'Computer Sci', score: 98, benchmark: 85 },
    { subject: 'Humanities', score: 91, benchmark: 85 },
  ];

  const kpiCards = [
    {
      label: 'Total Students',
      value: '2,481',
      change: '+4.2%',
      changeDir: 'up' as const,
      sub: 'Enrolled this academic year',
      icon: Users,
      gradient: 'from-iris-600/20 to-iris-500/5',
      iconBg: 'from-iris-600 to-iris-500',
      borderGlow: 'rgba(124, 58, 237, 0.15)',
    },
    {
      label: 'Attendance Today',
      value: '97.1%',
      change: '+1.2%',
      changeDir: 'up' as const,
      sub: '2,410 Present • 71 Absent',
      icon: CheckSquare,
      gradient: 'from-emerald-600/20 to-emerald-500/5',
      iconBg: 'from-emerald-600 to-emerald-500',
      borderGlow: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: 'Pending Approvals',
      value: String(pendingUsers.length),
      change: 'Action needed',
      changeDir: 'neutral' as const,
      sub: 'Awaiting security clearance',
      icon: Clock,
      gradient: 'from-amber-600/20 to-amber-500/5',
      iconBg: 'from-amber-600 to-amber-500',
      borderGlow: 'rgba(245, 158, 11, 0.15)',
    },
    {
      label: 'Academic Index',
      value: '94.8',
      change: '+2.3%',
      changeDir: 'up' as const,
      sub: 'Term 1 Board Evaluation',
      icon: Award,
      gradient: 'from-cyan-600/20 to-cyan-500/5',
      iconBg: 'from-cyan-600 to-cyan-500',
      borderGlow: 'rgba(6, 182, 212, 0.15)',
    },
  ];

  const customTooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    borderRadius: '12px',
    padding: '10px 14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    fontSize: '12px',
    color: '#f1f5f9',
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-iris">
              <Shield className="w-3 h-3" />
              Institutional Governance
            </span>
            <span className="badge badge-emerald">
              <Activity className="w-3 h-3" />
              Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            Good Morning, Dr. Sterling
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here's your institutional overview for today. All systems operational.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)',
            }}
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Action Message Toast */}
      {actionMessage && (
        <div className="p-4 rounded-xl flex items-center gap-2.5 text-sm font-semibold animate-fadeInDown"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#34d399',
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-fadeInUp stagger-${i + 1}`}
            style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
              boxShadow: `0 4px 24px rgba(0,0,0,0.2), 0 0 40px ${kpi.borderGlow}`,
            }}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-50 pointer-events-none`} />

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  {kpi.label}
                </span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.iconBg} flex items-center justify-center shadow-lg`}>
                  <kpi.icon className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="stat-number text-3xl mb-1">{kpi.value}</div>

              <div className="flex items-center gap-2 mt-2">
                {kpi.changeDir === 'up' && (
                  <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" /> {kpi.change}
                  </span>
                )}
                {kpi.changeDir === 'neutral' && (
                  <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400">
                    <Zap className="w-3 h-3" /> {kpi.change}
                  </span>
                )}
                <span className="text-[11px] text-slate-500">{kpi.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals Queue */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-600/15">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Pending Access Approvals ({pendingUsers.length})</h3>
              <p className="text-xs text-slate-500">Registrations awaiting security clearance</p>
            </div>
          </div>

          <Link to="/admin/users" className="text-xs font-bold text-iris-400 hover:text-iris-300 flex items-center gap-1 transition-colors">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-14 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
            <span className="text-sm text-slate-500 font-medium">All access requests have been reviewed.</span>
          </div>
        ) : (
          <div>
            {pendingUsers.map((pUser) => (
              <div key={pUser.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-800/20" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.04)' }}>
                <div className="flex items-center gap-3.5">
                  <img
                    src={pUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={pUser.fullName}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{pUser.fullName}</h4>
                      <span className="badge badge-amber text-[9px]">{pUser.role}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {pUser.email} • {pUser.department || pUser.gradeSection || 'General'}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      {pUser.bio || 'Applicant for portal credentials'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRejectUser(pUser.id, pUser.fullName)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveUser(pUser.id, pUser.fullName)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Attendance Trend */}
        <div className="lg:col-span-7 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Attendance Trend</h3>
              <p className="text-xs text-slate-500">Weekly % against 95% target</p>
            </div>
            <span className="badge badge-emerald">Avg 97.1%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="attendanceGradDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area type="monotone" dataKey="attendance" stroke="#8b5cf6" strokeWidth={3} fill="url(#attendanceGradDark)" dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#0f172a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="lg:col-span-5 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Academic Mastery</h3>
              <p className="text-xs text-slate-500">Subject proficiency index</p>
            </div>
            <span className="badge badge-cyan">Term 1</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={subjectPerformance}>
                <PolarGrid stroke="rgba(148, 163, 184, 0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                <PolarRadiusAxis domain={[70, 100]} stroke="rgba(148, 163, 184, 0.1)" fontSize={10} />
                <Radar name="Performance" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Logs & Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Audit Logs */}
        <div className="lg:col-span-8 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-iris-400" />
              <h3 className="text-sm font-bold text-white font-display">Security Audit Log</h3>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-iris-400 hover:text-iris-300 transition-colors">
              Full Trail →
            </Link>
          </div>

          <div className="space-y-0.5">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs rounded-lg px-3 transition-colors hover:bg-slate-800/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{log.user_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md text-slate-400"
                      style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
                    >
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{log.description}</p>
                </div>
                <div className="text-[10px] text-slate-600 whitespace-nowrap font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Facilities */}
        <div className="lg:col-span-4 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-display">Facilities</h3>
            </div>
            <span className="badge badge-emerald text-[9px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          <div className="space-y-2">
            {facilities.map((fac) => (
              <div key={fac.id} className="p-3 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-slate-800/30"
                style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148, 163, 184, 0.05)' }}
              >
                <div>
                  <div className="font-bold text-slate-200">{fac.building_name}</div>
                  <div className="text-[11px] text-slate-500">{fac.room_code} • {fac.room_type}</div>
                </div>
                <span className="badge badge-emerald text-[9px]">{fac.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

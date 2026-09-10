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
  XCircle, ArrowRight, Building2, Eye, Award, AlertTriangle, RefreshCw
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Executive Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Institutional Governance Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Good Morning, Dr. Sterling
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's what's happening across Oakridge International School today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span>Manage All Users</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Enrolled Students</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">2,481</div>
          <div className="text-[11px] text-teal-700 font-bold mt-1 flex items-center gap-1">
            <span>↑ 4.2%</span> <span className="text-slate-600 font-normal">vs last academic year</span>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Present Today</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-display">97.1%</div>
          <div className="text-[11px] text-slate-600 font-medium mt-1">
            2,410 Present • 71 Absent
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Pending Approvals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-display">
            {pendingUsers.length}
          </div>
          <div className="text-[11px] text-amber-800 font-semibold mt-1">
            Awaiting administrator review
          </div>
        </div>

        {/* Academic Health Index */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Academic Score</span>
            <div className="w-9 h-9 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-800 font-display">94.8 / 100</div>
          <div className="text-[11px] text-slate-600 font-medium mt-1">
            Term 1 Board Evaluation
          </div>
        </div>
      </div>

      {/* REAL-TIME PENDING REGISTRATION APPROVALS QUEUE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Pending Access Approvals ({pendingUsers.length})
              </h3>
              <p className="text-xs text-slate-500">
                Self-service registrations waiting for institutional security clearance.
              </p>
            </div>
          </div>

          <Link
            to="/admin/users"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <span>All access requests have been reviewed and approved.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingUsers.map((pUser) => (
              <div key={pUser.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3.5">
                  <img
                    src={pUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={pUser.fullName}
                    className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{pUser.fullName}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        {pUser.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {pUser.email} • {pUser.department || pUser.gradeSection || 'General Admissions'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {pUser.bio || 'Applicant for portal credentials'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRejectUser(pUser.id, pUser.fullName)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold transition-colors border border-slate-200"
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveUser(pUser.id, pUser.fullName)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Grant Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Campus Attendance Trend</h3>
              <p className="text-xs text-slate-500">Weekly percentage against institutional target (95%)</p>
            </div>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Avg 97.1%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis domain={[90, 100]} stroke="#94A3B8" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="attendance" stroke="#0D9488" strokeWidth={3} fill="url(#attendanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department / Subject Mastery Radar */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Academic Mastery</h3>
              <p className="text-xs text-slate-500">Subject proficiency ratings</p>
            </div>
            <span className="text-xs font-bold text-navy-800 bg-navy-50 px-2.5 py-1 rounded-full border border-navy-200">
              Term 1
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={subjectPerformance}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={10} />
                <PolarRadiusAxis domain={[70, 100]} stroke="#CBD5E1" fontSize={10} />
                <Radar name="Performance" dataKey="score" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Security Audit Logs & Campus Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-Time Audit Logs */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900 font-display">Security Audit Log</h3>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-teal-600 hover:underline">
              Inspect Full Audit Trail
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{log.user_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{log.description}</p>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Facilities Occupancy */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-navy-800" />
              <h3 className="text-base font-bold text-slate-900 font-display">Campus Facilities</h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
              Online
            </span>
          </div>

          <div className="space-y-3">
            {facilities.map((fac) => (
              <div key={fac.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{fac.building_name}</div>
                  <div className="text-[11px] text-slate-500">{fac.room_code} • {fac.room_type}</div>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {fac.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

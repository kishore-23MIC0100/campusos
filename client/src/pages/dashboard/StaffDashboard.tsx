import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Megaphone, Bus, Calendar, ArrowUpRight, Clock3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myLeaves, setMyLeaves] = useState<any[]>([]);

  useEffect(() => {
    api.getLeaves({ status: 'ALL' })
      .then((result) => setMyLeaves(result.leaves || []))
      .catch((error) => console.error('[Staff leave summary]', error));
  }, []);

  const pendingCount = myLeaves.filter((leave) => leave.status === 'PENDING').length;
  const latestLeave = myLeaves[0];
  const shortcuts = [
    { to: '/leave', label: 'Leave & requests', description: 'Apply and follow your request status', icon: CalendarDays, color: 'from-teal-600 to-cyan-600' },
    { to: '/announcements', label: 'Campus notices', description: 'Read current school announcements', icon: Megaphone, color: 'from-indigo-600 to-violet-600' },
    { to: '/transport', label: 'Transport', description: 'View campus transport information', icon: Bus, color: 'from-amber-500 to-orange-600' },
    { to: '/events', label: 'Campus events', description: 'See upcoming activities and events', icon: Calendar, color: 'from-emerald-600 to-teal-600' },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-teal-50 to-indigo-50 p-7 shadow-sm sm:p-9">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800">Staff workspace</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Welcome, {user?.fullName || 'Campus colleague'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your staff account has access to self-service requests and campus information. Leadership and academic administration tools remain restricted to their authorized roles.</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">My pending leave</p><p className="mt-2 text-3xl font-extrabold text-slate-900">{pendingCount}</p></div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><Clock3 className="h-5 w-5" /></div>
          </div>
          <Link to="/leave" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-800 hover:text-teal-950">Open leave requests <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest leave status</p><p className="mt-2 text-lg font-extrabold text-slate-900">{latestLeave ? String(latestLeave.status).replace('_', ' ') : 'No requests yet'}</p></div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
          <p className="mt-2 text-xs text-slate-500">{latestLeave ? `${latestLeave.leave_type} • ${latestLeave.from_date} to ${latestLeave.to_date}` : 'Submit leave and track its review here.'}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map(({ to, label, description, icon: Icon, color }) => (
          <Link key={to} to={to} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">{label}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-teal-700" />
          </Link>
        ))}
      </section>
    </div>
  );
};

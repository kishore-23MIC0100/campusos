import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, CheckSquare, BookOpen, Clock, ArrowRight, Plus, Users, Award, Activity
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [classResult, assessmentResult, timetableResult] = await Promise.allSettled([
          api.getClasses(), api.getAssessments(),
          api.getTimetable({ teacherName: user?.fullName, day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }) }),
        ]);
        if (classResult.status === 'fulfilled') setClasses(classResult.value.classes || []);
        if (assessmentResult.status === 'fulfilled') setAssessments(assessmentResult.value.assessments || []);
        if (timetableResult.status === 'fulfilled') setTodayClasses((timetableResult.value.slots || []).map((slot: any) => ({
          period: slot.period_index, time: `${slot.start_time} - ${slot.end_time}`, grade: `${slot.grade}${slot.section}`, subject: slot.subject,
          room: slot.room_number || 'Room not assigned', status: 'UPCOMING',
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const allottedClasses = user?.allottedClasses || [];
  const taughtClassRows = classes.filter((item: any) => allottedClasses.length === 0 || allottedClasses.some((c: any) => c.grade === item.grade && c.section === item.section));
  const studentsCount = taughtClassRows.reduce((sum: number, item: any) => sum + Number(item.total_students || 0), 0);
  const pendingGrading = assessments.reduce((sum: number, item: any) => sum + Math.max(0, Number(item.totalStudents || 0) - Number(item.gradedCount || 0)), 0);
  const gradedAssessments = assessments.filter((item: any) => Number(item.gradedCount) > 0);
  const classAverage = gradedAssessments.length ? Math.round(gradedAssessments.reduce((sum: number, item: any) => sum + (Number(item.max_marks) ? Number(item.averageScore || 0) / Number(item.max_marks) * 100 : 0), 0) / gradedAssessments.length) : null;
  const kpiCards = [
    { label: "Today's Lectures", value: loading ? '—' : `${todayClasses.length} periods`, sub: 'Teaching schedule', icon: Clock, gradient: 'from-cyan-600 to-teal-600', glow: 'rgba(6, 182, 212, 0.15)' },
    { label: 'Mentored Students', value: loading ? '—' : String(studentsCount), sub: `${taughtClassRows.length} allotted classes`, icon: Users, gradient: 'from-blue-600 to-indigo-600', glow: 'rgba(99, 102, 241, 0.15)' },
    { label: 'Pending Grading', value: loading ? '—' : String(pendingGrading), sub: `${assessments.length} assessments`, icon: BookOpen, gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245, 158, 11, 0.15)' },
    { label: 'Class Avg Score', value: loading ? '—' : classAverage === null ? '—' : `${classAverage}%`, sub: `${gradedAssessments.length} graded assessments`, icon: Award, gradient: 'from-emerald-600 to-emerald-500', glow: 'rgba(16, 185, 129, 0.15)' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-cyan"><GraduationCap className="w-3 h-3" /> Faculty Workspace</span>
            <span className="badge badge-emerald"><Activity className="w-3 h-3" /> Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            Good Morning, {user?.fullName || 'Mrs. Priya Nair'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">Faculty workspace • {taughtClassRows.length} allotted classes • live assessment summary</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/attendance"
            className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0d9488)', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)' }}
          >
            <CheckSquare className="w-4 h-4" /> Mark Attendance
          </Link>
          <Link to="/assessments"
            className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)' }}
          >
            <Plus className="w-4 h-4" /> Create Assessment
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={kpi.label} className={`relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fadeInUp stagger-${i + 1}`}
            style={{ boxShadow: `0 8px 28px rgba(15, 23, 42, 0.07), 0 0 40px ${kpi.glow}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-lg`}>
                <kpi.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 sm:text-3xl">{kpi.value}</div>
            <div className="mt-1 text-[11px] text-slate-600">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Schedule & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h3 className="text-sm font-bold text-slate-900 font-display">Today's Schedule</h3><p className="text-xs text-slate-500">Your timetable for today</p></div>
            <Link to="/timetable" className="text-xs font-bold text-iris-400 hover:text-iris-300 transition-colors">Full Timetable</Link>
          </div>
          <div className="space-y-2.5">
            {todayClasses.length === 0 && !loading && <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">No timetable periods are assigned to you today.</div>}
            {todayClasses.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-xl flex items-center justify-between gap-3 transition-all ${
                item.status === 'IN_PROGRESS' ? 'animate-borderGlow' : ''
              }`} style={{
                background: item.status === 'IN_PROGRESS' ? 'rgba(6, 182, 212, 0.08)' : '#f8fafc',
                border: `1px solid ${item.status === 'IN_PROGRESS' ? 'rgba(6, 182, 212, 0.3)' : '#e2e8f0'}`,
              }}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    item.status === 'IN_PROGRESS' ? 'bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400'
                  }`} style={item.status !== 'IN_PROGRESS' ? { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' } : {}}>
                    P{item.period}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.grade}</span>
                      <span className="text-xs text-slate-600">• {item.subject}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.time} • {item.room}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-[9px] ${
                    item.status === 'IN_PROGRESS' ? 'badge-cyan' : item.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'
                  }`}>{item.status.replace('_', ' ')}</span>
                  <Link to="/attendance" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 font-display">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { to: '/attendance', icon: CheckSquare, label: 'Bulk Mark Attendance', color: 'text-cyan-400' },
              { to: '/assessments', icon: BookOpen, label: 'Assessment & Quiz Studio', color: 'text-indigo-600' },
              { to: '/leave', icon: Clock, label: 'Apply for Leave', color: 'text-amber-400' },
              { to: '/spotlight', icon: Award, label: 'Nominate for Spotlight', color: 'text-emerald-400' },
            ].map((action) => (
              <Link key={action.to} to={action.to}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800"
              >
                <div className="flex items-center gap-2.5">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  <span>{action.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

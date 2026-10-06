import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ClassTeacherCard } from '../../components/common/ClassTeacherCard';
import {
  Users, CheckSquare, BookOpen, Clock, Calendar, Megaphone,
  CheckCircle2, ArrowRight, Award, Trophy, Sparkles, TrendingUp,
  FileCheck, Shield, ChevronRight, Activity
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [stuRes, hwRes, perfRes] = await Promise.all([
          api.getStudent('stu_1'),
          api.getHomework({ grade: 'Grade 10', section: 'A' }),
          api.getPerformance({ studentId: 'stu_1' }),
        ]);
        setStudentDetails(stuRes.student);
        setHomeworkList(hwRes.homework || []);
        setPerformance(perfRes.records || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayClasses = [
    { period: 1, time: '08:30', subject: 'Mathematics & Calculus', teacher: 'Mrs. Priya Nair', room: 'Room 301' },
    { period: 2, time: '09:20', subject: 'Physics Laboratory', teacher: 'Dr. Marcus Vance', room: 'Lab 3' },
    { period: 3, time: '10:10', subject: 'Computer Science', teacher: 'Elena Rostova', room: 'Tech Lab 1' },
    { period: 4, time: '11:15', subject: 'English Literature', teacher: 'Arthur Pendelton', room: 'Room 301' },
  ];

  const kpiCards = [
    { label: 'Attendance', value: '96.4%', sub: 'Excellent Standing', icon: CheckSquare, gradient: 'from-emerald-600 to-emerald-500', glow: 'rgba(16, 185, 129, 0.15)' },
    { label: 'Current GPA', value: '3.92', sub: 'Percentile: 99.4th', icon: Award, gradient: 'from-blue-600 to-indigo-600', glow: 'rgba(99, 102, 241, 0.15)' },
    { label: 'Active Tasks', value: `${homeworkList.length}`, sub: 'Calculus due Sept 15', icon: BookOpen, gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245, 158, 11, 0.15)' },
    { label: 'Honors', value: '3 Awards', sub: 'National STEM Gold', icon: Trophy, gradient: 'from-iris-600 to-iris-500', glow: 'rgba(124, 58, 237, 0.15)' },
  ];

  return (
    <div className="campus-dashboard-student space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-iris"><Users className="w-3 h-3" /> Learning Hub</span>
            <span className="badge badge-emerald"><Activity className="w-3 h-3" /> Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            Welcome back, {user?.fullName || 'Arav Patel'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Grade 10A • Roll #14 • STU-2026-8841 • Orion Blue House</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/timetable" className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0d9488)', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)' }}
          ><Clock className="w-4 h-4" /> My Timetable</Link>
          <Link to="/leave" className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)' }}
          >Apply Leave</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={kpi.label} className={`relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-fadeInUp stagger-${i + 1}`}
            style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)', boxShadow: `0 4px 24px rgba(0,0,0,0.2), 0 0 40px ${kpi.glow}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-lg`}><kpi.icon className="w-4 h-4 text-white" /></div>
            </div>
            <div className="stat-number text-2xl sm:text-3xl">{kpi.value}</div>
            <div className="text-[11px] text-slate-500 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Schedule & Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-display">Today's Classes</h3>
            <Link to="/timetable" className="text-xs font-bold text-iris-400 hover:text-iris-300 transition-colors">Weekly View</Link>
          </div>
          <div className="space-y-2">
            {todayClasses.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148, 163, 184, 0.05)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iris-600 to-iris-500 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-iris-600/15">
                    P{item.period}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{item.subject}</div>
                    <div className="text-[11px] text-slate-500">{item.teacher} • {item.room}</div>
                  </div>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-400">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-display">Active Coursework</h3>
            <Link to="/homework" className="text-xs font-bold text-iris-400 hover:text-iris-300 transition-colors">Submission Hub</Link>
          </div>
          <div className="space-y-2">
            {homeworkList.map((hw) => (
              <div key={hw.id} className="p-3.5 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148, 163, 184, 0.05)' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{hw.title}</span>
                    <span className="badge badge-amber text-[9px]">{hw.priority}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{hw.subject} • Due {hw.due_date} • {hw.teacher_name}</div>
                </div>
                <Link to="/homework" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}
                >Submit</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ClassTeacherCard classKey="Grade 10A" studentName={user?.fullName || 'Arav Patel'} isParentView={false} />
    </div>
  );
};

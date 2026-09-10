import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, User } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, CheckSquare, BookOpen, Clock, Calendar, Megaphone,
  CheckCircle2, ArrowRight, AlertCircle, Plus, Users, Award, Sparkles
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tchRes, clsRes] = await Promise.all([
          api.getTeacher('tch_1'),
          api.getClasses(),
        ]);
        setTeacherData(tchRes);
        setClasses(clsRes.classes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayClasses = [
    { period: 1, time: '08:30 - 09:15', grade: 'Grade 10A', subject: 'Calculus: Derivatives', room: 'Room 301', status: 'COMPLETED' },
    { period: 3, time: '10:10 - 10:55', grade: 'Grade 11A', subject: 'Linear Transformations', room: 'Room 401', status: 'IN_PROGRESS' },
    { period: 6, time: '13:40 - 14:25', grade: 'Grade 10B', subject: 'Quadratic Optimization', room: 'Room 302', status: 'UPCOMING' },
    { period: 7, time: '14:30 - 15:15', grade: 'Grade 12A', subject: 'Multivariable Integration', room: 'Room 402', status: 'UPCOMING' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Faculty Workspace & Class Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Good Morning, {user?.fullName || 'Mrs. Priya Nair'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Senior Mathematics Faculty • Grade 10 Lead Mentor • 4 Classes Scheduled Today
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/attendance"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </Link>
          <Link
            to="/homework"
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Post Assignment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Today's Lectures</span>
            <Clock className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">4 Periods</div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">Period 3 Active (Room 401)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Mentored Students</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-800 font-display">148</div>
          <div className="text-[11px] text-slate-600 font-medium mt-1">Across 4 Sections</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Pending Grading</span>
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-display">24 Subs</div>
          <div className="text-[11px] text-amber-800 font-semibold mt-1">Problem Set 4.3 Calculus</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Class Avg Score</span>
            <Award className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">94.2%</div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">Grade 10A Mathematics</div>
        </div>
      </div>

      {/* Today's Schedule & Quick Attendance Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Lectures */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Today's Class Schedule</h3>
              <p className="text-xs text-slate-500">Live period progression for Monday</p>
            </div>
            <Link to="/timetable" className="text-xs font-bold text-teal-600 hover:underline">
              Full Timetable
            </Link>
          </div>

          <div className="space-y-3">
            {todayClasses.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  item.status === 'IN_PROGRESS'
                    ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    item.status === 'IN_PROGRESS' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    P{item.period}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.grade}</span>
                      <span className="text-xs font-semibold text-slate-600">• {item.subject}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.time} • {item.room}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    item.status === 'IN_PROGRESS'
                      ? 'bg-teal-200 text-teal-900 animate-pulse'
                      : item.status === 'COMPLETED'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <Link
                    to="/attendance"
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Open Roster"
                  >
                    <ArrowRight className="w-4 h-4 text-teal-600" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Leave & Faculty Actions */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">Faculty Quick Actions</h3>
          
          <div className="space-y-2.5">
            <Link
              to="/attendance"
              className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 hover:bg-teal-100/70 transition-colors flex items-center justify-between text-xs font-semibold text-teal-900"
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                <span>Bulk Mark Attendance</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/homework"
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-navy-800" />
                <span>Assignment Repository</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/leave"
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Apply for Faculty Leave</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/spotlight"
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Nominate Student for Spotlight</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

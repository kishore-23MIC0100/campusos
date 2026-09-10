import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, CheckSquare, BookOpen, Clock, Calendar, Megaphone,
  CheckCircle2, ArrowRight, Award, Trophy, Sparkles, TrendingUp,
  FileCheck, Shield, ChevronRight
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <Users className="w-4 h-4" />
            <span>Student Learning Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Welcome back, {user?.fullName || 'Arav Patel'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Grade 10A • Roll #14 • Student ID: STU-2026-8841 • Orion Blue House
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/timetable"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>My Timetable</span>
          </Link>
          <Link
            to="/leave"
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <span>Apply Student Leave</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Attendance</span>
            <CheckSquare className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-display">96.4%</div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">Status: Excellent Standing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Current GPA</span>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-800 font-display">3.92 / 4.0</div>
          <div className="text-[11px] text-slate-600 font-medium mt-1">Percentile: 99.4th</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Tasks</span>
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-display">
            {homeworkList.length} Tasks
          </div>
          <div className="text-[11px] text-amber-800 font-semibold mt-1">Calculus due Sept 15</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Honors & Medals</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">3 Awards</div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">National STEM Gold Laureate</div>
        </div>
      </div>

      {/* Today's Classes & Pending Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">Today's Class Schedule</h3>
            <Link to="/timetable" className="text-xs font-bold text-teal-600 hover:underline">
              Weekly View
            </Link>
          </div>

          <div className="space-y-3">
            {todayClasses.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-navy-800 text-white font-bold text-xs flex items-center justify-center">
                    P{item.period}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.subject}</div>
                    <div className="text-[11px] text-slate-500">{item.teacher} • {item.room}</div>
                  </div>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coursework & Homework Queue */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">Active Coursework</h3>
            <Link to="/homework" className="text-xs font-bold text-teal-600 hover:underline">
              Submission Hub
            </Link>
          </div>

          <div className="space-y-3">
            {homeworkList.map((hw) => (
              <div key={hw.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{hw.title}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {hw.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {hw.subject} • Due {hw.due_date} • Assigned by {hw.teacher_name}
                  </div>
                </div>

                <Link
                  to="/homework"
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                >
                  Submit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

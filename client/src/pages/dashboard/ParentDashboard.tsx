import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  HeartHandshake, CheckSquare, BookOpen, Clock, Calendar, Megaphone,
  CheckCircle2, ArrowRight, Award, Trophy, Sparkles, TrendingUp,
  CreditCard, MessageSquare, ChevronDown, User, AlertCircle
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getMyChildren();
        setChildren(res.children || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeChild = children[selectedChildIndex] || {
    first_name: 'Arav',
    last_name: 'Patel',
    grade: 'Grade 10',
    section: 'A',
    student_id: 'STU-2026-8841',
    attendance_pct: 96.4,
    gpa: 3.92,
    house: 'Orion Blue',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header with Multi-Child Dropdown Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Family & Parent Advisory Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Welcome, {user?.fullName || 'Rajesh Patel'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Oakridge Parent Association • Monitoring {children.length || 2} Linked Children
          </p>
        </div>

        {/* Multi-Child Switcher Tabs */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 px-2 hidden sm:inline">Active Child:</span>
            {children.map((child, idx) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedChildIndex === idx
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{child.first_name} ({child.grade})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Child Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Attendance Rate</span>
            <CheckSquare className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-display">
            {activeChild.attendance_pct || 96.4}%
          </div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">Status: Present in Class Today</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Term 1 GPA</span>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-800 font-display">
            {activeChild.gpa || 3.92} / 4.0
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-1">Grade Rank: Top 2%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">School Fee Dues</span>
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-display">Paid in Full</div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-1">Receipt #REC-2026-8941</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Teacher Advisory</span>
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Oct 4</div>
          <div className="text-[11px] text-purple-800 font-semibold mt-1">Parent-Teacher Conclave</div>
        </div>
      </div>

      {/* Child Academic Records & Leave Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Academic Marks Summary */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {activeChild.first_name}'s Term 1 Scorecard
              </h3>
              <p className="text-xs text-slate-500">{activeChild.grade} Section {activeChild.section} • Board Certified</p>
            </div>
            <Link to="/performance" className="text-xs font-bold text-teal-600 hover:underline">
              Detailed Analytics
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { subject: 'Mathematics & Calculus', marks: 98, max: 100, grade: 'A+', feedback: 'Exceptional analytical proofs and speed.' },
              { subject: 'Physics & Lab Mechanics', marks: 96, max: 100, grade: 'A+', feedback: 'Outstanding experimental precision.' },
              { subject: 'Computer Science', marks: 99, max: 100, grade: 'A+', feedback: 'Mastery of algorithmic data structures.' },
              { subject: 'English Literature', marks: 91, max: 100, grade: 'A', feedback: 'Nuanced comparative essay analysis.' },
            ].map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{sub.subject}</div>
                  <div className="text-slate-500 mt-0.5">{sub.feedback}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{sub.marks} / {sub.max}</div>
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                    Grade {sub.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parent Actions */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">Parent Actions</h3>
          
          <div className="space-y-3">
            <Link
              to="/leave"
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Submit Child Absence Leave</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/events"
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Book Teacher Advisory Slot</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/announcements"
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <span>School Circulars & Bus Routes</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

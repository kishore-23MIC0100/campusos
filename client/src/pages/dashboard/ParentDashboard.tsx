import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ClassTeacherCard } from '../../components/common/ClassTeacherCard';
import {
  HeartHandshake, CheckSquare, BookOpen, Clock, Calendar, Megaphone,
  CheckCircle2, ArrowRight, Award, Trophy, Sparkles, TrendingUp,
  CreditCard, MessageSquare, ChevronDown, User, AlertCircle, Activity
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
        const validChildren = (res.children || []).filter(
          (c: any) => c.last_name === 'Patel' || c.parent_name === 'Rajesh Patel' || c.id === 'stu_1' || c.id === 'stu_2'
        );
        setChildren(
          validChildren.length > 0
            ? validChildren
            : [
                { id: 'stu_1', first_name: 'Arav', last_name: 'Patel', grade: 'Grade 10', section: 'A', student_id: 'STU-2026-8841', attendance_pct: 96.4, gpa: 3.92, house: 'Orion Blue' },
                { id: 'stu_2', first_name: 'Diya', last_name: 'Patel', grade: 'Grade 7', section: 'A', student_id: 'STU-2026-5120', attendance_pct: 97.8, gpa: 3.88, house: 'Orion Blue' },
              ]
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeChild = children[selectedChildIndex] || {
    first_name: 'Arav', last_name: 'Patel', grade: 'Grade 10', section: 'A',
    student_id: 'STU-2026-8841', attendance_pct: 96.4, gpa: 3.92, house: 'Orion Blue',
  };

  const childScorecards: Record<string, any[]> = {
    Arav: [
      { subject: 'Mathematics & Calculus', marks: 98, max: 100, grade: 'A+', feedback: 'Exceptional analytical proofs and speed.' },
      { subject: 'Physics & Lab Mechanics', marks: 96, max: 100, grade: 'A+', feedback: 'Outstanding experimental precision.' },
      { subject: 'Computer Science', marks: 99, max: 100, grade: 'A+', feedback: 'Mastery of algorithmic data structures.' },
      { subject: 'English Literature', marks: 91, max: 100, grade: 'A', feedback: 'Nuanced comparative essay analysis.' },
    ],
    Diya: [
      { subject: 'General Science & Botany', marks: 97, max: 100, grade: 'A+', feedback: 'Exceptional observational notes.' },
      { subject: 'Mathematics & Algebra', marks: 98, max: 100, grade: 'A+', feedback: 'Flawless arithmetic proofs.' },
      { subject: 'Computer Science Basics', marks: 99, max: 100, grade: 'A+', feedback: 'Top performer in block coding.' },
      { subject: 'English & Rhetoric', marks: 95, max: 100, grade: 'A+', feedback: 'Vibrant vocabulary and delivery.' },
    ],
  };

  const currentScorecard = childScorecards[activeChild.first_name] || childScorecards.Arav;

  const kpiCards = [
    { label: 'Attendance', value: `${activeChild.attendance_pct || 96.4}%`, sub: 'Present Today', icon: CheckSquare, gradient: 'from-emerald-600 to-emerald-500', glow: 'rgba(16, 185, 129, 0.15)' },
    { label: 'Term 1 GPA', value: `${activeChild.gpa || 3.92}`, sub: 'Grade Rank: Top 2%', icon: Award, gradient: 'from-blue-600 to-indigo-600', glow: 'rgba(99, 102, 241, 0.15)' },
    { label: 'Fee Status', value: 'Paid', sub: 'Receipt #REC-2026-8941', icon: CreditCard, gradient: 'from-cyan-600 to-teal-600', glow: 'rgba(6, 182, 212, 0.15)' },
    { label: 'Next PTM', value: 'Oct 4', sub: 'Parent-Teacher Conclave', icon: MessageSquare, gradient: 'from-iris-600 to-iris-500', glow: 'rgba(124, 58, 237, 0.15)' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-amber"><HeartHandshake className="w-3 h-3" /> Family Portal</span>
            <span className="badge badge-emerald"><Activity className="w-3 h-3" /> Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            Welcome, {user?.fullName || 'Rajesh Patel'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Oakridge Parent Association • {children.length || 2} Linked Children</p>
        </div>

        {/* Child Switcher */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 p-1.5 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
            <span className="text-xs font-bold text-slate-500 px-2 hidden sm:inline">Child:</span>
            {children.map((child, idx) => (
              <button key={child.id} type="button" onClick={() => setSelectedChildIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedChildIndex === idx
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={selectedChildIndex === idx ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)' } : {}}
              >
                <User className="w-3.5 h-3.5" />
                <span>{child.first_name} ({child.grade})</span>
              </button>
            ))}
          </div>
        )}
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

      {/* Scorecard & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-display">{activeChild.first_name}'s Scorecard</h3>
              <p className="text-xs text-slate-500">{activeChild.grade} Section {activeChild.section} • Board Certified</p>
            </div>
            <Link to="/performance" className="text-xs font-bold text-iris-400 hover:text-iris-300 transition-colors">Full Analytics</Link>
          </div>
          <div className="space-y-2">
            {currentScorecard.map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-xl flex items-center justify-between text-xs"
                style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148, 163, 184, 0.05)' }}
              >
                <div>
                  <div className="font-bold text-white">{sub.subject}</div>
                  <div className="text-slate-500 mt-0.5">{sub.feedback}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{sub.marks} / {sub.max}</div>
                  <span className="badge badge-emerald text-[9px]">Grade {sub.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <h3 className="text-sm font-bold text-white font-display">Parent Actions</h3>
          <div className="space-y-2">
            {[
              { to: '/leave', icon: Clock, label: 'Submit Absence Leave', color: 'text-amber-400' },
              { to: '/events', icon: Calendar, label: 'Book Advisory Slot', color: 'text-cyan-400' },
              { to: '/announcements', icon: Megaphone, label: 'Circulars & Bus Routes', color: 'text-iris-400' },
            ].map((action) => (
              <Link key={action.to} to={action.to}
                className="p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-all hover:bg-slate-800/30"
                style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148, 163, 184, 0.05)' }}
              >
                <div className="flex items-center gap-2.5"><action.icon className={`w-4 h-4 ${action.color}`} /><span>{action.label}</span></div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ClassTeacherCard
        classKey={activeChild.grade === 'Grade 7' ? 'Grade 7A' : 'Grade 10A'}
        studentName={`${activeChild.first_name} ${activeChild.last_name}`}
        isParentView={true}
      />
    </div>
  );
};

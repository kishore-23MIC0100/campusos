import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp, BarChart2, Award, Plus, Search, CheckCircle2,
  X, Filter, UserCheck, Shield
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  const availableGrades = React.useMemo(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      return Array.from(new Set(user.allottedClasses.map((c) => c.grade)));
    }
    return ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  }, [isTeacher, user?.allottedClasses]);

  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [subjectAverages, setSubjectAverages] = useState<any[]>([]);
  const [grade, setGrade] = useState(() => {
    if (user?.role === 'TEACHER' && user.allottedClasses?.[0]?.grade) {
      return user.allottedClasses[0].grade;
    }
    return 'Grade 10';
  });
  const [loading, setLoading] = useState(true);

  // Sync grade if user allotments load
  useEffect(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      if (!user.allottedClasses.some((c) => c.grade === grade)) {
        setGrade(user.allottedClasses[0].grade);
      }
    }
  }, [isTeacher, user?.allottedClasses]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getPerformance({ grade });
        setPerformanceData(res.records || []);
        setSubjectAverages(res.subjectAverages || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [grade]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>
              {isTeacher ? 'Faculty Academic Analytics' : 'Diagnostic Academic Analytics'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Performance & Mastery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isTeacher
              ? `Oakridge International School • Diagnostic metrics for allotted classes (${availableGrades.join(', ')})`
              : 'Oakridge International School • Term 1 Assessment Diagnostic Metrics'}
          </p>
        </div>

        <div>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="glass-input px-3.5 py-2 text-xs font-bold rounded-xl bg-white text-slate-800 cursor-pointer shadow-2xs border border-slate-300"
          >
            {availableGrades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teacher Allotment Notice */}
      {isTeacher && user?.allottedClasses && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-teal-700 flex-shrink-0" />
            <div>
              <span className="font-bold">Faculty Allotment Scope: </span>
              <span>Showing diagnostic performance records for your allotted classes: </span>
              <span className="font-semibold text-teal-900 bg-white/80 px-2 py-0.5 rounded border border-teal-200">
                {user.allottedClasses.map((c) => `${c.grade}-${c.section}`).join(', ')}
              </span>
              <span className="text-teal-800 ml-1.5">• Unallotted grades are hidden.</span>
            </div>
          </div>
          <span className="hidden md:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-700 text-white">
            Faculty Scoped
          </span>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">Subject-wise Average Mastery</h3>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">Benchmark: 85%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages}>
                <XAxis dataKey="subject" stroke="#94A3B8" fontSize={10} />
                <YAxis domain={[70, 100]} stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="average" fill="#0D9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">Institutional Mastery Radar</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={subjectAverages}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={10} />
                <PolarRadiusAxis domain={[70, 100]} stroke="#CBD5E1" fontSize={10} />
                <Radar name="Class Score" dataKey="average" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Roster */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-base text-slate-900 font-display">
          Class Evaluation Records ({grade})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-6">Student</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Assessment</th>
              <th className="py-3 px-4">Marks Obtained</th>
              <th className="py-3 px-4">Grade</th>
              <th className="py-3 px-4">Percentile</th>
              <th className="py-3 px-6">Faculty Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {performanceData.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-6 font-bold text-slate-900">{rec.student_name}</td>
                <td className="py-3 px-4 text-slate-700 font-semibold">{rec.subject}</td>
                <td className="py-3 px-4 text-slate-500">{rec.exam_type}</td>
                <td className="py-3 px-4 font-bold text-slate-800">{rec.marks_obtained} / {rec.max_marks}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md font-bold bg-teal-100 text-teal-800 text-[10px]">
                    {rec.grade_letter}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">{rec.percentile}%</td>
                <td className="py-3 px-6 text-slate-600">{rec.teacher_remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users, GraduationCap, CheckSquare, BookOpen, Clock, Award,
  ArrowLeft, Download, Printer, Shield, Calendar, HeartHandshake,
  FileText, CheckCircle2, ChevronRight
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'attendance' | 'homework' | 'leaves'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        if (!id) throw new Error('Choose a student from the directory to open their profile.');
        const res = await api.getStudent(id);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'The student profile could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, attempt]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading student profile dossier...</div>;
  }

  if (error || !data?.student) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-800" role="alert"><h1 className="text-lg font-semibold">Student profile unavailable</h1><p className="mt-2 text-sm">{error || 'This student record is unavailable.'}</p><div className="mt-5 flex gap-4"><button onClick={() => setAttempt(value => value + 1)} className="rounded-lg border border-rose-300 px-4 py-2 text-xs font-semibold">Try again</button><Link to="/students" className="px-4 py-2 text-xs font-semibold">Back to student directory</Link></div></div>;
  const student = data.student;

  const performance = data?.performance || [];
  const attendance = data?.attendance || [];
  const homework = data?.homework || [];
  const leaves = data?.leaves || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print student profile</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-800 to-teal-700 text-white font-bold text-2xl flex items-center justify-center border border-white/20 shadow-md">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 font-display">
                {student.first_name} {student.last_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-800">
                {student.status || 'Status not recorded'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>{student.grade} - Section {student.section}</span>
              <span>•</span>
              <span>Student ID: <strong className="font-mono text-slate-800">{student.student_id}</strong></span>
              <span>•</span>
              <span>Adm #{student.admission_no}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Roll #{student.roll_no ?? 'Not assigned'} • House: {student.house || 'Not recorded'} • Blood: {student.blood_group || 'Not recorded'}
            </div>
          </div>
        </div>

        {/* Quick Performance Indicators */}
        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-teal-600 font-display">{data.attendance?.length ? `${(data.attendance.filter((item: any) => item.status === 'PRESENT' || item.status === 'LATE').length / data.attendance.length * 100).toFixed(1)}%` : 'N/A'}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Attendance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-blue-800 font-display">{student.gpa ?? 'N/A'}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Recorded GPA</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview & Profile' },
          { key: 'academic', label: 'Academic Performance' },
          { key: 'attendance', label: 'Attendance Records' },
          { key: 'homework', label: 'Homework & Tasks' },
          { key: 'leaves', label: 'Leave Applications' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            className={`pb-3 px-3 whitespace-nowrap transition-colors border-b-2 font-bold ${
              activeTab === t.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Personal & Academic Details</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Date of Birth:</span><span className="font-semibold">{student.dob}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Gender:</span><span className="font-semibold">{student.gender}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Academic Year:</span><span className="font-semibold">{student.academic_year || 'Not recorded'}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Class Mentor:</span><span className="font-semibold">{student.class_teacher || 'Not recorded'}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Residential Address:</span><span className="font-semibold">{student.address || 'Not recorded'}</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Guardian & Emergency Contacts</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Primary Guardian:</span><span className="font-semibold">{student.parent_name || 'Not recorded'}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Guardian Phone:</span><span className="font-mono font-semibold">{student.parent_phone || 'Not recorded'}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Emergency Relation:</span><span className="font-semibold">{student.emergency_relation || 'Not recorded'}</span></div>
              <div className="py-2.5 flex justify-between"><span className="text-slate-500">Transit Route:</span><span className="font-semibold">{student.transport_route || 'Not recorded'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Academic */}
      {activeTab === 'academic' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">Recorded assessment results</h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Subject</th>
                <th className="p-3">Exam Type</th>
                <th className="p-3">Marks</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Percentile</th>
                <th className="p-3">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!performance.length && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No assessment results recorded.</td></tr>}
              {performance.map((p: any) => (
                <tr key={p.id}>
                  <td className="p-3 font-bold text-slate-900">{p.subject}</td>
                  <td className="p-3 text-slate-500">{p.exam_type}</td>
                  <td className="p-3 font-bold">{p.marks_obtained} / {p.max_marks}</td>
                  <td className="p-3 font-bold text-teal-700">{p.grade_letter}</td>
                  <td className="p-3 font-mono">{p.percentile}%</td>
                  <td className="p-3 text-slate-600">{p.teacher_remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">Attendance History</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {!attendance.length && <p className="py-8 text-center text-slate-500">No attendance records recorded.</p>}
            {attendance.map((att: any) => (
              <div key={att.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{att.date}</span>
                  <span className="text-slate-400 ml-2">• Marked by {att.marked_by}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Homework */}
      {activeTab === 'homework' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">Class Homework Tasks</h3>
          <div className="space-y-3 text-xs">
            {!homework.length && <p className="py-8 text-center text-slate-500">No homework assignments recorded.</p>}
            {homework.map((hw: any) => (
              <div key={hw.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{hw.title} ({hw.subject})</div>
                  <div className="text-slate-500 mt-0.5">{hw.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Due: {hw.due_date}</div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    {hw.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Leaves */}
      {activeTab === 'leaves' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">Leave Applications</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {!leaves.length && <p className="py-8 text-center text-slate-500">No leave requests recorded.</p>}
            {leaves.map((lv: any) => (
              <div key={lv.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{lv.leave_type} LEAVE</span>
                  <div className="text-slate-500">{lv.from_date} to {lv.to_date} • {lv.reason}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  lv.status === 'APPROVED' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {lv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

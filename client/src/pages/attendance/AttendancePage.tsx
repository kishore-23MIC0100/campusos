import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  CheckSquare, Calendar, Users, CheckCircle2, XCircle, Clock,
  AlertCircle, Save, Download, RefreshCw, ChevronRight, Check,
  Shield, Lock, Sparkles, UserCheck
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  
  const isTeacher = user?.role === 'TEACHER';
  const isTeacherOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || isTeacher;
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

  // Compute available grades based on role
  const availableGrades = React.useMemo(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      return Array.from(new Set(user.allottedClasses.map((c) => c.grade)));
    }
    return ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  }, [isTeacher, user?.allottedClasses]);

  const [grade, setGrade] = useState(() => {
    if (user?.role === 'TEACHER' && user.allottedClasses?.[0]?.grade) {
      return user.allottedClasses[0].grade;
    }
    return 'Grade 10';
  });

  // Compute available sections for the selected grade
  const availableSections = React.useMemo(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      const matched = user.allottedClasses.filter((c) => c.grade === grade).map((c) => c.section);
      return matched.length > 0 ? Array.from(new Set(matched)) : ['A'];
    }
    return ['A', 'B'];
  }, [isTeacher, user?.allottedClasses, grade]);

  const [section, setSection] = useState(() => {
    if (user?.role === 'TEACHER' && user.allottedClasses?.[0]?.section) {
      return user.allottedClasses[0].section;
    }
    return 'A';
  });

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Sync state if user allotments load after initial mount
  useEffect(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      const hasCurrentGrade = user.allottedClasses.some((c) => c.grade === grade);
      if (!hasCurrentGrade) {
        setGrade(user.allottedClasses[0].grade);
        setSection(user.allottedClasses[0].section);
      } else if (!availableSections.includes(section)) {
        setSection(availableSections[0] || 'A');
      }
    }
  }, [isTeacher, user?.allottedClasses, availableSections]);

  const loadRoster = async () => {
    try {
      const [stuRes, attRes] = await Promise.all([
        api.getStudents({ grade, section }),
        api.getAttendance({ grade, section, date }),
      ]);

      const stuList = stuRes.students || [];
      setStudents(stuList);

      const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
      
      // If attendance was already recorded for this date, pre-populate
      if (attRes.records && attRes.records.length > 0) {
        attRes.records.forEach((r: any) => {
          initialMap[r.student_id] = r.status;
        });
      } else {
        // Default everyone to PRESENT for rapid 1-click workflows
        stuList.forEach((s: any) => {
          initialMap[s.id] = 'PRESENT';
        });
      }

      setAttendanceMap(initialMap);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [grade, section, date]);

  const setStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    if (!isTeacherOrAdmin) return;
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    if (!isTeacherOrAdmin) return;
    const updated: Record<string, 'PRESENT' | 'ABSENT'> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSave = async () => {
    if (!isTeacherOrAdmin) return;
    setSaving(true);
    setSavedSuccess(null);

    const records = students.map((s) => ({
      studentId: s.id,
      studentName: `${s.first_name} ${s.last_name}`,
      rollNo: s.roll_no || 0,
      status: attendanceMap[s.id] || 'PRESENT',
    }));

    try {
      const res = await api.submitBulkAttendance(grade, section, date, records);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      setSavedSuccess(res.message);
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const total = students.length;
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;
  const excusedCount = Object.values(attendanceMap).filter((s) => s === 'EXCUSED').length;
  const presentRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-700 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>
              {isTeacher
                ? 'Faculty Allotted Attendance Management'
                : isTeacherOrAdmin
                ? 'Institutional Attendance Management'
                : isStudent
                ? 'Student Attendance Records'
                : 'Ward Attendance Monitoring'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {isTeacherOrAdmin ? 'Attendance Taker' : isStudent ? 'Daily Attendance Register' : 'Ward Attendance Register'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isTeacher
              ? `Authorized Faculty Workspace • Scoped strictly to your allotted classes (${user?.allottedClasses?.map(c => `${c.grade}-${c.section}`).join(', ') || 'Assigned Classes'})`
              : isTeacherOrAdmin
              ? 'Oakridge International School • 1-Click Bulk Verification & SMS Broadcast'
              : isStudent
              ? 'Verified institutional presence register • Official CBSE classroom logs'
              : 'Real-time verified presence records for your enrolled children'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isTeacherOrAdmin ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save & Broadcast Attendance</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Read-Only Verified View</span>
            </div>
          )}
        </div>
      </div>

      {/* Faculty Allotment Notice for Teachers */}
      {isTeacher && user?.allottedClasses && user.allottedClasses.length > 0 && (
        <div className="p-4 rounded-2xl bg-teal-50/90 border border-teal-200/90 text-teal-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-teal-700 flex-shrink-0" />
            <div className="leading-relaxed">
              <span className="font-bold">Faculty Allotment Scope: </span>
              <span>You have edit access for </span>
              <span className="font-semibold text-teal-900 bg-white/80 px-2 py-0.5 rounded-md border border-teal-200">
                {user.allottedClasses.map((c) => `${c.grade} - ${c.section}`).join(', ')}
              </span>
              <span className="text-teal-800 ml-1.5">• Non-allotted classes are protected and omitted from your portal view.</span>
            </div>
          </div>
          <span className="hidden md:inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-700 text-white shadow-2xs">
            Faculty Scoped
          </span>
        </div>
      )}

      {/* Role-Aware Notice Banner for Students / Parents */}
      {!isTeacherOrAdmin && (
        <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-blue-950 text-xs flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Official Read-Only Record: </span>
            {isStudent
              ? 'Your attendance is officially recorded and locked by your assigned class teacher. For discrepancies or leave requests, please submit a formal application via the Leave Management module.'
              : 'Attendance records for your ward(s) are officially marked and published daily by Oakridge classroom teachers.'}
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Selector & Quick Bulk Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {isTeacher ? 'Your Allotted Grade' : 'Grade'}
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-600 cursor-pointer"
            >
              {availableGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {isTeacher ? 'Your Allotted Section' : 'Section'}
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-600 cursor-pointer"
            >
              {availableSections.map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Quick Bulk Marking Actions (Strictly Teacher & Admin Only) */}
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500 mr-1">Quick Bulk:</span>
            <button
              type="button"
              onClick={() => markAll('PRESENT')}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('ABSENT')}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
            >
              All Absent
            </button>
          </div>
        )}
      </div>

      {/* Live Statistics Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xl font-bold text-slate-900">{total}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Enrolled</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xl font-bold text-teal-600">{presentCount}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Present</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xl font-bold text-red-600">{absentCount}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Absent</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xl font-bold text-amber-600">{lateCount}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Late</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-xl font-bold text-blue-700">{presentRate}%</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Presence Index</div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-6">Roll #</th>
              <th className="py-3.5 px-6">Student Name</th>
              <th className="py-3.5 px-4">Student ID</th>
              <th className="py-3.5 px-4">
                {isTeacherOrAdmin ? 'Attendance Status Marking' : 'Verified Attendance Status'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {students.map((stu) => {
              const currentStatus = attendanceMap[stu.id] || 'PRESENT';
              const isSelf = isStudent && (stu.student_id === (user as any)?.studentId || stu.student_id === (user as any)?.student_id || stu.id === user?.id || user?.fullName?.toLowerCase().includes(stu.first_name.toLowerCase()));
              const isMyChild = isParent && (stu.last_name === 'Patel' || stu.first_name === 'Arav' || stu.first_name === 'Diya');

              return (
                <tr
                  key={stu.id}
                  className={`transition-colors ${
                    isSelf
                      ? 'bg-blue-50/70 hover:bg-blue-50'
                      : isMyChild
                      ? 'bg-amber-50/60 hover:bg-amber-50/80'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 px-6 font-bold text-slate-800">#{stu.roll_no || 14}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{stu.first_name} {stu.last_name}</span>
                      {isSelf && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          My Record
                        </span>
                      )}
                      {isMyChild && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Linked Ward
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{stu.student_id}</td>
                  <td className="py-3.5 px-4">
                    {isTeacherOrAdmin ? (
                      /* Interactive Marking Controls (Teachers and Admins only) */
                      <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setStatus(stu.id, 'PRESENT')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'PRESENT'
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(stu.id, 'ABSENT')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'ABSENT'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(stu.id, 'LATE')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'LATE'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(stu.id, 'EXCUSED')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'EXCUSED'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    ) : (
                      /* Read-Only Status Badges (Students & Parents) */
                      <div>
                        {currentStatus === 'PRESENT' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>Present</span>
                          </span>
                        )}
                        {currentStatus === 'ABSENT' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Absent</span>
                          </span>
                        )}
                        {currentStatus === 'LATE' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Late</span>
                          </span>
                        )}
                        {currentStatus === 'EXCUSED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>Excused</span>
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

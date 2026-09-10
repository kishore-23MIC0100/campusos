import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  CheckSquare, Calendar, Users, CheckCircle2, XCircle, Clock,
  AlertCircle, Save, Download, RefreshCw, ChevronRight, Check,
  Shield, Lock, Unlock, Sparkles, UserCheck, KeyRound, Smartphone,
  Mail, ArrowRight, ShieldCheck, X, RotateCcw, Copy, Send, HelpCircle,
  GraduationCap, Award, CheckCircle, FileText, CalendarCheck, AlertTriangle
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

  // Default to today or latest recorded date (2026-09-10)
  const [date, setDate] = useState('2026-09-10');
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [markedByMap, setMarkedByMap] = useState<Record<string, string>>({});
  const [isDateMarked, setIsDateMarked] = useState(false);
  
  // Historical records for student/parent logs
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Selected child for Parent view
  const [selectedParentChild, setSelectedParentChild] = useState<'Arav' | 'Diya'>('Arav');

  // Submission & OTP Lock States
  const [isSubmitted, setIsSubmitted] = useState(true);
  const [isUnlockedForEdit, setIsUnlockedForEdit] = useState(false);
  const [unlockedTimestamp, setUnlockedTimestamp] = useState<string | null>(null);

  // OTP Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [currentOtp, setCurrentOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpNotificationToast, setOtpNotificationToast] = useState<{ otp: string; sentTo: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpVerifyCount, setOtpVerifyCount] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const loadRoster = async () => {
    try {
      const targetGrade = isStudent ? 'Grade 10' : (isParent && selectedParentChild === 'Diya' ? 'Grade 7' : grade);
      const targetSection = isStudent ? 'A' : (isParent && selectedParentChild === 'Diya' ? 'A' : section);

      const [stuRes, attRes, allAttRes] = await Promise.all([
        api.getStudents({ grade: targetGrade, section: targetSection }),
        api.getAttendance({ grade: targetGrade, section: targetSection, date }),
        api.getAttendance({ grade: targetGrade, section: targetSection }),
      ]);

      const stuList = stuRes.students || [];
      setStudents(stuList);
      setHistoryRecords(allAttRes.records || []);

      const newMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
      const newRemarks: Record<string, string> = {};
      const newMarkedBy: Record<string, string> = {};
      
      // If attendance was already recorded for this date, populate with exact record
      if (attRes.records && attRes.records.length > 0) {
        attRes.records.forEach((r: any) => {
          // Find matching student
          const matchedStu = stuList.find((s: any) => s.id === r.student_id || s.student_id === r.student_id || `${s.first_name} ${s.last_name}`.toLowerCase() === r.student_name?.toLowerCase());
          const key = matchedStu ? matchedStu.id : r.student_id;
          newMap[key] = r.status;
          if (r.remarks) newRemarks[key] = r.remarks;
          if (r.marked_by) newMarkedBy[key] = r.marked_by;
        });
        setIsDateMarked(true);
        setIsSubmitted(true);
      } else {
        // Attendance was NOT marked for this date
        setIsDateMarked(false);
        setIsSubmitted(false);
        
        // If teacher, default to PRESENT for initial quick fill
        if (isTeacherOrAdmin) {
          stuList.forEach((s: any) => {
            newMap[s.id] = 'PRESENT';
          });
        }
      }

      setIsUnlockedForEdit(false);
      setAttendanceMap(newMap);
      setRemarksMap(newRemarks);
      setMarkedByMap(newMarkedBy);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [grade, section, date, isStudent, isParent, selectedParentChild]);

  // Generate & Dispatch OTP
  const generateAndSendOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(newOtp);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError(null);
    setResendCooldown(30);

    const contactTarget = user?.phone || '+91 98450-11223';
    setOtpNotificationToast({ otp: newOtp, sentTo: contactTarget });

    // Focus first input box on modal render
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 150);
  };

  const handleRequestEdit = () => {
    if (!isTeacherOrAdmin) return;
    generateAndSendOtp();
    setShowOtpModal(true);
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    if (val && !/^\d+$/.test(digit)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpError(null);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    if (!currentOtp) return;
    setOtpDigits(currentOtp.split(''));
    setOtpError(null);
    otpInputRefs.current[5]?.focus();
  };

  const handleVerifyOtp = () => {
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (entered !== currentOtp) {
      setOtpError('Invalid OTP code. Please check the code sent to your phone/email.');
      return;
    }

    // Correct OTP! Unlock edit mode
    setIsUnlockedForEdit(true);
    setShowOtpModal(false);
    setOtpVerifyCount((prev) => prev + 1);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setUnlockedTimestamp(timeStr);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setSavedSuccess(`🔓 Attendance unlocked for editing (Authorized via OTP Verification #${otpVerifyCount + 1}). You may now modify statuses and submit.`);
  };

  const handleCopyOtp = () => {
    if (!currentOtp) return;
    navigator.clipboard.writeText(currentOtp);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const setStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    if (!isTeacherOrAdmin) return;
    if (isSubmitted && !isUnlockedForEdit) {
      handleRequestEdit();
      return;
    }
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    if (!isTeacherOrAdmin) return;
    if (isSubmitted && !isUnlockedForEdit) {
      handleRequestEdit();
      return;
    }
    const updated: Record<string, 'PRESENT' | 'ABSENT'> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmitAttendance = async () => {
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
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      setIsSubmitted(true);
      setIsUnlockedForEdit(false);
      setIsDateMarked(true);
      setSavedSuccess(res.message || '✅ Attendance submitted and locked successfully. Real-time SMS dispatched to parents.');
      await loadRoster();
      setTimeout(() => setSavedSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Determine scoped student list based on role
  const displayStudents = React.useMemo(() => {
    if (isStudent) {
      const myId = (user as any)?.studentId || (user as any)?.student_id || 'STU-2026-8841';
      const myRecord = students.filter(
        (s) => s.student_id === myId || s.first_name?.toLowerCase() === 'arav' || s.id === user?.id
      );
      return myRecord.length > 0
        ? myRecord
        : [
            {
              id: 'stu_1',
              first_name: 'Arav',
              last_name: 'Patel',
              student_id: 'STU-2026-8841',
              roll_no: 14,
              grade: 'Grade 10',
              section: 'A',
              attendance_pct: 96.4,
            },
          ];
    }

    if (isParent) {
      if (selectedParentChild === 'Diya') {
        return [
          {
            id: 'stu_2',
            first_name: 'Diya',
            last_name: 'Patel',
            student_id: 'STU-2026-5120',
            roll_no: 9,
            grade: 'Grade 7',
            section: 'A',
            attendance_pct: 97.8,
          },
        ];
      }
      return [
        {
          id: 'stu_1',
          first_name: 'Arav',
          last_name: 'Patel',
          student_id: 'STU-2026-8841',
          roll_no: 14,
          grade: 'Grade 10',
          section: 'A',
          attendance_pct: 96.4,
        },
      ];
    }

    return students;
  }, [students, isStudent, isParent, selectedParentChild, user]);

  // Filter history records for student / parent log
  const studentHistory = React.useMemo(() => {
    if (!isStudent && !isParent) return [];
    const targetName = isStudent ? 'arav' : (selectedParentChild === 'Diya' ? 'diya' : 'arav');
    const filtered = historyRecords.filter(
      (r) => r.student_name?.toLowerCase().includes(targetName) || (isStudent && r.student_id === 'stu_1') || (isParent && selectedParentChild === 'Diya' && r.student_id === 'stu_2')
    );
    // Sort descending by date
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [historyRecords, isStudent, isParent, selectedParentChild]);

  // Selected date status for student
  const studentSelectedStatus = isStudent && displayStudents[0] ? attendanceMap[displayStudents[0].id] : null;
  const studentSelectedRemark = isStudent && displayStudents[0] ? remarksMap[displayStudents[0].id] : null;
  const studentSelectedMarker = isStudent && displayStudents[0] ? markedByMap[displayStudents[0].id] : 'Mrs. Priya Nair';

  const total = displayStudents.length;
  const presentCount = displayStudents.filter((s) => attendanceMap[s.id] === 'PRESENT').length;
  const absentCount = displayStudents.filter((s) => attendanceMap[s.id] === 'ABSENT').length;
  const lateCount = displayStudents.filter((s) => attendanceMap[s.id] === 'LATE').length;
  const excusedCount = displayStudents.filter((s) => attendanceMap[s.id] === 'EXCUSED').length;
  const presentRate = isStudent ? '96.4' : total > 0 && isDateMarked ? ((presentCount / total) * 100).toFixed(1) : '100.0';

  const canDirectlyEdit = isTeacherOrAdmin && (!isSubmitted || isUnlockedForEdit);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Real-time SMS / OTP Notification Toast Simulation */}
      {otpNotificationToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-indigo-500/30 flex items-center justify-between gap-4 animate-slideDown">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Institutional SMS Gateway
                </span>
                <span className="text-xs text-slate-300">Target: {otpNotificationToast.sentTo}</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                One-Time Password (OTP) for Attendance Edit is: <span className="font-mono font-extrabold text-amber-300 text-base tracking-widest px-2 py-0.5 rounded bg-white/10 border border-white/20">{otpNotificationToast.otp}</span> (Valid for 5 mins)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOtpNotificationToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            {isTeacherOrAdmin
              ? 'Daily Attendance Register'
              : isStudent
              ? 'My Attendance Record'
              : 'Ward Attendance Register'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isTeacher
              ? `Authorized Faculty Workspace • Class ${grade} - ${section} • Secure OTP Multi-Factor Verification Enabled`
              : isTeacherOrAdmin
              ? 'Oakridge International School • Secure Submission with OTP Edit Verification'
              : isStudent
              ? `Personal presence ledger for ${user?.fullName || 'Arav Patel'} (Roll #14 • Grade 10 - Section A)`
              : 'Real-time verified presence records for your enrolled children'}
          </p>
        </div>

        {/* Primary Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          {isTeacherOrAdmin ? (
            canDirectlyEdit ? (
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={saving || students.length === 0}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSubmitted ? 'Submit & Re-Lock Attendance' : 'Submit Daily Attendance'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestEdit}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Request OTP to Edit Attendance</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Official Student Record (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Status Banner for Teachers & Admins */}
      {isTeacherOrAdmin && (
        isSubmitted && !isUnlockedForEdit ? (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-200/70 flex items-center justify-center flex-shrink-0 text-amber-900 font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <span className="font-extrabold text-amber-900">Attendance Locked & Submitted: </span>
                <span>Records for {grade} - {section} ({date}) are sealed. To modify any student's status, generate an OTP to unlock editing.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestEdit}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock with OTP</span>
            </button>
          </div>
        ) : isUnlockedForEdit ? (
          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-900 font-bold">
                <Unlock className="w-4 h-4 text-emerald-800" />
              </div>
              <div className="leading-relaxed">
                <span className="font-extrabold text-emerald-900">Editing Unlocked via OTP #{otpVerifyCount} ({unlockedTimestamp || 'Active Session'}): </span>
                <span>You have authorized write access. Click any status to change, then click <strong>"Submit & Re-Lock Attendance"</strong> to finalize.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmitAttendance}
              disabled={saving}
              className="self-start sm:self-auto px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Submit & Lock</span>
            </button>
          </div>
        ) : null
      )}

      {/* Role-Aware Notice Banner for Students */}
      {isStudent && (
        <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-blue-950 text-xs flex items-start gap-3 shadow-2xs">
          <GraduationCap className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-extrabold text-blue-900">Personal Student Roster View: </span>
            <span>This register is strictly scoped to your individual presence record for <strong>Grade 10 - Section A</strong>. Class teacher <strong>Mrs. Priya Nair</strong> verifies your daily presence during homeroom period at 08:15 AM. Use the date picker to inspect your presence record on any specific date.</span>
          </div>
        </div>
      )}

      {/* Parent Child Switcher Banner */}
      {isParent && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <span className="font-bold">Select Enrolled Ward: </span>
              <span>Switch between your children to inspect individual attendance registers.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedParentChild('Arav')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedParentChild === 'Arav'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
              }`}
            >
              Arav Patel (Grade 10A)
            </button>
            <button
              type="button"
              onClick={() => setSelectedParentChild('Diya')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedParentChild === 'Diya'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
              }`}
            >
              Diya Patel (Grade 7A)
            </button>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Selector & Quick Bulk Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        {isStudent ? (
          <div className="flex flex-wrap items-center gap-4 w-full justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Your Enrolled Class</div>
                <div className="text-xs font-bold text-slate-900">Grade 10 • Section A</div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Student ID</div>
                <div className="text-xs font-mono font-bold text-blue-700">STU-2026-8841</div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Roll Number</div>
                <div className="text-xs font-bold text-slate-900">#14</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Attendance Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : isParent ? (
          <div className="flex flex-wrap items-center gap-4 w-full justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Ward Enrolled Class</div>
                <div className="text-xs font-bold text-slate-900">
                  {selectedParentChild === 'Arav' ? 'Grade 10 • Section A' : 'Grade 7 • Section A'}
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Student ID</div>
                <div className="text-xs font-mono font-bold text-amber-700">
                  {selectedParentChild === 'Arav' ? 'STU-2026-8841' : 'STU-2026-5120'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Attendance Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-600 cursor-pointer"
              />
            </div>
          </div>
        ) : (
          /* Teacher / Admin Controls */
          <>
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
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs font-bold text-slate-500 mr-1">Quick Bulk:</span>
              <button
                type="button"
                onClick={() => markAll('PRESENT')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  canDirectlyEdit
                    ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-pointer'
                }`}
                title={canDirectlyEdit ? 'Mark All Present' : 'Requires OTP Unlock'}
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => markAll('ABSENT')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  canDirectlyEdit
                    ? 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-pointer'
                }`}
                title={canDirectlyEdit ? 'Mark All Absent' : 'Requires OTP Unlock'}
              >
                All Absent
              </button>
            </div>
          </>
        )}
      </div>

      {/* Live Statistics Ticker */}
      {isStudent ? (
        /* Student's Personal Presence Metrics for the Selected Date & Academic Year */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-extrabold text-blue-700">96.4%</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Term Attendance Rate</div>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
              ✓ CBSE Compliant (&gt;75%)
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-extrabold text-teal-600">108</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Days Present</div>
            <span className="inline-block text-[10px] text-slate-500 mt-1">Academic Year 2025-26</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-extrabold text-amber-600">3</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Approved Leaves</div>
            <span className="inline-block text-[10px] text-slate-500 mt-1">Formal leave granted</span>
          </div>

          {/* Dynamic Status Card for Selected Date */}
          <div className={`p-4 rounded-2xl border shadow-2xs ${
            !isDateMarked
              ? 'bg-slate-50 border-slate-200 text-slate-600'
              : studentSelectedStatus === 'PRESENT'
              ? 'bg-teal-50/70 border-teal-200 text-teal-900'
              : studentSelectedStatus === 'LATE'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : studentSelectedStatus === 'EXCUSED'
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : 'bg-red-50/70 border-red-200 text-red-900'
          }`}>
            <div className="text-xl font-extrabold">
              {!isDateMarked ? (
                <span className="text-slate-500 font-bold text-sm flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" /> Pending / Not Held
                </span>
              ) : studentSelectedStatus === 'PRESENT' ? (
                <span className="text-teal-700">Present</span>
              ) : studentSelectedStatus === 'LATE' ? (
                <span className="text-amber-700">Late Arrival</span>
              ) : studentSelectedStatus === 'EXCUSED' ? (
                <span className="text-blue-700">Excused</span>
              ) : (
                <span className="text-red-700">Absent</span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              Status on {date}
            </div>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
              {!isDateMarked
                ? 'No roll call recorded'
                : `Verified by ${studentSelectedMarker}`}
            </span>
          </div>
        </div>
      ) : isParent ? (
        /* Parent Ward's Metrics */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-extrabold text-amber-600">
              {selectedParentChild === 'Arav' ? '96.4%' : '97.8%'}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              {selectedParentChild}'s Attendance
            </div>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
              ✓ Excellent Compliance
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-extrabold text-teal-600">
              {selectedParentChild === 'Arav' ? '108' : '110'}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Days Attended</div>
            <span className="inline-block text-[10px] text-slate-500 mt-1">Academic Year 2025-26</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-2xl font-extrabold text-amber-600">
              {selectedParentChild === 'Arav' ? '3' : '2'}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Excused Leaves</div>
            <span className="inline-block text-[10px] text-slate-500 mt-1">All with prior notice</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xl font-extrabold">
              {!isDateMarked ? (
                <span className="text-slate-500 text-sm">Not Marked</span>
              ) : (
                <span className="text-teal-600">{attendanceMap[displayStudents[0]?.id] || 'Present'}</span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              Status on {date}
            </div>
            <span className="inline-block text-[10px] font-bold text-slate-500 mt-1">
              {isDateMarked ? 'Official Entry Logged' : 'No record on file'}
            </span>
          </div>
        </div>
      ) : (
        /* Teacher / Admin Class Overview */
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
      )}

      {/* Selected Date Attendance Register Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {isStudent
                ? `Official Presence Ledger for ${date}`
                : isParent
                ? `${selectedParentChild}'s Attendance Record on ${date}`
                : `Class Roll Call Roster on ${date}`}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {isStudent ? 'Grade 10 • Section A' : isParent ? (selectedParentChild === 'Arav' ? 'Grade 10 • Section A' : 'Grade 7 • Section A') : `${grade} • Section ${section}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isTeacherOrAdmin ? (
              isDateMarked && !isUnlockedForEdit ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked & Submitted</span>
                </span>
              ) : isUnlockedForEdit ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Editing Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200">
                  <span>Draft (Not Submitted)</span>
                </span>
              )
            ) : isDateMarked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>CBSE Verified Record</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Pending Teacher Roll Call</span>
              </span>
            )}
          </div>
        </div>

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
            {displayStudents.map((stu) => {
              const currentStatus = attendanceMap[stu.id];
              const remark = remarksMap[stu.id];
              const isSelf = isStudent;
              const isMyChild = isParent;

              return (
                <tr
                  key={stu.id}
                  className={`transition-colors ${
                    isSelf
                      ? 'bg-blue-50/50 hover:bg-blue-50/70'
                      : isMyChild
                      ? 'bg-amber-50/50 hover:bg-amber-50/70'
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
                          title={!canDirectlyEdit ? 'Click to request OTP unlock' : 'Mark Present'}
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
                          title={!canDirectlyEdit ? 'Click to request OTP unlock' : 'Mark Absent'}
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
                          title={!canDirectlyEdit ? 'Click to request OTP unlock' : 'Mark Late'}
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
                          title={!canDirectlyEdit ? 'Click to request OTP unlock' : 'Mark Excused'}
                        >
                          Excused
                        </button>
                      </div>
                    ) : (
                      /* Dynamic Read-Only Status Badges (Students & Parents) */
                      <div>
                        {!isDateMarked || !currentStatus ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>No attendance marked for {date}</span>
                          </span>
                        ) : currentStatus === 'PRESENT' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                              <span>Present</span>
                            </span>
                            {remark && <span className="text-[11px] text-slate-500">({remark})</span>}
                          </div>
                        ) : currentStatus === 'LATE' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Late Arrival</span>
                            </span>
                            {remark && <span className="text-[11px] text-amber-800 font-medium">({remark})</span>}
                          </div>
                        ) : currentStatus === 'EXCUSED' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                              <span>Excused</span>
                            </span>
                            {remark && <span className="text-[11px] text-blue-800 font-medium">({remark})</span>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Absent</span>
                            </span>
                            {remark && <span className="text-[11px] text-red-800 font-medium">({remark})</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Bottom Submission Bar for Teachers/Admins */}
        {isTeacherOrAdmin && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>
                {canDirectlyEdit
                  ? 'All changes will be cryptographically logged in the institutional security audit trail upon submission.'
                  : 'Attendance is finalized. If any pupil arrived late or was excused, request an OTP to make modifications.'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {canDirectlyEdit ? (
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSubmitted ? 'Submit & Re-Lock Attendance' : 'Submit Daily Attendance'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestEdit}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Request OTP to Edit Attendance</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📅 STUDENT & PARENT HISTORICAL ATTENDANCE LOG (Day-by-Day Timeline)         */}
      {/* ========================================================================= */}
      {(isStudent || isParent) && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-display">
                  {isStudent ? 'Daily Presence History Ledger' : `${selectedParentChild}'s Verified Presence Log`}
                </h3>
                <p className="text-xs text-slate-500">
                  Click any date in the log to inspect historical records on that specific day
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {studentHistory.length} Recorded Days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-6">Recorded Date</th>
                  <th className="py-3 px-4">Homeroom Status</th>
                  <th className="py-3 px-4">Verified By</th>
                  <th className="py-3 px-6">Official Teacher Notes / Remarks</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentHistory.map((rec) => {
                  const isSelectedDate = rec.date === date;
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setDate(rec.date)}
                      className={`cursor-pointer transition-colors ${
                        isSelectedDate ? 'bg-teal-50/80 font-bold' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-6 font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.date}</span>
                        {isSelectedDate && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-600 text-white">
                            Selected
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {rec.status === 'PRESENT' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            Present
                          </span>
                        )}
                        {rec.status === 'LATE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Late Arrival
                          </span>
                        )}
                        {rec.status === 'EXCUSED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            <Check className="w-3 h-3 text-blue-600" />
                            Excused
                          </span>
                        )}
                        {rec.status === 'ABSENT' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rec.marked_by || 'Mrs. Priya Nair'}</td>
                      <td className="py-3 px-6 text-slate-600 text-[11px]">{rec.remarks || 'On-Time Homeroom Presence'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDate(rec.date);
                          }}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                        >
                          View Day →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔐 HIGH-SECURITY OTP VERIFICATION MODAL                                    */}
      {/* ========================================================================= */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-5 animate-scaleIn relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-2xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Security Clearance Required
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 font-display mt-0.5">
                  Authorize Attendance Edit
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To prevent unauthorized record modifications, enter the <strong>6-digit One-Time Password (OTP)</strong> sent to your registered contact (<strong>{user?.phone || '+91 98450-11223'}</strong> / <strong>{user?.email || 'faculty@campusos.edu'}</strong>).
            </p>

            {/* Live OTP Demo Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Generated OTP Code</div>
                <div className="text-lg font-mono font-extrabold text-slate-900 tracking-widest">{currentOtp}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fill</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                  title="Copy OTP"
                >
                  {copySuccess ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 6 Digit Input Boxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Enter 6-Digit OTP:</label>
              <div className="flex items-center justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className={`w-12 h-13 text-center text-xl font-bold font-mono rounded-xl border bg-slate-50 focus:bg-white outline-none transition-all shadow-2xs ${
                      otpError
                        ? 'border-red-400 focus:border-red-600 ring-2 ring-red-100'
                        : 'border-slate-300 focus:border-teal-600 focus:ring-3 focus:ring-teal-100'
                    }`}
                  />
                ))}
              </div>

              {otpError && (
                <div className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1.5 animate-shake">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>

            {/* Resend OTP & Expiry */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Code valid for 5 mins</span>
              </div>

              <button
                type="button"
                onClick={generateAndSendOtp}
                disabled={resendCooldown > 0}
                className="font-bold text-teal-700 hover:text-teal-900 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend New OTP'}</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Unlock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

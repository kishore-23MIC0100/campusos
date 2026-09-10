import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Clock, Plus, Search, Calendar, AlertTriangle, CheckCircle2,
  Printer, Trash2, X, ChevronRight, Users, Building2,
  GraduationCap, Sparkles, BookOpen, MapPin, UserCheck, CalendarDays
} from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  // Selected child for Parent view
  const [selectedParentChild, setSelectedParentChild] = useState<'Arav' | 'Diya'>('Arav');

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

  const [slots, setSlots] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Active day filter for mobile view
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [activeDayTab, setActiveDayTab] = useState('Monday');

  // Sync if user data changes
  useEffect(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      const hasGrade = user.allottedClasses.some((c) => c.grade === grade);
      if (!hasGrade) {
        setGrade(user.allottedClasses[0].grade);
        setSection(user.allottedClasses[0].section);
      } else if (!availableSections.includes(section)) {
        setSection(availableSections[0] || 'A');
      }
    }
  }, [isTeacher, user?.allottedClasses, availableSections]);

  // New slot form
  const [newDay, setNewDay] = useState('Monday');
  const [newPeriod, setNewPeriod] = useState(1);
  const [newStartTime, setNewStartTime] = useState('08:30');
  const [newEndTime, setNewEndTime] = useState('09:15');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newTeacher, setNewTeacher] = useState('Mrs. Priya Nair');
  const [newRoom, setNewRoom] = useState('Room 301');

  const loadTimetable = async () => {
    try {
      const targetGrade = isStudent ? 'Grade 10' : (isParent && selectedParentChild === 'Diya' ? 'Grade 7' : grade);
      const targetSection = isStudent ? 'A' : (isParent && selectedParentChild === 'Diya' ? 'A' : section);

      const res = await api.getTimetable({ grade: targetGrade, section: targetSection });
      setSlots(res.slots || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [grade, section, isStudent, isParent, selectedParentChild]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    try {
      await api.createTimetableSlot({
        grade,
        section,
        dayOfWeek: newDay,
        periodIndex: newPeriod,
        startTime: newStartTime,
        endTime: newEndTime,
        subject: newSubject,
        teacherName: newTeacher,
        roomNumber: newRoom,
      });

      setShowAddModal(false);
      loadTimetable();
    } catch (err: any) {
      setConflictError(err.message || 'Scheduling conflict detected.');
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Remove this schedule slot?')) return;
    try {
      await api.deleteTimetableSlot(id);
      loadTimetable();
    } catch (err) {
      console.error(err);
    }
  };

  const periods = [1, 2, 3, 4, 5, 6, 7];

  const periodTimeMap: Record<number, { start: string; end: string }> = {
    1: { start: '08:30', end: '09:15' },
    2: { start: '09:20', end: '10:05' },
    3: { start: '10:10', end: '10:55' },
    4: { start: '11:15', end: '12:00' },
    5: { start: '12:05', end: '12:50' },
    6: { start: '13:40', end: '14:25' },
    7: { start: '14:30', end: '15:15' },
  };

  const getSlot = (day: string, period: number) => {
    return slots.find((s) => s.day_of_week === day && s.period_index === period);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-700 mb-1">
            {isStudent ? (
              <GraduationCap className="w-4 h-4 text-blue-700" />
            ) : isParent ? (
              <Users className="w-4 h-4 text-amber-700" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <span>
              {isStudent
                ? 'Student Academic Routine'
                : isParent
                ? 'Ward Academic Schedule'
                : isTeacher
                ? 'Faculty Allotted Schedule'
                : 'Master Schedule & Conflict Resolution'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {isStudent
              ? 'My Class Timetable'
              : isParent
              ? `${selectedParentChild}'s Class Timetable`
              : 'Weekly Academic Timetable'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isStudent
              ? `Personal Classroom Schedule for ${user?.fullName || 'Arav Patel'} • Grade 10 - Section A • Room 301 (Academic Wing)`
              : isParent
              ? `Weekly subject periods & faculty routine for ${selectedParentChild === 'Arav' ? 'Arav Patel (Grade 10A)' : 'Diya Patel (Grade 7A)'}`
              : isTeacher
              ? 'Scoped exclusively to your allotted class periods'
              : 'Oakridge International School • Automated Room & Faculty Conflict Detection'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Export Schedule</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Schedule Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Specific Banner / Notice */}
      {isStudent && (
        <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-blue-950 text-xs flex items-start gap-3 shadow-2xs">
          <GraduationCap className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-extrabold text-blue-900">Personal Class Schedule View: </span>
            <span>You are enrolled in <strong>Grade 10 - Section A</strong>. Class periods run from <strong>08:30 AM to 03:15 PM</strong> with lunch break between Period 5 & 6. Homeroom guidance is supervised by <strong>Mrs. Priya Nair</strong> in <strong>Room 301</strong>.</span>
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
              <span>Switch between your children to view their specific class timetables.</span>
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

      {/* Teacher Allotment Notice */}
      {isTeacher && user?.allottedClasses && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-teal-700 flex-shrink-0" />
            <div>
              <span className="font-bold">Faculty Timetable Scope: </span>
              <span>Displaying schedules for your allotted classes: </span>
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

      {/* Class Switcher / Locked Student Schedule Information Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {isStudent ? (
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
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Class Mentor</div>
              <div className="text-xs font-bold text-slate-900">Mrs. Priya Nair</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Homeroom</div>
              <div className="text-xs font-bold text-slate-900">Room 301</div>
            </div>
          </div>
        ) : isParent ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Ward Enrolled Class</div>
              <div className="text-xs font-bold text-slate-900">
                {selectedParentChild === 'Arav' ? 'Grade 10 • Section A' : 'Grade 7 • Section A'}
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Class Mentor</div>
              <div className="text-xs font-bold text-slate-900">
                {selectedParentChild === 'Arav' ? 'Mrs. Priya Nair (Math)' : 'Elena Rostova (CS)'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Active Schedule:</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 cursor-pointer outline-none focus:border-teal-600"
            >
              {availableGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 cursor-pointer outline-none focus:border-teal-600"
            >
              {availableSections.map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>
        )}

        <div className="text-xs text-slate-500 font-medium">
          7 Periods Daily • 35 Periods Weekly
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-x-auto p-6">
        <div className="min-w-[850px]">
          <div className="grid grid-cols-8 gap-3 text-center mb-3">
            <div className="p-3 text-xs font-extrabold uppercase text-slate-400 bg-slate-50 rounded-xl">
              Day / Period
            </div>
            {periods.map((p) => (
              <div key={p} className="p-3 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl">
                <div>Period {p}</div>
                <div className="text-[10px] text-slate-400 font-normal font-mono mt-0.5">
                  {periodTimeMap[p]?.start} - {periodTimeMap[p]?.end}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {days.map((day) => (
              <div key={day} className="grid grid-cols-8 gap-3 items-stretch">
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white font-bold text-xs flex flex-col items-center justify-center shadow-2xs">
                  <span>{day}</span>
                  <span className="text-[10px] text-slate-400 font-normal">7 Periods</span>
                </div>

                {periods.map((p) => {
                  const slot = getSlot(day, p);
                  return (
                    <div
                      key={p}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[95px] ${
                        slot
                          ? 'bg-slate-50 hover:bg-teal-50/40 border-slate-200 hover:border-teal-300 shadow-2xs'
                          : 'bg-slate-100/40 border-dashed border-slate-200 text-center items-center justify-center text-[10px] text-slate-400'
                      }`}
                    >
                      {slot ? (
                        <>
                          <div>
                            <div className="text-xs font-bold text-slate-900 line-clamp-1">{slot.subject}</div>
                            <div className="text-[11px] text-teal-700 font-semibold mt-0.5 line-clamp-1">{slot.teacher_name}</div>
                          </div>
                          <div className="pt-2 border-t border-slate-200/80 mt-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold">{slot.room_number || 'Room 301'}</span>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <span>Break / Free</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: Allocate Slot with Conflict Checking (Super Admin Only) */}
      {showAddModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setConflictError(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-slate-900 font-display mb-1">Allocate Timetable Period</h3>
            <p className="text-xs text-slate-500 mb-6">Assign faculty, classroom, and time slot with automatic clash detection.</p>

            {conflictError && (
              <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>{conflictError}</div>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week *</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Period Number *</label>
                  <select
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300"
                  >
                    {periods.map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Physics Laboratory"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Member *</label>
                  <select
                    value={newTeacher}
                    onChange={(e) => setNewTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300"
                  >
                    <option value="Mrs. Priya Nair">Mrs. Priya Nair</option>
                    <option value="Dr. Marcus Vance">Dr. Marcus Vance</option>
                    <option value="Elena Rostova">Elena Rostova</option>
                    <option value="Arthur Pendelton">Arthur Pendelton</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Lab Number *</label>
                  <input
                    type="text"
                    required
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. Lab 3 or Room 301"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition-all mt-3 cursor-pointer"
              >
                Validate & Save Slot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

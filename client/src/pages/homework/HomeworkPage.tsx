import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen, Plus, Search, Calendar, FileText, CheckCircle2,
  Clock, AlertCircle, X, Download, Upload, ArrowRight
} from 'lucide-react';

export const HomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [grade, setGrade] = useState('ALL');
  const [subject, setSubject] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState<any | null>(null);

  const isTeacher = user?.role === 'TEACHER';
  const isTeacherOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || isTeacher;

  const ALL_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English Literature', 'Computer Science'];

  // Allotted grades for teachers / all for admins
  const availableGrades = React.useMemo(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      return Array.from(new Set(user.allottedClasses.map((c) => c.grade)));
    }
    return ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  }, [isTeacher, user?.allottedClasses]);

  // Allotted subjects for teachers / all for admins
  const availableSubjects = React.useMemo(() => {
    if (isTeacher && user?.allottedSubjects && user.allottedSubjects.length > 0) {
      return user.allottedSubjects;
    }
    return ALL_SUBJECTS;
  }, [isTeacher, user?.allottedSubjects]);

  // New Homework Form state initialized with teacher defaults
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(() => {
    if (user?.role === 'TEACHER' && user.allottedSubjects?.[0]) return user.allottedSubjects[0];
    return 'Mathematics';
  });
  const [newGrade, setNewGrade] = useState(() => {
    if (user?.role === 'TEACHER' && user.allottedClasses?.[0]?.grade) return user.allottedClasses[0].grade;
    return 'Grade 10';
  });
  const [newSection, setNewSection] = useState(() => {
    if (user?.role === 'TEACHER' && user.allottedClasses?.[0]?.section) return user.allottedClasses[0].section;
    return 'A';
  });
  const [newDueDate, setNewDueDate] = useState('2026-09-20');
  const [newPriority, setNewPriority] = useState('NORMAL');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal available sections based on selected newGrade
  const modalAvailableSections = React.useMemo(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      const matched = user.allottedClasses.filter((c) => c.grade === newGrade).map((c) => c.section);
      return matched.length > 0 ? Array.from(new Set(matched)) : ['A'];
    }
    return ['A', 'B'];
  }, [isTeacher, user?.allottedClasses, newGrade]);

  // Keep modal defaults in sync when opening
  useEffect(() => {
    if (isTeacher && user?.allottedClasses && user.allottedClasses.length > 0) {
      if (!user.allottedClasses.some((c) => c.grade === newGrade)) {
        setNewGrade(user.allottedClasses[0].grade);
        setNewSection(user.allottedClasses[0].section);
      } else if (!modalAvailableSections.includes(newSection)) {
        setNewSection(modalAvailableSections[0] || 'A');
      }
    }
    if (isTeacher && user?.allottedSubjects && user.allottedSubjects.length > 0) {
      if (!user.allottedSubjects.includes(newSubject)) {
        setNewSubject(user.allottedSubjects[0]);
      }
    }
  }, [isTeacher, user?.allottedClasses, user?.allottedSubjects, modalAvailableSections]);

  // Student submission form
  const [solutionNotes, setSolutionNotes] = useState('');
  const [submittingSolution, setSubmittingSolution] = useState(false);

  const loadHomework = async () => {
    try {
      const res = await api.getHomework({ grade, subject, search });
      setHomeworkList(res.homework || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [grade, subject, search]);

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    setSubmitting(true);
    try {
      await api.createHomework({
        title: newTitle,
        subject: newSubject,
        grade: newGrade,
        section: newSection,
        dueDate: newDueDate,
        priority: newPriority,
        description: newDescription,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      loadHomework();
      toast.success('Homework assignment published and broadcasted to class students.', 'Assignment Created', { confetti: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish homework.', 'Publish Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubmitModal) return;

    setSubmittingSolution(true);
    try {
      await api.submitHomework(showSubmitModal.id, solutionNotes, 'student_work.pdf');
      setShowSubmitModal(null);
      setSolutionNotes('');
      loadHomework();
      toast.success('Assignment solution submitted to faculty grading queue.', 'Submission Received', { confetti: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit solution.', 'Submission Error');
    } finally {
      setSubmittingSolution(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>
              {isTeacher
                ? 'Faculty Allotted Coursework & Assignments'
                : 'Coursework & Continuous Assessment'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Homework & Assignment Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isTeacher
              ? `Publish & grade assignments scoped to your allotted subjects (${user?.allottedSubjects?.join(', ') || 'Faculty Syllabus'})`
              : 'Digital problem sets, rubric-based grading, and student submissions.'}
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Assignment</span>
          </button>
        )}
      </div>

      {/* Teacher Allotment Notice */}
      {isTeacher && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-700 flex-shrink-0" />
            <div>
              <span className="font-bold">Faculty Allotment Active: </span>
              <span>Authorized subjects: </span>
              <span className="font-semibold text-teal-900 bg-white/80 px-2 py-0.5 rounded border border-teal-200 mr-2">
                {user?.allottedSubjects?.join(', ') || 'Allotted Subjects'}
              </span>
              <span>Classes: </span>
              <span className="font-semibold text-teal-900 bg-white/80 px-2 py-0.5 rounded border border-teal-200">
                {user?.allottedClasses?.map((c) => `${c.grade}-${c.section}`).join(', ') || 'Allotted Classes'}
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-700 text-white">
            Scoped Access
          </span>
        </div>
      )}

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments by title, topic, teacher..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-white font-medium text-slate-700 cursor-pointer"
          >
            <option value="ALL">All {isTeacher ? 'My Classes' : 'Grades'}</option>
            {availableGrades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-white font-medium text-slate-700 cursor-pointer"
          >
            <option value="ALL">All {isTeacher ? 'My Subjects' : 'Subjects'}</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Homework Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homeworkList.map((hw) => (
          <div key={hw.id} className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  hw.priority === 'URGENT'
                    ? 'bg-red-100 text-red-800'
                    : hw.priority === 'IMPORTANT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {hw.priority} PRIORITY
                </span>

                <span className="text-xs font-mono font-semibold text-slate-400">
                  {hw.grade} {hw.section}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                {hw.title}
              </h3>
              <div className="text-xs font-semibold text-teal-700 mb-3">{hw.subject}</div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                {hw.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />Due: {hw.due_date}</span>
                <span className="text-[11px] text-slate-400 font-medium">By {hw.teacher_name}</span>
              </div>

              {user?.role === 'STUDENT' ? (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(hw)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    hw.isSubmitted
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-navy-800 hover:bg-navy-900 text-white'
                  }`}
                >
                  {hw.isSubmitted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Submitted (Resubmit Solution)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Solution</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Submissions Queue</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">34/38 Graded</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Create Assignment (Teacher/Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Assignment Publisher</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 font-display mb-1">Create Coursework</h3>
            <p className="text-xs text-slate-500 mb-6">Dispatches assignment to students and parents instantly.</p>

            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Calculus: Optimization & Rate of Change"
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTeacher ? 'Your Allotted Subject *' : 'Subject *'}
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-white cursor-pointer"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTeacher ? 'Your Allotted Class *' : 'Target Class *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="glass-input px-2 py-2 text-xs rounded-xl bg-white cursor-pointer"
                    >
                      {availableGrades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="glass-input px-2 py-2 text-xs rounded-xl bg-white cursor-pointer"
                    >
                      {modalAvailableSections.map((s) => (
                        <option key={s} value={s}>Sec {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-white"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions & Problem Set Details *</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail the exercises, textbook page numbers, and grading criteria..."
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition-all mt-2"
              >
                {submitting ? 'Publishing...' : 'Publish Coursework to Students'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Submit Solution (Student) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowSubmitModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 font-display mb-1">Submit Assignment Solution</h3>
            <p className="text-xs text-slate-500 mb-4">{showSubmitModal.title}</p>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Solution Notes / Description</label>
                <textarea
                  rows={3}
                  value={solutionNotes}
                  onChange={(e) => setSolutionNotes(e.target.value)}
                  placeholder="Summarize your working steps or link relevant digital repositories..."
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="font-semibold text-slate-700">solution_document_final.pdf</span>
                <div className="text-[10px] text-slate-400">Attached from CampusOS Workspace</div>
              </div>

              <button
                type="submit"
                disabled={submittingSolution}
                className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs transition-colors"
              >
                {submittingSolution ? 'Submitting...' : 'Confirm & Hand in Solution'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  TrendingUp, Award, BookOpen, CheckCircle2, Clock, Plus, Search,
  Filter, BarChart3, Users, Edit3, Trash2, X, ChevronRight, Download,
  Save, Sparkles, HelpCircle, FileText, CheckSquare, Star, UploadCloud, Eye, FileImage
} from 'lucide-react';

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read this file.'));
  reader.readAsDataURL(file);
});

const saveDataFile = (name: string, type: string, dataUrl: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = name || 'assessment-file';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const toLocalDateTimeInput = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const AssessmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';
  const isStudentOrParent = user?.role === 'STUDENT' || user?.role === 'PARENT';

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedTerm, setSelectedTerm] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Assessment for Marks Entry / Analytics
  const [activeAssessment, setActiveAssessment] = useState<any>(null);
  const [assessmentMarks, setAssessmentMarks] = useState<any[]>([]);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState<any[]>([]);
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [savingMarks, setSavingMarks] = useState(false);

  // Student portal view state
  const [studentAssessments, setStudentAssessments] = useState<any>(null);
  const [studentFiles, setStudentFiles] = useState<Record<string, File | null>>({});
  const [isAttachmentDragging, setIsAttachmentDragging] = useState(false);
  const [studentSessions, setStudentSessions] = useState<Record<string, any>>({});
  const [submittingAssessment, setSubmittingAssessment] = useState<string | null>(null);
  const [quizRemaining, setQuizRemaining] = useState<Record<string, number>>({});

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    assessmentType: 'Unit Test',
    grade: 'Grade 10',
    section: 'A',
    subject: 'Mathematics',
    maxMarks: 100,
    weightage: 20,
    assessmentDate: new Date().toISOString().split('T')[0],
    term: 'Term 1',
    description: '',
    dueAt: '',
    questions: [{ id: `q_${Date.now()}`, prompt: '', type: 'ESSAY', language: 'javascript', marks: 10, options: ['', '', '', ''], correctAnswer: '' }],
    attachments: [] as any[],
    settings: { shuffleQuestions: true, timeLimitMinutes: 30, attemptsAllowed: 1 },
  });

  const loadAssessments = async () => {
    setLoading(true);
    try {
      if (isStudentOrParent) {
        if (user?.role === 'PARENT') {
          const linked = await api.getMyChildren();
          const reports = await Promise.all(linked.children.map(async (child: any) => ({ child, report: await api.getStudentAssessments(child.id) })));
          const first = reports[0]?.report;
          setStudentAssessments(first ? {
            ...first,
            assessments: reports.flatMap(({ child, report }) => report.assessments.map((assessment: any) => ({ ...assessment, studentName: `${child.first_name} ${child.last_name}` }))),
            totalAssessments: reports.reduce((sum, entry) => sum + entry.report.totalAssessments, 0),
            gradedAssessments: reports.reduce((sum, entry) => sum + entry.report.gradedAssessments, 0),
          } : null);
        } else {
          const studentId = user?.studentId || user?.id || 'usr_student_1';
          const res = await api.getStudentAssessments(studentId);
          setStudentAssessments(res);
        }
      } else {
        // Teacher / Admin assessment list
        const res = await api.getAssessments({
          grade: selectedGrade !== 'ALL' ? selectedGrade : undefined,
          section: selectedSection !== 'ALL' ? selectedSection : undefined,
          subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
          term: selectedTerm !== 'ALL' ? selectedTerm : undefined,
          search: searchQuery.trim() || undefined,
        });
        setAssessments(res.assessments || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load assessments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, [selectedGrade, selectedSection, selectedSubject, selectedTerm]);

  const handleOpenAssessmentDetail = async (assessmentId: string) => {
    try {
      const res = await api.getAssessmentDetails(assessmentId);
      setActiveAssessment(res.assessment);
      setAssessmentMarks((res.marks || []).map((mark: any) => ({ ...mark, question_marks: typeof mark.question_marks === 'string' ? JSON.parse(mark.question_marks || '{}') : (mark.question_marks || {}) })));
      setAssessmentSubmissions(res.submissions || []);
      setDeadlineDraft(res.assessment.due_at ? toLocalDateTimeInput(res.assessment.due_at) : '');
      setAnalytics(res.analytics);
    } catch (err: any) {
      showToast(err.message || 'Failed to load assessment marks roster', 'error');
    }
  };

  const handleSaveDeadline = async () => {
    if (!activeAssessment || !deadlineDraft) { showToast('Choose a submission deadline.', 'error'); return; }
    try {
      await api.updateAssessmentDeadline(activeAssessment.id, new Date(deadlineDraft).toISOString());
      showToast('Assessment deadline updated.', 'success');
      await handleOpenAssessmentDetail(activeAssessment.id);
      loadAssessments();
    } catch (err: any) { showToast(err.message || 'Could not update the deadline.', 'error'); }
  };

  const handleSubmitStudentWork = async (assessmentId: string) => {
    const file = studentFiles[assessmentId];
    const isQuiz = /quiz/i.test(studentAssessments?.assessments?.find((item: any) => item.assessmentId === assessmentId)?.assessmentType || '');
    if (!file && !isQuiz) { showToast('Choose a completion file before submitting.', 'error'); return; }
    try {
      setSubmittingAssessment(assessmentId);
      const data = file ? await fileToDataUrl(file) : '';
      const session = studentSessions[assessmentId] || {};
      await api.submitAssessment(assessmentId, { ...(file ? { file: { name: file.name, type: file.type || 'application/octet-stream', data } } : {}), answers: session.answers || {}, notes: session.notes || '' });
      showToast('Your assessment work has been submitted.', 'success');
      setStudentFiles(prev => ({ ...prev, [assessmentId]: null }));
      loadAssessments();
    } catch (err: any) { showToast(err.message || 'Could not submit your work.', 'error'); }
    finally { setSubmittingAssessment(null); }
  };

  const handleStartQuiz = async (assessmentId: string) => {
    try {
      const session = await api.startAssessment(assessmentId);
      setStudentSessions(prev => ({ ...prev, [assessmentId]: { ...(prev[assessmentId] || {}), startedAt: session.startedAt, endsAt: session.endsAt } }));
    } catch (err: any) { showToast(err.message || 'Could not start quiz.', 'error'); }
  };

  useEffect(() => {
    const update = () => setQuizRemaining(Object.fromEntries(Object.entries(studentSessions).filter(([, session]) => session.endsAt).map(([id, session]) => [id, Math.max(0, Math.ceil((new Date(session.endsAt).getTime() - Date.now()) / 1000))])));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [studentSessions]);

  const downloadAssessmentFile = async (assessmentId: string, submissionId: string) => {
    try {
      const res = await api.getAssessmentSubmissionFile(assessmentId, submissionId);
      saveDataFile(res.file.name, res.file.type, res.file.data);
    } catch (err: any) { showToast(err.message || 'Could not download the file.', 'error'); }
  };

  const exportMarksCsv = () => {
    if (!assessmentMarks.length || !activeAssessment) return;
    const rows = [['Roll No', 'Student', 'Assessment', 'Subject', 'Score', 'Maximum', 'Grade', 'Submission', 'Submitted At', 'Feedback']];
    assessmentMarks.forEach(m => {
      const submission = assessmentSubmissions.find(s => s.student_id === m.student_id);
      rows.push([m.roll_no, m.student_name, activeAssessment.title, activeAssessment.subject, m.marks_obtained ?? '', activeAssessment.max_marks, calculateLetter(m.marks_obtained, Number(activeAssessment.max_marks)), submission?.file_name || 'Not submitted', submission?.submitted_at || '', m.feedback || '']);
    });
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${activeAssessment.title.replace(/[^a-z0-9-_]+/gi, '_')}_marks.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const setQuestion = (index: number, key: string, value: any) => setCreateForm(prev => ({ ...prev, questions: prev.questions.map((question: any, i: number) => i === index ? { ...question, [key]: value } : question) }));

  const handleAssessmentAttachments = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const currentSize = createForm.attachments.reduce((total: number, file: any) => total + Number(file.size || 0), 0);
    if (selected.some(file => file.size > 5 * 1024 * 1024) || currentSize + selected.reduce((total, file) => total + file.size, 0) > 5 * 1024 * 1024) { showToast('All reference files together must stay within 5 MB.', 'error'); return; }
    try {
      const attachments = await Promise.all(selected.map(async file => ({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: await fileToDataUrl(file) })));
      setCreateForm(prev => ({ ...prev, attachments: [...prev.attachments, ...attachments] }));
    } catch { showToast('Could not read the selected attachment.', 'error'); }
  };

  const formatFileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleMarkChange = (studentId: string, value: string) => {
    const num = value === '' ? null : Number(value);
    setAssessmentMarks(prev =>
      prev.map(m => (m.student_id === studentId ? { ...m, marks_obtained: num } : m))
    );
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setAssessmentMarks(prev =>
      prev.map(m => (m.student_id === studentId ? { ...m, feedback } : m))
    );
  };

  const handleQuestionMarkChange = (studentId: string, questionId: string, value: string) => {
    setAssessmentMarks(prev => prev.map(mark => {
      if (mark.student_id !== studentId) return mark;
      const questionMarks = { ...(typeof mark.question_marks === 'string' ? JSON.parse(mark.question_marks || '{}') : (mark.question_marks || {})), [questionId]: value === '' ? '' : Number(value) };
      const total = Object.values(questionMarks).reduce((sum: number, score: any) => sum + (score === '' ? 0 : Number(score)), 0);
      return { ...mark, question_marks: questionMarks, marks_obtained: total };
    }));
  };

  const handleSaveMarks = async () => {
    if (!activeAssessment) return;
    setSavingMarks(true);
    try {
      const payload = assessmentMarks.map(m => ({
        studentId: m.student_id,
        marksObtained: m.marks_obtained,
        questionMarks: m.question_marks,
        feedback: m.feedback,
      }));

      await api.updateAssessmentMarks(activeAssessment.id, payload);
      showToast('Assessment marks & feedback saved successfully', 'success');
      // Refresh details
      handleOpenAssessmentDetail(activeAssessment.id);
      loadAssessments();
    } catch (err: any) {
      showToast(err.message || 'Failed to save marks', 'error');
    } finally {
      setSavingMarks(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const maxMarks = createForm.questions.reduce((sum: number, question: any) => sum + Number(question.marks || 0), 0);
      if (!maxMarks) { showToast('Add at least one question with marks.', 'error'); return; }
      if (createForm.questions.some((question: any) => !question.prompt.trim())) { showToast('Add the prompt for every question.', 'error'); return; }
      const res = await api.createAssessment({
        ...createForm,
        maxMarks,
        dueAt: createForm.dueAt ? new Date(createForm.dueAt).toISOString() : null,
        facultyName: user?.fullName || 'Subject Faculty',
        facultyId: user?.id,
      });
      showToast(`Assessment created for ${res.enrolledCount} enrolled students!`, 'success');
      setShowCreateModal(false);
      loadAssessments();
      handleOpenAssessmentDetail(res.assessment.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to create assessment', 'error');
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assessment and all student marks?')) return;
    try {
      await api.deleteAssessment(id);
      showToast('Assessment removed', 'success');
      setActiveAssessment(null);
      loadAssessments();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete assessment', 'error');
    }
  };

  const calculateLetter = (score: number | null, max: number) => {
    if (score === null || isNaN(score) || max <= 0) return '—';
    const p = (score / max) * 100;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B+';
    if (p >= 60) return 'B';
    if (p >= 50) return 'C+';
    if (p >= 40) return 'C';
    return 'F';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              Academic Standards & Subject Evaluations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Subject Faculty Assessment Portal
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Create curriculum-aligned unit tests, practical lab exams, and rubric project assessments with continuous marks recording and analytics.
            </p>
          </div>

          {isTeacher && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Subject Assessment
            </button>
          )}
        </div>
      </div>

      {/* STUDENT / PARENT VIEW */}
      {isStudentOrParent ? (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Evaluated Assessments</div>
                <div className="text-2xl font-black text-navy-900 mt-1">
                  {studentAssessments?.gradedAssessments || 0} / {studentAssessments?.totalAssessments || 0}
                </div>
                <div className="text-xs text-teal-600 font-bold mt-1">Term 1 Active</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overall Assessment Average</div>
                <div className="text-2xl font-black text-teal-700 mt-1">
                  {studentAssessments?.subjectBreakdown?.length > 0
                    ? Math.round(
                        studentAssessments.subjectBreakdown.reduce((a: any, b: any) => a + b.averagePercentage, 0) /
                          studentAssessments.subjectBreakdown.length
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-emerald-600 font-bold mt-1">Grade Distinction: A+</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Curriculum Subjects</div>
                <div className="text-2xl font-black text-navy-900 mt-1">
                  {studentAssessments?.subjectBreakdown?.length || 4}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">Math, Physics, CS, Chemistry</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          {user?.role === 'STUDENT' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div><h3 className="text-base font-extrabold text-navy-900">Assignments & quizzes</h3><p className="mt-1 text-xs text-slate-500">Open class materials, complete quizzes, or submit your work before the faculty deadline.</p></div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase text-teal-700">{studentAssessments?.assessments?.length || 0} assigned</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {(studentAssessments?.assessments || []).map((item: any) => {
                  const quiz = /quiz/i.test(item.assessmentType || '');
                  const submitted = Boolean(item.submission && item.submission.attemptCount >= item.attemptsAllowed);
                  const pastDeadline = item.dueAt && Date.now() > new Date(item.dueAt).getTime();
                  return <article key={item.assessmentId} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-teal-50/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-wide text-teal-700">{item.subject} · {item.assessmentType}</div><h4 className="mt-1 font-extrabold text-slate-900">{item.title}</h4><p className="mt-1 text-xs text-slate-500">{item.description}{item.studentName ? ` · ${item.studentName}` : ''}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${submitted ? 'bg-emerald-100 text-emerald-700' : pastDeadline ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>{submitted ? 'Submitted' : pastDeadline ? 'Closed' : 'Open'}</span></div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600"><span>{item.maxMarks} marks · Due {item.dueAt ? new Date(item.dueAt).toLocaleString() : 'No deadline set'}</span>{item.submission?.fileName && <span className="font-semibold text-emerald-700">File: {item.submission.fileName}</span>}</div>
                    {item.attachments?.map((file: any, index: number) => <a key={index} href={file.data} download={file.name} className="mt-2 mr-2 inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700"><Download className="h-3.5 w-3.5" />{file.name}</a>)}
                    {!submitted && !pastDeadline && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3"><p className="text-[11px] font-semibold text-slate-600">{item.questions?.length ? `${item.questions.length} questions · ${quiz ? 'timed quiz' : 'assessment workspace'}` : 'Upload your completed work'} · {item.attemptsAllowed} allowed attempt{item.attemptsAllowed === 1 ? '' : 's'}</p><Link to={`/assessment-portal/${item.assessmentId}`} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100">{quiz ? 'Take test' : 'Open assessment'} <ChevronRight className="ml-1 inline h-4 w-4" /></Link></div>}
                  </article>;
                })}
              </div>
            </section>
          )}

          {/* Subject Performance Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-navy-900 mb-4">Subject-Wise Assessment Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(studentAssessments?.subjectBreakdown || []).map((sub: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-slate-900 text-xs">{sub.subject}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      Top {sub.highestPercentage}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-navy-900">{sub.averagePercentage}%</div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${sub.averagePercentage}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">{sub.assessmentsCount} Tests Completed</div>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Assessment Results */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-navy-900">Term 1 Assessment Report Cards</h3>
              <span className="text-xs text-slate-400">Official Instructor Feedback Included</span>
            </div>
            <div className="divide-y divide-slate-100">
              {(studentAssessments?.assessments || []).map((card: any) => (
                <div key={card.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                        {card.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">• {card.assessmentType}</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">{card.title}</div>
                    <div className="text-xs text-slate-600 italic mt-1">
                      <strong>Faculty Feedback:</strong> "{card.feedback || 'Completed with good effort.'}"
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">Evaluated by {card.facultyName} on {card.assessmentDate}</div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xl font-black text-navy-900">
                        {card.marksObtained} <span className="text-xs text-slate-400 font-normal">/ {card.maxMarks}</span>
                      </div>
                      <div className="text-xs font-bold text-teal-700">{card.percentage}%</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-black text-base border border-teal-200">
                      {card.letterGrade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* FACULTY & ADMIN WORKSPACE */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 9">Grade 9</option>
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing {assessments.length} Active Assessments
            </div>
          </div>

          {/* Assessment Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading subject assessments...
              </div>
            ) : assessments.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                No assessments found for {selectedGrade} {selectedSection}. Click "New Subject Assessment" to create one.
              </div>
            ) : (
              assessments.map((a) => {
                const isSelected = activeAssessment?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => handleOpenAssessmentDetail(a.id)}
                    className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-100">
                            {a.subject}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">{a.assessment_type}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-2">{a.title}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-navy-900">{a.max_marks} Max Marks</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{a.weightage}% Weight</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-medium">
                      {a.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-slate-500 font-medium">
                        Instructor: <strong className="text-slate-800">{a.faculty_name}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-teal-700">
                        <span>Class Avg: {a.averageScore}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ACTIVE ASSESSMENT MARKS ENTRY & EVALUATION MATRIX */}
          {activeAssessment && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    Interactive Marks Roster & Evaluation Grid
                  </div>
                  <h3 className="text-xl font-black text-navy-900 mt-0.5">
                    {activeAssessment.title} ({activeAssessment.grade} {activeAssessment.section} • {activeAssessment.subject})
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Max Score: {activeAssessment.max_marks} • Date: {activeAssessment.assessment_date} • Term: {activeAssessment.term} • Due: {activeAssessment.due_at ? new Date(activeAssessment.due_at).toLocaleString() : 'Not set'}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><label className="text-[10px] font-bold text-slate-600">Manage class deadline <input type="datetime-local" value={deadlineDraft} onChange={e => setDeadlineDraft(e.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs" /></label><button type="button" onClick={handleSaveDeadline} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-700">Save deadline</button></div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={exportMarksCsv}
                    className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
                  ><Download className="h-4 w-4" /> Download class marks CSV</button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssessment(activeAssessment.id)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                    title="Delete Assessment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={savingMarks}
                    onClick={handleSaveMarks}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {savingMarks ? 'Saving...' : 'Save & Publish Marks'}
                  </button>
                </div>
              </div>

              {/* Analytics Mini Dashboard */}
              {analytics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Class Average</div>
                    <div className="font-black text-navy-900 text-lg mt-0.5">{analytics.averageMarks} / {activeAssessment.max_marks}</div>
                    <div className="text-[10px] text-teal-700 font-bold">{analytics.averagePercentage}% Avg</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Highest Score</div>
                    <div className="font-black text-emerald-600 text-lg mt-0.5">{analytics.highestScore}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Top Performer</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Pass Rate</div>
                    <div className="font-black text-navy-900 text-lg mt-0.5">{analytics.passRate}%</div>
                    <div className="text-[10px] text-emerald-600 font-bold">Standard Met</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Roster Progress</div>
                    <div className="font-black text-navy-900 text-lg mt-0.5">{analytics.gradedCount} / {analytics.totalStudents}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Students Evaluated</div>
                  </div>
                </div>
              )}

              {/* Student Marks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Score (Max: {activeAssessment.max_marks})</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4">Submission file</th>
                      <th className="py-3 px-4">Question responses & marks</th>
                      <th className="py-3 px-4">Qualitative Rubric Feedback & Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {assessmentMarks.map((m) => {
                      const letter = calculateLetter(m.marks_obtained, Number(activeAssessment.max_marks));
                      return (
                        <tr key={m.student_id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{m.roll_no || '—'}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{m.student_name}</td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              max={activeAssessment.max_marks}
                              value={m.marks_obtained !== null && m.marks_obtained !== undefined ? m.marks_obtained : ''}
                              onChange={(e) => handleMarkChange(m.student_id, e.target.value)}
                              placeholder="0"
                              className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-center text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-4">
                            {assessmentSubmissions.find(s => s.student_id === m.student_id)?.file_name ? <button type="button" onClick={() => downloadAssessmentFile(activeAssessment.id, assessmentSubmissions.find(s => s.student_id === m.student_id).id)} className="inline-flex items-center gap-1 text-teal-700 hover:underline"><Download className="h-3.5 w-3.5" />{assessmentSubmissions.find(s => s.student_id === m.student_id).file_name}</button> : <span className="text-slate-400">{/quiz/i.test(activeAssessment.assessment_type) ? 'Quiz' : 'Not submitted'}</span>}
                          </td>
                          <td className="min-w-64 py-3 px-4">{activeAssessment.questions?.length && assessmentSubmissions.find(s => s.student_id === m.student_id)?.answers ? <details><summary className="cursor-pointer font-bold text-indigo-700">Review & score questions</summary><div className="mt-2 space-y-2">{activeAssessment.questions.map((question: any, index: number) => { const submission = assessmentSubmissions.find(s => s.student_id === m.student_id); const questionMark = m.question_marks?.[question.id]; return <div key={question.id} className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] font-bold text-slate-700">Q{index + 1} · {question.marks} marks</div><p className="mt-1 max-w-sm whitespace-pre-wrap text-[11px] text-slate-600">{submission.answers?.[question.id] || 'No response'}</p>{question.type !== 'MULTIPLE_CHOICE' && <label className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-600">Award <input type="number" min="0" max={question.marks} step="0.5" value={questionMark ?? ''} onChange={e => handleQuestionMarkChange(m.student_id, question.id, e.target.value)} className="w-14 rounded border border-slate-200 px-1.5 py-1 text-xs" /> / {question.marks}</label>}</div>; })}</div></details> : <span className="text-slate-400">—</span>}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block w-8 py-1 rounded font-black text-xs bg-slate-100 text-slate-800 border border-slate-200">
                              {letter}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={m.feedback || ''}
                              onChange={(e) => handleFeedbackChange(m.student_id, e.target.value)}
                              placeholder="Add constructive feedback / rubric remarks..."
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW ASSESSMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900 font-extrabold text-base">
                <BookOpen className="w-5 h-5 text-teal-600" />
                Create Subject Assessment
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  placeholder="e.g. Chemical Thermodynamics Unit Test"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="English Literature">English</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment Type</label>
                  <select
                    value={createForm.assessmentType}
                    onChange={(e) => setCreateForm({ ...createForm, assessmentType: e.target.value, questions: createForm.questions.map((q: any) => ({ ...q, type: /quiz/i.test(e.target.value) && q.type === 'ESSAY' ? 'MULTIPLE_CHOICE' : q.type })) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Mid-Term Exam">Mid-Term Exam</option>
                    <option value="Lab Practical">Lab Practical</option>
                    <option value="Project Assessment">Project Rubric</option>
                    <option value="Pop Quiz">Pop Quiz</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade</label>
                  <select
                    value={createForm.grade}
                    onChange={(e) => setCreateForm({ ...createForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 7">Grade 7</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section</label>
                  <select
                    value={createForm.section}
                    onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={createForm.maxMarks}
                    onChange={(e) => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700" htmlFor="assessment-deadline">Submission deadline</label>
                <input id="assessment-deadline" type="datetime-local" required value={createForm.dueAt} onChange={e => setCreateForm({ ...createForm, dueAt: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Reference files students can view</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Attach instructions, readings, or templates for this class.</p>
                  </div>
                  <div className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-extrabold text-teal-800">{createForm.attachments.length} {createForm.attachments.length === 1 ? 'file' : 'files'} · 5 MB max</div>
                </div>

                <label
                  onDragOver={e => { e.preventDefault(); setIsAttachmentDragging(true); }}
                  onDragLeave={e => { e.preventDefault(); setIsAttachmentDragging(false); }}
                  onDrop={e => { e.preventDefault(); setIsAttachmentDragging(false); handleAssessmentAttachments(e.dataTransfer.files); }}
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition ${isAttachmentDragging ? 'border-teal-500 bg-teal-50 ring-4 ring-teal-500/10' : 'border-slate-300 bg-slate-50/70 hover:border-teal-400 hover:bg-teal-50/50'}`}
                >
                  <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt" onChange={e => { handleAssessmentAttachments(e.target.files); e.currentTarget.value = ''; }} className="sr-only" />
                  <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-teal-700 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow"><UploadCloud className="h-5 w-5" /></span>
                  <span className="text-xs font-bold text-slate-800">Drop files here or <span className="text-teal-700 underline decoration-teal-300 underline-offset-2">browse files</span></span>
                  <span className="mt-1.5 text-[10px] text-slate-500">PDF, DOC/DOCX, PPT/PPTX, JPG/PNG, TXT · 5 MB combined</span>
                </label>

                {createForm.attachments.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {createForm.attachments.map((file: any, index: number) => {
                      const canPreview = file.type === 'application/pdf' || file.type?.startsWith('image/');
                      return <li key={`${file.name}-${index}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><FileImage className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-800">{file.name}</span><span className="mt-0.5 block text-[10px] text-slate-500">{formatFileSize(Number(file.size || 0))}</span></span>
                        {canPreview && <a href={file.data} target="_blank" rel="noreferrer" aria-label={`Preview ${file.name}`} title="Preview file" className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"><Eye className="h-4 w-4" /></a>}
                        <a href={file.data} download={file.name} aria-label={`Download ${file.name}`} title="Download file" className="rounded-lg p-2 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"><Download className="h-4 w-4" /></a>
                        <button type="button" onClick={() => setCreateForm(prev => ({ ...prev, attachments: prev.attachments.filter((_: any, i: number) => i !== index) }))} aria-label={`Remove ${file.name}`} title="Remove file" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button>
                      </li>;
                    })}
                  </ul>
                ) : <p className="mt-3 text-center text-[10px] text-slate-400">No reference files added yet.</p>}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between"><div><h3 className="font-extrabold text-slate-900">Question bank & marks</h3><p className="text-[10px] text-slate-500">Max marks are calculated from the question marks below.</p></div><button type="button" onClick={() => setCreateForm(prev => ({ ...prev, questions: [...prev.questions, { id: `q_${Date.now()}`, prompt: '', type: /quiz/i.test(prev.assessmentType) ? 'MULTIPLE_CHOICE' : 'ESSAY', language: 'javascript', marks: 1, options: ['', '', '', ''], correctAnswer: '' }] }))} className="rounded-lg bg-indigo-100 px-3 py-2 text-[11px] font-bold text-indigo-700">+ Add question</button></div>
                <div className="space-y-3">{createForm.questions.map((question: any, index: number) => <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="grid gap-2 sm:grid-cols-[1fr_160px_90px_auto]"><input value={question.prompt} onChange={e => setQuestion(index, 'prompt', e.target.value)} placeholder={`Question ${index + 1}`} className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800" /><select value={question.type} onChange={e => setQuestion(index, 'type', e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-800"><option value="ESSAY">Written response</option><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="CODE">Programming response</option></select><label className="flex items-center gap-1 text-[10px] font-bold text-slate-600"><input type="number" min="1" value={question.marks} onChange={e => setQuestion(index, 'marks', Number(e.target.value))} className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-xs" /> marks</label><button type="button" disabled={createForm.questions.length <= 1} onClick={() => setCreateForm(prev => ({ ...prev, questions: prev.questions.filter((_: any, i: number) => i !== index) }))} className="rounded-lg px-2 text-rose-600 disabled:opacity-30" aria-label="Remove question"><X className="h-4 w-4" /></button></div>{question.type === 'CODE' && <label className="mt-2 block text-[10px] font-bold text-slate-600">Programming language<select value={question.language || 'javascript'} onChange={e => setQuestion(index, 'language', e.target.value)} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option><option value="c">C</option></select></label>}{question.type === 'MULTIPLE_CHOICE' && <div className="mt-2 grid gap-2 sm:grid-cols-2">{question.options.map((option: string, oi: number) => <input key={oi} value={option} onChange={e => { const options = [...question.options]; options[oi] = e.target.value; setQuestion(index, 'options', options); }} placeholder={`Option ${oi + 1}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800" />)}<label className="text-[10px] font-bold text-slate-600 sm:col-span-2">Correct answer<select value={question.correctAnswer} onChange={e => setQuestion(index, 'correctAnswer', e.target.value)} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"><option value="">Choose correct option</option>{question.options.filter((option: string) => option.trim()).map((option: string, oi: number) => <option key={oi} value={option}>{option}</option>)}</select></label></div>}</div>)}</div>
                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-[11px] text-slate-700"><span className="font-extrabold text-teal-800">Total: {createForm.questions.reduce((sum: number, question: any) => sum + Number(question.marks || 0), 0)} marks</span><label className="flex items-center gap-2"><input type="checkbox" checked={createForm.settings.shuffleQuestions} onChange={e => setCreateForm(prev => ({ ...prev, settings: { ...prev.settings, shuffleQuestions: e.target.checked } }))} />Shuffle question order for each student</label><label className="flex items-center gap-1">Time limit <input type="number" min="1" max="240" value={createForm.settings.timeLimitMinutes} onChange={e => setCreateForm(prev => ({ ...prev, settings: { ...prev.settings, timeLimitMinutes: Number(e.target.value) } }))} className="w-14 rounded-lg border border-slate-200 px-2 py-1" /> min</label><label className="flex items-center gap-1">Allowed attempts <input type="number" min="1" max="5" value={createForm.settings.attemptsAllowed} onChange={e => setCreateForm(prev => ({ ...prev, settings: { ...prev.settings, attemptsAllowed: Number(e.target.value) } }))} className="w-12 rounded-lg border border-slate-200 px-2 py-1" /></label></div>
              </section>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Evaluation Rubric</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 placeholder:text-slate-400"
                  placeholder="Specify syllabus scope, question pattern, and grading criteria..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Publish assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

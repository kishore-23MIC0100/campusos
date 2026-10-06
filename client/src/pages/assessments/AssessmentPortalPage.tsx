import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, Clock3, Code2,
  Download, FileText, GraduationCap, Layers3, LockKeyhole, Play, Sparkles,
  TimerReset, Trophy, Upload, Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const readFile = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read the selected file.'));
  reader.readAsDataURL(file);
});

const remainingSeconds = (endsAt?: string) => endsAt ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)) : 0;

export const AssessmentPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [session, setSession] = useState<{ startedAt: string; endsAt: string } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'COMPLETED'>('ALL');

  const loadPortal = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const studentId = user.studentId || user.id;
      const [studentReport, detail] = await Promise.all([
        api.getStudentAssessments(studentId),
        assessmentId ? api.getAssessmentDetails(assessmentId) : Promise.resolve(null),
      ]);
      setReport(studentReport);
      if (detail) {
        setAssessment(detail.assessment);
        setSubmission(detail.submissions?.[0] || null);
      }
    } catch (err: any) {
      showToast(err.message || 'Could not load the assessment portal.', 'error');
      if (assessmentId) navigate('/assessment-portal', { replace: true });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPortal(); }, [user?.id, assessmentId]);

  useEffect(() => {
    if (!session?.endsAt) return;
    const tick = () => setSecondsLeft(remainingSeconds(session.endsAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session?.endsAt]);

  const assessments = report?.assessments || [];
  const openAssessments = assessments.filter((item: any) => {
    const attemptsUsed = Number(item.submission?.attemptCount || 0);
    const canAttempt = attemptsUsed < Number(item.attemptsAllowed || 1);
    const beforeDeadline = !item.dueAt || new Date(item.dueAt).getTime() >= Date.now();
    return canAttempt && beforeDeadline;
  });
  const filteredAssessments = useMemo(() => assessments.filter((item: any) => {
    const completed = Number(item.submission?.attemptCount || 0) >= Number(item.attemptsAllowed || 1);
    const expired = item.dueAt && new Date(item.dueAt).getTime() < Date.now();
    if (filter === 'OPEN') return !completed && !expired;
    if (filter === 'COMPLETED') return completed || Boolean(item.marksObtained !== null && item.marksObtained !== undefined);
    return true;
  }), [assessments, filter]);

  const isQuestionAssessment = Boolean(assessment?.questions?.length);
  const isRunning = Boolean(session?.startedAt && secondsLeft > 0);
  const dueDate = assessment?.due_at ? new Date(assessment.due_at) : null;

  const beginAssessment = async () => {
    if (!assessment) return;
    setStarting(true);
    try {
      const active = await api.startAssessment(assessment.id);
      setSession(active);
      setSecondsLeft(remainingSeconds(active.endsAt));
    } catch (err: any) { showToast(err.message || 'Could not start this assessment.', 'error'); }
    finally { setStarting(false); }
  };

  const submitAssessment = async () => {
    if (!assessment) return;
    if (isQuestionAssessment && !session) { showToast('Start the assessment before submitting answers.', 'error'); return; }
    if (isQuestionAssessment && assessment.questions.some((question: any) => !String(answers[question.id] || '').trim())) {
      showToast('Answer every question before submitting.', 'error'); return;
    }
    if (!isQuestionAssessment && !file) { showToast('Choose your completion file first.', 'error'); return; }
    setSubmitting(true);
    try {
      const encoded = file ? await readFile(file) : undefined;
      await api.submitAssessment(assessment.id, {
        ...(file ? { file: { name: file.name, type: file.type || 'application/octet-stream', data: encoded! } } : {}),
        answers,
      });
      showToast('Your work was submitted successfully.', 'success');
      navigate('/assessment-portal', { replace: true });
    } catch (err: any) { showToast(err.message || 'Submission failed.', 'error'); }
    finally { setSubmitting(false); }
  };

  const secondsLabel = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f6f9ff]"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm"><span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />Preparing your assessment space…</div></div>;

  if (assessmentId && assessment) {
    const questions = assessment.questions || [];
    const submitted = Boolean(submission && Number(submission.attempt_count || 1) >= Number(assessment.settings?.attemptsAllowed || 1));
    const deadlinePassed = dueDate && dueDate.getTime() < Date.now();
    return <main className="min-h-screen bg-[#f6f9ff] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link to="/assessment-portal" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-700"><ArrowLeft className="h-4 w-4" /> Assessment portal</Link><div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-extrabold text-indigo-700"><LockKeyhole className="h-3.5 w-3.5" /> Secure student workspace</div></div></header>
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br from-[#e8f5ff] via-white to-[#f1edff] p-7 shadow-[0_24px_80px_rgba(69,95,160,0.12)] sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> {assessment.subject} · {assessment.assessment_type}</span><h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{assessment.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{assessment.description || 'Complete each prompt carefully and submit your work before the class deadline.'}</p></div>
            <div className="portal-float relative mx-auto hidden h-36 w-36 items-center justify-center rounded-[2rem] border border-white/90 bg-white/70 shadow-[0_22px_44px_rgba(56,90,160,0.16)] [transform:perspective(700px)_rotateY(-12deg)_rotateX(8deg)] sm:flex"><div className="absolute inset-3 rounded-[1.5rem] bg-gradient-to-br from-cyan-100 via-white to-indigo-100" /><GraduationCap className="relative h-14 w-14 text-indigo-600 drop-shadow" /><span className="absolute -right-3 -top-3 rounded-xl bg-amber-300 p-2 text-amber-900 shadow-lg"><Zap className="h-4 w-4" /></span></div>
          </div>
          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white bg-white/75 p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Maximum score</div><div className="mt-1 text-xl font-black text-slate-900">{assessment.max_marks} <span className="text-xs font-semibold text-slate-500">marks</span></div></div><div className="rounded-2xl border border-white bg-white/75 p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Questions</div><div className="mt-1 text-xl font-black text-slate-900">{questions.length || 'File task'} <span className="text-xs font-semibold text-slate-500">{questions.length ? `· ${assessment.settings?.timeLimitMinutes || 30} min` : '· upload work'}</span></div></div><div className="rounded-2xl border border-white bg-white/75 p-4"><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Deadline</div><div className="mt-1 text-sm font-extrabold text-slate-900">{dueDate ? dueDate.toLocaleString() : 'No deadline set'}</div></div></div>
        </section>

        {assessment.attachments?.length > 0 && <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-900">Reference material</h2><div className="mt-3 flex flex-wrap gap-2">{assessment.attachments.map((attachment: any, index: number) => <a key={index} href={attachment.data} download={attachment.name} className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-800 transition hover:bg-indigo-100"><Download className="h-4 w-4" />{attachment.name}</a>)}</div></section>}

        {submitted || deadlinePassed ? <section className="mt-6 flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 className="h-8 w-8 text-emerald-600" /><div><h2 className="font-extrabold text-slate-900">{submitted ? 'Assessment submitted' : 'Assessment closed'}</h2><p className="mt-1 text-sm text-slate-600">{submitted ? 'Your response is recorded. You can return to the portal to review your assessment list.' : 'The faculty deadline has passed.'}</p></div><Link to="/assessment-portal" className="ml-auto rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white">Back to portal</Link></section> : <>
          {isQuestionAssessment && !session && <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-white p-6 shadow-[0_18px_50px_rgba(66,88,150,0.09)] sm:flex-row sm:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200"><Play className="ml-0.5 h-5 w-5 fill-current" /></div><div className="flex-1"><h2 className="font-extrabold text-slate-900">Ready to begin?</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Starting begins your {assessment.settings?.timeLimitMinutes || 30}-minute timer. You have {assessment.settings?.attemptsAllowed || 1} allowed attempt{Number(assessment.settings?.attemptsAllowed || 1) === 1 ? '' : 's'}.</p></div><button type="button" onClick={beginAssessment} disabled={starting} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 disabled:opacity-60">{starting ? 'Opening assessment…' : 'Begin assessment'} <ArrowRight className="ml-2 inline h-4 w-4" /></button></section>}

          {isQuestionAssessment && session && <>
            <div className="sticky top-[65px] z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-white/95 px-4 py-3 shadow-lg shadow-indigo-100/50 backdrop-blur"><div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Layers3 className="h-4 w-4 text-indigo-600" /> {questions.length} questions · {questions.reduce((total: number, question: any) => total + Number(question.marks || 0), 0)} marks</div><div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-sm font-black ${secondsLeft < 60 ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-800'}`}><TimerReset className="h-4 w-4" />{secondsLabel}</div></div>
            {secondsLeft === 0 && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"><span>Your timed attempt has expired. Return to the assessment list to see whether another attempt is available.</span><Link to="/assessment-portal" className="font-extrabold underline">Return to assessment list</Link></div>}
            <section className="mt-5 space-y-4">{questions.map((question: any, index: number) => <article key={question.id} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-7"><div className="mb-4 flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-xs font-black text-indigo-700">{String(index + 1).padStart(2, '0')}</span><div><span className="text-[9px] font-black uppercase tracking-[0.14em] text-indigo-600">{question.type === 'CODE' ? `${question.language || 'Code'} challenge` : question.type === 'MULTIPLE_CHOICE' ? 'Multiple choice' : 'Written response'}</span><h2 className="mt-1 text-sm font-extrabold leading-6 text-slate-900 sm:text-base">{question.prompt}</h2></div></div><span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold text-amber-800">{question.marks} pts</span></div>
              {question.type === 'MULTIPLE_CHOICE' ? <div className="grid gap-2 sm:grid-cols-2">{(question.options || []).map((option: string, optionIndex: number) => <label key={optionIndex} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${answers[question.id] === option ? 'border-indigo-300 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50'}`}><input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => setAnswers(previous => ({ ...previous, [question.id]: option }))} className="accent-indigo-600" /><span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[10px] font-black text-slate-500">{String.fromCharCode(65 + optionIndex)}</span>{option}</label>)}</div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#f8faff]"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2"><span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-600">{question.type === 'CODE' ? <Code2 className="h-4 w-4 text-indigo-600" /> : <FileText className="h-4 w-4 text-teal-600" />}{question.type === 'CODE' ? question.language || 'Code editor' : 'Your response'}</span>{question.type === 'CODE' && <span className="font-mono text-[10px] text-slate-400">student-answer.{question.language === 'python' ? 'py' : question.language === 'java' ? 'java' : question.language === 'cpp' ? 'cpp' : 'js'}</span>}</div><textarea rows={question.type === 'CODE' ? 10 : 5} spellCheck={question.type !== 'CODE'} value={answers[question.id] || ''} onChange={event => setAnswers(previous => ({ ...previous, [question.id]: event.target.value }))} placeholder={question.type === 'CODE' ? `// Write your ${question.language || 'program'} solution here…` : 'Write your response here…'} className={`w-full resize-y bg-transparent p-4 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 ${question.type === 'CODE' ? 'font-mono text-[13px]' : ''}`} /></div>}
            </article>)}</section>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Your answers are submitted once. Check every response before you finish.</p><button type="button" onClick={submitAssessment} disabled={!isRunning || submitting} className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-teal-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit assessment'} <CheckCircle2 className="ml-2 inline h-4 w-4" /></button></div>
          </>}

          {!isQuestionAssessment && <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-extrabold text-slate-900">Upload your completed work</h2><p className="mt-1 text-xs text-slate-500">PDF, DOCX, PPTX, image, or text file · up to 5 MB.</p><label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40"><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt" onChange={event => setFile(event.target.files?.[0] || null)} className="sr-only" /><Upload className="h-8 w-8 text-teal-600" /><span className="mt-3 text-sm font-bold text-slate-800">{file?.name || 'Choose your completion file'}</span><span className="mt-1 text-xs text-slate-500">Click to browse your device</span></label><button type="button" onClick={submitAssessment} disabled={!file || submitting} className="mt-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 text-xs font-extrabold text-white disabled:opacity-50">{submitting ? 'Uploading…' : 'Submit work'} <ArrowRight className="ml-2 inline h-4 w-4" /></button></section>}
        </>}
      </div>
    </main>;
  }

  const completedCount = assessments.filter((item: any) => item.submission || item.marksObtained !== null && item.marksObtained !== undefined).length;
  return <main className="min-h-screen overflow-hidden bg-[#f6f9ff] text-slate-900">
    <header className="relative z-10 border-b border-white/80 bg-white/80 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link to="/dashboard" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-200"><GraduationCap className="h-5 w-5" /></span><span><span className="block text-sm font-black text-slate-900">CampusOS</span><span className="block text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">Assessment portal</span></span></Link><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><div className="text-xs font-extrabold text-slate-800">{user?.fullName}</div><div className="text-[10px] font-semibold text-slate-500">Student workspace</div></div><Link to="/assessments" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">My results</Link></div></div></header>

    <div className="mx-auto max-w-7xl px-5 pb-16 pt-7 sm:pt-10">
      <section className="portal-hero relative overflow-hidden rounded-[2.2rem] border border-white bg-gradient-to-br from-[#e7f6ff] via-[#f4f7ff] to-[#f5efff] px-6 py-8 shadow-[0_30px_90px_rgba(73,101,165,0.13)] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-36 h-[28rem] w-[28rem] rounded-full bg-cyan-200/60 blur-3xl" /><div className="pointer-events-none absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl" />
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Your focus zone</span><h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl">Think clearly.<br /><span className="bg-gradient-to-r from-indigo-700 via-violet-600 to-cyan-600 bg-clip-text text-transparent">Show what you know.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">A calm, focused space for quizzes, coding challenges, and class assessments. Your next challenge is ready when you are.</p><div className="mt-6 flex flex-wrap gap-3"><a href="#assigned-assessments" className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5">Explore assessments <ArrowRight className="ml-2 inline h-4 w-4" /></a><span className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/70 px-4 py-3 text-xs font-bold text-slate-600"><LockKeyhole className="h-4 w-4 text-teal-600" /> Private to your class</span></div></div>
          <div className="relative mx-auto flex h-60 w-full max-w-md items-center justify-center [perspective:1000px] sm:h-72"><div className="portal-orbit absolute h-52 w-52 rounded-full border border-indigo-200/70 sm:h-64 sm:w-64" /><div className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-white/90 to-indigo-100/70 shadow-[inset_-16px_-18px_35px_rgba(87,101,189,0.16),0_30px_60px_rgba(67,89,162,0.17)] sm:h-48 sm:w-48" /><div className="portal-float relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white bg-white/80 shadow-[0_24px_50px_rgba(65,86,153,0.22)] [transform:rotateX(12deg)_rotateY(-14deg)] sm:h-36 sm:w-36"><BookOpen className="h-14 w-14 text-indigo-600 drop-shadow" /><span className="absolute -right-4 top-2 rounded-xl bg-amber-300 p-2 text-amber-900 shadow-lg"><Zap className="h-4 w-4" /></span><span className="absolute -bottom-3 -left-4 rounded-xl bg-teal-500 p-2 text-white shadow-lg"><Code2 className="h-4 w-4" /></span></div><div className="absolute right-7 top-8 rounded-xl border border-white bg-white/85 px-3 py-2 text-[10px] font-extrabold text-indigo-700 shadow-lg">FOCUS MODE</div><div className="absolute bottom-5 left-4 rounded-xl border border-white bg-white/85 px-3 py-2 text-[10px] font-extrabold text-teal-700 shadow-lg">READY TO LEARN</div></div>
        </div>
        <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white bg-white/70 p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500"><BookOpen className="h-4 w-4 text-indigo-600" /> Assigned</div><div className="mt-2 text-2xl font-black text-slate-900">{assessments.length}</div></div><div className="rounded-2xl border border-white bg-white/70 p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed</div><div className="mt-2 text-2xl font-black text-slate-900">{completedCount}</div></div><div className="rounded-2xl border border-white bg-white/70 p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500"><Clock3 className="h-4 w-4 text-amber-600" /> Ready to take</div><div className="mt-2 text-2xl font-black text-slate-900">{openAssessments.length}</div></div></div>
      </section>

      <section id="assigned-assessments" className="mt-10 scroll-mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">Your class</div><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Assessment library</h2><p className="mt-1 text-sm text-slate-500">Choose an open assessment to enter its dedicated workspace.</p></div><div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">{(['ALL', 'OPEN', 'COMPLETED'] as const).map(option => <button type="button" key={option} onClick={() => setFilter(option)} className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${filter === option ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>{option === 'ALL' ? 'All' : option === 'OPEN' ? 'Open' : 'Completed'}</button>)}</div></div>
        {filteredAssessments.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Trophy className="h-7 w-7" /></div><h3 className="mt-4 font-extrabold text-slate-900">Nothing here yet</h3><p className="mt-1 text-sm text-slate-500">Your faculty’s class assessments will appear here when they are published.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredAssessments.map((item: any, index: number) => {
          const attemptCount = Number(item.submission?.attemptCount || 0);
          const attemptsAllowed = Number(item.attemptsAllowed || 1);
          const completed = attemptCount >= attemptsAllowed;
          const expired = item.dueAt && new Date(item.dueAt).getTime() < Date.now();
          const codeChallenge = item.questions?.some((question: any) => question.type === 'CODE');
          const Icon = codeChallenge ? Code2 : /quiz/i.test(item.assessmentType) ? Zap : FileText;
          return <article key={item.assessmentId} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_20px_45px_rgba(69,86,143,0.14)]" style={{ animationDelay: `${index * 70}ms` }}><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500 opacity-80" /><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-indigo-700"><Icon className="h-5 w-5" /></span><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${completed ? 'bg-emerald-50 text-emerald-700' : expired ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>{completed ? 'Completed' : expired ? 'Closed' : 'Open'}</span></div><div className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-indigo-600">{item.subject} · {item.assessmentType}</div><h3 className="mt-1 text-lg font-black leading-snug text-slate-900">{item.title}</h3><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{item.description || 'Open the workspace to view instructions and complete your assessment.'}</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><span className="block text-[9px] font-bold uppercase text-slate-400">Score</span><span className="mt-1 block text-xs font-extrabold text-slate-800">{item.maxMarks} marks</span></div><div className="rounded-xl bg-slate-50 p-3"><span className="block text-[9px] font-bold uppercase text-slate-400">Due date</span><span className="mt-1 block truncate text-xs font-extrabold text-slate-800">{item.dueAt ? new Date(item.dueAt).toLocaleDateString() : 'No deadline'}</span></div></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-[10px] font-semibold text-slate-500">{item.questions?.length ? `${item.questions.length} questions` : 'File submission'} · {attemptCount}/{attemptsAllowed} attempts</span>{!completed && !expired ? <Link to={`/assessment-portal/${item.assessmentId}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[10px] font-extrabold text-white shadow-md shadow-indigo-100 transition group-hover:-translate-y-0.5">Take test <ArrowRight className="h-3.5 w-3.5" /></Link> : <Link to={`/assessment-portal/${item.assessmentId}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700">View details <ArrowRight className="h-3.5 w-3.5" /></Link>}</div></article>;
        })}</div>}
      </section>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-[10px] font-semibold text-slate-400"><span>CampusOS Assessment Portal · Your work is saved securely</span><span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-teal-600" /> Student-only access</span></footer>
    </div>
    <style>{`@keyframes portal-float { 0%,100% { transform: translateY(0) rotateX(12deg) rotateY(-14deg); } 50% { transform: translateY(-10px) rotateX(15deg) rotateY(-10deg); } } @keyframes portal-orbit { from { transform: rotate(0deg) scaleY(.42); } to { transform: rotate(360deg) scaleY(.42); } } .portal-float { animation: portal-float 5s ease-in-out infinite; } .portal-orbit { animation: portal-orbit 18s linear infinite; } @media (prefers-reduced-motion: reduce) { .portal-float,.portal-orbit { animation: none; } }`}</style>
  </main>;
};

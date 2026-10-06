import express from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getTeacherAllotments } from './auth.js';

const router = express.Router();

function calculateGrade(score: number, max: number): string {
  if (max <= 0) return 'N/A';
  const percentage = (score / max) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
}

function parseJson(value: any, fallback: any = []) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function findStudentForUser(db: any, user: any) {
  const students = db.prepare('SELECT * FROM students').all() as any[];
  return students.find(student => student.user_id === user?.id)
    || students.find(student => student.student_id && student.student_id === user?.studentId)
    || students.find(student => student.id === user?.studentId);
}

function studentIdentifiers(student: any, user?: any) {
  return new Set([student?.id, student?.user_id, student?.student_id, user?.id, user?.studentId].filter(Boolean).map(String));
}

// 1. Get All Assessments (Filter by grade, section, subject, faculty)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    if (!['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'You cannot browse assessment rosters.' });
    const { grade, section, subject, facultyId, term, search } = req.query;
    let list = db.prepare('SELECT * FROM assessments').all() as any[];

    if (req.user?.role === 'STUDENT') {
      const student = findStudentForUser(db, req.user);
      if (!student) return res.json({ assessments: [] });
      list = list.filter(a => a.grade === student.grade && a.section === student.section);
    } else if (req.user?.role === 'TEACHER') {
      list = list.filter(a => a.faculty_id === req.user!.id);
    }

    if (grade) {
      list = list.filter(a => a.grade === grade);
    }
    if (section) {
      list = list.filter(a => a.section === section);
    }
    if (subject) {
      list = list.filter(a => (a.subject || '').toLowerCase() === String(subject).toLowerCase());
    }
    if (facultyId) {
      list = list.filter(a => a.faculty_id === facultyId || a.faculty_email === facultyId);
    }
    if (term) {
      list = list.filter(a => a.term === term);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        a =>
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.subject && a.subject.toLowerCase().includes(q)) ||
          (a.faculty_name && a.faculty_name.toLowerCase().includes(q))
      );
    }

    // Attach student submission/mark count for each assessment
    const allMarks = db.prepare('SELECT * FROM assessment_marks').all() as any[];
    const enriched = list.map(a => {
      const marksForAssessment = allMarks.filter(m => m.assessment_id === a.id);
      const gradedCount = marksForAssessment.filter(m => m.marks_obtained !== null && m.marks_obtained !== undefined).length;
      const totalStudents = marksForAssessment.length;
      const scores = marksForAssessment
        .filter(m => m.marks_obtained !== null && !isNaN(Number(m.marks_obtained)))
        .map(m => Number(m.marks_obtained));

      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;

      return {
        ...a,
        questions: req.user?.role === 'STUDENT'
          ? parseJson(a.questions).map((q: any) => ({ id: q.id, prompt: q.prompt, type: q.type, marks: q.marks, options: q.options, language: q.language }))
          : parseJson(a.questions),
        attachments: parseJson(a.attachments),
        settings: parseJson(a.settings, {}),
        totalStudents,
        gradedCount,
        averageScore: Number(avg),
        highestScore: highest,
        lowestScore: lowest,
      };
    });

    res.json({ assessments: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Assessment Details with Student Marks and Analytics
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const assessment = (db.prepare('SELECT * FROM assessments').all() as any[]).find(a => a.id === id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    if (req.user!.role === 'TEACHER' && assessment.faculty_id !== req.user!.id) return res.status(403).json({ error: 'This assessment is assigned to another faculty member.' });
    if (req.user!.role === 'STUDENT') {
      const student = findStudentForUser(db, req.user);
      if (!student || student.grade !== assessment.grade || student.section !== assessment.section) return res.status(403).json({ error: 'This assessment is not assigned to your class.' });
    } else if (!['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'You cannot view this assessment.' });

    const marks = (db.prepare('SELECT * FROM assessment_marks').all() as any[]).filter(
      m => m.assessment_id === id
    );
    const allSubmissions = (db as any).data.assessment_submissions || [];
    const submissions = allSubmissions.filter((s: any) => s.assessment_id === id);
    const isStudent = req.user?.role === 'STUDENT';
    const student = isStudent ? findStudentForUser(db, req.user) : undefined;
    const studentIds = studentIdentifiers(student, req.user);
    const assessmentWithSettings = { ...assessment, questions: [...parseJson(assessment.questions)], attachments: parseJson(assessment.attachments), settings: parseJson(assessment.settings, {}) };
    if (isStudent && assessmentWithSettings.settings.shuffleQuestions !== false) {
      for (let i = assessmentWithSettings.questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [assessmentWithSettings.questions[i], assessmentWithSettings.questions[j]] = [assessmentWithSettings.questions[j], assessmentWithSettings.questions[i]];
      }
    }
    const safeAssessment = isStudent ? { ...assessmentWithSettings, questions: assessmentWithSettings.questions.map((q: any) => ({ id: q.id, prompt: q.prompt, type: q.type, marks: q.marks, options: q.options, language: q.language })) } : assessmentWithSettings;

    const validScores = marks
      .filter(m => m.marks_obtained !== null && !isNaN(Number(m.marks_obtained)))
      .map(m => Number(m.marks_obtained));

    const maxMarks = Number(assessment.max_marks) || 100;
    const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
    const highest = validScores.length > 0 ? Math.max(...validScores) : 0;
    const lowest = validScores.length > 0 ? Math.min(...validScores) : 0;
    const passCount = validScores.filter(s => (s / maxMarks) >= 0.4).length;
    const passRate = validScores.length > 0 ? Math.round((passCount / validScores.length) * 100) : 0;

    const gradeDistribution: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'F': 0 };
    marks.forEach(m => {
      const g = m.grade || calculateGrade(Number(m.marks_obtained), maxMarks);
      if (gradeDistribution[g] !== undefined) gradeDistribution[g]++;
    });

    res.json({
      assessment: safeAssessment,
      marks: isStudent ? marks.filter((m: any) => studentIds.has(String(m.student_id))) : marks,
      submissions: (isStudent ? submissions.filter((s: any) => studentIds.has(String(s.student_id))) : submissions).map((s: any) => ({ ...s, file_data: undefined })),
      analytics: {
        totalStudents: marks.length,
        gradedCount: validScores.length,
        averageMarks: Number(avg.toFixed(1)),
        averagePercentage: Number(((avg / maxMarks) * 100).toFixed(1)),
        highestScore: highest,
        lowestScore: lowest,
        passRate,
        gradeDistribution,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Assessment by Subject Faculty
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const {
      title, assessmentType = 'Unit Test', grade, section, subject,
      maxMarks = 100, weightage = 20, assessmentDate, term = 'Term 1',
      description, facultyId, facultyName, dueAt, questions = [], attachments = [], settings = {}
    } = req.body;

    if (!title || !grade || !section || !subject) {
      return res.status(400).json({ error: 'Title, grade, section, and subject are required' });
    }
    if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) return res.status(400).json({ error: 'A valid submission deadline is required.' });
    if (/quiz/i.test(assessmentType) && (!Array.isArray(questions) || questions.length === 0)) return res.status(400).json({ error: 'A quiz needs at least one question.' });

    const id = `asm_${Date.now()}`;
    const user = (req as any).user || {};

    if (!['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)) return res.status(403).json({ error: 'Only faculty can publish assessments.' });
    if (user.role === 'TEACHER') {
      const allotments = getTeacherAllotments(user.id, db);
      const classAllowed = allotments.allottedClasses.some((c: any) => c.grade.toLowerCase() === String(grade).toLowerCase() && c.section.toLowerCase() === String(section).toLowerCase());
      const subjectAllowed = !allotments.allottedSubjects.length || allotments.allottedSubjects.some((s: string) => s.toLowerCase() === String(subject).toLowerCase());
      if (!classAllowed || !subjectAllowed) return res.status(403).json({ error: 'This class or subject is outside your teaching allotment.' });
    }
    const points = Array.isArray(questions) ? questions.reduce((sum: number, q: any) => sum + Number(q.marks || 0), 0) : 0;
    if (points && Math.abs(points - Number(maxMarks)) > 0.001) return res.status(400).json({ error: `Question marks total ${points}, but maximum marks is ${maxMarks}.` });
    if (Array.isArray(questions) && questions.some((q: any) => !q.prompt?.trim() || Number(q.marks) <= 0 || (q.type === 'MULTIPLE_CHOICE' && (q.options?.filter((o: string) => o.trim()).length < 2 || !q.options.includes(q.correctAnswer))))) return res.status(400).json({ error: 'Each question needs a prompt and positive marks. Multiple choice questions need at least two options and a correct answer.' });

    const newAssessment = {
      id,
      title,
      assessment_type: assessmentType,
      grade,
      section,
      subject,
      max_marks: Number(maxMarks) || 100,
      weightage: Number(weightage) || 20,
      assessment_date: assessmentDate || new Date().toISOString().split('T')[0],
      term,
      description: description || 'Comprehensive subject evaluation and rubric grading.',
      due_at: dueAt || null,
      questions: JSON.stringify(Array.isArray(questions) ? questions : []),
      attachments: JSON.stringify(Array.isArray(attachments) ? attachments : []),
      settings: JSON.stringify(settings || {}),
      faculty_id: user.role === 'TEACHER' ? user.id : (facultyId || user.id || 'usr_teacher_1'),
      faculty_name: facultyName || user.fullName || 'Subject Faculty Lead',
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
    };

    const assessmentsTable = (db as any).data.assessments || [];
    assessmentsTable.push(newAssessment);

    // Auto-generate student marks roster for the enrolled students in that grade & section
    const students = (db.prepare('SELECT * FROM students').all() as any[]).filter(
      s => s.grade === grade && s.section === section
    );

    const marksTable = (db as any).data.assessment_marks || [];
    students.forEach((st, idx) => {
      marksTable.push({
        id: `mrk_${id}_${st.id}`,
        assessment_id: id,
        student_id: st.id,
        student_name: st.full_name || st.name,
        roll_no: st.roll_no || (idx + 1),
        marks_obtained: null,
        question_marks: '{}',
        max_marks: Number(maxMarks) || 100,
        grade: null,
        feedback: '',
        evaluated_at: null,
        evaluated_by: newAssessment.faculty_name,
        created_at: new Date().toISOString(),
      });
    });

    (db as any).scheduleSave();
    res.status(201).json({ success: true, assessment: newAssessment, enrolledCount: students.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Batch Save / Update Marks for Students in an Assessment
router.post('/:id/marks', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { marksList } = req.body; // Array of { studentId, marksObtained, feedback }

    if (!Array.isArray(marksList)) {
      return res.status(400).json({ error: 'marksList must be an array' });
    }

    const assessment = (db.prepare('SELECT * FROM assessments').all() as any[]).find(a => a.id === id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    if (!['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Only faculty can grade assessments.' });
    if (req.user!.role === 'TEACHER' && assessment.faculty_id !== req.user!.id) return res.status(403).json({ error: 'Only the assigned faculty can grade this assessment.' });

    const maxMarks = Number(assessment.max_marks) || 100;
    const marksTable = (db as any).data.assessment_marks || [];
    const user = (req as any).user || {};
    const now = new Date().toISOString();

    marksList.forEach(entry => {
      const studentId = entry.studentId || entry.student_id;
      let target = marksTable.find((m: any) => m.assessment_id === id && m.student_id === studentId);

      const score = entry.marksObtained !== null && entry.marksObtained !== undefined ? Number(entry.marksObtained) : null;
      if (score !== null && (score < 0 || score > maxMarks)) throw new Error(`Marks for ${studentId} must be between 0 and ${maxMarks}.`);
      const questionMarks = entry.questionMarks !== undefined ? entry.questionMarks : undefined;
      if (questionMarks !== undefined) {
        const configuredQuestions = parseJson(assessment.questions);
        const invalid = configuredQuestions.some((q: any) => Number(questionMarks[q.id] || 0) < 0 || Number(questionMarks[q.id] || 0) > Number(q.marks || maxMarks));
        if (invalid) throw new Error('A question score cannot exceed that question’s available marks.');
      }
      const calculatedG = score !== null ? calculateGrade(score, maxMarks) : null;

      if (target) {
        target.marks_obtained = score;
        if (questionMarks !== undefined) target.question_marks = JSON.stringify(questionMarks);
        target.grade = calculatedG;
        if (entry.feedback !== undefined) target.feedback = entry.feedback;
        target.evaluated_at = now;
        target.evaluated_by = user.fullName || assessment.faculty_name;
        target.updated_at = now;
      } else {
        marksTable.push({
          id: `mrk_${id}_${studentId}`,
          assessment_id: id,
          student_id: studentId,
          student_name: entry.studentName || entry.student_name || 'Student',
          roll_no: entry.rollNo || entry.roll_no || 1,
          marks_obtained: score,
          question_marks: JSON.stringify(questionMarks || {}),
          max_marks: maxMarks,
          grade: calculatedG,
          feedback: entry.feedback || '',
          evaluated_at: now,
          evaluated_by: user.fullName || assessment.faculty_name,
          created_at: now,
        });
      }
    });

    (db as any).scheduleSave();
    res.json({ success: true, message: `Updated marks for ${marksList.length} students.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/deadline', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const assessment = (db.prepare('SELECT * FROM assessments').all() as any[]).find(a => a.id === req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
    if (!['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Only faculty can manage assessment deadlines.' });
    if (req.user!.role === 'TEACHER' && assessment.faculty_id !== req.user!.id) return res.status(403).json({ error: 'Only the assigned faculty can manage this deadline.' });
    const deadline = new Date(req.body?.dueAt || '');
    if (Number.isNaN(deadline.getTime())) return res.status(400).json({ error: 'Enter a valid deadline.' });
    assessment.due_at = deadline.toISOString();
    (db as any).scheduleSave();
    res.json({ success: true, dueAt: assessment.due_at });
  } catch (err: any) { res.status(500).json({ error: err.message || 'Could not update deadline.' }); }
});

router.post('/:id/start', authMiddleware, (req, res) => {
  try {
    if (req.user?.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can start an assessment.' });
    const db = getDb();
    const assessment = (db.prepare('SELECT * FROM assessments').all() as any[]).find(a => a.id === req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
    if (!parseJson(assessment.questions).length) return res.status(400).json({ error: 'This assessment uses file submission and does not need a timed session.' });
    const student = findStudentForUser(db, req.user);
    const studentId = student?.id;
    if (!student || student.grade !== assessment.grade || student.section !== assessment.section) return res.status(403).json({ error: 'This assessment is not assigned to your class.' });
    const now = Date.now();
    if (assessment.due_at && now > new Date(assessment.due_at).getTime()) return res.status(403).json({ error: 'The submission deadline has passed.' });
    const submissions = (db as any).data.assessment_submissions || ((db as any).data.assessment_submissions = []);
    const studentIds = studentIdentifiers(student, req.user);
    let previous = submissions.find((s: any) => s.assessment_id === assessment.id && studentIds.has(String(s.student_id)));
    const attemptsAllowed = Number(parseJson(assessment.settings, {}).attemptsAllowed || 1);
    if (Number(previous?.attempt_count || 0) >= attemptsAllowed) return res.status(403).json({ error: `You have used all ${attemptsAllowed} allowed attempts.` });
    const sessions = (db as any).data.assessment_sessions || ((db as any).data.assessment_sessions = []);
    const current = sessions.find((session: any) => session.assessment_id === assessment.id && studentIds.has(String(session.student_id)) && !session.completed_at);
    if (current && now <= new Date(current.ends_at).getTime()) return res.json({ startedAt: current.started_at, endsAt: current.ends_at });
    if (current) {
      current.completed_at = new Date(now).toISOString();
      const attemptsUsed = Number(previous?.attempt_count || 0) + 1;
      const timeoutRecord = { id: `asub_${Date.now()}_${studentId}`, assessment_id: assessment.id, student_id: studentId, student_name: req.user.fullName, file_name: '', file_type: '', file_data: '', answers: {}, notes: 'Time limit expired.', submitted_at: current.completed_at, status: 'TIMED_OUT', attempt_count: attemptsUsed };
      const previousIndex = submissions.findIndex((s: any) => s.assessment_id === assessment.id && studentIds.has(String(s.student_id)));
      if (previousIndex >= 0) submissions[previousIndex] = timeoutRecord; else submissions.push(timeoutRecord);
      previous = timeoutRecord;
      if (attemptsUsed >= attemptsAllowed) { (db as any).scheduleSave(); return res.status(403).json({ error: `Assessment time expired. You have used all ${attemptsAllowed} allowed attempts.` }); }
    }
    const limit = Math.max(1, Number(parseJson(assessment.settings, {}).timeLimitMinutes || 30));
    const endsAt = new Date(now + limit * 60000).toISOString();
    const session = { id: `ases_${Date.now()}_${studentId}`, assessment_id: assessment.id, student_id: studentId, started_at: new Date(now).toISOString(), ends_at: endsAt, completed_at: null };
    sessions.push(session);
    (db as any).scheduleSave();
    res.json({ startedAt: session.started_at, endsAt });
  } catch (err: any) { res.status(500).json({ error: err.message || 'Could not start the assessment.' }); }
});

// Student file submission for assignments and open-response assessments.
router.post('/:id/submit', authMiddleware, (req, res) => {
  try {
    if (req.user?.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can submit assessment work.' });
    const db = getDb();
    const assessment = (db.prepare('SELECT * FROM assessments').all() as any[]).find(a => a.id === req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
    const student = findStudentForUser(db, req.user);
    const studentId = student?.id;
    if (!student || student.grade !== assessment.grade || student.section !== assessment.section) return res.status(403).json({ error: 'This assessment is not assigned to your class.' });
    const now = new Date();
    if (assessment.due_at && now.getTime() > new Date(assessment.due_at).getTime()) return res.status(403).json({ error: 'The submission deadline has passed.' });
    const { file, answers = {}, notes = '' } = req.body || {};
    const questions = parseJson(assessment.questions);
    const isQuestionAssessment = questions.length > 0;
    if ((!file?.name || !file?.data || !file?.type) && !isQuestionAssessment) return res.status(400).json({ error: 'Choose a completion file to submit.' });
    if (isQuestionAssessment && questions.some((q: any) => !String(answers[q.id] || '').trim())) return res.status(400).json({ error: 'Answer every question before submitting.' });
    if (file?.data && String(file.data).length > 7_000_000) return res.status(413).json({ error: 'File is too large. Maximum upload size is 5 MB.' });
    let autoScore: number | null = null;
    let autoQuestionMarks: Record<string, number> = {};
    if (isQuestionAssessment) {
      if (questions.length && questions.every((q: any) => q.type === 'MULTIPLE_CHOICE')) {
        autoQuestionMarks = Object.fromEntries(questions.map((q: any) => [q.id, answers[q.id] === q.correctAnswer ? Number(q.marks || 0) : 0]));
        autoScore = Object.values(autoQuestionMarks).reduce((sum, marks) => sum + marks, 0);
      }
    }
    const submissions = (db as any).data.assessment_submissions || ((db as any).data.assessment_submissions = []);
    let quizSession: any = null;
    if (isQuestionAssessment) {
      quizSession = ((db as any).data.assessment_sessions || []).find((session: any) => session.assessment_id === assessment.id && studentIds.has(String(session.student_id)) && !session.completed_at);
      if (!quizSession) return res.status(403).json({ error: 'Start this assessment before submitting.' });
      if (now.getTime() > new Date(quizSession.ends_at).getTime()) return res.status(403).json({ error: 'The assessment time limit has expired.' });
    }
    const studentIds = studentIdentifiers(student, req.user);
    const previous = submissions.findIndex((s: any) => s.assessment_id === assessment.id && studentIds.has(String(s.student_id)));
    const attemptCount = previous >= 0 ? Number(submissions[previous].attempt_count || 1) : 0;
    const attemptsAllowed = Number(parseJson(assessment.settings, {}).attemptsAllowed || 1);
    if (attemptCount >= attemptsAllowed) return res.status(403).json({ error: `You have used all ${attemptsAllowed} allowed attempts.` });
    const record = { id: `asub_${Date.now()}_${studentId}`, assessment_id: assessment.id, student_id: studentId, student_name: req.user.fullName, file_name: file?.name ? String(file.name).slice(0, 180) : '', file_type: file?.type ? String(file.type).slice(0, 120) : '', file_data: file?.data || '', answers, notes: String(notes).slice(0, 5000), submitted_at: now.toISOString(), status: 'SUBMITTED', attempt_count: attemptCount + 1 };
    if (previous >= 0) submissions[previous] = record; else submissions.push(record);
    if (quizSession) quizSession.completed_at = now.toISOString();
    if (autoScore !== null) {
      const mark = ((db as any).data.assessment_marks || []).find((m: any) => m.assessment_id === assessment.id && studentIds.has(String(m.student_id)));
      if (mark) { mark.marks_obtained = autoScore; mark.question_marks = JSON.stringify(autoQuestionMarks); mark.grade = calculateGrade(autoScore, Number(assessment.max_marks)); mark.evaluated_at = now.toISOString(); mark.evaluated_by = 'Automatic Quiz Grading'; }
    }
    (db as any).scheduleSave();
    res.status(201).json({ success: true, submission: { ...record, file_data: undefined } });
  } catch (err: any) { res.status(400).json({ error: err.message || 'Submission failed.' }); }
});

router.get('/:id/submissions/:submissionId/file', authMiddleware, (req, res) => {
  const db = getDb();
  const assessment = (db.prepare('SELECT * FROM assessments').all() as any[]).find(a => a.id === req.params.id);
  if (!assessment || !['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Not authorized to download submissions.' });
  if (req.user!.role === 'TEACHER' && assessment.faculty_id !== req.user!.id) return res.status(403).json({ error: 'Only the assigned faculty can download these submissions.' });
  const submission = ((db as any).data.assessment_submissions || []).find((s: any) => s.id === req.params.submissionId && s.assessment_id === assessment.id);
  if (!submission) return res.status(404).json({ error: 'Submission file not found.' });
  res.json({ file: { name: submission.file_name, type: submission.file_type, data: submission.file_data } });
});

// 5. Delete Assessment
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const assessmentsTable = (db as any).data.assessments || [];
    const target = assessmentsTable.find((a: any) => a.id === id);
    if (!target) return res.status(404).json({ error: 'Assessment not found.' });
    if (!['TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Only faculty can remove assessments.' });
    if (req.user!.role === 'TEACHER' && target.faculty_id !== req.user!.id) return res.status(403).json({ error: 'Only the assigned faculty can remove this assessment.' });
    (db as any).data.assessments = assessmentsTable.filter((a: any) => a.id !== id);

    const marksTable = (db as any).data.assessment_marks || [];
    (db as any).data.assessment_marks = marksTable.filter((m: any) => m.assessment_id !== id);

    (db as any).scheduleSave();
    res.json({ success: true, message: 'Assessment and all corresponding marks removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Student Assessment Portal: View all marks across all subjects for a student
router.get('/student/:studentId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { studentId: requestedIdentifier } = req.params;
    if (!['STUDENT', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'You cannot view this student report.' });
    const requestedStudent = (db.prepare('SELECT * FROM students').all() as any[]).find(student =>
      [student.id, student.user_id, student.student_id].some(value => value && String(value) === String(requestedIdentifier))
    );
    if (!requestedStudent) return res.status(404).json({ error: 'Student not found.' });
    const studentId = requestedStudent.id;
    const targetIds = studentIdentifiers(requestedStudent);
    if (req.user!.role === 'STUDENT') {
      const currentStudent = findStudentForUser(db, req.user);
      const currentIds = studentIdentifiers(currentStudent, req.user);
      if (![...targetIds].some(identifier => currentIds.has(identifier))) return res.status(403).json({ error: 'You can only view your own assessment results.' });
    }
    if (req.user!.role === 'PARENT') {
      const parent = (db.prepare('SELECT * FROM parents').all() as any[]).find(p => p.user_id === req.user!.id || p.id === req.user!.id);
      const childIds = parent ? parseJson(parent.children_ids, []) : [];
      const linkedByStudent = requestedStudent.parent_id === req.user!.id;
      const linkedByIds = childIds.some((childId: string) => targetIds.has(String(childId)));
      if (!linkedByStudent && !linkedByIds) return res.status(403).json({ error: 'This student is not linked to your parent account.' });
    }

    const allAssessments = db.prepare('SELECT * FROM assessments').all() as any[];
    const allMarks = db.prepare('SELECT * FROM assessment_marks').all() as any[];

    const studentMarks = allMarks.filter(m => targetIds.has(String(m.student_id)));

    const assessmentCards = studentMarks.map(m => {
      const parentAssessment = allAssessments.find(a => a.id === m.assessment_id) || {};
      const submission = ((db as any).data.assessment_submissions || []).find((s: any) => s.assessment_id === m.assessment_id && targetIds.has(String(s.student_id)));
      const questions = parseJson(parentAssessment.questions);
      if (parseJson(parentAssessment.settings, {}).shuffleQuestions !== false) for (let i = questions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]; }
      const score = Number(m.marks_obtained);
      const max = Number(m.max_marks || parentAssessment.max_marks || 100);
      const pct = max > 0 && !isNaN(score) ? Math.round((score / max) * 100) : 0;

      return {
        id: m.id,
        assessmentId: m.assessment_id,
        title: parentAssessment.title || 'Subject Assessment',
        assessmentType: parentAssessment.assessment_type || 'Unit Test',
        subject: parentAssessment.subject || 'Core Subject',
        grade: parentAssessment.grade,
        section: parentAssessment.section,
        term: parentAssessment.term || 'Term 1',
        assessmentDate: parentAssessment.assessment_date,
        facultyName: parentAssessment.faculty_name,
        marksObtained: m.marks_obtained,
        maxMarks: max,
        percentage: pct,
        letterGrade: m.grade || calculateGrade(score, max),
        feedback: m.feedback,
        evaluatedAt: m.evaluated_at,
        dueAt: parentAssessment.due_at || null,
        description: parentAssessment.description || '',
        attachments: parseJson(parentAssessment.attachments),
        submission: submission ? { id: submission.id, fileName: submission.file_name, submittedAt: submission.submitted_at, status: submission.status, attemptCount: submission.attempt_count || 1 } : null,
        assessmentStatus: parentAssessment.status || 'PUBLISHED',
        questions: questions.map((q: any) => ({ id: q.id, prompt: q.prompt, type: q.type, marks: q.marks, options: q.options, language: q.language })),
        attemptsAllowed: parseJson(parentAssessment.settings, {}).attemptsAllowed || 1,
        timeLimitMinutes: parseJson(parentAssessment.settings, {}).timeLimitMinutes || 30,
      };
    });

    // Compute subject wise averages
    const subjectStats: Record<string, { totalPct: number; count: number; highestPct: number }> = {};
    assessmentCards.forEach(card => {
      if (card.marksObtained !== null) {
        if (!subjectStats[card.subject]) {
          subjectStats[card.subject] = { totalPct: 0, count: 0, highestPct: 0 };
        }
        subjectStats[card.subject].totalPct += card.percentage;
        subjectStats[card.subject].count += 1;
        if (card.percentage > subjectStats[card.subject].highestPct) {
          subjectStats[card.subject].highestPct = card.percentage;
        }
      }
    });

    const subjectBreakdown = Object.keys(subjectStats).map(sub => ({
      subject: sub,
      averagePercentage: Math.round(subjectStats[sub].totalPct / subjectStats[sub].count),
      highestPercentage: subjectStats[sub].highestPct,
      assessmentsCount: subjectStats[sub].count,
    }));

    res.json({
      studentId,
      totalAssessments: assessmentCards.length,
      gradedAssessments: assessmentCards.filter(c => c.marksObtained !== null).length,
      assessments: assessmentCards,
      subjectBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

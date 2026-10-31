import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  Download,
  FileText,
  GraduationCap,
  LockKeyhole,
  Play,
  RefreshCw,
  Sun,
  Moon,
  TimerReset,
  Upload,
  AlertCircle,
} from "lucide-react";
import { api } from "../../services/api";
import { assessmentState } from "../../services/assessment-state";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useWorkspaceTheme } from "../../hooks/useWorkspaceTheme";
import { BrandLogo } from "../../components/brand/BrandLogo";
import "../../workspace.css";
import "./assessment.css";

type Question = {
  id: string;
  prompt: string;
  type: string;
  marks: number;
  options?: string[];
  language?: string;
};
const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
const remainingSeconds = (endsAt?: string) =>
  endsAt
    ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000))
    : 0;
const deadline = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " IST"
    : "No deadline";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

function PortalHeader({
  detail,
  name,
  theme,
  toggleTheme,
}: {
  detail: boolean;
  name?: string;
  theme: string;
  toggleTheme: () => void;
}) {
  return (
    <header className="assessment-header">
      <div className="assessment-header-inner">
        {detail ? (
          <Link className="assessment-back" to="/assessment-portal">
            <ArrowLeft size={17} /> Assessment library
          </Link>
        ) : (
          <BrandLogo
            to="/dashboard"
            showSubtitle={false}
            showBadge={false}
            variant={theme === "dark" ? "dark" : "light"}
          />
        )}
        <div className="assessment-header-actions">
          <button
            className="assessment-icon-button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} workspace theme`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link className="assessment-back" to="/dashboard">
            Workspace <ArrowUpRight size={15} />
          </Link>
          <span className="assessment-user" title={name}>
            {name
              ?.split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("") || "S"}
          </span>
        </div>
      </div>
    </header>
  );
}
function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`assessment-notice ${error ? "is-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {error ? <AlertCircle size={20} /> : <LockKeyhole size={18} />}
      <div>{children}</div>
    </div>
  );
}

export function AssessmentPortalPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useWorkspaceTheme();
  const [report, setReport] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [session, setSession] = useState<{
    startedAt: string;
    endsAt: string;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "COMPLETED">("ALL");
  const [now, setNow] = useState(() => Date.now());
  const studentId = user?.studentId || user?.id;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSession(null);
    setAnswers({});
    setFile(null);
    if (!studentId) {
      setError("Your student account is not available. Sign in again.");
      setLoading(false);
      return;
    }
    Promise.all([
      api.getStudentAssessments(studentId),
      assessmentId
        ? api.getAssessmentDetails(assessmentId)
        : Promise.resolve(null),
    ])
      .then(([studentReport, detail]) => {
        if (!active) return;
        setReport(studentReport);
        setAssessment(detail?.assessment || null);
        setSubmission(detail?.submissions?.[0] || null);
        setNow(Date.now());
      })
      .catch((reason) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentId, assessmentId, attempt]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!session?.endsAt) return;
    const tick = () => setSecondsLeft(remainingSeconds(session.endsAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session?.endsAt]);
  const assessments: any[] = report?.assessments || [];
  const readyCount = assessments.filter(
    (item) => assessmentState(item, now) === "OPEN",
  ).length;
  const completedCount = assessments.filter(
    (item) => assessmentState(item, now) === "COMPLETED",
  ).length;
  const filtered = assessments.filter(
    (item) => filter === "ALL" || assessmentState(item, now) === filter,
  );
  const questions: Question[] = assessment?.questions || [];
  const questionBased = questions.length > 0;
  const reportItem = assessments.find(
    (item) => item.assessmentId === assessmentId,
  );
  const submitted =
    Boolean(
      submission &&
        Number(submission.attempt_count || 1) >=
          Number(assessment?.settings?.attemptsAllowed || 1),
    ) ||
    Boolean(reportItem && assessmentState(reportItem, now) === "COMPLETED");
  const closed = Boolean(
    assessment?.due_at && new Date(assessment.due_at).getTime() < now,
  );
  const answered = questions.filter((question) =>
    String(answers[question.id] || "").trim(),
  ).length;
  async function beginAssessment() {
    setStarting(true);
    try {
      const active = await api.startAssessment(assessment.id);
      setSession(active);
      setSecondsLeft(remainingSeconds(active.endsAt));
    } catch (reason) {
      showToast(errorMessage(reason), "error");
    } finally {
      setStarting(false);
    }
  }
  async function submitAssessment() {
    if (questionBased && (!session || answered < questions.length)) {
      showToast(
        "Start the assessment and answer every question before submitting.",
        "error",
      );
      return;
    }
    if (!questionBased && !file) {
      showToast("Choose your completion file first.", "error");
      return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
      showToast("Your submission must be no larger than 2 MB.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const encoded = file ? await readFile(file) : undefined;
      await api.submitAssessment(assessment.id, {
        ...(file
          ? {
              file: {
                name: file.name,
                type: file.type || "application/octet-stream",
                data: encoded!,
              },
            }
          : {}),
        answers,
      });
      showToast("Your work was submitted successfully.", "success");
      navigate("/assessment-portal", { replace: true });
    } catch (reason) {
      showToast(errorMessage(reason), "error");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="assessment-theme" data-workspace-theme={theme}>
      <a className="assessment-skip" href="#assessment-content">
        Skip to assessment
      </a>
      <PortalHeader
        detail={Boolean(assessmentId)}
        name={user?.fullName}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div id="assessment-content" className="assessment-container">
        {loading ? (
          <div className="assessment-loading" role="status">
            <span />
            <span />
            <span />
            <p>Preparing your assessment workspace...</p>
          </div>
        ) : error ? (
          <section className="assessment-empty">
            <AlertCircle size={32} />
            <h1>We couldn't load your assessments</h1>
            <p>{error}</p>
            <button
              className="assessment-button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              <RefreshCw size={16} /> Try again
            </button>
          </section>
        ) : assessmentId && assessment ? (
          <>
            <section className="assessment-detail-hero">
              <div className="assessment-eyebrow">
                {assessment.subject} / {assessment.assessment_type}
              </div>
              <h1>{assessment.title}</h1>
              <p>
                {assessment.description ||
                  "Read each prompt carefully, then submit your work for review."}
              </p>
              <div className="assessment-detail-meta">
                <span>
                  <GraduationCap size={17} />
                  <strong>{assessment.max_marks}</strong> total marks
                </span>
                <span>
                  <Clock3 size={17} />
                  {questionBased
                    ? `${questions.length} questions / ${assessment.settings?.timeLimitMinutes || 30} minutes`
                    : "File submission"}
                </span>
                <span>
                  <BookOpen size={17} />
                  {deadline(assessment.due_at)}
                </span>
              </div>
            </section>
            {assessment.is_demo && (
              <Notice>
                Demonstration assessment. This work stays in the local review
                database.
              </Notice>
            )}
            {assessment.attachments?.length > 0 && (
              <section className="assessment-material">
                <h2>Reference material</h2>
                <div>
                  {assessment.attachments.map(
                    (attachment: any, index: number) => (
                      <a
                        className="assessment-button is-secondary"
                        key={index}
                        href={attachment.data}
                        download={attachment.name}
                      >
                        <Download size={16} />
                        {attachment.name}
                      </a>
                    ),
                  )}
                </div>
              </section>
            )}
            {submitted || closed ? (
              <section className="assessment-result">
                <span className="assessment-result-icon">
                  <CheckCircle2 size={32} />
                </span>
                <div>
                  <div className="assessment-eyebrow">
                    {submitted ? "Work recorded" : "Deadline reached"}
                  </div>
                  <h2>
                    {submitted
                      ? "Assessment submitted."
                      : "This assessment is closed."}
                  </h2>
                  <p>
                    {submitted
                      ? "Your response is saved. Recorded marks appear below when grading is available."
                      : "Contact your teacher if you need help with the deadline."}
                  </p>
                  {reportItem?.marksObtained !== null &&
                    reportItem?.marksObtained !== undefined && (
                      <strong className="assessment-result-score">
                        {reportItem.marksObtained}
                        <small> / {reportItem.maxMarks} marks</small>
                      </strong>
                    )}
                </div>
                <Link
                  to="/assessment-portal"
                  className="assessment-button is-secondary"
                >
                  Back to library <ArrowRight size={16} />
                </Link>
              </section>
            ) : (
              <>
                {questionBased && !session && (
                  <section className="assessment-start">
                    <span className="assessment-start-icon">
                      <Play size={24} />
                    </span>
                    <div>
                      <h2>Ready when you are.</h2>
                      <p>
                        Starting begins your{" "}
                        {assessment.settings?.timeLimitMinutes || 30}-minute
                        timer. {assessment.settings?.attemptsAllowed || 1}{" "}
                        attempt
                        {Number(assessment.settings?.attemptsAllowed || 1) === 1
                          ? ""
                          : "s"}{" "}
                        available. Keep this tab open while you work.
                      </p>
                    </div>
                    <button
                      className="assessment-button"
                      onClick={beginAssessment}
                      disabled={starting}
                    >
                      {starting ? "Starting..." : "Begin assessment"}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                )}
                {questionBased && session && (
                  <>
                    <div className="assessment-attempt-bar">
                      <div>
                        <strong>
                          {answered} of {questions.length} answered
                        </strong>
                        <span>{assessment.max_marks} marks in total</span>
                      </div>
                      <div
                        className={`assessment-timer ${secondsLeft < 60 ? "is-urgent" : ""}`}
                        role="timer"
                        aria-label="Time remaining"
                      >
                        <TimerReset size={19} />
                        {Math.floor(secondsLeft / 60)}:
                        {String(secondsLeft % 60).padStart(2, "0")}
                      </div>
                    </div>
                    {secondsLeft === 0 && (
                      <Notice error>
                        Your timed attempt has expired. Return to the library to
                        check whether another attempt is available.
                      </Notice>
                    )}
                    <div className="assessment-questions">
                      {questions.map((question, index) => (
                        <fieldset
                          key={question.id}
                          className="assessment-question"
                          disabled={secondsLeft === 0 || submitting}
                        >
                          <legend className="sr-only">
                            Question {index + 1}: {question.prompt}
                          </legend>
                          <div className="assessment-question-heading">
                            <span>{index + 1}</span>
                            <div>
                              <small>
                                {question.type === "CODE"
                                  ? `${question.language || "Code"} challenge`
                                  : question.type === "MULTIPLE_CHOICE"
                                    ? "Multiple choice"
                                    : "Written response"}
                              </small>
                              <h2>{question.prompt}</h2>
                            </div>
                            <strong>{question.marks} pts</strong>
                          </div>
                          {question.type === "MULTIPLE_CHOICE" ? (
                            <div className="assessment-options">
                              {(question.options || []).map(
                                (option, optionIndex) => (
                                  <label
                                    key={optionIndex}
                                    className={
                                      answers[question.id] === option
                                        ? "is-selected"
                                        : ""
                                    }
                                  >
                                    <input
                                      type="radio"
                                      name={question.id}
                                      checked={answers[question.id] === option}
                                      onChange={() =>
                                        setAnswers((previous) => ({
                                          ...previous,
                                          [question.id]: option,
                                        }))
                                      }
                                    />
                                    <span>
                                      {String.fromCharCode(65 + optionIndex)}
                                    </span>
                                    {option}
                                  </label>
                                ),
                              )}
                            </div>
                          ) : (
                            <div
                              className={`assessment-editor ${question.type === "CODE" ? "is-code" : ""}`}
                            >
                              <div>
                                {question.type === "CODE" ? (
                                  <Code2 size={17} />
                                ) : (
                                  <FileText size={17} />
                                )}
                                <span>
                                  {question.type === "CODE"
                                    ? question.language || "Code"
                                    : "Your response"}
                                </span>
                              </div>
                              <textarea
                                aria-label={`Answer for question ${index + 1}: ${question.prompt}`}
                                rows={question.type === "CODE" ? 10 : 5}
                                spellCheck={question.type !== "CODE"}
                                value={answers[question.id] || ""}
                                onChange={(event) =>
                                  setAnswers((previous) => ({
                                    ...previous,
                                    [question.id]: event.target.value,
                                  }))
                                }
                                placeholder={
                                  question.type === "CODE"
                                    ? "Write your program here. Code is submitted for teacher review."
                                    : "Explain your thinking here..."
                                }
                              />
                            </div>
                          )}
                        </fieldset>
                      ))}
                    </div>
                    <div className="assessment-submit">
                      <p>
                        Check your responses before submitting. Your teacher
                        will receive this attempt.
                      </p>
                      <button
                        className="assessment-button"
                        onClick={submitAssessment}
                        disabled={secondsLeft === 0 || submitting}
                      >
                        {submitting ? "Submitting..." : "Submit assessment"}
                        <CheckCircle2 size={17} />
                      </button>
                    </div>
                  </>
                )}
                {!questionBased && (
                  <section className="assessment-upload">
                    <div className="assessment-eyebrow">Your submission</div>
                    <h2>Bring your work together.</h2>
                    <p>
                      PDF, Word, PowerPoint, image or text file, up to 2 MB.
                    </p>
                    <label>
                      <input
                        aria-label="Choose your completion file"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                        onChange={(event) =>
                          setFile(event.target.files?.[0] || null)
                        }
                      />
                      <Upload size={28} />
                      <strong>
                        {file?.name || "Choose your completion file"}
                      </strong>
                      <span>Browse your device to upload your work</span>
                    </label>
                    <button
                      className="assessment-button"
                      disabled={!file || submitting}
                      onClick={submitAssessment}
                    >
                      {submitting ? "Uploading..." : "Submit work"}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <section className="assessment-library-hero">
              <div>
                <div className="assessment-eyebrow">
                  Your assessment workspace
                </div>
                <h1>
                  A little focus.
                  <br />
                  <span>A lot of possibility.</span>
                </h1>
                <p>
                  Quizzes, projects and coding challenges for your class. Find
                  your next task and show what you've learned.
                </p>
                <a className="assessment-button" href="#assessment-library">
                  Explore your assessments <ArrowRight size={17} />
                </a>
                <div className="assessment-privacy">
                  <LockKeyhole size={14} /> Assigned to your class. Submitted by
                  you.
                </div>
              </div>
              <div
                className="assessment-orb"
                aria-label={`${readyCount} assessments ready to take`}
              >
                <span className="assessment-orb-ring" />
                <div className="assessment-orb-core">
                  <BookOpen size={36} strokeWidth={1.3} />
                  <strong>{readyCount}</strong>
                  <span>ready to take</span>
                </div>
                <span className="assessment-orb-caption">
                  <Code2 size={16} /> Learn. Think. Create.
                </span>
              </div>
            </section>
            <section
              className="assessment-counts"
              aria-label="Your assessment summary"
            >
              <div>
                <BookOpen size={21} />
                <span>Assigned to you</span>
                <strong>{assessments.length}</strong>
              </div>
              <div>
                <CheckCircle2 size={21} />
                <span>Completed</span>
                <strong>{completedCount}</strong>
              </div>
              <div className="is-ready">
                <Clock3 size={21} />
                <span>Ready to take</span>
                <strong>{readyCount}</strong>
              </div>
            </section>
            <section id="assessment-library" className="assessment-library">
              <div className="assessment-library-heading">
                <div>
                  <h2>Your assessment library</h2>
                  <p>Pick a task, read the brief, and make it yours.</p>
                </div>
                <div
                  className="assessment-filters"
                  role="group"
                  aria-label="Filter assessments"
                >
                  {(["ALL", "OPEN", "COMPLETED"] as const).map((option) => (
                    <button
                      key={option}
                      aria-pressed={filter === option}
                      onClick={() => setFilter(option)}
                    >
                      {option === "ALL"
                        ? "All work"
                        : option === "OPEN"
                          ? "Ready to take"
                          : "Completed"}
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length ? (
                <div className="assessment-cards">
                  {filtered.map((item) => {
                    const state = assessmentState(item, now);
                    const hasScore =
                      item.marksObtained !== null &&
                      item.marksObtained !== undefined;
                    const isCode = item.questions?.some(
                      (question: Question) => question.type === "CODE",
                    );
                    const Icon = isCode
                      ? Code2
                      : item.questions?.length
                        ? BookOpen
                        : FileText;
                    return (
                      <article
                        className="assessment-card"
                        key={item.assessmentId}
                      >
                        <div className="assessment-card-top">
                          <span className="assessment-card-icon">
                            <Icon size={23} strokeWidth={1.5} />
                          </span>
                          <span
                            className={`assessment-state is-${state.toLowerCase()}`}
                          >
                            {state === "COMPLETED"
                              ? "Completed"
                              : state === "CLOSED"
                                ? "Closed"
                                : "Ready to take"}
                          </span>
                        </div>
                        <div className="assessment-card-subject">
                          {item.subject} / {item.assessmentType}
                        </div>
                        <h3>{item.title}</h3>
                        <p>
                          {item.description ||
                            "Open the brief to review the instructions for your class."}
                        </p>
                        <dl>
                          <div>
                            <dt>
                              {state === "COMPLETED" && hasScore
                                ? "Your score"
                                : "Total marks"}
                            </dt>
                            <dd>
                              {state === "COMPLETED" && hasScore
                                ? `${item.marksObtained} / `
                                : ""}
                              {item.maxMarks}
                            </dd>
                          </div>
                          <div>
                            <dt>Deadline</dt>
                            <dd>{deadline(item.dueAt)}</dd>
                          </div>
                        </dl>
                        <div className="assessment-card-bottom">
                          <span>
                            {item.questions?.length
                              ? `${item.questions.length} question${item.questions.length === 1 ? "" : "s"}`
                              : "File upload"}
                            <small>
                              {Number(item.submission?.attemptCount || 0)} /{" "}
                              {item.attemptsAllowed || 1} attempts
                            </small>
                          </span>
                          <Link
                            className={`assessment-button ${state === "OPEN" ? "" : "is-secondary"}`}
                            to={`/assessment-portal/${item.assessmentId}`}
                          >
                            {state === "OPEN" ? "Open task" : "View details"}
                            <ArrowUpRight size={15} />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="assessment-empty">
                  <CheckCircle2 size={30} />
                  <h3>
                    {filter === "OPEN"
                      ? "You're all caught up."
                      : "No assessments here yet."}
                  </h3>
                  <p>
                    {filter === "OPEN"
                      ? "New tasks will appear when your teacher publishes them."
                      : "Try another filter or check back after your teacher publishes class work."}
                  </p>
                </div>
              )}
            </section>
          </>
        )}
        <footer className="assessment-footer">
          <span>Scholaxys / Assessment workspace</span>
          <Link to="/dashboard">
            Back to your workspace <ArrowUpRight size={14} />
          </Link>
        </footer>
      </div>
    </main>
  );
}

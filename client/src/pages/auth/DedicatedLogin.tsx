import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { usePresentation } from "../../hooks/usePresentation";
import "../../marketing.css";
export type PortalRole = "admin" | "staff" | "teacher" | "student" | "parent";
const configs = {
  admin: {
    title: "Administration",
    role: "SUPER_ADMIN",
    text: "A clearer view of your school.",
    description:
      "People, records, and operations. Bring your school day into focus.",
    label: "Email or username",
    image: "admin",
  },
  staff: {
    title: "Staff",
    role: "STAFF",
    text: "Behind every great school day.",
    description:
      "For technicians, IT, maintenance, security, office, and every team behind the school day.",
    label: "Staff email or employee ID",
    image: "admin",
  },
  teacher: {
    title: "Teacher",
    role: "TEACHER",
    text: "More time for what you teach.",
    description:
      "Your classes, attendance, and student progress. Ready when you are.",
    label: "School email or employee ID",
    image: "teacher",
  },
  student: {
    title: "Student",
    role: "STUDENT",
    text: "Your next chapter starts here.",
    description:
      "Stay on top of your timetable, homework, and learning journey.",
    label: "Email or admission number",
    image: "student",
  },
  parent: {
    title: "Parent",
    role: "PARENT",
    text: "Stay close to their journey.",
    description:
      "A shared view of your child’s attendance, learning, and school life.",
    label: "Registered email or mobile",
    image: "parent",
  },
};
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
export const DedicatedLogin = ({
  initialRole = "admin",
}: {
  initialRole?: PortalRole;
}) => {
  const { root, dark, setDark } = usePresentation();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const role = initialRole;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"login" | "request" | "help">("login");
  const [fullName, setFullName] = useState("");
  const config = configs[role];
  useEffect(() => {
    setError("");
    setNotice("");
    setPassword("");
    setIdentifier("");
    setMode("login");
  }, [initialRole]);
  const changeMode = (value: typeof mode) => {
    setMode(value);
    setError("");
    setNotice("");
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(identifier.trim(), password, config.role);
        navigate("/dashboard", { replace: true });
      } else if (mode === "request") {
        const result = await api.register({
          fullName: fullName.trim(),
          email: identifier.trim(),
          password,
          role: role === "admin" ? "SCHOOL_ADMIN" : config.role,
        });
        setNotice(
          `${result.message}${result.requestId ? ` Reference: ${result.requestId}` : ""}`,
        );
        setPassword("");
      }
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      ref={root}
      className="presentation signin-page"
      data-theme={dark ? "dark" : "light"}
    >
      <a className="skip-link" href="#signin-main">
        Skip to sign in
      </a>
      <header className="public-header">
        <div className="public-nav">
          <BrandLogo
            variant={dark ? "dark" : "light"}
            showBadge={false}
            showSubtitle={false}
          />
          <div className="nav-actions">
            <Link className="text-link" to="/login">
              <ArrowLeft size={16} /> All workspaces
            </Link>
            <button
              className="icon-button"
              onClick={() => setDark(!dark)}
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>
      <main id="signin-main" className="signin-main page-width">
        <aside className="signin-visual">
          <img
            src={`/assets/heroes/${config.image}_hero.jpg`}
            alt={`${config.title} school community`}
            fetchPriority="high"
          />
          <div className="signin-visual-content">
            <span>Scholaxys / {config.title}</span>
            <h1>{config.text}</h1>
            <p>{config.description}</p>
          </div>
        </aside>
        <section className="signin-form-panel">
          <div className="signin-lock">
            <LockKeyhole size={23} />
          </div>
          <span className="section-label">{config.title} workspace</span>
          <h2>
            {mode === "request"
              ? "Request your account"
              : mode === "help"
                ? "Let’s get you back in."
                : "Welcome back."}
          </h2>
          <p className="signin-description">
            {mode === "request"
              ? "Submit your details for school administrator approval."
              : mode === "help"
                ? "Your school administrator manages account recovery."
                : "Sign in to continue your school day."}
          </p>
          {mode === "help" ? (
            <div className="signin-help">
              <ShieldCheck size={27} />
              <p>
                Contact your school office or administrator with your registered
                email address or school ID. They can verify your identity and
                arrange access.
              </p>
              <p>
                For your security, passwords are never sent through this page.
              </p>
              <button
                className="button button-primary"
                onClick={() => changeMode("login")}
              >
                Back to sign in <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="signin-form">
              {mode === "request" && (
                <label>
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={120}
                    placeholder="Your full name"
                  />
                </label>
              )}
              <label>
                {mode === "request" ? "School email" : config.label}
                <input
                  required
                  type={mode === "request" ? "email" : "text"}
                  name="username"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    mode === "request"
                      ? "you@school.edu"
                      : "Your school account"
                  }
                  maxLength={200}
                />
              </label>
              <div className="signin-field">
                <div className="password-label">
                  <label htmlFor="signin-password">Password</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => changeMode("help")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="password-input">
                  <input
                    required
                    id="signin-password"
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete={
                      mode === "request" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={mode === "request" ? 12 : 1}
                    maxLength={128}
                    placeholder={
                      mode === "request"
                        ? "At least 12 characters"
                        : "Enter your password"
                    }
                  />
                  <button
                    type="button"
                    aria-label={visible ? "Hide password" : "Show password"}
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="form-feedback error" role="alert">
                  {error}
                </div>
              )}
              {notice && (
                <div className="form-feedback success" role="status">
                  <CheckCircle2 size={18} />
                  {notice}
                </div>
              )}
              <button
                className="button button-primary signin-submit"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "Please wait…"
                  : mode === "request"
                    ? "Submit access request"
                    : "Sign in to workspace"}
                {!busy && <ArrowRight size={18} />}
              </button>
            </form>
          )}
          {mode === "login" && role !== "admin" ? (
            <p className="signin-new">
              New to Scholaxys?{" "}
              <button onClick={() => changeMode("request")}>
                Request access
              </button>
            </p>
          ) : mode === "request" ? (
            <p className="signin-new">
              Already have an account?{" "}
              <button onClick={() => changeMode("login")}>Sign in</button>
            </p>
          ) : null}
          {user && mode === "login" && (
            <Link className="signin-existing text-link" to="/dashboard">
              Continue as {user.fullName}
              <ArrowRight size={15} />
            </Link>
          )}
          <div className="signin-security">
            <ShieldCheck size={16} />
            <span>Use the account issued by your school.</span>
          </div>
        </section>
      </main>
      <footer className="auth-footer page-width">
        <span>© {new Date().getFullYear()} Scholaxys</span>
        <Link to="/">Back to campus</Link>
      </footer>
    </div>
  );
};

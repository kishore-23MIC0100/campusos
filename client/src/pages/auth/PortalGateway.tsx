import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  ShieldCheck,
  Moon,
  Sun,
} from "lucide-react";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { usePresentation } from "../../hooks/usePresentation";
import "../../marketing.css";
export const PortalGateway = () => {
  const { root, dark, setDark } = usePresentation();
  return (
    <div
      ref={root}
      className="presentation gateway"
      data-theme={dark ? "dark" : "light"}
    >
      <a className="skip-link" href="#gateway-main">
        Skip to content
      </a>
      <header className="public-header">
        <div className="public-nav">
          <BrandLogo
            variant={dark ? "dark" : "light"}
            showBadge={false}
            showSubtitle={false}
          />
          <div className="nav-actions">
            <Link to="/" className="text-link">
              <ArrowLeft size={16} /> Back to campus
            </Link>
            <button
              className="icon-button"
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>
      <main className="gateway-main page-width" id="gateway-main">
        <div className="gateway-intro">
          <span className="section-label">Your Scholaxys workspace</span>
          <h1>
            A place for
            <br />
            <span>everyone.</span>
          </h1>
          <p>Choose your role to sign in with your school-issued account.</p>
          <div className="gateway-assurance">
            <ShieldCheck size={20} />
            <span>
              Dedicated access.
              <br />
              <strong>A more focused school day.</strong>
            </span>
          </div>
        </div>
        <div className="gateway-options">
          {[
            {
              name: "Administration",
              desc: "School leadership, records, and operations",
              path: "/admin/login",
              icon: LayoutDashboard,
            },
            {
              name: "Teachers",
              desc: "Classes, attendance, and assessments",
              path: "/teacher/login",
              icon: BookOpen,
            },
            {
              name: "Students",
              desc: "Your timetable, homework, and progress",
              path: "/student/login",
              icon: GraduationCap,
            },
            {
              name: "Parents",
              desc: "Stay connected to your child’s learning",
              path: "/parent/login",
              icon: HeartHandshake,
            },
            {
              name: "Staff",
              desc: "Technicians, IT, facilities, office, and support teams",
              path: "/staff/login",
              icon: ShieldCheck,
            },
          ].map(({ name, desc, path, icon: Icon }) => (
            <Link to={path} key={name}>
              <span className="gateway-icon">
                <Icon size={23} />
              </span>
              <div>
                <h2>{name}</h2>
                <p>{desc}</p>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          ))}
          <p className="gateway-help">
            Need access? Your school administrator can create or approve your
            account.
          </p>
        </div>
      </main>
      <footer className="auth-footer page-width">
        <span>© {new Date().getFullYear()} Scholaxys</span>
        <span>One campus. Every possibility.</span>
      </footer>
    </div>
  );
};

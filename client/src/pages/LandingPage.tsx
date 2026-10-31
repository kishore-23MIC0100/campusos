import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "../components/brand/BrandLogo";
import { CampusExperience } from "../components/3d/CampusExperience";
import { useAuth } from "../context/AuthContext";
import { usePresentation } from "../hooks/usePresentation";
import "../marketing.css";

export const LandingPage = () => {
  const { user, reduceMotion, setReduceMotion } = useAuth();
  const { root, dark, setDark } = usePresentation();
  const [menu, setMenu] = useState(false);
  return (
    <div
      ref={root}
      className="presentation landing"
      data-theme={dark ? "dark" : "light"}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="public-header">
        <div className="public-nav">
          <BrandLogo
            variant={dark ? "dark" : "light"}
            showBadge={false}
            showSubtitle={false}
          />
          <nav
            className={menu ? "public-links open" : "public-links"}
            aria-label="Main navigation"
          >
            <a href="#platform" onClick={() => setMenu(false)}>
              The platform
            </a>
            <a href="#campus" onClick={() => setMenu(false)}>
              Campus experience
            </a>
            <a href="#community" onClick={() => setMenu(false)}>
              Our community
            </a>
          </nav>
          <div className="nav-actions">
            <button
              className="icon-button"
              onClick={() => setDark(!dark)}
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              className="button button-dark nav-signin"
              to={user ? "/dashboard" : "/login"}
            >
              {user ? "Workspace" : "Sign in"}
              <ArrowUpRight size={16} />
            </Link>
            <button
              className="icon-button menu-toggle"
              aria-expanded={menu}
              aria-label="Toggle navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="home-hero page-width">
          <div className="hero-copy">
            <div className="hero-label">
              <span className="label-mark">
                <GraduationCap size={15} />
              </span>{" "}
              A better day on campus
            </div>
            <h1>
              One campus.
              <br />
              <span>Every possibility.</span>
            </h1>
            <p>
              Bring people, learning, and everyday operations together. Make
              more room for what matters.
            </p>
            <div className="hero-actions">
              <Link
                className="button button-primary"
                to={user ? "/dashboard" : "/login"}
              >
                {user ? "Open your workspace" : "Enter your campus"}
                <ArrowRight size={18} />
              </Link>
              <a className="text-link" href="#platform">
                Discover Scholaxys <ChevronDown size={16} />
              </a>
            </div>
          </div>
          <div id="campus" className="hero-model">
            <CampusExperience
              reduced={reduceMotion}
              onToggleMotion={() => setReduceMotion(!reduceMotion)}
            />
          </div>
        </section>
        <div className="principles page-width">
          <p>
            Thoughtfully connected.
            <br />
            <strong>Built around your school day.</strong>
          </p>
          <div>
            <ShieldCheck size={21} />
            <span>Role-based access</span>
          </div>
          <div>
            <Users size={21} />
            <span>One school community</span>
          </div>
          <div>
            <LayoutDashboard size={21} />
            <span>Everyday clarity</span>
          </div>
        </div>
        <section
          id="platform"
          className="platform-section page-width"
          data-reveal
        >
          <div className="section-intro">
            <span className="section-label">The Scholaxys platform</span>
            <h2>
              Less administration.
              <br />
              More education.
            </h2>
            <p>
              From the first roll call to the final bell, everything your team
              needs to keep the day moving.
            </p>
          </div>
          <div className="feature-layout">
            <article className="feature-main">
              <div className="feature-icon">
                <BookOpen size={25} />
              </div>
              <h3>Learning, without the loose ends.</h3>
              <p>
                Attendance, homework, assessments, and student progress.
                Connected tools that give teachers time to teach.
              </p>
              <div className="feature-tags">
                <span>
                  <Check size={14} /> Attendance
                </span>
                <span>
                  <Check size={14} /> Assessments
                </span>
                <span>
                  <Check size={14} /> Timetables
                </span>
              </div>
              <img
                src="/indian_stem_robotics_wing.jpg"
                alt="Students collaborating in a bright school learning space"
                loading="lazy"
                width="800"
                height="480"
              />
            </article>
            <div className="feature-side">
              <article>
                <div className="feature-icon">
                  <Users size={24} />
                </div>
                <h3>
                  A shared view.
                  <br />
                  The right perspective.
                </h3>
                <p>
                  Dedicated workspaces for administrators, teachers, staff,
                  students, and families. Everyone knows their next step.
                </p>
                <Link to="/login" className="text-link">
                  Find your workspace <ArrowUpRight size={17} />
                </Link>
              </article>
              <article>
                <div className="feature-icon">
                  <CalendarDays size={24} />
                </div>
                <h3>Keep the whole day in sync.</h3>
                <p>
                  Manage leave, school events, announcements, and transport from
                  a single place.
                </p>
                <div className="feature-bottom">
                  <span>People. Plans. Progress.</span>
                  <CalendarDays size={28} />
                </div>
              </article>
            </div>
          </div>
        </section>
        <section className="operations-section page-width" data-reveal>
          <div className="operations-image">
            <img
              src="/real_school_quadrangle.jpg"
              alt="Landscaped school courtyard between academic buildings"
              loading="lazy"
              width="1000"
              height="900"
            />
          </div>
          <div className="operations-copy">
            <span className="section-label">Made for the people behind it</span>
            <h2>
              A school runs on
              <br />a thousand small things.
            </h2>
            <p>
              Give your team a clear place to manage them. Organised records,
              useful insights, and less time switching between tools.
            </p>
            <ul>
              <li>
                <ShieldCheck size={20} />
                <div>
                  <strong>Access with purpose</strong>
                  <span>Permissions match each person’s role.</span>
                </div>
              </li>
              <li>
                <LayoutDashboard size={20} />
                <div>
                  <strong>A clearer daily picture</strong>
                  <span>Your school’s data, in your workspace.</span>
                </div>
              </li>
              <li>
                <Wallet size={20} />
                <div>
                  <strong>Operations that stay organised</strong>
                  <span>Staff records, leave, payroll, and reporting.</span>
                </div>
              </li>
            </ul>
          </div>
        </section>
        <section
          id="community"
          className="community-section page-width"
          data-reveal
        >
          <div className="section-intro">
            <h2>Your place in the campus.</h2>
            <p>A focused workspace for every part of your school community.</p>
          </div>
          <div className="community-links">
            {[
              {
                name: "Administration",
                desc: "Lead with a clear view.",
                path: "/admin/login",
                icon: LayoutDashboard,
              },
              {
                name: "Teachers",
                desc: "Make time for teaching.",
                path: "/teacher/login",
                icon: BookOpen,
              },
              {
                name: "Students",
                desc: "Own your learning journey.",
                path: "/student/login",
                icon: GraduationCap,
              },
              {
                name: "Parents",
                desc: "Stay close to their progress.",
                path: "/parent/login",
                icon: Users,
              },
              {
                name: "Staff",
                desc: "Keep the campus moving.",
                path: "/staff/login",
                icon: ShieldCheck,
              },
            ].map(({ name, desc, path, icon: Icon }) => (
              <Link to={path} key={name}>
                <Icon size={25} />
                <div>
                  <h3>{name}</h3>
                  <p>{desc}</p>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </div>
        </section>
        <section className="closing-section page-width" data-reveal>
          <GraduationCap size={38} strokeWidth={1.3} />
          <h2>
            Good days start
            <br />
            with a connected campus.
          </h2>
          <Link to="/login" className="button button-primary">
            Find your workspace <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="public-footer page-width">
        <BrandLogo
          variant={dark ? "dark" : "light"}
          showBadge={false}
          showSubtitle={false}
          size="sm"
        />
        <p>People. Learning. Possibility.</p>
        <span>© {new Date().getFullYear()} Scholaxys</span>
        <a href="#main">Back to top ↑</a>
      </footer>
    </div>
  );
};

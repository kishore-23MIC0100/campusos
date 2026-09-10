import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BrandLogo } from '../../components/brand/BrandLogo';
import {
  Shield, Eye, EyeOff, Lock, User as UserIcon, Mail, Phone, ArrowRight,
  Sparkles, CheckCircle, AlertCircle, Clock, X, HelpCircle, Building2,
  GraduationCap, Users, HeartHandshake, ChevronRight, Server, Key,
  BookOpen, PhoneCall, MessageSquare, Info
} from 'lucide-react';

export type PortalRole = 'admin' | 'teacher' | 'student' | 'parent';

interface OtherRoleLink {
  key: PortalRole;
  label: string;
  path: string;
}

interface RoleConfig {
  roleKey: 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  portalPath: string;
  badgeLabel: string;
  portalTitle: string;
  portalSubtitle: string;
  heroHeadline: string;
  heroSubline: string;
  heroImage: string;
  identifierLabel: string;
  identifierHint: string;
  identifierPlaceholder: string;
  identifierType: 'text' | 'email';
  buttonLabel: string;
  defaultIdentifier: string;
  defaultPassword: string;
  roleName: string;
  floatingFeature: string;
  tintGlow: string;
  themeTagColor: string;
  submitButtonClass: string;
  inputFocusRing: string;
  accentLinkColor: string;
  heroBadgeStyle: string;
  heroIconStyle: string;
  iconBg: string;
  roleIcon: React.ReactNode;
  otherRoles: OtherRoleLink[];
}

const ROLE_CONFIGS: Record<PortalRole, RoleConfig> = {
  admin: {
    roleKey: 'SUPER_ADMIN',
    portalPath: '/admin/login',
    badgeLabel: 'INSTITUTIONAL GOVERNANCE',
    portalTitle: 'Administrator Sign In',
    portalSubtitle: 'Principal, Vice-Principal & Leadership Console',
    heroHeadline: 'Command school operations with precision & foresight.',
    heroSubline: 'Unified institutional governance, staff records, real-time analytics, and automated administrative control.',
    heroImage: '/assets/heroes/admin_hero.jpg',
    identifierLabel: 'Administrator Email or Username',
    identifierHint: 'Official school leadership account (e.g. admin@campusos.edu)',
    identifierPlaceholder: 'e.g. admin@campusos.edu or admin.lead',
    identifierType: 'text',
    buttonLabel: 'Sign In to Admin Portal',
    defaultIdentifier: 'admin@campusos.edu',
    defaultPassword: 'Admin@2026',
    roleName: 'Admin',
    floatingFeature: 'Institutional Oversight • Multi-Tenant RBAC Active',
    tintGlow: 'from-slate-950 via-slate-950/75 to-navy-950/50',
    themeTagColor: 'text-indigo-800 bg-indigo-50 border-indigo-200',
    submitButtonClass: 'bg-slate-900 hover:bg-slate-950 text-white shadow-md shadow-slate-900/10',
    inputFocusRing: 'focus:border-slate-800 focus:ring-slate-100',
    accentLinkColor: 'text-indigo-700 hover:text-indigo-900',
    heroBadgeStyle: 'bg-indigo-500/25 text-indigo-100 border-indigo-300/30',
    heroIconStyle: 'bg-indigo-500/30 text-indigo-300 border-indigo-400/40',
    iconBg: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    roleIcon: <Building2 className="w-5 h-5 text-indigo-700" />,
    otherRoles: [
      { key: 'teacher', label: 'Teacher Login', path: '/teacher/login' },
      { key: 'student', label: 'Student Login', path: '/student/login' },
      { key: 'parent', label: 'Parent Login', path: '/parent/login' },
    ],
  },
  teacher: {
    roleKey: 'TEACHER',
    portalPath: '/teacher/login',
    badgeLabel: 'FACULTY & TEACHING STAFF',
    portalTitle: 'Teacher Sign In',
    portalSubtitle: 'Classroom attendance, homework grading & student evaluation',
    heroHeadline: 'Inspire potential, measure mastery, shape futures.',
    heroSubline: 'Intuitive classroom attendance, rapid homework reviews, and continuous student diagnostic reports.',
    heroImage: '/assets/heroes/teacher_hero.jpg',
    identifierLabel: 'Teacher ID or School Email',
    identifierHint: 'Use your school-issued email or employee code',
    identifierPlaceholder: 'e.g. priya.nair@campusos.edu',
    identifierType: 'text',
    buttonLabel: 'Sign In to Teacher Portal',
    defaultIdentifier: 'priya.nair@campusos.edu',
    defaultPassword: 'Teacher@2026',
    roleName: 'Teacher',
    floatingFeature: 'Smart Classroom Sync • Live Timetable & Gradebook',
    tintGlow: 'from-slate-950 via-slate-950/75 to-teal-950/50',
    themeTagColor: 'text-teal-800 bg-teal-50 border-teal-200',
    submitButtonClass: 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/15',
    inputFocusRing: 'focus:border-teal-600 focus:ring-teal-100',
    accentLinkColor: 'text-teal-700 hover:text-teal-900',
    heroBadgeStyle: 'bg-teal-500/25 text-teal-100 border-teal-300/30',
    heroIconStyle: 'bg-teal-500/30 text-teal-300 border-teal-400/40',
    iconBg: 'bg-teal-50 text-teal-700 border border-teal-200',
    roleIcon: <BookOpen className="w-5 h-5 text-teal-700" />,
    otherRoles: [
      { key: 'student', label: 'Student Login', path: '/student/login' },
      { key: 'parent', label: 'Parent Login', path: '/parent/login' },
      { key: 'admin', label: 'Admin Login', path: '/admin/login' },
    ],
  },
  student: {
    roleKey: 'STUDENT',
    portalPath: '/student/login',
    badgeLabel: 'STUDENT ACADEMIC PORTAL',
    portalTitle: 'Student Sign In',
    portalSubtitle: 'Live study schedule, homework submissions & gradebook',
    heroHeadline: 'Your modern campus companion for discovery & growth.',
    heroSubline: 'Real-time timetable, assignment submissions, digital gradebook, and digital library resources.',
    heroImage: '/assets/heroes/student_hero.jpg',
    identifierLabel: 'Student Roll No. or Student Email',
    identifierHint: 'Find your Roll Number on your school identity card',
    identifierPlaceholder: 'e.g. STU-2026-8841 or arav.patel@campusos.edu',
    identifierType: 'text',
    buttonLabel: 'Sign In to Student Portal',
    defaultIdentifier: 'arav.patel@campusos.edu',
    defaultPassword: 'Student@2026',
    roleName: 'Student',
    floatingFeature: 'Automated GPA • Interactive Schedule & Assignments',
    tintGlow: 'from-slate-950 via-slate-950/75 to-blue-950/50',
    themeTagColor: 'text-blue-800 bg-blue-50 border-blue-200',
    submitButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/15',
    inputFocusRing: 'focus:border-blue-600 focus:ring-blue-100',
    accentLinkColor: 'text-blue-700 hover:text-blue-900',
    heroBadgeStyle: 'bg-blue-500/25 text-blue-100 border-blue-300/30',
    heroIconStyle: 'bg-blue-500/30 text-blue-300 border-blue-400/40',
    iconBg: 'bg-blue-50 text-blue-700 border border-blue-200',
    roleIcon: <GraduationCap className="w-5 h-5 text-blue-700" />,
    otherRoles: [
      { key: 'parent', label: 'Parent Login', path: '/parent/login' },
      { key: 'teacher', label: 'Teacher Login', path: '/teacher/login' },
      { key: 'admin', label: 'Admin Login', path: '/admin/login' },
    ],
  },
  parent: {
    roleKey: 'PARENT',
    portalPath: '/parent/login',
    badgeLabel: 'PARENT & FAMILY PORTAL',
    portalTitle: 'Parent Sign In',
    portalSubtitle: 'Track child attendance, academic progress & fee receipts',
    heroHeadline: 'Partner in your child’s educational journey & milestones.',
    heroSubline: 'Comprehensive attendance tracking, marks insights, teacher dialogues, and school fee receipts.',
    heroImage: '/assets/heroes/parent_hero.jpg',
    identifierLabel: 'Parent Mobile Number or Registered Email',
    identifierHint: 'Enter the 10-digit mobile number registered with the school',
    identifierPlaceholder: 'e.g. 98765 43210 or rajesh.patel@gmail.com',
    identifierType: 'text',
    buttonLabel: 'Sign In to Parent Portal',
    defaultIdentifier: 'rajesh.patel@gmail.com',
    defaultPassword: 'Parent@2026',
    roleName: 'Parent',
    floatingFeature: 'Multi-Child Linkage • Real-time Attendance & Fee Alerts',
    tintGlow: 'from-slate-950 via-slate-950/75 to-amber-950/50',
    themeTagColor: 'text-amber-800 bg-amber-50 border-amber-200',
    submitButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/15',
    inputFocusRing: 'focus:border-amber-600 focus:ring-amber-100',
    accentLinkColor: 'text-amber-700 hover:text-amber-900',
    heroBadgeStyle: 'bg-amber-500/25 text-amber-100 border-amber-300/30',
    heroIconStyle: 'bg-amber-500/30 text-amber-300 border-amber-400/40',
    iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
    roleIcon: <HeartHandshake className="w-5 h-5 text-amber-700" />,
    otherRoles: [
      { key: 'student', label: 'Student Login', path: '/student/login' },
      { key: 'teacher', label: 'Teacher Login', path: '/teacher/login' },
      { key: 'admin', label: 'Admin Login', path: '/admin/login' },
    ],
  },
};

export const DedicatedLogin: React.FC<{ initialRole?: PortalRole }> = ({ initialRole = 'admin' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Determine current active role from route or prop
  const currentRole: PortalRole = (() => {
    if (location.pathname.includes('/teacher')) return 'teacher';
    if (location.pathname.includes('/student')) return 'student';
    if (location.pathname.includes('/parent')) return 'parent';
    if (location.pathname.includes('/admin')) return 'admin';
    return initialRole;
  })();

  const config = ROLE_CONFIGS[currentRole];

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingState, setPendingState] = useState<{ requestId: string; fullName: string; role: string } | null>(null);
  const [roleMismatchAlert, setRoleMismatchAlert] = useState<string | null>(null);

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showHelpdeskModal, setShowHelpdeskModal] = useState(false);

  // Request Access form fields
  const [reqFullName, setReqFullName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqRole, setReqRole] = useState(config.roleKey);
  const [reqPassword, setReqPassword] = useState('Password@2026');
  const [reqPhone, setReqPhone] = useState('');
  const [reqDepartment, setReqDepartment] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState<{ requestId: string; message: string } | null>(null);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // 3D Parallax effect on hero card
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handlePrefillDemo = () => {
    setIdentifier(config.defaultIdentifier);
    setPassword(config.defaultPassword);
    setErrorMessage(null);
    setRoleMismatchAlert(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingState(null);
    setRoleMismatchAlert(null);

    if (!identifier.trim()) {
      setErrorMessage(`Please enter your ${config.identifierLabel.toLowerCase()}.`);
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(identifier, password, config.roleKey);
      if (res.roleMismatchWarning) {
        setRoleMismatchAlert(res.roleMismatchWarning);
      }
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 350);
    } catch (err: any) {
      if (err.data && err.data.status === 'PENDING') {
        setPendingState({
          requestId: err.data.requestId || 'REQ-88419',
          fullName: err.data.user?.fullName || identifier,
          role: err.data.user?.role || config.roleKey,
        });
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check your credentials or contact school desk.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName || !reqEmail) return;

    setReqLoading(true);
    try {
      const res = await api.register({
        fullName: reqFullName,
        email: reqEmail,
        password: reqPassword,
        role: reqRole,
        phone: reqPhone,
        department: reqDepartment,
        notes: reqNotes,
      });

      setReqSuccess({
        requestId: res.requestId,
        message: res.message,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to submit registration.');
    } finally {
      setReqLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      const res = await api.resetPassword(forgotEmail);
      setForgotSuccess(res.message);
    } catch (err: any) {
      alert(err.message || 'Error processing password reset.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-teal-500 selection:text-white">
      {/* Background Decorative Dot Grid & Subtle Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      
      <div className="orbit-circle w-[900px] h-[900px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
      <div className="orbit-circle w-[1200px] h-[1200px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between z-20">
        <BrandLogo variant="light" size="md" badgeText="CBSE-AFF-9801" to="/" />

        {/* Quick Links: Portal Gateway, School Helpdesk Hotline & Real Campus View */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-xs transition-all hover:shadow-sm"
          >
            <span>← Portal Gateway</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowHelpdeskModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-all hover:shadow-sm cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">School Helpdesk</span>
          </button>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-all hover:shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Campus View</span>
          </Link>
        </div>
      </header>

      {/* Main Center Access Card Container */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-auto z-10 py-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          
          {/* LEFT COLUMN: Cinematic Human Hero Visual */}
          <div
            ref={heroRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 overflow-hidden select-none parallax-container bg-slate-950"
          >
            {/* Background Role Image with subtle depth parallax */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out opacity-85"
              style={{
                backgroundImage: `url(${config.heroImage}), url('/real_school_academic_wing.jpg')`,
                transform: `scale(1.06) translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
              }}
            />

            {/* Cinematic Gradient Dark Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/40 pointer-events-none" />

            {/* Top Security & Role Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className={`text-[11px] uppercase tracking-widest font-extrabold px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm ${config.heroBadgeStyle}`}>
                {config.badgeLabel}
              </span>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>256-Bit SSL</span>
              </div>
            </div>

            {/* Bottom Institutional Quote */}
            <div className="relative z-10 mt-auto space-y-3">
              <div className="bg-slate-950/85 backdrop-blur-xl p-5 rounded-2xl border border-white/15 shadow-2xl text-white">
                <h2 className="text-xl font-extrabold !text-white leading-snug font-display tracking-tight drop-shadow-md mb-1.5">
                  {config.heroHeadline}
                </h2>
                <p className="text-xs !text-slate-300 leading-relaxed font-normal">
                  {config.heroSubline}
                </p>
              </div>

              {/* Floating Status Card */}
              <div className="bg-navy-950/90 backdrop-blur-xl rounded-xl p-3.5 border border-white/20 shadow-xl flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${config.heroIconStyle}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white tracking-wide">CampusOS Portal</div>
                    <div className="text-[10px] text-slate-300">{config.floatingFeature}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase font-bold text-teal-300">Server Status</div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Clean, Focused Sign-In Form */}
          <div className="lg:col-span-7 bg-white text-slate-900 p-7 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Role Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl mb-6 border border-slate-200/80">
                {(['admin', 'teacher', 'student', 'parent'] as PortalRole[]).map((r) => {
                  const isActive = currentRole === r;
                  const labels: Record<PortalRole, string> = {
                    admin: 'Admin',
                    teacher: 'Teacher',
                    student: 'Student',
                    parent: 'Parent',
                  };
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => navigate(ROLE_CONFIGS[r].portalPath)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      {labels[r]}
                    </button>
                  );
                })}
              </div>

              {/* Institutional Role Header */}
              <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs flex-shrink-0 ${config.iconBg}`}>
                    {config.roleIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                        {config.portalTitle}
                      </h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {config.portalSubtitle}
                    </p>
                  </div>
                </div>

                {/* 1-Click Demo Fill Button */}
                <button
                  type="button"
                  onClick={handlePrefillDemo}
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all cursor-pointer"
                  title="Prefill test demo account"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>Demo Fill</span>
                </button>
              </div>

              {/* Error / Alert States */}
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Sign In Error: </span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {roleMismatchAlert && (
                <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>{roleMismatchAlert}</div>
                </div>
              )}

              {/* Explicit Approval Pending State Card */}
              {pendingState && (
                <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>Account Pending Administrator Verification</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Your registration for <strong>{pendingState.fullName}</strong> as <strong>{pendingState.role}</strong> has been received and is in the institutional approval queue.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-amber-200 font-mono text-[11px] text-amber-900">
                    <span>Reference: <strong>{pendingState.requestId}</strong></span>
                    <span className="px-2 py-0.5 rounded bg-amber-200 font-bold">STATUS: PENDING</span>
                  </div>
                </div>
              )}

              {/* Clean Single-Action Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifier field */}
                <div>
                  <label htmlFor="identifier-input" className="block text-xs font-bold text-slate-800 mb-1.5">
                    {config.identifierLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      {currentRole === 'parent' ? <Phone className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    </div>
                    <input
                      id="identifier-input"
                      type={config.identifierType}
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={config.identifierPlaceholder}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-teal-600 focus:ring-3 focus:ring-teal-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all shadow-2xs outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5">
                    <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{config.identifierHint}</span>
                  </div>
                </div>

                {/* Password field with show/hide toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password-input" className="block text-xs font-bold text-slate-800">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className={`text-xs font-bold ${config.accentLinkColor} transition-colors cursor-pointer hover:underline`}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-teal-600 focus:ring-3 focus:ring-teal-100 text-slate-900 placeholder:text-slate-400 font-medium transition-all shadow-2xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Encrypted Session Notice */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Remember this device</span>
                  </label>

                  <button
                    type="button"
                    onClick={handlePrefillDemo}
                    className="sm:hidden text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    Use Demo Credentials
                  </button>
                </div>

                {/* Single Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2 active:scale-[0.99] ${config.submitButtonClass}`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>{config.buttonLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Institutional Footer & Request Access */}
            <div className="pt-5 border-t border-slate-100 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                <span>New to school? </span>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(true)}
                  className={`font-bold ${config.accentLinkColor} hover:underline cursor-pointer`}
                >
                  Request portal access
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                <span>Oakridge CampusOS</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowHelpdeskModal(true)}
                  className="text-slate-600 hover:text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  Help Desk
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-600 z-10 flex flex-wrap items-center justify-between gap-2">
        <div>
          © 2026 CampusOS Intelligent School Management Platform. All institutional rights reserved.
        </div>
        <div className="flex items-center gap-4 font-semibold">
          <button
            type="button"
            onClick={() => setShowHelpdeskModal(true)}
            className="hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
            <span>School Desk: +91 (080) 2845-7800</span>
          </button>
          <span>•</span>
          <Link to="/" className="hover:text-slate-900 transition-colors">Platform Overview</Link>
        </div>
      </footer>

      {/* MODAL: School Helpdesk Assistance (Crucial for Tier 2/3 Users) */}
      {showHelpdeskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowHelpdeskModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Oakridge Helpdesk Support</h3>
                <p className="text-xs text-slate-500">Official Assistance for Parents, Teachers & Students</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              If you are having trouble logging in or need to update your registered mobile number or roll number, our school office is ready to help.
            </p>

            <div className="space-y-2.5 mb-5">
              {/* Phone Line */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase">School Office Hotline</div>
                    <div className="text-sm font-bold text-slate-900">+91 (080) 2845-7800</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  8am - 4:30pm
                </span>
              </div>

              {/* WhatsApp Desk */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">WhatsApp Support Desk</div>
                    <div className="text-sm font-bold text-emerald-950">+91 98000 12345</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Fast Reply
                </span>
              </div>

              {/* Email */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">IT & Academic Support</div>
                  <div className="text-xs font-bold text-slate-900">support@campusos.edu</div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1 mb-5">
              <div className="font-bold flex items-center gap-1 text-blue-800">
                <Info className="w-3.5 h-3.5" />
                <span>Quick Tips:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5 pl-1">
                <li><strong>Parents:</strong> Use the mobile number registered during student admission.</li>
                <li><strong>Students:</strong> Your Roll Number is on your physical ID badge.</li>
                <li><strong>Teachers:</strong> Use your official school email ID.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpdeskModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Request Access (Creates PENDING user) */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => {
                setShowRequestModal(false);
                setReqSuccess(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {reqSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display">Access Request Submitted</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your registration ticket <strong>#{reqSuccess.requestId}</strong> has been logged in the School Management approvals queue.
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1 font-mono">
                  <div>Applicant: {reqFullName}</div>
                  <div>Assigned Role: {reqRole}</div>
                  <div>Status: PENDING ADMIN REVIEW</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setReqSuccess(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-navy-800 text-white font-semibold text-sm hover:bg-navy-900 cursor-pointer"
                >
                  Return to Portal
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>Institutional Admission & Access</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-display mb-1">Request Portal Account</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Submit your details for verification. School administration will review and activate your authorized role.
                </p>

                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={reqFullName}
                      onChange={(e) => setReqFullName(e.target.value)}
                      placeholder="e.g. Dr. Jennifer Croft or Rohan Mehta"
                      className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="name@campusos.edu"
                        className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Role *</label>
                      <select
                        value={reqRole}
                        onChange={(e) => setReqRole(e.target.value as any)}
                        className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl bg-white"
                      >
                        <option value="TEACHER">Teacher / Faculty</option>
                        <option value="STUDENT">Student</option>
                        <option value="PARENT">Parent / Guardian</option>
                        <option value="SCHOOL_ADMIN">School Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="+91 98000 00000"
                        className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Grade</label>
                      <input
                        type="text"
                        value={reqDepartment}
                        onChange={(e) => setReqDepartment(e.target.value)}
                        placeholder="e.g. Science / Grade 10"
                        className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={reqPassword}
                      onChange={(e) => setReqPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reqLoading}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition-all mt-2 cursor-pointer"
                  >
                    {reqLoading ? 'Submitting Request...' : 'Submit Request for Approval'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Forgot Password */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Recovery Instructions Sent</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{forgotSuccess}</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-navy-800 text-white font-bold text-xs mt-2 hover:bg-navy-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center mb-3">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-1">Reset Password</h3>
                <p className="text-xs text-slate-600 mb-5 font-normal">
                  Enter your registered mobile number, email, or username to receive password reset instructions.
                </p>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Registered Identifier</label>
                    <input
                      type="text"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. 9876543210 or email@campusos.edu"
                      className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl font-medium text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Send Reset Link / OTP
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

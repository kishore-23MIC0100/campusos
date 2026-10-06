import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Shield, Eye, EyeOff, Lock, User as UserIcon, Mail, Phone, ArrowRight,
  Sparkles, CheckCircle, AlertCircle, Clock, X, HelpCircle, Building2,
  GraduationCap, Users, HeartHandshake, ChevronRight, Server, Key,
  BookOpen, PhoneCall, MessageSquare, Info, Zap
} from 'lucide-react';

export type PortalRole = 'admin' | 'teacher' | 'student' | 'parent';

interface RoleConfig {
  roleKey: 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  portalPath: string;
  badgeLabel: string;
  portalTitle: string;
  portalSubtitle: string;
  heroHeadline: string;
  heroSubline: string;
  identifierLabel: string;
  identifierHint: string;
  identifierPlaceholder: string;
  identifierType: 'text' | 'email';
  buttonLabel: string;
  defaultIdentifier: string;
  defaultPassword: string;
  roleName: string;
  floatingFeature: string;
  gradient: string;
  glowColor: string;
  badgeClass: string;
  iconGradient: string;
  roleIcon: React.ReactNode;
  otherRoles: { key: PortalRole; label: string; path: string }[];
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
    identifierLabel: 'Administrator Email or Username',
    identifierHint: 'Official school leadership account (e.g. admin@campusos.edu)',
    identifierPlaceholder: 'e.g. admin@campusos.edu',
    identifierType: 'text',
    buttonLabel: 'Sign In to Admin Portal',
    defaultIdentifier: 'admin@campusos.edu',
    defaultPassword: 'Admin@2026',
    roleName: 'Admin',
    floatingFeature: 'Institutional Oversight • Multi-Tenant RBAC',
    gradient: 'from-iris-600 to-purple-700',
    glowColor: 'rgba(124, 58, 237, 0.2)',
    badgeClass: 'badge-iris',
    iconGradient: 'from-iris-600 to-iris-500',
    roleIcon: <Building2 className="w-5 h-5 text-white" />,
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
    portalSubtitle: 'Classroom attendance, grading & evaluation',
    heroHeadline: 'Inspire potential, measure mastery, shape futures.',
    heroSubline: 'Intuitive classroom attendance, rapid homework reviews, and continuous student diagnostic reports.',
    identifierLabel: 'Teacher ID or School Email',
    identifierHint: 'Use your school-issued email or employee code',
    identifierPlaceholder: 'e.g. priya.nair@campusos.edu',
    identifierType: 'text',
    buttonLabel: 'Sign In to Teacher Portal',
    defaultIdentifier: 'priya.nair@campusos.edu',
    defaultPassword: 'Teacher@2026',
    roleName: 'Teacher',
    floatingFeature: 'Smart Classroom Sync • Live Gradebook',
    gradient: 'from-cyan-600 to-teal-600',
    glowColor: 'rgba(6, 182, 212, 0.2)',
    badgeClass: 'badge-cyan',
    iconGradient: 'from-cyan-600 to-teal-500',
    roleIcon: <BookOpen className="w-5 h-5 text-white" />,
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
    portalSubtitle: 'Study schedule, homework & gradebook',
    heroHeadline: 'Your modern campus companion for discovery & growth.',
    heroSubline: 'Real-time timetable, assignment submissions, digital gradebook, and library resources.',
    identifierLabel: 'Student Roll No. or Email',
    identifierHint: 'Find your Roll Number on your school identity card',
    identifierPlaceholder: 'e.g. arav.patel@campusos.edu',
    identifierType: 'text',
    buttonLabel: 'Sign In to Student Portal',
    defaultIdentifier: 'arav.patel@campusos.edu',
    defaultPassword: 'Student@2026',
    roleName: 'Student',
    floatingFeature: 'Automated GPA • Interactive Assignments',
    gradient: 'from-blue-600 to-indigo-600',
    glowColor: 'rgba(99, 102, 241, 0.2)',
    badgeClass: 'badge-iris',
    iconGradient: 'from-blue-600 to-indigo-600',
    roleIcon: <GraduationCap className="w-5 h-5 text-white" />,
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
    portalSubtitle: 'Track attendance, progress & fees',
    heroHeadline: "Partner in your child's educational journey.",
    heroSubline: 'Comprehensive attendance tracking, marks insights, teacher dialogues, and fee receipts.',
    identifierLabel: 'Parent Mobile or Email',
    identifierHint: 'Enter the mobile number registered with the school',
    identifierPlaceholder: 'e.g. rajesh.patel@gmail.com',
    identifierType: 'text',
    buttonLabel: 'Sign In to Parent Portal',
    defaultIdentifier: 'rajesh.patel@gmail.com',
    defaultPassword: 'Parent@2026',
    roleName: 'Parent',
    floatingFeature: 'Multi-Child Linkage • Real-time Alerts',
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.2)',
    badgeClass: 'badge-amber',
    iconGradient: 'from-amber-500 to-orange-600',
    roleIcon: <HeartHandshake className="w-5 h-5 text-white" />,
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

  const currentRole: PortalRole = (() => {
    if (location.pathname.includes('/teacher')) return 'teacher';
    if (location.pathname.includes('/student')) return 'student';
    if (location.pathname.includes('/parent')) return 'parent';
    if (location.pathname.includes('/admin')) return 'admin';
    return initialRole;
  })();

  const config = ROLE_CONFIGS[currentRole];

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingState, setPendingState] = useState<{ requestId: string; fullName: string; role: string } | null>(null);
  const [roleMismatchAlert, setRoleMismatchAlert] = useState<string | null>(null);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showHelpdeskModal, setShowHelpdeskModal] = useState(false);

  const [reqFullName, setReqFullName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqRole, setReqRole] = useState(config.roleKey);
  const [reqPassword, setReqPassword] = useState('Password@2026');
  const [reqPhone, setReqPhone] = useState('');
  const [reqDepartment, setReqDepartment] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState<{ requestId: string; message: string } | null>(null);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });

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

    if (!identifier.trim()) { setErrorMessage(`Please enter your ${config.identifierLabel.toLowerCase()}.`); return; }
    if (!password) { setErrorMessage('Please enter your password.'); return; }

    setLoading(true);
    try {
      const res = await login(identifier, password, config.roleKey);
      if (res.roleMismatchWarning) setRoleMismatchAlert(res.roleMismatchWarning);
      setTimeout(() => navigate('/dashboard'), 350);
    } catch (err: any) {
      if (err.data && err.data.status === 'PENDING') {
        setPendingState({ requestId: err.data.requestId || 'REQ-88419', fullName: err.data.user?.fullName || identifier, role: err.data.user?.role || config.roleKey });
      } else {
        setErrorMessage(err.message || 'Authentication failed. Check credentials or contact school desk.');
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
      const res = await api.register({ fullName: reqFullName, email: reqEmail, password: reqPassword, role: reqRole, phone: reqPhone, department: reqDepartment, notes: reqNotes });
      setReqSuccess({ requestId: res.requestId, message: res.message });
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

  const modalStyle = {
    background: 'rgba(15, 23, 42, 0.9)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
  };
  const roleHeroImage = {
    admin: '/assets/heroes/admin_hero.jpg',
    teacher: '/assets/heroes/teacher_hero.jpg',
    student: '/assets/heroes/student_hero.jpg',
    parent: '/assets/heroes/parent_hero.jpg',
  }[currentRole];

  return (
    <div className="campus-login min-h-screen bg-[#f8f9fc] text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-teal-500 selection:text-white">
      {/* Aurora BG */}
      <div className="cinema-bg" />
      <div className="mesh-dots" />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 60%)` }}
      />
      <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 60%)' }}
      />

      {/* Top Header */}
      <header className="campus-login-header w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-display tracking-tight">CampusOS</div>
            <div className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">CBSE-AFF-9801</div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-iris-300 px-3 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.15)' }}
          >
            <span>← Gateway</span>
          </Link>
          <button type="button" onClick={() => setShowHelpdeskModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Help Desk</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-auto z-10 py-4">
        <div className="campus-login-shell rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            boxShadow: `0 40px 80px rgba(0,0,0,0.4), 0 0 80px ${config.glowColor}`,
          }}
        >
          {/* LEFT: Hero Visual */}
          <div
            ref={heroRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="campus-login-visual hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 overflow-hidden select-none parallax-container"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(17,43,62,.08) 0%, rgba(17,43,62,.12) 42%, rgba(246,249,248,.94) 100%), url('${roleHeroImage}')` }}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out"
              style={{
                background: `radial-gradient(circle at ${50 + mousePos.x * 30}% ${50 + mousePos.y * 30}%, ${config.glowColor}, transparent 60%)`,
                transform: `scale(1.2)`,
              }}
            />

            {/* Animated morph blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 animate-morphBlob opacity-20 pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${config.glowColor}, rgba(6, 182, 212, 0.15))` }}
            />

            {/* Top badges */}
            <div className="relative z-10 flex items-center justify-between">
              <span className={`${config.badgeClass} badge text-[10px]`}>{config.badgeLabel}</span>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold badge badge-emerald">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>256-Bit SSL</span>
              </div>
            </div>

            {/* Bottom content */}
            <div className="relative z-10 mt-auto space-y-3">
              <div className="rounded-xl p-5" style={{ background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                <h2 className="text-xl font-bold text-white leading-snug font-display tracking-tight mb-2">
                  {config.heroHeadline}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">{config.heroSubline}</p>
              </div>

              <div className="rounded-xl p-3.5 flex items-center justify-between gap-3"
                style={{ background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(148, 163, 184, 0.06)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.iconGradient} flex items-center justify-center shadow-lg`}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">CampusOS Portal</div>
                    <div className="text-[10px] text-slate-500">{config.floatingFeature}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase font-bold text-cyan-400">Status</div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Sign-In Form */}
          <div className="campus-login-form lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between relative">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-iris-500/20 to-transparent" />

            <div>
              {/* Role Header */}
              <div className="mb-6 pb-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.iconGradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    {config.roleIcon}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">{config.portalTitle}</h1>
                    <p className="text-xs text-slate-500 mt-0.5">{config.portalSubtitle}</p>
                  </div>
                </div>
                <button type="button" onClick={handlePrefillDemo}
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-teal-600 hover:text-iris-300"
                  style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.15)' }}
                  title="Prefill demo credentials"
                >
                  <Sparkles className="w-3 h-3" /> Demo
                </button>
              </div>

              {/* Error / Alerts */}
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5"
                  style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.15)', color: '#fb7185' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div><span className="font-bold">Error: </span>{errorMessage}</div>
                </div>
              )}

              {roleMismatchAlert && (
                <div className="mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5"
                  style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', color: '#a78bfa' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>{roleMismatchAlert}</div>
                </div>
              )}

              {pendingState && (
                <div className="mb-5 p-4 rounded-xl text-xs space-y-2"
                  style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
                >
                  <div className="flex items-center gap-2 font-bold"><Clock className="w-4 h-4 animate-spin" /> Pending Verification</div>
                  <p className="text-amber-300/80">
                    Registration for <strong>{pendingState.fullName}</strong> as <strong>{pendingState.role}</strong> is in queue.
                  </p>
                  <div className="flex items-center justify-between pt-2 font-mono text-[11px] text-amber-400/60" style={{ borderTop: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    <span>Ref: <strong>{pendingState.requestId}</strong></span>
                    <span className="badge badge-amber text-[9px]">PENDING</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="identifier-input" className="block text-xs font-bold text-slate-300 mb-1.5">
                    {config.identifierLabel} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      {currentRole === 'parent' ? <Phone className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    </div>
                    <input
                      id="identifier-input"
                      type={config.identifierType}
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={config.identifierPlaceholder}
                      className="input-dark w-full pl-10 pr-4"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1.5">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    <span>{config.identifierHint}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password-input" className="block text-xs font-bold text-slate-300">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <button type="button" onClick={() => setShowForgotModal(true)}
                      className="text-xs font-bold text-teal-600 hover:text-iris-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-dark w-full pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 font-medium">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-iris-600 focus:ring-iris-500 focus:ring-offset-0"
                    />
                    <span>Remember device</span>
                  </label>
                  <button type="button" onClick={handlePrefillDemo} className="sm:hidden text-xs font-bold text-teal-600 cursor-pointer">
                    Use Demo
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2 active:scale-[0.99] bg-gradient-to-r ${config.gradient} hover:shadow-lg`}
                  style={{ boxShadow: `0 8px 25px ${config.glowColor}` }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                  ) : (
                    <><span>{config.buttonLabel}</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom links */}
            <div className="pt-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500"
              style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}
            >
              <div>
                <span>New to school? </span>
                <button type="button" onClick={() => setShowRequestModal(true)}
                  className="font-bold text-teal-600 hover:text-iris-300 cursor-pointer transition-colors"
                >Request access</button>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                {config.otherRoles.map((r) => (
                  <Link key={r.key} to={r.path} className="text-slate-500 hover:text-white font-semibold transition-colors">
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-600 z-10 flex flex-wrap items-center justify-between gap-2">
        <div>© 2026 CampusOS. All rights reserved.</div>
        <div className="flex items-center gap-4 font-semibold">
          <button type="button" onClick={() => setShowHelpdeskModal(true)}
            className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-500" /> +91 (080) 2845-7800
          </button>
        </div>
      </footer>

      {/* Helpdesk Modal */}
      {showHelpdeskModal && (
        <div className="campus-login-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowHelpdeskModal(false)}
        >
          <div className="campus-login-modal rounded-2xl max-w-md w-full p-6 sm:p-7 relative animate-scaleIn" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowHelpdeskModal(false)} className="absolute top-5 right-5 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center shadow-lg"><PhoneCall className="w-5 h-5 text-white" /></div>
              <div><h3 className="text-lg font-bold text-white font-display">Oakridge Help Desk</h3><p className="text-xs text-slate-500">Official Support</p></div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">For login issues, mobile updates, or roll number assistance.</p>
            <div className="space-y-2.5 mb-5">
              <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-cyan-400" /><div><div className="text-[10px] font-bold text-slate-500 uppercase">School Line</div><div className="text-sm font-bold text-white">+91 (080) 2845-7800</div></div></div>
                <span className="badge badge-emerald text-[9px]">8am-4:30pm</span>
              </div>
              <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <div className="flex items-center gap-2.5"><MessageSquare className="w-4 h-4 text-emerald-400" /><div><div className="text-[10px] font-bold text-emerald-400 uppercase">WhatsApp</div><div className="text-sm font-bold text-white">+91 98000 12345</div></div></div>
                <span className="badge badge-emerald text-[9px]">Fast Reply</span>
              </div>
              <div className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <Mail className="w-4 h-4 text-slate-400" /><div><div className="text-[10px] font-bold text-slate-500 uppercase">Email Support</div><div className="text-xs font-bold text-white">support@campusos.edu</div></div>
              </div>
            </div>
            <button type="button" onClick={() => setShowHelpdeskModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)' }}
            >Return to Login</button>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="campus-login-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => { setShowRequestModal(false); setReqSuccess(null); }}
        >
          <div className="campus-login-modal rounded-2xl max-w-lg w-full p-6 sm:p-8 relative animate-scaleIn" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { setShowRequestModal(false); setReqSuccess(null); }}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
            ><X className="w-5 h-5" /></button>

            {reqSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Request Submitted</h3>
                <p className="text-sm text-slate-400">Ticket <strong className="text-white">#{reqSuccess.requestId}</strong> logged for admin review.</p>
                <div className="p-4 rounded-xl text-xs text-slate-400 text-left space-y-1 font-mono"
                  style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.06)' }}
                >
                  <div>Applicant: {reqFullName}</div><div>Role: {reqRole}</div><div>Status: PENDING</div>
                </div>
                <button type="button" onClick={() => { setShowRequestModal(false); setReqSuccess(null); }}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                >Return to Portal</button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 text-teal-600">
                  <Building2 className="w-4 h-4" /> Access Request
                </div>
                <h3 className="text-xl font-bold text-white font-display mb-1">Request Portal Account</h3>
                <p className="text-xs text-slate-500 mb-6">Submit details for admin verification and role activation.</p>
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                    <input type="text" required value={reqFullName} onChange={(e) => setReqFullName(e.target.value)} placeholder="e.g. Dr. Jennifer Croft" className="input-dark" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label><input type="email" required value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} placeholder="name@campusos.edu" className="input-dark" /></div>
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
                      <select value={reqRole} onChange={(e) => setReqRole(e.target.value as any)} className="input-dark">
                        <option value="TEACHER">Teacher</option><option value="STUDENT">Student</option><option value="PARENT">Parent</option><option value="SCHOOL_ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label><input type="tel" value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="+91 98000 00000" className="input-dark" /></div>
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1">Department</label><input type="text" value={reqDepartment} onChange={(e) => setReqDepartment(e.target.value)} placeholder="e.g. Science / Grade 10" className="input-dark" /></div>
                  </div>
                  <div><label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label><input type="password" required value={reqPassword} onChange={(e) => setReqPassword(e.target.value)} placeholder="Create password" className="input-dark" /></div>
                  <button type="submit" disabled={reqLoading}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}
                  >{reqLoading ? 'Submitting...' : 'Submit for Approval'}</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="campus-login-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => { setShowForgotModal(false); setForgotSuccess(null); }}
        >
          <div className="campus-login-modal rounded-2xl max-w-md w-full p-6 sm:p-8 relative animate-scaleIn" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { setShowForgotModal(false); setForgotSuccess(null); }}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
            ><X className="w-5 h-5" /></button>

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center mx-auto shadow-lg"><CheckCircle className="w-6 h-6 text-white" /></div>
                <h3 className="text-lg font-bold text-white font-display">Recovery Sent</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{forgotSuccess}</p>
                <button type="button" onClick={() => { setShowForgotModal(false); setForgotSuccess(null); }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                >Close</button>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-600 to-iris-500 flex items-center justify-center mb-3 shadow-lg"><Key className="w-5 h-5 text-white" /></div>
                <h3 className="text-xl font-bold text-white font-display mb-1">Reset Password</h3>
                <p className="text-xs text-slate-500 mb-5">Enter your registered identifier to receive reset instructions.</p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Registered Identifier</label>
                    <input type="text" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="e.g. email@campusos.edu" className="input-dark" />
                  </div>
                  <button type="submit"
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)' }}
                  >Send Reset Link</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

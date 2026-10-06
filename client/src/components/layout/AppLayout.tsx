import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BrandLogo } from '../brand/BrandLogo';
import { NotificationCenter } from '../notifications/NotificationCenter';
import {
  Shield, LayoutDashboard, Users, GraduationCap, HeartHandshake, CheckSquare,
  CalendarDays, BookOpen, Clock, Calendar, Megaphone, Sparkles, TrendingUp,
  Building2, FileText, Settings, Key, ShieldAlert, LogOut, Search, Bell,
  Menu, X, ChevronDown, CheckCircle, ArrowUpRight, Compass, Sparkle, RefreshCw,
  DollarSign, Bus, Award, Briefcase, Command, Zap, ChevronRight
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Quiet fail
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    return () => clearInterval(timer);
  }, []);

  // Global CMD+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search execution
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const sampleResults = [
      { type: 'Student', title: 'Arav Patel (Grade 10A)', link: '/students/stu_1', desc: 'Roll #14 • GPA 3.92', icon: Users },
      { type: 'Student', title: 'Diya Patel (Grade 7A)', link: '/students/stu_2', desc: 'Roll #09 • GPA 3.88', icon: Users },
      { type: 'Teacher', title: 'Mrs. Priya Nair', link: '/teachers/tch_1', desc: 'Mathematics Faculty', icon: GraduationCap },
      { type: 'Teacher', title: 'Dr. Marcus Vance', link: '/teachers/tch_2', desc: 'Physics Department Head', icon: GraduationCap },
      { type: 'Homework', title: 'Calculus Optimization', link: '/homework', desc: 'Grade 10A • Due Sept 15', icon: BookOpen },
      { type: 'Event', title: 'Annual STEM Summit 2026', link: '/events', desc: 'Oct 15 • Grand Auditorium', icon: Calendar },
      { type: 'Announcement', title: 'Mid-Term Hall Tickets', link: '/announcements', desc: 'Published by Principal', icon: Megaphone },
      { type: 'Module', title: 'Attendance Taker', link: '/attendance', desc: 'Daily Class Roster', icon: CheckSquare },
      { type: 'Module', title: 'Payroll & Salaries', link: '/payroll', desc: 'Staff Salary Disbursements & Payslips', icon: DollarSign },
      { type: 'Module', title: 'Staff & Personnel Directory', link: '/staff-management', desc: 'Faculty Credentials & HR Dossiers', icon: Briefcase },
      { type: 'Module', title: 'Subject Assessments Portal', link: user?.role === 'STUDENT' ? '/assessment-portal' : '/assessments', desc: 'Unit Tests, Lab Practicals & Marks', icon: Award },
      { type: 'Module', title: 'Campus Transportation', link: '/transport', desc: 'GPS Fleet, Bus Routes & Stops', icon: Bus },
      { type: 'Module', title: 'Timetable Builder', link: '/timetable', desc: 'Weekly Schedule Grid', icon: Clock },
      { type: 'Module', title: 'Leave Approvals', link: '/leave', desc: 'Pending Requests', icon: CalendarDays },
    ].filter((item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.type.toLowerCase().includes(q));

    setSearchResults(sampleResults);
  }, [searchQuery]);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ALL'] },
      ]
    },
    {
      label: 'People',
      items: [
        { label: 'Students', icon: Users, path: '/students', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
        { label: 'Faculty', icon: GraduationCap, path: '/teachers', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
        { label: 'Staff & HR', icon: Briefcase, path: '/staff-management', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
        { label: 'Parents', icon: HeartHandshake, path: '/parents', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      ]
    },
    {
      label: 'Academics',
      items: [
        { label: 'Attendance', icon: CheckSquare, path: '/attendance', roles: ['ALL'] },
        { label: 'Homework', icon: BookOpen, path: '/homework', roles: ['ALL'] },
        { label: 'Assessments', icon: Award, path: user?.role === 'STUDENT' ? '/assessment-portal' : '/assessments', roles: ['ALL'] },
        { label: 'Timetable', icon: Clock, path: '/timetable', roles: ['ALL'] },
        { label: 'Performance', icon: TrendingUp, path: '/performance', roles: ['ALL'] },
      ]
    },
    {
      label: 'Operations',
      items: [
        { label: 'Payroll', icon: DollarSign, path: '/payroll', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
        { label: 'Transport', icon: Bus, path: '/transport', roles: ['ALL'] },
        { label: 'Leave', icon: CalendarDays, path: '/leave', roles: ['ALL'] },
      ]
    },
    {
      label: 'Community',
      items: [
        { label: 'Events', icon: Calendar, path: '/events', roles: ['ALL'] },
        { label: 'Announcements', icon: Megaphone, path: '/announcements', roles: ['ALL'] },
        { label: 'Spotlight', icon: Sparkles, path: '/spotlight', roles: ['ALL'] },
      ]
    },
    {
      label: 'Administration',
      items: [
        { label: 'School Mgmt', icon: Building2, path: '/school-management', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
        { label: 'Reports', icon: FileText, path: '/reports', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      ]
    }
  ];

  const adminNavItems = [
    { label: 'Users & Access', icon: Key, path: '/admin/users' },
    { label: 'Roles & RBAC', icon: Shield, path: '/admin/roles' },
    { label: 'Audit Logs', icon: ShieldAlert, path: '/admin/audit-logs' },
  ];

  const sidebarWidth = sidebarCollapsed ? 'w-[72px]' : 'w-64';

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'SCHOOL_ADMIN': return 'from-iris-600 to-iris-500';
      case 'TEACHER': return 'from-cyan-600 to-cyan-500';
      case 'STUDENT': return 'from-emerald-600 to-emerald-500';
      case 'PARENT': return 'from-amber-600 to-amber-500';
      default: return 'from-slate-600 to-slate-500';
    }
  };

  return (
    <div className="campus-app-shell min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Aurora background */}
      <div className="aurora-bg" />
      <div className="mesh-grid" />

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`campus-app-sidebar fixed inset-y-0 left-0 z-40 ${sidebarWidth} flex flex-col justify-between transition-all duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          borderRight: '1px solid rgba(148, 163, 184, 0.08)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iris-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-iris-600/20">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-display tracking-tight">CampusOS</div>
                  <div className="text-[9px] font-bold text-iris-400 uppercase tracking-widest">Smart ERP</div>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iris-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-iris-600/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Badge */}
          {!sidebarCollapsed && (
            <div className="mx-3 mt-3 mb-2 p-3 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user?.fullName || 'User'}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-iris-500/20"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{user?.fullName || 'User'}</div>
                  <div className={`text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r ${getRoleBadgeColor(user?.role)} bg-clip-text text-transparent`}>
                    {user?.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {navGroups.map((group) => {
              const filteredItems = group.items.filter(
                (item) => item.roles.includes('ALL') || (user && item.roles.includes(user.role))
              );
              if (filteredItems.length === 0) return null;

              return (
                <div key={group.label} className="mb-1">
                  {!sidebarCollapsed && (
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-600 px-3 pt-3 pb-1.5">
                      {group.label}
                    </div>
                  )}
                  {filteredItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const isHovered = hoveredNav === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        onMouseEnter={() => setHoveredNav(item.path)}
                        onMouseLeave={() => setHoveredNav(null)}
                        className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                          sidebarCollapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 hover:text-slate-100'
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        {/* Active indicator glow */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-iris-600/15 to-cyan-600/10 border border-iris-500/20" />
                        )}
                        {/* Hover glow */}
                        {isHovered && !isActive && (
                          <div className="absolute inset-0 rounded-xl bg-slate-800/40" />
                        )}
                        {/* Active left accent */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-iris-500 to-cyan-500" />
                        )}
                        <item.icon className={`relative w-4 h-4 flex-shrink-0 ${isActive ? 'text-iris-400' : ''}`} />
                        {!sidebarCollapsed && <span className="relative truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              );
            })}

            {/* Admin Governance Group */}
            {isSuperAdmin && (
              <div className="mb-1">
                {!sidebarCollapsed && (
                  <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-amber-500/70 px-3 pt-3 pb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Governance
                  </div>
                )}
                {adminNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                        sidebarCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'text-amber-300'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-amber-500/10 border border-amber-500/20" />
                      )}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-amber-400 to-amber-600" />
                      )}
                      <item.icon className={`relative w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                      {!sidebarCollapsed && <span className="relative truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-2 border-t border-slate-800/50 space-y-0.5">
            {/* Collapse toggle (desktop) */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>

            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Settings className="w-4 h-4" />
              {!sidebarCollapsed && <span>Settings</span>}
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN VIEWPORT */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        {/* Top Navbar */}
        <header
          className="campus-app-topbar sticky top-0 z-30 h-14 px-4 sm:px-6 flex items-center justify-between"
          style={{
            background: 'rgba(2, 6, 23, 0.7)',
            backdropFilter: 'blur(20px) saturate(1.5)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-500 text-xs font-medium transition-all w-44 sm:w-64 hover:text-slate-300"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.08)',
              }}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="truncate">Search anything...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md text-slate-600 font-semibold"
                style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
              >
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer group"
                title="Notifications"
              >
                <Bell className="w-[18px] h-[18px] group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-extrabold text-white ring-2 ring-slate-950 animate-pulse"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <NotificationCenter
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onRefresh={loadNotifications}
                  onClose={() => setShowNotifMenu(false)}
                />
              )}
            </div>

            {/* Landing link */}
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-400 hover:text-white transition-all"
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.06)',
              }}
            >
              <Compass className="w-3.5 h-3.5 text-iris-400" />
              <span className="hidden sm:inline">Campus</span>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="campus-app-content flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>

      {/* COMMAND PALETTE MODAL */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          style={{ background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSearchModal(false); }}
        >
          <div
            className="max-w-2xl w-full rounded-2xl overflow-hidden animate-scaleIn"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(40px) saturate(2)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5), 0 0 80px rgba(124, 58, 237, 0.1)',
            }}
          >
            {/* Search Input */}
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <Search className="w-5 h-5 text-iris-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, faculty, modules..."
                className="w-full text-sm text-white placeholder:text-slate-500 outline-none font-medium bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-[10px] px-2 py-1 rounded-lg text-slate-400 font-mono font-bold"
                style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <div className="text-sm text-slate-500 font-medium">
                    {searchQuery ? 'No matching records found' : 'Start typing to search...'}
                  </div>
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <Link
                    key={i}
                    to={res.link}
                    onClick={() => setShowSearchModal(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.15)' }}
                      >
                        <res.icon className="w-4 h-4 text-iris-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200 group-hover:text-white">{res.title}</div>
                        <div className="text-xs text-slate-500">{res.desc}</div>
                      </div>
                    </div>
                    <span className="badge badge-iris text-[9px]">{res.type}</span>
                  </Link>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-600 font-medium"
              style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">↵</kbd> Open
                </span>
              </div>
              <span>CampusOS Spotlight</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

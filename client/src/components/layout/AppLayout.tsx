import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BrandLogo } from '../brand/BrandLogo';
import {
  Shield, LayoutDashboard, Users, GraduationCap, HeartHandshake, CheckSquare,
  CalendarDays, BookOpen, Clock, Calendar, Megaphone, Sparkles, TrendingUp,
  Building2, FileText, Settings, Key, ShieldAlert, LogOut, Search, Bell,
  Menu, X, ChevronDown, CheckCircle, ArrowUpRight, Compass, Sparkle, RefreshCw
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search query in Command Palette
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

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
      { type: 'Student', title: 'Arav Patel (Grade 10A)', link: '/students/stu_1', desc: 'Roll #14 • GPA 3.92' },
      { type: 'Student', title: 'Diya Patel (Grade 7A)', link: '/students/stu_2', desc: 'Roll #09 • GPA 3.88' },
      { type: 'Teacher', title: 'Mrs. Priya Nair', link: '/teachers/tch_1', desc: 'Mathematics Faculty' },
      { type: 'Teacher', title: 'Dr. Marcus Vance', link: '/teachers/tch_2', desc: 'Physics Department Head' },
      { type: 'Homework', title: 'Calculus Optimization', link: '/homework', desc: 'Grade 10A • Due Sept 15' },
      { type: 'Event', title: 'Annual STEM Summit 2026', link: '/events', desc: 'Oct 15 • Grand Auditorium' },
      { type: 'Announcement', title: 'Mid-Term Hall Tickets', link: '/announcements', desc: 'Published by Principal' },
      { type: 'Module', title: 'Attendance Taker', link: '/attendance', desc: 'Daily Class Roster' },
      { type: 'Module', title: 'Timetable Builder', link: '/timetable', desc: 'Weekly Schedule Grid' },
      { type: 'Module', title: 'Leave Approvals', link: '/leave', desc: 'Pending Requests' },
    ].filter((item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.type.toLowerCase().includes(q));

    setSearchResults(sampleResults);
  }, [searchQuery]);

  const handleRoleQuickSwitch = async (role: string) => {
    if (role === 'SUPER_ADMIN') await login('admin@campusos.edu', 'Admin@2026');
    else if (role === 'TEACHER') await login('priya.nair@campusos.edu', 'Teacher@2026');
    else if (role === 'STUDENT') await login('arav.patel@campusos.edu', 'Student@2026');
    else if (role === 'PARENT') await login('rajesh.patel@gmail.com', 'Parent@2026');
    navigate('/dashboard');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ALL'] },
    { label: 'Students', icon: Users, path: '/students', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
    { label: 'Teachers & Faculty', icon: GraduationCap, path: '/teachers', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
    { label: 'Parents Directory', icon: HeartHandshake, path: '/parents', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
    { label: 'Daily Attendance', icon: CheckSquare, path: '/attendance', roles: ['ALL'] },
    { label: 'Leave Management', icon: CalendarDays, path: '/leave', roles: ['ALL'] },
    { label: 'Homework Hub', icon: BookOpen, path: '/homework', roles: ['ALL'] },
    { label: 'Timetable Schedule', icon: Clock, path: '/timetable', roles: ['ALL'] },
    { label: 'Events & Occasions', icon: Calendar, path: '/events', roles: ['ALL'] },
    { label: 'Announcements', icon: Megaphone, path: '/announcements', roles: ['ALL'] },
    { label: 'Campus Spotlight', icon: Sparkles, path: '/spotlight', roles: ['ALL'] },
    { label: 'Academic Performance', icon: TrendingUp, path: '/performance', roles: ['ALL'] },
    { label: 'School Management', icon: Building2, path: '/school-management', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
    { label: 'Reporting & Exports', icon: FileText, path: '/reports', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
  ];

  const adminNavItems = [
    { label: 'Users & Approvals', icon: Key, path: '/admin/users' },
    { label: 'Roles & RBAC', icon: Shield, path: '/admin/roles' },
    { label: 'Security Audit Logs', icon: ShieldAlert, path: '/admin/audit-logs' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* SIDEBAR NAVIGATION (Clean Light Theme with High Contrast) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white text-slate-700 border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <BrandLogo
              variant="light"
              size="sm"
              showSubtitle={false}
              showBadge={true}
              badgeText="CBSE"
              to="/dashboard"
            />

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Mini Badge in Sidebar */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user?.fullName || 'User'}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'Institutional User'}</div>
                <div className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">{user?.role}</div>
              </div>
            </div>
          </div>

          {/* Navigation Items List */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Academic & Campus
            </div>

            {navItems
              .filter((item) => item.roles.includes('ALL') || (user && item.roles.includes(user.role)))
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-navy-800 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

            {/* Admin Governance Group */}
            {isSuperAdmin && (
              <div className="pt-4 space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 px-3 mb-2">
                  Governance & Control
                </div>
                {adminNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Settings & Logout */}
          <div className="p-3 border-t border-slate-200 space-y-1">
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Platform Settings</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 text-xs font-semibold transition-colors w-44 sm:w-64"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">Search records...</span>
              <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-bold">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Dropdown in Topbar */}
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-500 font-bold mr-1">Switch Role:</span>
              <button
                type="button"
                onClick={() => handleRoleQuickSwitch('SUPER_ADMIN')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  user?.role === 'SUPER_ADMIN' ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSwitch('TEACHER')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  user?.role === 'TEACHER' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSwitch('STUDENT')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  user?.role === 'STUDENT' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSwitch('PARENT')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  user?.role === 'PARENT' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Parent
              </button>
            </div>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-scaleIn">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {unreadCount} Unread
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.markAllNotificationsRead();
                        loadNotifications();
                      }}
                      className="text-xs text-teal-700 hover:underline font-bold"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 font-medium">No new notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 space-y-1">
                          <div className="text-xs font-bold text-slate-900">{n.title}</div>
                          <div className="text-xs text-slate-600 leading-relaxed font-normal">{n.message}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Back to Real Campus Button */}
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Real Campus</span>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* COMMAND PALETTE MODAL (CMD+K) */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, faculty, timetable, assignments..."
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 outline-none font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono font-bold"
              >
                ESC
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  {searchQuery ? 'No matching records found.' : 'Type a name, class, subject, or module...'}
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <Link
                    key={i}
                    to={res.link}
                    onClick={() => setShowSearchModal(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700">{res.title}</div>
                      <div className="text-[11px] text-slate-600">{res.desc}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {res.type}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

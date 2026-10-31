import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api, type User } from "../../services/api";
import { BrandLogo } from "../brand/BrandLogo";
import { useWorkspaceTheme } from "../../hooks/useWorkspaceTheme";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HeartHandshake,
  CheckSquare,
  CalendarDays,
  BookOpen,
  Clock,
  Calendar,
  Megaphone,
  Sparkles,
  TrendingUp,
  Building2,
  FileText,
  Settings,
  KeyRound,
  ShieldCheck,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  Bus,
  Award,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import "../../workspace.css";

type NavItem = {
  label: string;
  path: string;
  icon: typeof Users;
  roles?: User["role"][];
};
const admins: User["role"][] = ["SUPER_ADMIN", "SCHOOL_ADMIN"];
const faculty: User["role"][] = [...admins, "TEACHER"];
const academic: User["role"][] = [...faculty, "STUDENT", "PARENT"];

function navigation(role?: User["role"]) {
  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "People",
      items: [
        { label: "Students", path: "/students", icon: Users, roles: faculty },
        {
          label: "Faculty",
          path: "/teachers",
          icon: GraduationCap,
          roles: faculty,
        },
        {
          label: "Staff & HR",
          path: "/staff-management",
          icon: Briefcase,
          roles: admins,
        },
        {
          label: "Parents",
          path: "/parents",
          icon: HeartHandshake,
          roles: faculty,
        },
      ],
    },
    {
      label: "Academics",
      items: [
        {
          label: "Attendance",
          path: "/attendance",
          icon: CheckSquare,
          roles: academic,
        },
        {
          label: "Homework",
          path: "/homework",
          icon: BookOpen,
          roles: academic,
        },
        {
          label: "Assessments",
          path: role === "STUDENT" ? "/assessment-portal" : "/assessments",
          icon: Award,
          roles: academic,
        },
        {
          label: "Timetable",
          path: "/timetable",
          icon: Clock,
          roles: academic,
        },
        {
          label: "Performance",
          path: "/performance",
          icon: TrendingUp,
          roles: academic,
        },
      ],
    },
    {
      label: "Campus",
      items: [
        {
          label: "Staff teams",
          path: "/staff-services",
          icon: Users,
          roles: [...faculty, "STAFF"],
        },
        { label: "Transport", path: "/transport", icon: Bus },
        { label: "Leave", path: "/leave", icon: CalendarDays },
        { label: "Events", path: "/events", icon: Calendar },
        { label: "Announcements", path: "/announcements", icon: Megaphone },
        {
          label: "Spotlight",
          path: "/spotlight",
          icon: Sparkles,
          roles: academic,
        },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          label: "School Mgmt",
          path: "/school-management",
          icon: Building2,
          roles: admins,
        },
        { label: "Reports", path: "/reports", icon: FileText, roles: faculty },
        { label: "Payroll", path: "/payroll", icon: Briefcase, roles: admins },
        {
          label: "Users & Access",
          path: "/admin/users",
          icon: KeyRound,
          roles: admins,
        },
        {
          label: "Roles & RBAC",
          path: "/admin/roles",
          icon: ShieldCheck,
          roles: admins,
        },
        {
          label: "Audit Logs",
          path: "/admin/audit-logs",
          icon: FileText,
          roles: admins,
        },
      ],
    },
  ];
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || Boolean(role && item.roles.includes(role)),
      ),
    }))
    .filter((group) => group.items.length);
}

type Notification = Awaited<
  ReturnType<typeof api.getNotifications>
>["notifications"][number];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme: workspaceTheme, toggleTheme } = useWorkspaceTheme();
  const [mobileViewport, setMobileViewport] = useState(
    () => window.matchMedia("(max-width: 1023px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setMobileViewport(media.matches);
      if (!media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationLoading, setNotificationLoading] = useState(true);
  const commandRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const navGroups = useMemo(() => navigation(user?.role), [user?.role]);
  const allPages = useMemo(
    () => [
      ...navGroups.flatMap((group) => group.items),
      { label: "Settings", path: "/settings", icon: Settings },
    ],
    [navGroups],
  );
  const currentPage = allPages.find(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`),
  );
  const matches = allPages.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const initials =
    user?.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join("") || "CO";
  const roleName =
    user?.role === "SCHOOL_ADMIN"
      ? "School administrator"
      : user?.role === "SUPER_ADMIN"
        ? "Administrator"
        : user?.role
          ? user.role[0] + user.role.slice(1).toLowerCase()
          : "Campus member";

  async function loadNotifications() {
    setNotificationError("");
    try {
      const result = await api.getNotifications();
      setNotifications(result.notifications || []);
      setUnread(result.unreadCount || 0);
    } catch {
      setNotificationError(
        "Notifications could not be loaded. Please try again.",
      );
    } finally {
      setNotificationLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await api.getNotifications();
        if (active) {
          setNotifications(result.notifications || []);
          setUnread(result.unreadCount || 0);
          setNotificationError("");
        }
      } catch {
        if (active)
          setNotificationError(
            "Notifications could not be loaded. Please try again.",
          );
      } finally {
        if (active) setNotificationLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.id]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (commandRef.current?.open) commandRef.current.close();
        else commandRef.current?.showModal();
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
        setNotificationOpen(false);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current
      ?.querySelector<HTMLButtonElement>(".workspace-close")
      ?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = drawerRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!elements?.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", trapFocus);
      previous?.focus();
    };
  }, [mobileOpen]);

  async function readNotification(item: Notification) {
    try {
      if (!item.is_read) await api.markNotificationRead(item.id);
      await loadNotifications();
      const safeLink =
        typeof item.link === "string" &&
        item.link.startsWith("/") &&
        !item.link.startsWith("//");
      if (safeLink) {
        setNotificationOpen(false);
        navigate(item.link);
      }
    } catch {
      setNotificationError(
        "We could not update this notification. Please try again.",
      );
    }
  }

  return (
    <div
      className={`workspace-shell ${collapsed ? "workspace-collapsed" : ""}`}
      data-workspace-theme={workspaceTheme}
    >
      <a className="workspace-skip" href="#workspace-content">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="workspace-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={drawerRef}
        inert={mobileViewport && !mobileOpen}
        aria-hidden={mobileViewport && !mobileOpen ? true : undefined}
        className={`workspace-sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen || undefined}
      >
        <div className="workspace-brand">
          <BrandLogo
            size="sm"
            showSubtitle={false}
            showBadge={false}
            variant={workspaceTheme === "dark" ? "dark" : "light"}
            to="/dashboard"
            className={collapsed ? "workspace-logo-collapsed" : ""}
          />
          <button
            type="button"
            className="workspace-icon-button workspace-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        {!collapsed && (
          <div className="workspace-school">
            <span className="workspace-school-icon">
              <Building2 size={19} />
            </span>
            <div>
              <strong>Campus workspace</strong>
              <span>{roleName}</span>
            </div>
            <ShieldCheck size={16} />
          </div>
        )}
        <nav className="workspace-navigation">
          {navGroups.map((group) => (
            <div className="workspace-nav-group" key={group.label}>
              {!collapsed && <p>{group.label}</p>}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `workspace-nav-item ${isActive ? "is-active" : ""}`
                  }
                >
                  <item.icon size={18} strokeWidth={1.7} />
                  <span>{item.label}</span>
                  <ChevronRight className="workspace-nav-chevron" size={14} />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <NavLink
            className="workspace-nav-item"
            to="/settings"
            title="Settings"
          >
            <Settings size={18} strokeWidth={1.7} />
            <span>Settings</span>
          </NavLink>
          <button
            className="workspace-nav-item workspace-collapse"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            <span>Collapse sidebar</span>
          </button>
          <div className="workspace-profile">
            <span className="workspace-avatar">{initials}</span>
            {!collapsed && (
              <div>
                <strong>{user?.fullName}</strong>
                <span>{roleName}</span>
              </div>
            )}
            <button
              className="workspace-icon-button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            <button
              type="button"
              className="workspace-icon-button workspace-menu"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{currentPage?.label || "Campus"}</strong>
          </div>
          <div className="workspace-topbar-actions">
            <button
              className="workspace-icon-button"
              aria-label={`Switch to ${workspaceTheme === "dark" ? "light" : "dark"} workspace theme`}
              onClick={toggleTheme}
            >
              {workspaceTheme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <button
              ref={searchRef}
              className="workspace-search-trigger"
              onClick={() => commandRef.current?.showModal()}
              aria-label="Search workspace pages"
            >
              <Search size={16} />
              <span>Find a page...</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="workspace-notification-wrap">
              <button
                className="workspace-icon-button"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                aria-expanded={notificationOpen}
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                <Bell size={19} />
                {unread > 0 && (
                  <span className="workspace-notification-count">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <section
                  className="workspace-notifications"
                  aria-label="Notifications"
                >
                  <div className="workspace-notifications-heading">
                    <h2>Notifications</h2>
                    <button
                      className="workspace-icon-button"
                      aria-label="Close notifications"
                      onClick={() => setNotificationOpen(false)}
                    >
                      <X size={17} />
                    </button>
                  </div>
                  {notificationLoading ? (
                    <p className="workspace-muted">Loading notifications...</p>
                  ) : notificationError ? (
                    <div className="workspace-notification-error">
                      <p>{notificationError}</p>
                      <button onClick={loadNotifications}>Try again</button>
                    </div>
                  ) : notifications.length ? (
                    <>
                      <div className="workspace-notification-list">
                        {notifications.map((item) => (
                          <button
                            key={item.id}
                            className={`workspace-notification ${item.is_read ? "" : "is-unread"}`}
                            onClick={() => readNotification(item)}
                          >
                            <span className="workspace-notice-icon">
                              <Bell size={16} />
                            </span>
                            <span>
                              <strong>{item.title}</strong>
                              <span>{item.message}</span>
                              <small>
                                {item.created_at
                                  ? new Date(
                                      item.created_at,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : ""}
                              </small>
                            </span>
                            {!item.is_read && (
                              <span className="workspace-unread-dot" />
                            )}
                          </button>
                        ))}
                      </div>
                      <button
                        className="workspace-read-all"
                        onClick={async () => {
                          try {
                            await api.markAllNotificationsRead();
                            await loadNotifications();
                          } catch {
                            setNotificationError(
                              "Unable to mark notifications as read. Please try again.",
                            );
                          }
                        }}
                      >
                        <Check size={15} /> Mark all as read
                      </button>
                    </>
                  ) : (
                    <div className="workspace-notification-empty">
                      <Bell size={25} />
                      <strong>You're all caught up</strong>
                      <p>New campus updates will appear here.</p>
                    </div>
                  )}
                </section>
              )}
            </div>
            <Link to="/" className="workspace-campus-link">
              Campus site <ArrowUpRight size={15} />
            </Link>
            <span
              className="workspace-topbar-avatar"
              aria-label={user?.fullName}
            >
              {initials}
            </span>
          </div>
        </header>
        <main
          id="workspace-content"
          className="workspace-content campus-app-content"
          tabIndex={-1}
        >
          {children}
        </main>
        <footer className="workspace-footer">
          <span>Scholaxys</span>
          <span>Your campus, connected.</span>
          <Link to="/settings">
            Account settings <ArrowUpRight size={12} />
          </Link>
        </footer>
      </div>
      <dialog
        ref={commandRef}
        className="workspace-command"
        onClose={() => {
          setQuery("");
          searchRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) commandRef.current?.close();
        }}
      >
        <div className="workspace-command-search">
          <Search size={20} />
          <input
            autoFocus
            aria-label="Search workspace pages"
            placeholder="Where would you like to go?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="workspace-icon-button"
            aria-label="Close search"
            onClick={() => commandRef.current?.close()}
          >
            <X size={18} />
          </button>
        </div>
        <p className="workspace-command-label">
          {query ? `${matches.length} matching pages` : "Your workspace pages"}
        </p>
        <div className="workspace-command-results">
          {matches.length ? (
            matches.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => commandRef.current?.close()}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                <ArrowUpRight size={15} />
              </Link>
            ))
          ) : (
            <p className="workspace-command-empty">
              No pages match “{query}”. Try another name.
            </p>
          )}
        </div>
        <div className="workspace-command-footer">
          Only pages available to your account are shown.
        </div>
      </dialog>
    </div>
  );
}

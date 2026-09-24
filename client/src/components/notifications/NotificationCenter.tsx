import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Bell, BellRing, Check, CheckCheck, Trash2, X, ExternalLink,
  CalendarDays, BookOpen, CheckSquare, Megaphone, ShieldAlert,
  Sparkles, Filter, Volume2, VolumeX, Clock, ArrowRight, User
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  user_id?: string;
  target_role?: string;
  title: string;
  message: string;
  type?: string;
  category?: 'ACADEMIC' | 'ATTENDANCE' | 'LEAVE' | 'ANNOUNCEMENT' | 'SECURITY' | 'GENERAL';
  link?: string;
  is_read: number | boolean;
  created_at: string;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onRefresh: () => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  onRefresh,
  onClose,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'ACADEMIC' | 'ATTENDANCE' | 'ADMIN'>('ALL');
  const [clearing, setClearing] = useState(false);

  // Derive categories if not explicitly set in backend
  const enhancedNotifs = useMemo(() => {
    return notifications.map((n) => {
      let category = n.category || 'GENERAL';
      let link = n.link;
      const lowerTitle = (n.title || '').toLowerCase();
      const lowerMsg = (n.message || '').toLowerCase();

      if (lowerTitle.includes('homework') || lowerTitle.includes('assignment') || lowerMsg.includes('homework') || lowerMsg.includes('submission')) {
        category = 'ACADEMIC';
        link = link || '/homework';
      } else if (lowerTitle.includes('attendance') || lowerMsg.includes('attendance') || lowerTitle.includes('present') || lowerTitle.includes('absent')) {
        category = 'ATTENDANCE';
        link = link || '/attendance';
      } else if (lowerTitle.includes('leave') || lowerMsg.includes('leave') || lowerMsg.includes('sanction') || lowerTitle.includes('absence')) {
        category = 'LEAVE';
        link = link || '/leave';
      } else if (lowerTitle.includes('security') || lowerTitle.includes('login') || lowerTitle.includes('approval') || lowerTitle.includes('access')) {
        category = 'SECURITY';
        link = link || '/admin/users';
      } else if (lowerTitle.includes('announcement') || lowerTitle.includes('circular') || lowerTitle.includes('event')) {
        category = 'ANNOUNCEMENT';
        link = link || '/announcements';
      }

      return {
        ...n,
        category,
        link,
      };
    });
  }, [notifications]);

  // Filter based on active tab
  const filteredNotifs = useMemo(() => {
    if (activeTab === 'UNREAD') {
      return enhancedNotifs.filter((n) => !n.is_read);
    }
    if (activeTab === 'ACADEMIC') {
      return enhancedNotifs.filter((n) => n.category === 'ACADEMIC');
    }
    if (activeTab === 'ATTENDANCE') {
      return enhancedNotifs.filter((n) => n.category === 'ATTENDANCE' || n.category === 'LEAVE');
    }
    if (activeTab === 'ADMIN') {
      return enhancedNotifs.filter((n) => n.category === 'SECURITY' || n.category === 'ANNOUNCEMENT');
    }
    return enhancedNotifs;
  }, [enhancedNotifs, activeTab]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      onRefresh();
      toast.success('All notifications marked as read.', 'Inbox Updated');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleMarkSingleRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch {
      // Quiet
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      onRefresh();
      toast.info('Notification dismissed.', 'Removed');
    } catch {
      // Quiet
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await api.clearAllNotifications();
      onRefresh();
      toast.success('Notification tray cleared.', 'Inbox Clean');
    } catch {
      toast.error('Failed to clear notifications.');
    } finally {
      setClearing(false);
    }
  };

  const handleSendTestNotification = () => {
    const testTypes: Array<{ title: string; message: string; type: any }> = [
      { title: 'Leave Application Sanctioned', message: 'Medical absence for Arav Patel has been approved by Class Lead.', type: 'success' },
      { title: 'New Homework Uploaded', message: 'Physics Chapter 4 Numerical proofs due on Monday at 09:00 AM.', type: 'info' },
      { title: 'Daily Attendance Report', message: 'Grade 10 Section A recorded 98.2% attendance today with 0 unexcused leaves.', type: 'success' },
      { title: 'Security Audit Notice', message: 'Authorized login detected from Institutional Chrome Client.', type: 'warning' },
    ];
    const picked = testTypes[Math.floor(Math.random() * testTypes.length)];
    toast.showToast({
      title: picked.title,
      message: picked.message,
      type: picked.type,
      confetti: picked.type === 'success',
    });
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'ATTENDANCE':
        return <CheckSquare className="w-4 h-4 text-teal-600" />;
      case 'LEAVE':
        return <CalendarDays className="w-4 h-4 text-emerald-600" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-navy-600" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ATTENDANCE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'LEAVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SECURITY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ANNOUNCEMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-slate-900/30 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp mt-14 sm:mt-12 mr-0 sm:mr-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-teal-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs relative">
              <BellRing className="w-5 h-5 animate-ring" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  Notification Center
                </h3>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/80 animate-pulse">
                    {unreadCount} Unread
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200/80">
                    All Caught Up
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time campus alerts, assignments, and attendance updates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toast.toggleSound}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={toast.soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
            >
              {toast.soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 overflow-x-auto bg-slate-50/50">
          {[
            { id: 'ALL', label: 'All', count: enhancedNotifs.length },
            { id: 'UNREAD', label: 'Unread', count: unreadCount },
            { id: 'ACADEMIC', label: 'Academic', count: enhancedNotifs.filter((n) => n.category === 'ACADEMIC').length },
            { id: 'ATTENDANCE', label: 'Attendance & Leave', count: enhancedNotifs.filter((n) => n.category === 'ATTENDANCE' || n.category === 'LEAVE').length },
            { id: 'ADMIN', label: 'System', count: enhancedNotifs.filter((n) => n.category === 'SECURITY' || n.category === 'ANNOUNCEMENT').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification Scroll View */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3 shadow-xs animate-floatSoft">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 font-display">
                Zero Pending Notifications
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                You're completely updated with all school announcements, grades, and attendance events.
              </p>
              <button
                type="button"
                onClick={handleSendTestNotification}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Live Notification</span>
              </button>
            </div>
          ) : (
            filteredNotifs.map((n, idx) => {
              const isUnread = !n.is_read;
              return (
                <div
                  key={n.id || idx}
                  onClick={() => {
                    if (isUnread) handleMarkSingleRead(n.id);
                    if (n.link) {
                      navigate(n.link);
                      onClose();
                    }
                  }}
                  className={`
                    group relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-start gap-3
                    ${isUnread ? 'bg-teal-50/40 hover:bg-teal-50/70 border border-teal-200/50 shadow-xs' : 'hover:bg-slate-50/90 border border-transparent'}
                    hover:translate-x-0.5
                  `}
                >
                  {/* Category Icon */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(n.category)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(n.category)}`}>
                        {n.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">
                        {formatRelativeTime(n.created_at)}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 ring-2 ring-teal-100 flex-shrink-0" title="Unread" />
                      )}
                    </div>

                    <h5 className={`text-xs ${isUnread ? 'font-extrabold text-slate-900' : 'font-bold text-slate-800'} font-display leading-snug`}>
                      {n.title}
                    </h5>

                    <p className="text-xs text-slate-600 font-normal leading-relaxed mt-0.5 break-words">
                      {n.message}
                    </p>

                    {/* Footer Row: Actions & Direct Link */}
                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-100/60">
                      {n.link && (
                        <span className="text-[11px] font-bold text-teal-700 group-hover:text-teal-800 flex items-center gap-1">
                          <span>Open View</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkSingleRead(n.id, e)}
                            className="text-[10px] font-semibold text-slate-500 hover:text-teal-700 px-2 py-0.5 rounded hover:bg-slate-200/60"
                            title="Mark as read"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(n.id, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Tray Controls */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Animated Notification</span>
          </button>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearAll}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

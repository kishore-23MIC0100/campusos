import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  CalendarDays, Plus, Search, Filter, CheckCircle2, XCircle,
  Clock, AlertCircle, X, ChevronRight, Check
} from 'lucide-react';

export const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // New leave form
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [fromDate, setFromDate] = useState('2026-09-25');
  const [toDate, setToDate] = useState('2026-09-26');
  const [totalDays, setTotalDays] = useState(2);
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadLeaves = async () => {
    try {
      const res = await api.getLeaves({ status: statusFilter, search });
      setLeaves(res.leaves || []);
      setAnalytics(res.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [statusFilter, search]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    try {
      await api.submitLeave({
        leaveType,
        fromDate,
        toDate,
        totalDays,
        reason,
        isEmergency,
      });

      setShowApplyModal(false);
      setReason('');
      loadLeaves();
      alert('Leave application submitted to administration.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.approveLeave(id, 'Approved by institutional authority.');
      confetti({ particleCount: 50, spread: 60 });
      loadLeaves();
    } catch (err: any) {
      alert(err.message || 'Failed to approve leave.');
    }
  };

  const handleReject = async (id: string, name: string) => {
    const remarks = prompt(`Provide remark for declining ${name}'s leave:`);
    if (remarks === null) return;
    try {
      await api.rejectLeave(id, remarks);
      loadLeaves();
    } catch (err: any) {
      alert(err.message || 'Failed to decline leave.');
    }
  };

  const isReviewer = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>Leave Management Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Leave Applications & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time status tracking for students, faculty, and administrative staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Total Requests</div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">{analytics.total}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-amber-500 mb-1">Pending Review</div>
            <div className="text-2xl font-extrabold text-amber-600 font-display">{analytics.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-teal-600 mb-1">Approved</div>
            <div className="text-2xl font-extrabold text-teal-700 font-display">{analytics.approved}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">Declined</div>
            <div className="text-2xl font-extrabold text-slate-600 font-display">{analytics.rejected}</div>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by applicant name, reason, type..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === st
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden divide-y divide-slate-100">
        {leaves.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No leave applications found.</div>
        ) : (
          leaves.map((lv) => (
            <div key={lv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900">{lv.applicant_name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {lv.applicant_role}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    lv.status === 'APPROVED'
                      ? 'bg-teal-100 text-teal-800'
                      : lv.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {lv.status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-700">
                  {lv.leave_type} Leave • {lv.from_date} to {lv.to_date} ({lv.total_days} Day{lv.total_days > 1 ? 's' : ''})
                </div>

                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Reason: {lv.reason}
                </p>

                {lv.reviewer_remarks && (
                  <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg inline-block">
                    Reviewer: {lv.reviewed_by} — "{lv.reviewer_remarks}"
                  </div>
                )}
              </div>

              {isReviewer && lv.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReject(lv.id, lv.applicant_name)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold border border-slate-200"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(lv.id, lv.applicant_name)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Leave</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL: Apply for Leave */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
              <CalendarDays className="w-4 h-4" />
              <span>Leave Application</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 font-display mb-1">Request Leave Absence</h3>
            <p className="text-xs text-slate-500 mb-6">Submit application for administrative sanction.</p>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-white"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="MEDICAL">Medical / Health Leave</option>
                  <option value="ACADEMIC_DUTY">Academic Duty / Symposium</option>
                  <option value="EMERGENCY">Family Emergency</option>
                  <option value="BEREAVEMENT">Bereavement Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the purpose of absence and any arrangements made..."
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition-all mt-3"
              >
                {submitting ? 'Submitting...' : 'Submit Application to Administration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

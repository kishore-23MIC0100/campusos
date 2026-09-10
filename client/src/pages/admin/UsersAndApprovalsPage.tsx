import React, { useState, useEffect } from 'react';
import { api, User } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  Users, Key, Search, Filter, CheckCircle2, XCircle, Clock,
  Shield, Check, X, ArrowRight, ShieldAlert, Lock, Unlock
} from 'lucide-react';

export const UsersAndApprovalsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers({ status: statusFilter, role: roleFilter, search });
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter, roleFilter, search]);

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.approveUser(id);
      confetti({ particleCount: 70, spread: 70 });
      setActionAlert(`Access granted for ${name}. Account status: APPROVED.`);
      loadUsers();
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to approve user.');
    }
  };

  const handleReject = async (id: string, name: string) => {
    const reason = prompt(`Reason for declining access for ${name}:`);
    if (reason === null) return;
    try {
      await api.rejectUser(id, reason);
      setActionAlert(`Declined access for ${name}.`);
      loadUsers();
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject user.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'DISABLED' : 'APPROVED';
    try {
      await api.updateUserStatus(id, newStatus);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <Key className="w-4 h-4" />
            <span>Identity & Access Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Users & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Oakridge International School • Verification Queue & Account Status Lifecycle
          </p>
        </div>
      </div>

      {actionAlert && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, role..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="DISABLED">Disabled Only</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
            <option value="PARENT">Parent</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-6">User / Account</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Department / Class</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Registered</th>
              <th className="py-3.5 px-6 text-right">Approval Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={u.fullName}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-semibold">
                  {u.department || u.gradeSection || 'General'}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    u.status === 'APPROVED'
                      ? 'bg-teal-100 text-teal-800'
                      : u.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">
                  {u.status === 'PENDING' ? 'Awaiting Review' : 'Verified'}
                </td>
                <td className="py-3.5 px-6 text-right">
                  {u.status === 'PENDING' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(u.id, u.fullName)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 font-semibold text-xs border border-slate-200"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(u.id, u.fullName)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                    >
                      {u.status === 'APPROVED' ? 'Lock Account' : 'Unlock'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldAlert, Search, Filter, Calendar, Download, RefreshCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const res = await api.getAuditLogs({ action: actionFilter, search });
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, search]);

  const exportAuditCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User Name', 'Role', 'Action', 'Entity Type', 'Description', 'IP Address'];
    const rows = logs.map((l) => [
      l.id,
      l.created_at,
      `"${l.user_name}"`,
      l.user_role,
      l.action,
      l.entity_type,
      `"${l.description}"`,
      l.ip_address,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusOS_AuditLogs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Immutable Administrative Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Security & Compliance Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Oakridge International School • Complete forensic record of all administrative and user events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadLogs}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={exportAuditCSV}
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, description, action..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_APPROVED">USER_APPROVED</option>
            <option value="ATTENDANCE_MARKED">ATTENDANCE_MARKED</option>
            <option value="LEAVE_APPROVED">LEAVE_APPROVED</option>
            <option value="HOMEWORK_PUBLISHED">HOMEWORK_PUBLISHED</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-6">Timestamp</th>
              <th className="py-3.5 px-4">Operator / User</th>
              <th className="py-3.5 px-4">Action Key</th>
              <th className="py-3.5 px-4">Entity</th>
              <th className="py-3.5 px-6">Event Description</th>
              <th className="py-3.5 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-mono text-slate-500 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{l.user_name}</div>
                  <div className="text-[10px] text-teal-700 font-semibold">{l.user_role}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700 text-[10px]">
                    {l.action}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-600">{l.entity_type}</td>
                <td className="py-3.5 px-6 text-slate-700">{l.description}</td>
                <td className="py-3.5 px-4 font-mono text-slate-400">{l.ip_address || '127.0.0.1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

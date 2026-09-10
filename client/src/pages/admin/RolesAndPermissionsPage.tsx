import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shield, Lock, CheckCircle2, Key, Users, Check } from 'lucide-react';

export const RolesAndPermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getRolesAndPermissions();
        setRoles(res.roles || []);
        setPermissions(res.permissions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <Shield className="w-4 h-4" />
            <span>Granular Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Roles & Permissions Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configured system permissions, endpoint authorization, and policy enforcement.
          </p>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((r) => (
          <div key={r.id} className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-navy-100 text-navy-800">
                {r.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400">SYSTEM POLICY</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
          </div>
        ))}
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-base text-slate-900 font-display">
          Active RBAC Permissions Matrix
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-6">Permission Key</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-6">Description & Scope</th>
              <th className="py-3 px-4 text-center">Admin</th>
              <th className="py-3 px-4 text-center">Teacher</th>
              <th className="py-3 px-4 text-center">Student</th>
              <th className="py-3 px-4 text-center">Parent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {permissions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-6 font-mono font-bold text-teal-700">{p.key}</td>
                <td className="py-3 px-4 text-slate-500 font-semibold">{p.category}</td>
                <td className="py-3 px-6 text-slate-700">{p.description}</td>
                <td className="py-3 px-4 text-center text-teal-600"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-teal-600">{p.key.includes('read') || p.key.includes('attendance') || p.key.includes('homework') ? <Check className="w-4 h-4 mx-auto" /> : '—'}</td>
                <td className="py-3 px-4 text-center text-teal-600">{p.key.includes('read') || p.key.includes('leave.create') ? <Check className="w-4 h-4 mx-auto" /> : '—'}</td>
                <td className="py-3 px-4 text-center text-teal-600">{p.key.includes('read') || p.key.includes('leave.create') ? <Check className="w-4 h-4 mx-auto" /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

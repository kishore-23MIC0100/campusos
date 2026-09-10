import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HeartHandshake, Search, Phone, Mail, MapPin, User, ChevronRight } from 'lucide-react';

export const ParentsPage: React.FC = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getParents({ search });
        setParents(res.parents || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Parent Association & Guardian Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Parents Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registered Guardian Information & Multi-Child Linkage Data
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by parent name, child name, email, phone..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parents.map((par) => (
          <div key={par.id} className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-bold text-base flex items-center justify-center border border-amber-200">
                {par.first_name[0]}{par.last_name[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{par.first_name} {par.last_name}</h3>
                <div className="text-[11px] text-slate-500">{par.occupation || 'Parent Association Member'}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /><span className="font-mono">{par.phone}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /><span>{par.email}</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{par.address || 'Knowledge Corridor'}</span></div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-slate-800 mb-1">Linked Children:</div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-semibold text-[10px]">Arav Patel (Grade 10A)</span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-semibold text-[10px]">Diya Patel (Grade 7A)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

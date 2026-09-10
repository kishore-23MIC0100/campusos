import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { GraduationCap, Search, Filter, Mail, Phone, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';

export const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [department, setDepartment] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getTeachers({ department, search });
        setTeachers(res.teachers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [department, search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Faculty Roster & Department Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Teachers & Faculty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Oakridge International School • 148 Certified Instructors & Mentors
          </p>
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
            placeholder="Search by faculty name, subject, employee ID..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Department:</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Departments</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="English Literature">English Literature</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((tch) => (
          <div key={tch.id} className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-bold text-base flex items-center justify-center border border-teal-200">
                    {tch.first_name[0]}{tch.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{tch.first_name} {tch.last_name}</h3>
                    <div className="text-[11px] font-semibold text-teal-700">{tch.designation}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-600">
                  {tch.employee_id}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-slate-400" /><span>{tch.subjects || 'General Curriculum'}</span></div>
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" /><span>Handles: {tch.classes_handled || 'All Grades'}</span></div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /><span>{tch.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /><span>{tch.phone}</span></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">{tch.office_room || 'Room 204'}</span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {tch.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

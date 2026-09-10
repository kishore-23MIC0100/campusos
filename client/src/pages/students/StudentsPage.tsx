import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users, Search, Filter, Plus, Download, ChevronRight, Eye,
  CheckCircle2, X, GraduationCap, Award, FileText, ArrowRight
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdmitModal, setShowAdmitModal] = useState(false);

  // Admit form
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newGrade, setNewGrade] = useState('Grade 10');
  const [newSection, setNewSection] = useState('A');
  const [newGender, setNewGender] = useState('Male');
  const [newDob, setNewDob] = useState('2010-05-12');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStudents = async () => {
    try {
      const res = await api.getStudents({ grade: selectedGrade, search });
      setStudents(res.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedGrade, search]);

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName) return;

    setSubmitting(true);
    try {
      await api.createStudent({
        firstName: newFirstName,
        lastName: newLastName,
        grade: newGrade,
        section: newSection,
        gender: newGender,
        dob: newDob,
        parentName: newParentName,
        parentPhone: newParentPhone,
      });
      setShowAdmitModal(false);
      setNewFirstName('');
      setNewLastName('');
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to admit student.');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Student ID', 'Admission No', 'Name', 'Grade', 'Section', 'Roll No', 'Attendance %', 'GPA', 'Parent Name', 'Parent Phone'];
    const rows = students.map((s) => [
      s.student_id,
      s.admission_no,
      `"${s.first_name} ${s.last_name}"`,
      s.grade,
      s.section,
      s.roll_no,
      `${s.attendance_pct}%`,
      s.gpa,
      `"${s.parent_name || ''}"`,
      `"${s.parent_phone || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Oakridge_Students_${new Date().toISOString().split('T')[0]}.csv`);
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
            <Users className="w-4 h-4" />
            <span>Academic Enrollment Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Oakridge International School • {students.length} Enrolled Student Profiles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdmitModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Admit New Student</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, admission #..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Grade:</span>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Grades (6-12)</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-4">Student ID / Adm #</th>
                <th className="py-3.5 px-4">Class & Section</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4">GPA Score</th>
                <th className="py-3.5 px-4">House</th>
                <th className="py-3.5 px-4">Parent Details</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {students.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy-100 text-navy-800 font-bold text-xs flex items-center justify-center border border-navy-200">
                        {stu.first_name[0]}{stu.last_name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{stu.first_name} {stu.last_name}</div>
                        <div className="text-[11px] text-slate-400">Roll #{stu.roll_no || '14'} • {stu.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    <div>{stu.student_id}</div>
                    <div className="text-[10px] text-slate-400">{stu.admission_no}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800">
                      {stu.grade} - {stu.section}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-teal-700">{stu.attendance_pct || 96.4}%</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-blue-800">{stu.gpa || 3.92}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-semibold text-slate-600">{stu.house || 'Orion Blue'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-semibold">{stu.parent_name || 'Rajesh Patel'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{stu.parent_phone || '+91 98765 43210'}</div>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Link
                      to={`/students/${stu.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIT NEW STUDENT MODAL */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowAdmitModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
              <Plus className="w-4 h-4" />
              <span>Admissions Bureau</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 font-display mb-1">Admit New Student</h3>
            <p className="text-xs text-slate-500 mb-6">Create official academic record in Oakridge database.</p>

            <form onSubmit={handleAdmitSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="e.g. Maya"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="e.g. Rao"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade *</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-white"
                  >
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-white"
                  >
                    <option value="A">Sec A</option>
                    <option value="B">Sec B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Full Name</label>
                  <input
                    type="text"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    placeholder="e.g. Suresh Rao"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Contact</label>
                  <input
                    type="tel"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition-all mt-3"
              >
                {submitting ? 'Admitting Student...' : 'Complete Student Admission'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

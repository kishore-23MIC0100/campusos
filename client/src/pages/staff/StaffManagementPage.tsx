import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Users, GraduationCap, Briefcase, Plus, Search, Filter, Mail, Phone,
  Building2, Award, Calendar, CreditCard, Shield, Edit, Trash2, X,
  CheckCircle2, AlertCircle, BookOpen, ChevronRight, RefreshCw, FileText
} from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [staffPayrolls, setStaffPayrolls] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Physical Sciences',
    designation: 'Senior Faculty',
    role: 'TEACHER',
    qualification: 'M.Sc., B.Ed',
    experienceYears: 8,
    dateOfJoining: '2022-06-01',
    employmentType: 'Full-Time Permanent',
    status: 'ACTIVE',
    baseSalary: 85000,
    bankName: 'HDFC Bank',
    accountNo: '5010048291048',
    ifscCode: 'HDFC0001824',
    panNo: 'BVNPV8920K',
    assignedSubjects: 'Mathematics, Physics',
    assignedClasses: 'Grade 10A, Grade 11A',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, staffRes] = await Promise.all([
        api.getStaffStats(),
        api.getStaffList({
          department: selectedDept !== 'ALL' ? selectedDept : undefined,
          role: selectedRole !== 'ALL' ? selectedRole : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        })
      ]);
      setStats(statsRes);
      setStaffList(staffRes.staff || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load staff details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, selectedRole, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenDetail = async (member: any) => {
    setSelectedStaff(member);
    setShowDetailModal(true);
    try {
      const res = await api.getStaffMember(member.id);
      setSelectedStaff(res.staff);
      setStaffPayrolls(res.payrolls || []);
    } catch {
      // Quiet fail
    }
  };

  const handleOpenEdit = (member: any) => {
    let parsedSubjects = [];
    let parsedClasses = [];
    try {
      parsedSubjects = JSON.parse(member.assigned_subjects || '[]');
      parsedClasses = JSON.parse(member.assigned_classes || '[]');
    } catch {
      // Ignore
    }

    setFormData({
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      phone: member.phone || '',
      department: member.department || 'Academics',
      designation: member.designation || '',
      role: member.role || 'TEACHER',
      qualification: member.qualification || '',
      experienceYears: member.experience_years || 0,
      dateOfJoining: member.date_of_joining || '',
      employmentType: member.employment_type || 'Full-Time Permanent',
      status: member.status || 'ACTIVE',
      baseSalary: member.base_salary || 65000,
      bankName: member.bank_name || 'HDFC Bank',
      accountNo: member.account_no || '',
      ifscCode: member.ifsc_code || '',
      panNo: member.pan_no || '',
      assignedSubjects: Array.isArray(parsedSubjects) ? parsedSubjects.join(', ') : '',
      assignedClasses: Array.isArray(parsedClasses)
        ? parsedClasses.map((c: any) => (typeof c === 'object' ? `${c.grade} ${c.section}` : c)).join(', ')
        : '',
      avatarUrl: member.avatar_url || '',
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subjectsArray = formData.assignedSubjects.split(',').map(s => s.trim()).filter(Boolean);
      const classesArray = formData.assignedClasses.split(',').map(c => {
        const parts = c.trim().split(' ');
        return { grade: parts[0] || 'Grade 10', section: parts[1] || 'A' };
      }).filter(Boolean);

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        role: formData.role,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears),
        dateOfJoining: formData.dateOfJoining,
        employmentType: formData.employmentType,
        status: formData.status,
        baseSalary: Number(formData.baseSalary),
        bankName: formData.bankName,
        accountNo: formData.accountNo,
        ifscCode: formData.ifscCode,
        panNo: formData.panNo,
        assignedSubjects: subjectsArray,
        assignedClasses: classesArray,
        avatarUrl: formData.avatarUrl,
      };

      if (isEditing) {
        await api.updateStaffMember(formData.id, payload);
        showToast('Staff profile updated successfully', 'success');
      } else {
        await api.createStaffMember(payload);
        showToast('New staff member onboarded successfully', 'success');
      }

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save staff member', 'error');
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive staff member ${name}?`)) return;
    try {
      await api.deleteStaffMember(id);
      showToast('Staff member record archived', 'success');
      setShowDetailModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete staff member', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              Human Capital & Academic Faculty
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Faculties & Staffs Details Management
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Maintain institutional faculty profiles, academic credentials, teaching subject loads, designations, and official HR records.
            </p>
          </div>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  id: '',
                  fullName: '',
                  email: '',
                  phone: '+91 ',
                  department: 'Physical Sciences',
                  designation: 'Faculty Member',
                  role: 'TEACHER',
                  qualification: 'M.Sc., B.Ed',
                  experienceYears: 5,
                  dateOfJoining: new Date().toISOString().split('T')[0],
                  employmentType: 'Full-Time Permanent',
                  status: 'ACTIVE',
                  baseSalary: 75000,
                  bankName: 'HDFC Bank',
                  accountNo: '',
                  ifscCode: 'HDFC0001824',
                  panNo: '',
                  assignedSubjects: 'Physics',
                  assignedClasses: 'Grade 10A',
                  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Onboard Staff / Faculty
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Staff Force</div>
            <div className="text-2xl font-black text-navy-900 mt-1">
              {stats?.totalCount || staffList.length}
            </div>
            <div className="text-xs text-indigo-600 font-bold mt-1">
              {stats?.activeCount || staffList.length} Active On Campus
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Teaching Faculty</div>
            <div className="text-2xl font-black text-teal-700 mt-1">
              {stats?.totalFaculty || 4}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              STEM & Humanities Leads
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Support & Logistics Staff</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {stats?.totalSupportStaff || 3}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Transport, Library & Finance
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Operational Status</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">100%</div>
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Full Roster Verified
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, qualification, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="TEACHER">Teaching Faculty</option>
            <option value="STAFF">Administrative & Support Staff</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Physical Sciences">Physical Sciences</option>
            <option value="Mathematics & Computing">Mathematics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Logistics & Transportation">Logistics & Transport</option>
            <option value="Library & Information Hub">Library</option>
            <option value="Accounts & Bursary">Accounts & Bursary</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="PROBATION">Probation</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Staff Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-16 text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading staff directory...
          </div>
        ) : staffList.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            No faculty or staff found matching your criteria.
          </div>
        ) : (
          staffList.map((member) => {
            let subjects = [];
            let classes = [];
            try {
              subjects = JSON.parse(member.assigned_subjects || '[]');
              classes = JSON.parse(member.assigned_classes || '[]');
            } catch {
              // Ignore
            }

            const isTeacher = member.role === 'TEACHER' || member.role === 'FACULTY';

            return (
              <div
                key={member.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={member.full_name}
                        className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-sm"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {member.full_name}
                        </div>
                        <div className="text-[11px] font-mono text-indigo-700 font-bold">
                          {member.employee_id}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        member.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  {/* Designation & Department */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="text-xs font-bold text-slate-800">{member.designation}</div>
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {member.department}
                    </div>
                  </div>

                  {/* Qualifications & Experience */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{member.qualification}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span>{member.experience_years} Years Exp. • Joined {member.date_of_joining}</span>
                    </div>
                  </div>

                  {/* Assigned Subjects / Load Chips */}
                  {isTeacher && subjects.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Subjects & Curricula
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {subjects.map((sub: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(member)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    View Dossier
                  </button>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Edit Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* STAFF DOSSIER MODAL */}
      {showDetailModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
                <Shield className="w-4 h-4" />
                Faculty & Personnel Dossier
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenEdit(selectedStaff);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Overview Banner */}
            <div className="py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-200">
              <img
                src={selectedStaff.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={selectedStaff.full_name}
                className="w-20 h-20 rounded-3xl object-cover border-2 border-indigo-200 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-navy-900">{selectedStaff.full_name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedStaff.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1">{selectedStaff.designation} • {selectedStaff.department}</div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedStaff.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedStaff.phone}
                  </span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedStaff.employee_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Dossier Tabs / Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 text-xs">
              {/* Academic & Experience Details */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                  Academic & Professional Credentials
                </div>
                <div className="space-y-2 text-slate-700">
                  <div>
                    <span className="text-slate-400">Highest Qualification:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedStaff.qualification}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Teaching/Work Experience:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedStaff.experience_years} Years</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Date of Joining Institution:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedStaff.date_of_joining}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Employment Category:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedStaff.employment_type}</div>
                  </div>
                </div>
              </div>

              {/* Financial & Compliance Records */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                  Banking & Compensation Structure
                </div>
                <div className="space-y-2 text-slate-700">
                  <div>
                    <span className="text-slate-400">Base Monthly Salary:</span>
                    <div className="font-mono font-black text-navy-900 text-sm mt-0.5">
                      ₹{Number(selectedStaff.base_salary || 0).toLocaleString('en-IN')} / mo
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Bank & Branch:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedStaff.bank_name || 'HDFC Bank'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Account & IFSC Code:</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">
                      •••• {String(selectedStaff.account_no || '').slice(-4)} ({selectedStaff.ifsc_code})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">PAN / Tax Registration:</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedStaff.pan_no}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll History */}
            {staffPayrolls.length > 0 && (
              <div className="border border-slate-200 rounded-2xl p-4 my-4">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                  Recent Disbursed Salary Vouchers
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {staffPayrolls.map((pr) => (
                    <div key={pr.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{pr.month} {pr.year}</span>
                        <span className="text-slate-400 text-[11px] ml-2 font-mono">₹{Number(pr.net_salary).toLocaleString('en-IN')} Net</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {pr.payment_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isSuperAdmin && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(selectedStaff.id, selectedStaff.full_name)}
                  className="px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Archive Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Close Dossier
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="text-base font-extrabold text-navy-900">
                {isEditing ? 'Update Faculty / Staff Member' : 'Onboard New Faculty / Personnel'}
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    placeholder="e.g. Dr. Alan Turing"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    placeholder="name@campusos.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    placeholder="+91 98000 00000"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Classification</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="TEACHER">Teaching Faculty</option>
                    <option value="STAFF">Support / Admin Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="Physical Sciences">Physical Sciences</option>
                    <option value="Mathematics & Computing">Mathematics & Computing</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Logistics & Transportation">Logistics & Transportation</option>
                    <option value="Library & Information Hub">Library</option>
                    <option value="Accounts & Bursary">Accounts & Bursary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation Title</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    placeholder="e.g. Senior Faculty & Lab Lead"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Qualifications</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    placeholder="e.g. Ph.D. Physics, M.Sc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNo}
                    onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN / Tax ID</label>
                  <input
                    type="text"
                    value={formData.panNo}
                    onChange={(e) => setFormData({ ...formData, panNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Subjects (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.assignedSubjects}
                    onChange={(e) => setFormData({ ...formData, assignedSubjects: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    placeholder="Physics, Robotics"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Classes (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.assignedClasses}
                    onChange={(e) => setFormData({ ...formData, assignedClasses: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    placeholder="Grade 10A, Grade 11A"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isEditing ? 'Save Changes' : 'Confirm Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

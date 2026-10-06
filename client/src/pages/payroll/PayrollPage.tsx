import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign, CreditCard, Users, Clock, CheckCircle2, AlertCircle,
  FileText, Printer, Plus, Search, Filter, Download, ArrowUpRight,
  Building2, ShieldCheck, ChevronRight, X, Calendar, RefreshCw
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activePayslip, setActivePayslip] = useState<any>(null);
  const [loadingPayslip, setLoadingPayslip] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const [sumRes, recRes] = await Promise.all([
        api.getPayrollSummary(),
        api.getPayrollRecords({
          month: selectedMonth !== 'ALL' ? selectedMonth : undefined,
          year: selectedYear,
          department: selectedDept !== 'ALL' ? selectedDept : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        })
      ]);
      setSummary(sumRes);
      setRecords(recRes.records || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, [selectedMonth, selectedYear, selectedDept, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayrollData();
  };

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      const res = await api.generatePayroll(selectedMonth, selectedYear);
      showToast(res.message, 'success');
      setShowGenerateModal(false);
      loadPayrollData();
    } catch (err: any) {
      showToast(err.message || 'Error generating payroll run', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (recordId: string) => {
    try {
      await api.updatePayrollStatus(recordId, {
        status: 'PAID',
        paymentMethod: 'Direct Bank Transfer (NEFT/RTGS)',
        paymentDate: new Date().toISOString().split('T')[0]
      });
      showToast('Payroll record marked as PAID successfully', 'success');
      loadPayrollData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  const openPayslip = async (id: string) => {
    setLoadingPayslip(true);
    try {
      const res = await api.getPayslip(id);
      setActivePayslip(res.payslip);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch payslip details', 'error');
    } finally {
      setLoadingPayslip(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Institutional Finance & Bursary
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Faculties & Staff Payroll Management
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Manage salary structures, statutory PF/tax deductions, automated monthly disbursement runs, and verifiable digital payslips.
            </p>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Run Monthly Payroll
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Disbursed ({selectedMonth})</div>
            <div className="text-2xl font-black text-navy-900 mt-1">
              {formatCurrency(summary?.totalDisbursed)}
            </div>
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {summary?.paidCount || 0} Staff Disbursed
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Approvals</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {formatCurrency(summary?.pendingDisbursements)}
            </div>
            <div className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {summary?.pendingCount || 0} Pending Accounts
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Statutory Deductions (PF/Tax)</div>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {formatCurrency(summary?.totalDeductions)}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              TDS & Provident Fund
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Staff Headcount</div>
            <div className="text-2xl font-black text-navy-900 mt-1">
              {summary?.totalStaffCount || 7}
            </div>
            <div className="text-xs text-teal-600 font-bold mt-1">
              {summary?.processedCount || 0} Payroll Profiles Ready
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, ID, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Months</option>
            <option value="October">October 2026</option>
            <option value="September">September 2026</option>
            <option value="August">August 2026</option>
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
            <option value="Accounts & Bursary">Accounts & Bursary</option>
            <option value="Library & Information Hub">Library</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSED">Processed / Pending</option>
            <option value="PENDING">Pending Review</option>
          </select>

          <button
            type="button"
            onClick={loadPayrollData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800">
            Payroll Ledger ({records.length} Records)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Academic Session 2025-2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4 text-right">Base Salary</th>
                <th className="py-3.5 px-4 text-right">Allowances</th>
                <th className="py-3.5 px-4 text-right">Deductions</th>
                <th className="py-3.5 px-4 text-right">Net Payable</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading payroll ledger...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No payroll records matching your filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isPaid = r.payment_status === 'PAID';
                  const isPending = r.payment_status === 'PENDING';
                  const deductions = (Number(r.pf_deduction) || 0) + (Number(r.tax_deduction) || 0);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{r.employee_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{r.employee_id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-semibold">{r.department}</div>
                        <div className="text-[11px] text-slate-500">{r.designation}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {r.month} {r.year}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(r.base_salary)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                        +{formatCurrency((Number(r.hra) || 0) + (Number(r.allowances) || 0))}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-red-600">
                        -{formatCurrency(deductions)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-navy-900 text-sm">
                        {formatCurrency(r.net_salary)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {r.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openPayslip(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                            title="View Payslip"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-700" />
                            Payslip
                          </button>

                          {isSuperAdmin && !isPaid && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(r.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                              title="Mark Disbursed"
                            >
                              Disburse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE MONTHLY PAYROLL MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-navy-900 font-extrabold text-base">
                <DollarSign className="w-5 h-5 text-teal-600" />
                Run Automated Payroll Batch
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                This will automatically compute gross allowances, HRA (20%), standard allowances (15%), statutory PF deductions (12%), and TDS tax (8%) for all active faculties and staff.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                    <option value="September">September</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100 text-teal-800 text-xs">
                <strong>Institution:</strong> Oakridge International School<br />
                <strong>Eligible Headcount:</strong> {summary?.totalStaffCount || 7} Staff & Faculties
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={handleGeneratePayroll}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {generating ? 'Processing...' : 'Execute Payroll Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYSLIP VIEW & PRINT MODAL */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                Official Institutional Salary Voucher
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActivePayslip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payslip Header */}
            <div className="py-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-navy-900">Oakridge International School</h2>
                <div className="text-xs text-slate-500 mt-0.5">Plot 18, Knowledge Corridor, Bangalore • CBSE-AFF-2026-9801</div>
                <div className="text-xs font-bold text-slate-700 mt-2">
                  Salary Slip for the Period: <span className="text-teal-700">{activePayslip.month} {activePayslip.year}</span>
                </div>
              </div>
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Payment Status</div>
                <div className="text-sm font-extrabold text-emerald-600 flex items-center gap-1 sm:justify-end mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {activePayslip.payment_status}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Voucher: {activePayslip.id}
                </div>
              </div>
            </div>

            {/* Employee Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 bg-slate-50 rounded-2xl p-4 my-4 text-xs">
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">Employee Name</div>
                <div className="font-extrabold text-slate-900 mt-0.5">{activePayslip.employee_name}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">Employee ID</div>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{activePayslip.employee_id}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">Department</div>
                <div className="font-bold text-slate-800 mt-0.5">{activePayslip.department}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">PAN / Tax ID</div>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{activePayslip.pan_no}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">Designation</div>
                <div className="font-bold text-slate-800 mt-0.5">{activePayslip.designation}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">Bank Account</div>
                <div className="font-mono text-slate-800 mt-0.5">•••• {String(activePayslip.account_no || '').slice(-4)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">Disbursed Date</div>
                <div className="font-semibold text-slate-800 mt-0.5">{activePayslip.payment_date || '2026-10-01'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">Mode</div>
                <div className="font-semibold text-slate-800 mt-0.5">{activePayslip.payment_method || 'NEFT Transfer'}</div>
              </div>
            </div>

            {/* Earnings & Deductions Dual Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                  Gross Earnings (A)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(activePayslip.base_salary)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(activePayslip.hra)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Special & Academic Allowances</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(activePayslip.allowances)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 flex justify-between font-extrabold text-slate-900">
                    <span>Total Gross Earnings</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(activePayslip.gross_salary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-red-50 px-4 py-2 text-xs font-extrabold text-red-800 uppercase tracking-wider">
                  Statutory Deductions (B)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Provident Fund (PF - 12%)</span>
                    <span className="font-mono font-bold text-red-600">-{formatCurrency(activePayslip.pf_deduction)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Tax Deducted at Source (TDS)</span>
                    <span className="font-mono font-bold text-red-600">-{formatCurrency(activePayslip.tax_deduction)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Professional Tax</span>
                    <span className="font-mono font-bold text-red-600">-₹0</span>
                  </div>
                  <div className="p-3 bg-slate-50 flex justify-between font-extrabold text-slate-900">
                    <span>Total Deductions</span>
                    <span className="font-mono text-red-600">
                      -{formatCurrency((Number(activePayslip.pf_deduction) || 0) + (Number(activePayslip.tax_deduction) || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight Box */}
            <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl p-5 flex items-center justify-between shadow-lg my-4">
              <div>
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">Net Take-Home Pay (A - B)</div>
                <div className="text-2xl sm:text-3xl font-black mt-1">
                  {formatCurrency(activePayslip.net_salary)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-300 font-medium hidden sm:block">
                <div>Transferred to {activePayslip.bank_name || 'Bank Account'}</div>
                <div className="text-[11px] text-teal-300">IFSC: {activePayslip.ifsc_code}</div>
              </div>
            </div>

            {activePayslip.notes && (
              <div className="text-xs text-slate-500 italic mt-2">
                <strong>Remarks:</strong> {activePayslip.notes}
              </div>
            )}

            <div className="pt-6 mt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>This is a system-generated salary voucher authenticated by Oakridge CampusOS.</span>
              <span className="font-bold text-slate-600">Finance & Bursary Division</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

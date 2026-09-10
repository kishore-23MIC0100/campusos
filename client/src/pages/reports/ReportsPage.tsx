import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Download, Printer, CheckCircle2, Building2, Users, Calendar, Award } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getInstitutionalReport();
        setReport(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const downloadReport = (title: string) => {
    alert(`Generating certified PDF report for ${title}... Print dialog will open.`);
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <FileText className="w-4 h-4" />
            <span>Institutional Documentation & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Reports & Export Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Download certified compliance rosters, attendance audits, and student performance summaries.
          </p>
        </div>
      </div>

      {/* Available Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Campus Attendance Master Audit', desc: 'Comprehensive presence rates, excused leaves, and class comparisons.', type: 'ATTENDANCE_AUDIT', icon: Users },
          { title: 'Term 1 Board Evaluation Summary', desc: 'Subject averages, grade letter distribution, and student percentiles.', type: 'ACADEMIC_REPORT', icon: Award },
          { title: 'Faculty Workload & Timetable Dossier', desc: 'Weekly instructional periods, handled sections, and room allocations.', type: 'FACULTY_REPORT', icon: Calendar },
          { title: 'Annual Institution Compliance Report', desc: 'CBSE affiliation metrics, student-teacher ratio, and facility census.', type: 'COMPLIANCE_REPORT', icon: Building2 },
          { title: 'Parent Association & Contact Index', desc: 'Emergency contact records, linked student registries, and transit stops.', type: 'PARENT_DIRECTORY', icon: Users },
          { title: 'Security & Access Logs Summary', desc: 'Forensic review of RBAC changes, leave approvals, and audit trails.', type: 'SECURITY_AUDIT', icon: FileText },
        ].map((rep, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-200">
                <rep.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display mb-1.5">{rep.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{rep.desc}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">PDF / CSV Ready</span>
              <button
                type="button"
                onClick={() => downloadReport(rep.title)}
                className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

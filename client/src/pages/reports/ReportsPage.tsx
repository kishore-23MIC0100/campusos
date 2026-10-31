import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AlertCircle, Download, FileText, RefreshCw } from 'lucide-react';

type Report = Awaited<ReturnType<typeof api.getInstitutionalReport>>;
const metricLabels: Record<string, string> = {
  totalStudents: 'Enrolled students', totalTeachers: 'Teaching faculty', totalParents: 'Linked parents',
  presentToday: 'Present today', absentToday: 'Absent today', attendanceRate: 'Attendance rate (%)',
  pendingLeaves: 'Pending leave requests', upcomingEvents: 'Upcoming events', activeAnnouncements: 'Announcements', academicHealthScore: 'Average academic score (%)',
};
const csvCell = (value: unknown) => {
  const text = value == null ? 'Not available' : String(value);
  return `"${(/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`;
};

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api.getInstitutionalReport().then(result => { if (active) setReport(result); })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'Could not load the report.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const downloadReport = () => {
    if (!report) return;
    const rows = [
      ['Institution', report.institution.name], ['Academic year', report.institution.academicYear],
      ['Generated at', report.institution.reportGeneratedAt], [], ['Metric', 'Value'],
      ...Object.entries(metricLabels).map(([key, label]) => [label, report.metrics[key]]),
    ];
    const blob = new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `campusos-institutional-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="space-y-6 animate-fadeIn">
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-teal-700"><FileText className="h-4 w-4" />Institutional reporting</div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">Reports & exports</h1>
        <p className="mt-2 text-sm text-slate-500">Review current campus records and export an institutional summary.</p>
      </div>
      <button type="button" onClick={downloadReport} disabled={!report || loading || !!error} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Download size={16} />Export summary CSV</button>
    </div>
    {loading ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Loading institutional report">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      : error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><div className="flex items-center gap-2 font-semibold"><AlertCircle size={18} />Report unavailable</div><p className="mt-2 text-sm">{error}</p><button type="button" onClick={() => { setLoading(true); setError(''); setAttempt(value => value + 1); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold"><RefreshCw size={14} />Try again</button></div>
      : report && <>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">{report.institution.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{report.institution.academicYear ? `Academic year ${report.institution.academicYear}` : 'Academic year not configured'}</p>
          <p className="mt-3 text-xs text-slate-500">Generated {new Date(report.institution.reportGeneratedAt).toLocaleString()}. Attendance uses the school calendar date. Empty attendance and assessment records show as unavailable.</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Object.entries(metricLabels).map(([key, label]) => <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-3 font-display text-2xl font-bold tabular-nums text-slate-900">{report.metrics[key] == null ? 'Unavailable' : report.metrics[key]}{key.endsWith('Rate') || key.endsWith('Score') ? (report.metrics[key] == null ? '' : '%') : ''}</dd></div>)}</dl>
        <p className="text-xs text-slate-500">This summary contains aggregated operational data. Source records remain available in the corresponding campus modules.</p>
      </>}
  </div>;
};

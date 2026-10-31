import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Users, CheckCircle2, XCircle, Clock3, Save, Download, CalendarDays, Pencil, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardHeader, DashboardFeedback, EmptyState, MetricGrid, Panel, formatDate, useWorkspaceData } from '../dashboard/WorkspaceOverview';

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
type Student = { id: string; student_id?: string; first_name: string; last_name: string; roll_no?: number; grade: string; section: string };
type ClassOption = { grade: string; section: string };
type AttendanceRecord = { id: string; student_id: string; student_name: string; status: Status; date: string; marked_by?: string; remarks?: string };
const statusLabels: Record<Status, string> = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Excused' };
const schoolDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const classKey = (item: ClassOption) => `${item.grade}|${item.section}`;

function exportCsv(headers: string[], rows: unknown[][], name: string) {
  const cell = (value: unknown) => {
    const text = value == null ? '' : String(value);
    const safe = /^[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const url = URL.createObjectURL(new Blob(['\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(schoolDate);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadContext = useCallback(async (): Promise<{ classes: ClassOption[]; people: Student[] }> => {
    if (canManage) {
      const result = await api.getClasses();
      const classes = user?.role === 'TEACHER' ? (user.allottedClasses || []) : result.classes;
      return { classes: [...new Map(classes.map(item => [classKey(item), { grade: item.grade, section: item.section }])).values()], people: [] };
    }
    if (user?.role === 'PARENT') { const result = await api.getMyChildren(); return { classes: [], people: result.children || [] }; }
    if (user?.role === 'STUDENT' && user.studentId) { const result = await api.getStudent(user.studentId); return { classes: [], people: [result.student] }; }
    return { classes: [], people: [] };
  }, [canManage, user?.role, user?.studentId, user?.allottedClasses]);
  const context = useWorkspaceData(loadContext);
  const currentClass = context.data?.classes.find(item => classKey(item) === selectedClass) || context.data?.classes[0];
  const currentStudent = context.data?.people.find(item => item.id === selectedStudent) || context.data?.people[0];
  const loadRegister = useCallback(async (): Promise<{ students: Student[]; records: AttendanceRecord[] }> => {
    if (canManage && currentClass) {
      const [students, attendance] = await Promise.all([api.getStudents({ grade: currentClass.grade, section: currentClass.section }), api.getAttendance({ grade: currentClass.grade, section: currentClass.section, date })]);
      return { students: students.students, records: attendance.records };
    }
    if (!canManage && currentStudent) { const attendance = await api.getAttendance({ studentId: currentStudent.id }); return { students: [currentStudent], records: attendance.records }; }
    return { students: [], records: [] };
  }, [canManage, currentClass?.grade, currentClass?.section, currentStudent?.id, date]);
  const register = useWorkspaceData(loadRegister);
  const recordByStudent = useMemo(() => new Map((register.data?.records || []).map(record => [record.student_id, record])), [register.data]);
  useEffect(() => {
    const nextStatuses: Record<string, Status> = {};
    const nextRemarks: Record<string, string> = {};
    for (const student of register.data?.students || []) {
      const existing = recordByStudent.get(student.id) || recordByStudent.get(student.student_id || '');
      if (existing) { nextStatuses[student.id] = existing.status; nextRemarks[student.id] = existing.remarks || ''; }
    }
    setStatuses(nextStatuses); setRemarks(nextRemarks); setEditing(!register.data?.records.length); setSaveError('');
  }, [register.data, recordByStudent]);
  const roster = register.data?.students || [];
  const records = [...(register.data?.records || [])].sort((a, b) => b.date.localeCompare(a.date));
  const present = canManage ? roster.filter(student => statuses[student.id] === 'PRESENT').length : records.filter(record => record.status === 'PRESENT').length;
  const absent = canManage ? roster.filter(student => statuses[student.id] === 'ABSENT').length : records.filter(record => record.status === 'ABSENT').length;
  const unmarked = roster.filter(student => !statuses[student.id]).length;
  const hasChanges = roster.some(student => { const existing = recordByStudent.get(student.id) || recordByStudent.get(student.student_id || ''); return statuses[student.id] !== existing?.status || (remarks[student.id] || '') !== (existing?.remarks || ''); });
  const busy = context.loading || register.loading;
  const refresh = () => { context.refresh(); register.refresh(); };

  async function saveRegister() {
    if (!canManage || !currentClass || !roster.length || unmarked || saving) return;
    setSaving(true); setSaveError('');
    try {
      const result = await api.submitBulkAttendance(currentClass.grade, currentClass.section, date, roster.map(student => ({ studentId: student.id, studentName: `${student.first_name} ${student.last_name}`, rollNo: student.roll_no || 0, status: statuses[student.id], remarks: remarks[student.id] || '' })));
      setEditing(false); toast.success(result.message || 'Attendance register saved.', 'Attendance saved'); register.refresh();
    } catch (reason) { setSaveError(reason instanceof Error ? reason.message : 'The register could not be saved. Please try again.'); }
    finally { setSaving(false); }
  }
  function download() {
    if (canManage) exportCsv(['Date', 'Class', 'Roll number', 'Student', 'Student ID', 'Status', 'Remarks'], roster.map(student => [date, `${student.grade} ${student.section}`, student.roll_no, `${student.first_name} ${student.last_name}`, student.student_id, statuses[student.id] || 'Not marked', remarks[student.id]]), `campusos-attendance-${date}.csv`);
    else exportCsv(['Date', 'Student', 'Status', 'Recorded by', 'Remarks'], records.map(record => [record.date, record.student_name, record.status, record.marked_by, record.remarks]), `campusos-attendance-history-${schoolDate()}.csv`);
  }
  return <div className="workspace-overview attendance-workspace">
    <DashboardHeader eyebrow={canManage ? 'Academic operations' : 'Student attendance'} title={canManage ? 'Every school day, accounted for.' : 'A clear record of attendance.'} description={canManage ? 'Record attendance for your authorized classes and keep the register current.' : 'Review recorded attendance for student profiles linked to your account.'} refresh={refresh} loading={busy} action={<button type="button" className="workspace-primary" disabled={busy || (canManage ? !roster.length : !records.length)} onClick={download}><Download size={15} /> Export CSV</button>} />
    <DashboardFeedback loading={context.loading} error={context.error} refresh={context.refresh}>
      {canManage && !currentClass ? <Panel title="Your class register"><EmptyState title="No classes available" description="Ask your administrator to configure classes and assign them to your faculty account." icon={Users} /></Panel> : !canManage && !currentStudent ? <Panel title="Student attendance"><EmptyState title="No student profile linked" description="Your school office can connect the correct student profile to this account." icon={Users} /></Panel> : <>
        <section className="attendance-controls" aria-label="Attendance filters">
          {canManage ? <><label><span>Class & section</span><select aria-label="Class and section" value={currentClass ? classKey(currentClass) : ''} disabled={saving} onChange={event => setSelectedClass(event.target.value)}>{context.data?.classes.map(item => <option key={classKey(item)} value={classKey(item)}>{item.grade} {item.section}</option>)}</select></label><label><span>School date</span><input type="date" aria-label="School date" value={date} max={schoolDate()} disabled={saving} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></label><div className="attendance-filter-context"><CalendarDays size={17} /><span>School calendar<br /><strong>India Standard Time</strong></span></div></> : <label><span>{user?.role === 'PARENT' ? 'Student profile' : 'Your student profile'}</span><select value={currentStudent?.id || ''} onChange={event => setSelectedStudent(event.target.value)} aria-label="Student profile" disabled={context.data?.people.length === 1}>{context.data?.people.map(student => <option key={student.id} value={student.id}>{student.first_name} {student.last_name} ({student.grade} {student.section})</option>)}</select></label>}
        </section>
        <DashboardFeedback loading={register.loading} error={register.error} refresh={register.refresh}>
          <MetricGrid items={[
            { label: canManage ? 'Students in class' : 'Recorded days', value: canManage ? roster.length : records.length, detail: canManage ? `${currentClass?.grade} ${currentClass?.section} roster` : 'Days with an attendance record', icon: Users, featured: true },
            { label: 'Present', value: present, detail: canManage ? 'Students marked present' : 'Days marked present', icon: CheckCircle2 },
            { label: 'Absent', value: absent, detail: canManage ? 'Students marked absent' : 'Days marked absent', icon: XCircle },
            { label: canManage ? 'Not yet marked' : 'Late or excused', value: canManage ? unmarked : records.filter(record => record.status === 'LATE' || record.status === 'EXCUSED').length, detail: canManage ? 'Choose a status before saving' : 'Recorded late or excused days', icon: Clock3 },
          ]} />
          {saveError && <div className="attendance-save-error" role="alert"><AlertCircle size={18} /><span>{saveError}</span></div>}
          <Panel title={canManage ? `Class register · ${formatDate(date)}` : `${currentStudent?.first_name}'s attendance history`} description={canManage ? (register.data?.records.length ? 'Saved register. Authorized faculty and administrators can update attendance.' : 'This date has no saved register. Choose the correct status for each student.') : 'Only attendance recorded by your school is shown.'}>
            {canManage ? roster.length ? <><div className="attendance-register-toolbar"><span className="overview-tag">{editing ? 'Editing register' : 'Saved register'}</span>{editing ? <div><button className="workspace-secondary" type="button" disabled={saving} onClick={() => setStatuses(Object.fromEntries(roster.map(student => [student.id, 'PRESENT'])))}>Mark all present</button>{register.data?.records.length ? <button className="workspace-secondary" disabled={saving} onClick={() => register.refresh()}>Cancel changes</button> : null}</div> : <button className="workspace-secondary" onClick={() => setEditing(true)}><Pencil size={13} /> Edit register</button>}</div><div className="attendance-table-wrap"><table className="attendance-table"><thead><tr><th scope="col">Student</th><th scope="col">Roll no.</th><th scope="col">Attendance status</th><th scope="col">Remarks</th></tr></thead><tbody>{roster.map(student => <tr key={student.id}><td><div className="attendance-student"><span>{student.first_name?.[0]}{student.last_name?.[0]}</span><div><strong>{student.first_name} {student.last_name}</strong><small>{student.student_id}</small></div></div></td><td>{student.roll_no ?? 'N/A'}</td><td>{editing ? <select aria-label={`Attendance status for ${student.first_name} ${student.last_name}`} value={statuses[student.id] || ''} disabled={saving} onChange={event => setStatuses(previous => ({ ...previous, [student.id]: event.target.value as Status }))}><option value="" disabled>Select status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <span className={`attendance-status status-${(statuses[student.id] || '').toLowerCase()}`}>{statuses[student.id] ? statusLabels[statuses[student.id]] : 'Not marked'}</span>}</td><td>{editing ? <input aria-label={`Attendance remarks for ${student.first_name} ${student.last_name}`} value={remarks[student.id] || ''} placeholder="Optional remark" maxLength={500} disabled={saving} onChange={event => setRemarks(previous => ({ ...previous, [student.id]: event.target.value }))} /> : <span className="attendance-remark">{remarks[student.id] || 'No remarks'}</span>}</td></tr>)}</tbody></table></div>{editing && <div className="attendance-save-bar"><p>{unmarked ? `${unmarked} student${unmarked === 1 ? '' : 's'} still need an attendance status.` : hasChanges ? 'Your changes are ready to save.' : 'No changes to save.'}</p><button className="workspace-primary" disabled={saving || unmarked > 0 || !hasChanges} onClick={saveRegister}><Save size={15} />{saving ? 'Saving register...' : 'Save attendance'}</button></div>}</> : <EmptyState title="No students in this class" description="Add students to the selected class before taking attendance." icon={Users} /> : records.length ? <div className="attendance-table-wrap"><table className="attendance-table"><thead><tr><th scope="col">School date</th><th scope="col">Status</th><th scope="col">Recorded by</th><th scope="col">Remarks</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{formatDate(record.date)}</td><td><span className={`attendance-status status-${record.status.toLowerCase()}`}>{statusLabels[record.status]}</span></td><td>{record.marked_by || 'School faculty'}</td><td><span className="attendance-remark">{record.remarks || 'No remarks'}</span></td></tr>)}</tbody></table></div> : <EmptyState title="No attendance recorded yet" description="Recorded school attendance will appear here when your teachers submit the register." icon={CheckSquare} />}
          </Panel>
        </DashboardFeedback>
      </>}
    </DashboardFeedback>
  </div>;
}

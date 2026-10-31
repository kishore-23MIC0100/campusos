import { useCallback, useRef, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Clock3, Plus, Printer, Trash2, X, CalendarDays, AlertCircle, BookOpen } from 'lucide-react';
import { DashboardHeader, DashboardFeedback, EmptyState, Panel, useWorkspaceData } from '../dashboard/WorkspaceOverview';

type ClassOption = { grade: string; section: string; label?: string };
const key = (item: ClassOption) => `${item.grade}|${item.section}`;
const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const emptyForm = { dayOfWeek: 'Monday', periodIndex: 1, startTime: '08:30', endTime: '09:15', subject: '', teacherName: '', roomNumber: '' };

export function TimetablePage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const loadContext = useCallback(async (): Promise<{ classes: ClassOption[]; teachers: any[] }> => {
    if (user?.role === 'STUDENT') {
      if (!user.studentId) return { classes: [], teachers: [] };
      const result = await api.getStudent(user.studentId);
      return { classes: [{ grade: result.student.grade, section: result.student.section, label: `${result.student.first_name} ${result.student.last_name}` }], teachers: [] };
    }
    if (user?.role === 'PARENT') {
      const result = await api.getMyChildren();
      return { classes: result.children.map(child => ({ grade: child.grade, section: child.section, label: `${child.first_name} ${child.last_name}` })), teachers: [] };
    }
    if (user?.role === 'TEACHER') return { classes: user.allottedClasses || [], teachers: [] };
    const [classes, teachers] = await Promise.all([api.getClasses(), api.getTeachers()]);
    return { classes: classes.classes || [], teachers: teachers.teachers || [] };
  }, [user?.role, user?.studentId, user?.allottedClasses]);
  const context = useWorkspaceData(loadContext);
  const current = context.data?.classes.find(item => key(item) === selected) || context.data?.classes[0];
  const loadSlots = useCallback(async () => {
    if (!current) return { slots: [] as any[] };
    return api.getTimetable({ grade: current.grade, section: current.section, ...(user?.role === 'TEACHER' ? { teacherName: user.fullName } : {}) });
  }, [current?.grade, current?.section, user?.role, user?.fullName]);
  const schedule = useWorkspaceData(loadSlots);
  const slots = schedule.data?.slots || [];
  const days = week.filter(day => slots.some(slot => slot.day_of_week === day));
  const refresh = () => { context.refresh(); schedule.refresh(); };
  const teacherName = (teacher: any) => teacher.full_name || teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!current || !isAdmin || saving) return;
    setFormError('');
    if (form.endTime <= form.startTime) { setFormError('The end time must be after the start time.'); return; }
    setSaving(true);
    try {
      await api.createTimetableSlot({ grade: current.grade, section: current.section, ...form });
      dialog.current?.close(); setForm(emptyForm); schedule.refresh(); toast.success('The timetable period was saved.');
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'The period could not be saved. Please try again.'); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!isAdmin || !window.confirm('Remove this period from the timetable?')) return;
    setSaving(true); setActionError('');
    try { await api.deleteTimetableSlot(id); schedule.refresh(); toast.success('The timetable period was removed.'); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'The period could not be removed.'); }
    finally { setSaving(false); }
  }
  return <div className="workspace-overview">
    <DashboardHeader eyebrow="Academic planning" title="A clear rhythm for the school week." description="Class periods, teaching spaces and faculty assignments, in one place." refresh={refresh} loading={context.loading || schedule.loading} action={<><button className="workspace-secondary" disabled={!slots.length} onClick={() => window.print()}><Printer size={14} />Print timetable</button>{isAdmin && <button className="workspace-primary" disabled={!current} onClick={() => dialog.current?.showModal()}><Plus size={15} />Add period</button>}</>} />
    <DashboardFeedback loading={context.loading} error={context.error} refresh={context.refresh}>
      {!current ? <Panel title="Your timetable"><EmptyState title="No class profile available" description="Contact your school office to link your class or student profile." icon={CalendarDays} /></Panel> : <>
        <section className="attendance-controls"><label><span>{user?.role === 'PARENT' ? 'Student & class' : 'Class & section'}</span><select aria-label="Timetable class" value={key(current)} onChange={event => setSelected(event.target.value)} disabled={saving || context.data?.classes.length === 1}>{context.data?.classes.map((item, index) => <option key={`${key(item)}-${index}`} value={key(item)}>{item.label ? `${item.label} · ` : ''}{item.grade} {item.section}</option>)}</select></label><span className="workspace-muted">{slots.length} scheduled periods{user?.role === 'TEACHER' ? ' assigned to you' : ''}</span></section>
        {actionError && <div role="alert" className="attendance-save-error"><AlertCircle size={18} />{actionError}</div>}
        <DashboardFeedback loading={schedule.loading} error={schedule.error} refresh={schedule.refresh}>
          {slots.length ? <div className="timetable-days">{days.map(day => <Panel key={day} title={day} description={`${slots.filter(slot => slot.day_of_week === day).length} scheduled periods`}><div className="timetable-periods">{slots.filter(slot => slot.day_of_week === day).sort((a, b) => Number(a.period_index) - Number(b.period_index)).map(slot => <div key={slot.id}><span className="overview-period">P{slot.period_index}</span><div><h3>{slot.subject}</h3><p>{slot.teacher_name || 'Faculty not assigned'}</p><small>{slot.room_number || 'Room not assigned'}</small></div><time>{slot.start_time}<small>{slot.end_time}</small></time>{isAdmin && <button className="workspace-icon-button" disabled={saving} aria-label={`Remove ${slot.subject} on ${day}, period ${slot.period_index}`} onClick={() => remove(slot.id)}><Trash2 size={14} /></button>}</div>)}</div></Panel>)}</div> : <Panel title={`${current.grade} ${current.section}`}><EmptyState title="The week is ready to plan" description={isAdmin ? 'Add a period to start building this class timetable.' : 'No teaching periods have been scheduled for this class yet.'} icon={BookOpen} /></Panel>}
        </DashboardFeedback>
      </>}
    </DashboardFeedback>
    {isAdmin && <dialog className="workspace-command timetable-dialog" ref={dialog} onClose={() => setFormError('')} onClick={event => { if (event.target === event.currentTarget && !saving) dialog.current?.close(); }}><div className="workspace-notifications-heading"><h2>Add timetable period</h2><button className="workspace-icon-button" aria-label="Close add period" disabled={saving} onClick={() => dialog.current?.close()}><X size={18} /></button></div><form onSubmit={save} className="timetable-form"><p>{current?.grade} {current?.section}. Room and faculty conflicts are checked before saving.</p>{formError && <div className="attendance-save-error" role="alert">{formError}</div>}<div><label>School day<select required value={form.dayOfWeek} onChange={event => setForm({ ...form, dayOfWeek: event.target.value })}>{week.map(day => <option key={day}>{day}</option>)}</select></label><label>Period number<input required type="number" min={1} max={12} value={form.periodIndex} onChange={event => setForm({ ...form, periodIndex: Number(event.target.value) })} /></label></div><div><label>Starts at<input required type="time" value={form.startTime} onChange={event => setForm({ ...form, startTime: event.target.value })} /></label><label>Ends at<input required type="time" value={form.endTime} onChange={event => setForm({ ...form, endTime: event.target.value })} /></label></div><label>Subject<input required maxLength={100} value={form.subject} placeholder="Subject name" onChange={event => setForm({ ...form, subject: event.target.value })} /></label><label>Teaching faculty<select required value={form.teacherName} onChange={event => setForm({ ...form, teacherName: event.target.value })}><option value="" disabled>Select a faculty member</option>{context.data?.teachers.map(teacher => <option key={teacher.id} value={teacherName(teacher)}>{teacherName(teacher)}</option>)}</select></label><label>Room or lab<input required maxLength={80} value={form.roomNumber} placeholder="Room or laboratory name" onChange={event => setForm({ ...form, roomNumber: event.target.value })} /></label><button className="workspace-primary" type="submit" disabled={saving || !context.data?.teachers.length}><Clock3 size={15} />{saving ? 'Saving period...' : 'Save timetable period'}</button></form></dialog>}
  </div>;
}

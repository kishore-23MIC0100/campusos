import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock3, BookOpen, Award, CheckSquare, CalendarDays, ArrowUpRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardFeedback, DashboardHeader, EmptyState, MetricGrid, Notices, Panel, QuickLinks, useWorkspaceData } from './WorkspaceOverview';

export function TeacherDashboard() {
  const { user } = useAuth();
  const load = useCallback(async () => {
    const [classes, assessments, timetable, notices, students] = await Promise.all([
      api.getClasses(), api.getAssessments(), api.getTimetable({ teacherName: user?.fullName, day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }) }), api.getAnnouncements(), api.getStudents(),
    ]);
    const assignedClasses = (classes.classes || []).filter(item => (user?.allottedClasses || []).some(assigned => assigned.grade === item.grade && assigned.section === item.section));
    const actualClasses = assignedClasses.map(item => ({ ...item, total_students: students.students.filter(student => student.grade === item.grade && student.section === item.section).length }));
    return { classes: actualClasses, assessments: assessments.assessments, timetable: timetable.slots, notices: notices.announcements };
  }, [user?.fullName, user?.allottedClasses]);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const pending = (data?.assessments || []).reduce((total, item) => total + Math.max(0, Number(item.totalStudents || 0) - Number(item.gradedCount || 0)), 0);
  const students = (data?.classes || []).reduce((total, item) => total + Number(item.total_students || 0), 0);
  return <div className="workspace-overview">
    <DashboardHeader eyebrow="Faculty workspace" title={`Welcome back, ${user?.fullName || 'colleague'}.`} description="Your classes, student progress and teaching priorities, together." refresh={refresh} loading={loading} action={<Link to="/attendance" className="workspace-primary">Mark attendance <ArrowUpRight size={15} /></Link>} />
    <DashboardFeedback loading={loading} error={error} refresh={refresh}>
      <MetricGrid items={[
        { label: "Today's classes", value: data?.timetable.length || 0, detail: 'Periods on your teaching schedule', icon: Clock3, featured: true },
        { label: 'Assigned students', value: students, detail: `${data?.classes.length || 0} allotted classes`, icon: Users },
        { label: 'Pending grades', value: pending, detail: 'Assessment marks to be recorded', icon: BookOpen },
        { label: 'Assessments', value: data?.assessments.length || 0, detail: 'Assessments available to your account', icon: Award },
      ]} />
      <div className="overview-grid overview-grid-main">
        <Panel title="Your teaching day" description="Classes scheduled for today" to="/timetable" linkLabel="Full timetable">{data?.timetable.length ? <div className="overview-schedule">{data.timetable.map(slot => <div key={slot.id}><span className="overview-period">P{slot.period_index}</span><div><h3>{slot.subject}</h3><p>{slot.grade} {slot.section}<span>·</span>{slot.room_number || 'Room unassigned'}</p></div><time>{slot.start_time}<small>{slot.end_time}</small></time></div>)}</div> : <EmptyState title="A clear teaching day" description="No timetable periods are assigned to you today." icon={CalendarDays} />}</Panel>
        <Panel title="Teaching essentials" description="Move from planning to doing"><QuickLinks links={[
          { to: '/attendance', title: 'Take attendance', description: 'Update your class register', icon: CheckSquare },
          { to: '/assessments', title: 'Assessment studio', description: 'Create assessments and record marks', icon: Award },
          { to: '/homework', title: 'Set coursework', description: 'Create and review assignments', icon: BookOpen },
          { to: '/leave', title: 'Request leave', description: 'Plan time away from campus', icon: CalendarDays },
        ]} /></Panel>
      </div>
      <div className="overview-grid overview-grid-main"><Panel title="Campus announcements" to="/announcements"><Notices notices={data?.notices || []} /></Panel><Panel title="Your allotted classes" description="The classes connected to your faculty account">{data?.classes.length ? <div className="overview-class-list">{data.classes.map(item => <Link key={item.id || `${item.grade}-${item.section}`} to="/students"><span className="overview-link-icon"><Users size={19} /></span><div><strong>{item.grade} {item.section}</strong><small>{item.total_students || 0} students</small></div><ArrowUpRight size={16} /></Link>)}</div> : <EmptyState title="No classes assigned yet" description="Ask your school administrator to link your classes to your account." icon={Users} />}</Panel></div>
    </DashboardFeedback>
  </div>;
}

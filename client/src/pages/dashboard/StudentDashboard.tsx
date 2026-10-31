import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Award, BookOpen, Clock3, CalendarDays, ArrowUpRight, GraduationCap } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardFeedback, DashboardHeader, EmptyState, MetricGrid, Notices, Panel, QuickLinks, attendanceRate, averageScore, formatDate, useWorkspaceData } from './WorkspaceOverview';

export function StudentDashboard() {
  const { user } = useAuth();
  const load = useCallback(async () => {
    if (!user?.studentId) throw new Error('Your student profile is not linked yet. Contact your school administrator to connect your student record.');
    const details = await api.getStudent(user.studentId);
    const [timetable, notices] = await Promise.all([
      api.getTimetable({ grade: details.student.grade, section: details.student.section, day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }) }),
      api.getAnnouncements(),
    ]);
    return { ...details, timetable: timetable.slots, notices: notices.announcements };
  }, [user?.studentId]);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  return <div className="workspace-overview">
    <DashboardHeader eyebrow="Student workspace" title={`Ready for what's next, ${user?.fullName?.split(' ')[0] || 'student'}?`} description={data ? `${data.student.grade} ${data.student.section} · Your learning, coursework and campus updates.` : 'Your learning, coursework and campus updates, together.'} refresh={refresh} loading={loading} action={<Link to="/assessment-portal" className="workspace-primary">My assessments <ArrowUpRight size={15} /></Link>} />
    <DashboardFeedback loading={loading} error={error} refresh={refresh}>
      <MetricGrid items={[
        { label: 'Recent attendance', value: attendanceRate(data?.attendance || []), detail: `${data?.attendance.length || 0} recent attendance records`, icon: CheckSquare, featured: true },
        { label: 'Average score', value: averageScore(data?.performance || []), detail: `${data?.performance.length || 0} recorded assessment scores`, icon: Award },
        { label: 'Coursework', value: data?.homework.length || 0, detail: 'Assignments for your class', icon: BookOpen },
        { label: "Today's classes", value: data?.timetable.length || 0, detail: 'Periods on your timetable', icon: Clock3 },
      ]} />
      <div className="overview-grid overview-grid-main"><Panel title="Your learning day" description="Today's classes and teaching spaces" to="/timetable" linkLabel="Full timetable">{data?.timetable.length ? <div className="overview-schedule">{data.timetable.map(slot => <div key={slot.id}><span className="overview-period">P{slot.period_index}</span><div><h3>{slot.subject}</h3><p>{slot.teacher_name || 'Faculty to be assigned'}<span>·</span>{slot.room_number || 'Room unassigned'}</p></div><time>{slot.start_time}<small>{slot.end_time}</small></time></div>)}</div> : <EmptyState title="No classes today" description="Your scheduled classes will appear here on teaching days." icon={CalendarDays} />}</Panel><Panel title="Your learning essentials"><QuickLinks links={[
        { to: '/assessment-portal', title: 'Assessment portal', description: 'Open and submit your assessments', icon: Award },
        { to: '/homework', title: 'Coursework & homework', description: 'Review tasks and make submissions', icon: BookOpen },
        { to: '/performance', title: 'My performance', description: 'See your recorded subject results', icon: GraduationCap },
        { to: '/leave', title: 'Request an absence', description: 'Apply and track leave requests', icon: CalendarDays },
      ]} /></Panel></div>
      <div className="overview-grid overview-grid-main"><Panel title="Coursework to explore" description="The latest assignments for your class" to="/homework">{data?.homework.length ? <div className="overview-coursework">{data.homework.slice(0, 4).map(item => <Link key={item.id} to="/homework"><span className="overview-link-icon"><BookOpen size={18} /></span><div><span className="overview-coursework-subject">{item.subject}</span><h3>{item.title}</h3><p>Due {formatDate(item.due_date) || 'date to be confirmed'}</p></div><ArrowUpRight size={16} /></Link>)}</div> : <EmptyState title="No coursework published" description="Assignments from your teachers will appear here." icon={BookOpen} />}</Panel><Panel title="Campus announcements" to="/announcements"><Notices notices={data?.notices || []} /></Panel></div>
    </DashboardFeedback>
  </div>;
}

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, CheckSquare, BookOpen, Award, CalendarDays, Megaphone, Bus, ArrowUpRight, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DashboardFeedback, DashboardHeader, EmptyState, MetricGrid, Notices, Panel, QuickLinks, attendanceRate, averageScore, useWorkspaceData } from './WorkspaceOverview';

export function ParentDashboard() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState('');
  const load = useCallback(async () => {
    const [family, notices] = await Promise.all([api.getMyChildren(), api.getAnnouncements()]);
    return { children: family.children || [], notices: notices.announcements || [] };
  }, [user?.id]);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const activeChild = data?.children.find(child => child.id === selectedId) || data?.children[0];
  return <div className="workspace-overview">
    <DashboardHeader eyebrow="Family workspace" title={`Stay close to their progress, ${user?.fullName?.split(' ')[0] || 'parent'}.`} description="A thoughtful view of your child's learning and life on campus." refresh={refresh} loading={loading} action={<Link to="/announcements" className="workspace-primary">School updates <ArrowUpRight size={15} /></Link>} />
    <DashboardFeedback loading={loading} error={error} refresh={refresh}>
      {activeChild ? <><section className="overview-family-strip"><span className="overview-family-avatar">{activeChild.first_name?.[0]}{activeChild.last_name?.[0]}</span><div><strong>{activeChild.first_name} {activeChild.last_name}</strong><span>{activeChild.grade} {activeChild.section} · {activeChild.student_id || activeChild.admission_no || 'Student profile'}</span></div><label><span>Student</span><select value={activeChild.id} onChange={event => setSelectedId(event.target.value)} aria-label="Select your child">{data?.children.map(child => <option key={child.id} value={child.id}>{child.first_name} {child.last_name}</option>)}</select></label></section>
        <MetricGrid items={[
          { label: 'Recent attendance', value: attendanceRate(activeChild.recentAttendance || []), detail: `${activeChild.recentAttendance?.length || 0} recent attendance records`, icon: CheckSquare, featured: true },
          { label: 'Average score', value: averageScore(activeChild.performanceRecords || []), detail: 'Based on recorded subject results', icon: Award },
          { label: 'Recent coursework', value: activeChild.pendingHomework?.length || 0, detail: 'Latest assignments for this class', icon: BookOpen },
          { label: 'Linked students', value: data?.children.length || 0, detail: 'Student profiles in your family', icon: HeartHandshake },
        ]} />
        <div className="overview-grid overview-grid-main"><Panel title="A view of their progress" description="Recorded assessment results" to="/performance" linkLabel="View performance">{activeChild.performanceRecords?.length ? <div className="overview-scorecard">{activeChild.performanceRecords.slice(0, 6).map((item: Record<string, any>) => <div key={item.id}><span className="overview-link-icon"><BookOpen size={17} /></span><div><strong>{item.subject}</strong><p>{String(item.exam_type || item.term || 'Assessment').replaceAll('_', ' ').toLowerCase()}</p></div><span className="overview-score">{item.marks_obtained}<small> / {item.max_marks}</small></span>{item.grade_letter && <span className="overview-tag">{item.grade_letter}</span>}</div>)}</div> : <EmptyState title="Results will grow here" description="Your child's recorded assessment results will appear here." icon={Award} />}</Panel><Panel title="Family essentials"><QuickLinks links={[
          { to: '/attendance', title: 'Attendance history', description: 'Review recorded school attendance', icon: CheckSquare },
          { to: '/events', title: 'Campus calendar', description: 'See school events and activities', icon: CalendarDays },
          { to: '/transport', title: 'Transport information', description: 'Check campus routes and stops', icon: Bus },
          { to: '/announcements', title: 'School circulars', description: 'Read updates from your school', icon: Megaphone },
        ]} /></Panel></div>
      </> : <Panel title="Your family connection"><EmptyState title="No students linked yet" description="Contact your school office to link your child's student profile to this parent account." icon={Users} /></Panel>}
      <Panel title="Campus announcements" to="/announcements"><Notices notices={data?.notices || []} /></Panel>
    </DashboardFeedback>
  </div>;
}

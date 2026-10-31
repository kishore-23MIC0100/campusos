import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { HeartHandshake, Search, Phone, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import { DashboardFeedback, DashboardHeader, EmptyState, Panel, useWorkspaceData } from '../dashboard/WorkspaceOverview';

function childIds(value: unknown): string[] {
  try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []; } catch { return []; }
}
export function ParentsPage() {
  const [search, setSearch] = useState('');
  const load = useCallback(async () => { const [parents, students] = await Promise.all([api.getParents(), api.getStudents()]); return { parents: parents.parents, students: students.students }; }, []);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const parents = (data?.parents || []).filter(parent => `${parent.first_name} ${parent.last_name} ${parent.email} ${parent.phone}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="workspace-overview"><DashboardHeader eyebrow="People & community" title="Every family, connected." description="A directory of registered parents, guardians and their linked students." refresh={refresh} loading={loading} />
    <section className="attendance-controls"><label className="parent-directory-search"><span>Find a parent or guardian</span><div><Search size={16} /><input aria-label="Search parents" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email or phone" /></div></label><span className="workspace-muted">{parents.length} registered {parents.length === 1 ? 'guardian' : 'guardians'}</span></section>
    <DashboardFeedback loading={loading} error={error} refresh={refresh}>{parents.length ? <div className="parent-directory-grid">{parents.map(parent => {
      const ids = childIds(parent.children_ids);
      const children = (data?.students || []).filter(student => ids.includes(student.id) || ids.includes(student.student_id) || student.parent_id === parent.id || student.parent_id === parent.user_id);
      return <section className="parent-directory-card" key={parent.id}><div className="parent-directory-heading"><span>{parent.first_name?.[0]}{parent.last_name?.[0]}</span><div><h2>{parent.first_name} {parent.last_name}</h2><p>{parent.occupation || 'Registered guardian'}</p></div></div><div className="parent-directory-details"><div><Phone size={14} />{parent.phone ? <a href={`tel:${parent.phone}`}>{parent.phone}</a> : <span>Phone not provided</span>}</div><div><Mail size={14} />{parent.email ? <a href={`mailto:${parent.email}`}>{parent.email}</a> : <span>Email not provided</span>}</div><div><MapPin size={14} /><span>{parent.address || 'Address not provided'}</span></div></div><div className="parent-directory-children"><h3>Linked students</h3>{children.length ? children.map(child => <Link key={child.id} to={`/students/${child.id}`}><span>{child.first_name} {child.last_name}<small>{child.grade} {child.section}</small></span><ArrowUpRight size={14} /></Link>) : <p>No linked student profiles.</p>}</div></section>;
    })}</div> : <Panel title="Parent directory"><EmptyState title={search ? 'No matching guardians' : 'No parent profiles yet'} description={search ? 'Try another name, email address or phone number.' : 'Registered guardian profiles will appear here.'} icon={HeartHandshake} /></Panel>}</DashboardFeedback>
  </div>;
}

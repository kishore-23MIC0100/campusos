import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  Users,
  Wrench,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../services/api";
import {
  DashboardFeedback,
  DashboardHeader,
  EmptyState,
  useWorkspaceData,
} from "../dashboard/WorkspaceOverview";

export function StaffDirectoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const load = useCallback(() => api.getStaffDirectory(), []);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const staff = (data?.staff || []).filter(
    (member) =>
      (category === "ALL" || member.category === category) &&
      [
        member.fullName,
        member.employeeId,
        member.designation,
        member.department,
      ].some((value) =>
        value.toLowerCase().includes(search.toLowerCase().trim()),
      ),
  );
  const categoryName = (id: string) =>
    data?.categories.find((item) => item.id === id)?.name || "Support staff";
  return (
    <div className="workspace-overview">
      <DashboardHeader
        eyebrow="People behind the campus"
        title="Every team. One campus."
        description="Find technicians, IT support, laboratory assistants, maintenance, housekeeping, security, transport, office, and other school teams."
        refresh={refresh}
        loading={loading}
        action={
          <Link to="/leave" className="workspace-primary">
            My leave requests <ArrowUpRight size={16} />
          </Link>
        }
      />
      <DashboardFeedback loading={loading} error={error} refresh={refresh}>
        <section className="staff-team-intro">
          <span>
            <Wrench size={25} />
          </span>
          <div>
            <h2>Campus support & technical teams</h2>
            <p>
              Browse registered colleagues by their area of work. Contact
              details appear only when recorded by your school.
            </p>
          </div>
          <ShieldCheck size={24} />
        </section>
        {data?.myProfile && (
          <div className="staff-my-profile">
            <strong>Your staff profile</strong>
            <span>{data.myProfile.fullName}</span>
            <span>{data.myProfile.designation}</span>
            <span>{data.myProfile.department}</span>
            <span>{data.myProfile.employeeId}</span>
          </div>
        )}
        <div className="staff-directory-tools">
          <label className="staff-search">
            <Search size={18} />
            <input
              aria-label="Search staff teams"
              placeholder="Name, job title, department or employee ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Staff category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">All teams ({data?.staff.length || 0})</option>
              {data?.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({data.categoryCounts[item.id] || 0})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="staff-category-grid" aria-label="Staff categories">
          {data?.categories
            .filter((item) => item.id !== "FACULTY")
            .map((item) => (
              <button
                key={item.id}
                aria-pressed={category === item.id}
                onClick={() =>
                  setCategory(category === item.id ? "ALL" : item.id)
                }
              >
                <strong>{item.name}</strong>
                <span>{data.categoryCounts[item.id] || 0} registered</span>
                <small>{item.description}</small>
              </button>
            ))}
        </div>
        <section className="overview-panel staff-directory-panel">
          <div className="overview-panel-heading">
            <div>
              <h2>
                {category === "ALL"
                  ? "Staff directory"
                  : categoryName(category)}
              </h2>
              <p>
                {staff.length} colleague{staff.length === 1 ? "" : "s"} match
                your selection
              </p>
            </div>
          </div>
          {staff.length ? (
            <div className="staff-directory-grid">
              {staff.map((member) => (
                <article key={member.id} className="staff-person">
                  <div className="staff-person-top">
                    <span className="staff-initials">
                      {member.fullName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((name) => name[0])
                        .join("")}
                    </span>
                    <span
                      className={`overview-status ${member.status === "ACTIVE" ? "is-approved" : ""}`}
                    >
                      {member.status === "ON_LEAVE" ? "On leave" : "Active"}
                    </span>
                  </div>
                  <h3>{member.fullName}</h3>
                  <p>{member.designation}</p>
                  <span className="overview-tag">
                    {categoryName(member.category)}
                  </span>
                  <dl>
                    <div>
                      <dt>Department</dt>
                      <dd>{member.department}</dd>
                    </div>
                    <div>
                      <dt>Employee ID</dt>
                      <dd>{member.employeeId}</dd>
                    </div>
                  </dl>
                  <div className="staff-contact">
                    {member.email && (
                      <a href={`mailto:${member.email}`}>
                        <Mail size={15} />
                        {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone.replace(/[^+0-9]/g, "")}`}>
                        <Phone size={15} />
                        {member.phone}
                      </a>
                    )}
                    {!member.email && !member.phone && (
                      <span>Contact the school office for this colleague.</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No staff members found"
              description="Try another team or search. Your administrator can add personnel records in Staff & HR."
            />
          )}
        </section>
      </DashboardFeedback>
    </div>
  );
}

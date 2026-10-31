import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Megaphone,
  Bus,
  Calendar,
  Clock3,
  CheckCircle2,
  ArrowUpRight,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  DashboardFeedback,
  DashboardHeader,
  EmptyState,
  EventsList,
  MetricGrid,
  Notices,
  Panel,
  QuickLinks,
  formatDate,
  useWorkspaceData,
} from "./WorkspaceOverview";

export function StaffDashboard() {
  const { user } = useAuth();
  const load = useCallback(async () => {
    const [leaves, notices, events] = await Promise.all([
      api.getLeaves({ status: "ALL" }),
      api.getAnnouncements(),
      api.getEvents(),
    ]);
    return {
      leaves: leaves.leaves.filter((item) => item.applicant_id === user?.id),
      notices: notices.announcements,
      events: events.events,
    };
  }, [user?.id]);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const latestLeave = data?.leaves[0];
  const pending =
    data?.leaves.filter((item) => item.status === "PENDING").length || 0;
  const approved =
    data?.leaves.filter((item) => item.status === "APPROVED").length || 0;
  return (
    <div className="workspace-overview">
      <DashboardHeader
        eyebrow="Staff workspace"
        title="Your day, connected."
        description="For technicians, IT support, facilities, security, office and other campus staff."
        refresh={refresh}
        loading={loading}
        action={
          <Link to="/leave" className="workspace-primary">
            Apply for leave <ArrowUpRight size={15} />
          </Link>
        }
      />
      <DashboardFeedback loading={loading} error={error} refresh={refresh}>
        <MetricGrid
          items={[
            {
              label: "My leave requests",
              value: data?.leaves.length || 0,
              detail: "Requests submitted by you",
              icon: CalendarDays,
              featured: true,
            },
            {
              label: "Awaiting review",
              value: pending,
              detail: "Pending administrator approval",
              icon: Clock3,
            },
            {
              label: "Approved requests",
              value: approved,
              detail: "Your approved leave requests",
              icon: CheckCircle2,
            },
            {
              label: "Campus notices",
              value: data?.notices.length || 0,
              detail: "Announcements available to you",
              icon: Megaphone,
            },
          ]}
        />
        <div className="overview-grid overview-grid-main">
          <Panel
            title="Campus announcements"
            description="Stay informed about what's happening at school"
            to="/announcements"
          >
            <Notices notices={data?.notices || []} />
          </Panel>
          <Panel
            title="Your staff essentials"
            description="Everything you need for the working day"
          >
            <QuickLinks
              links={[
                {
                  to: "/staff-services",
                  title: "Staff teams & technicians",
                  description:
                    "Find IT, technical, maintenance and support colleagues",
                  icon: Wrench,
                },
                {
                  to: "/leave",
                  title: "Leave & requests",
                  description: "Apply and track approval status",
                  icon: CalendarDays,
                },
                {
                  to: "/transport",
                  title: "Campus transport",
                  description: "Routes, stops and fleet information",
                  icon: Bus,
                },
                {
                  to: "/events",
                  title: "Campus events",
                  description: "Explore activities and register",
                  icon: Calendar,
                },
                {
                  to: "/announcements",
                  title: "Notice board",
                  description: "Read school circulars and updates",
                  icon: Megaphone,
                },
              ]}
            />
          </Panel>
        </div>
        <div className="overview-grid overview-grid-main">
          <Panel
            title="Your latest request"
            to="/leave"
            linkLabel="All requests"
          >
            {latestLeave ? (
              <div className="overview-request">
                <div>
                  <span className="overview-tag">
                    {String(latestLeave.leave_type).replaceAll("_", " ")}
                  </span>
                  <span
                    className={`overview-status ${latestLeave.status === "APPROVED" ? "is-approved" : latestLeave.status === "REJECTED" ? "is-rejected" : ""}`}
                  >
                    {String(latestLeave.status).toLowerCase()}
                  </span>
                </div>
                <h3>
                  {formatDate(latestLeave.from_date)} to{" "}
                  {formatDate(latestLeave.to_date)}
                </h3>
                <p>{latestLeave.reason}</p>
                <span>
                  {latestLeave.total_days} day
                  {Number(latestLeave.total_days) === 1 ? "" : "s"} requested
                </span>
              </div>
            ) : (
              <EmptyState
                title="No leave requests yet"
                description="When you apply for leave, you can follow its review here."
                icon={CalendarDays}
              />
            )}
          </Panel>
          <Panel title="Coming up on campus" to="/events">
            <EventsList events={data?.events || []} />
          </Panel>
        </div>
      </DashboardFeedback>
    </div>
  );
}

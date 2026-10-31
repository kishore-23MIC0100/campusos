import { useCallback, useEffect, useState } from "react";
import { Download, Search, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  auditCsvCell as csvCell,
  auditTimestamp as formatTimestamp,
} from "../../services/audit-export";
import { api } from "../../services/api";
import {
  DashboardFeedback,
  DashboardHeader,
  EmptyState,
  useWorkspaceData,
} from "../dashboard/WorkspaceOverview";

const labels: Record<string, string> = {
  LOGIN_SUCCESS: "Successful sign-in",
  LOGIN_FAILED: "Failed sign-in",
  LOGIN_BLOCKED: "Blocked sign-in",
  PORTAL_ACCOUNT_CREATED: "Portal account created",
  PORTAL_CREDENTIALS_UPDATED: "Portal credentials updated",
  PASSWORD_CHANGED: "Password changed",
  ACCESS_REQUESTED: "Access requested",
  USER_APPROVED: "User approved",
  USER_REJECTED: "User rejected",
  USER_STATUS_CHANGED: "Account status changed",
};
export function AuditLogsPage() {
  const [action, setAction] = useState("ALL");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(
    () =>
      api.getAuditLogs({
        action: action === "ALL" ? undefined : action,
        search: query.trim() || undefined,
        limit: 100,
      }),
    [action, query],
  );
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const logs = data?.logs || [];
  const actions = [
    ...new Set([...Object.keys(labels), ...(data?.actions || [])]),
  ];
  function exportCSV() {
    const rows = [
      [
        "Timestamp (India time)",
        "Account",
        "Role",
        "Action",
        "Entity",
        "Description",
        "IP address",
        "User agent",
      ],
      ...logs.map((log) => [
        formatTimestamp(log.created_at),
        log.user_name,
        log.user_role,
        log.action,
        log.entity_type,
        log.description,
        log.ip_address,
        log.user_agent,
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Scholaxys_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="workspace-overview">
      <DashboardHeader
        eyebrow="Accountability & access"
        title="Activity & sign-in logs"
        description="Review successful sign-ins, rejected attempts, approvals and credential changes. Portal roles are recorded separately, including shared review accounts."
        refresh={refresh}
        loading={loading}
        action={
          <button
            className="workspace-secondary"
            disabled={loading || !logs.length}
            onClick={exportCSV}
          >
            <Download size={16} />
            Export current view
          </button>
        }
      />
      <div className="staff-team-intro">
        <span>
          <ShieldCheck size={24} />
        </span>
        <div>
          <h2>Authentication events, with context</h2>
          <p>
            Logs identify the portal, account role, time and browser. Passwords
            and authentication tokens are never included.
          </p>
        </div>
      </div>
      <div className="staff-directory-tools">
        <label className="staff-search">
          <Search size={18} />
          <input
            aria-label="Search activity logs"
            placeholder="Search account, action or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Action
          <select
            aria-label="Filter activity action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="ALL">All actions</option>
            {actions.map((value) => (
              <option key={value} value={value}>
                {labels[value] || value.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <DashboardFeedback loading={loading} error={error} refresh={refresh}>
        <section className="overview-panel staff-directory-panel">
          <div className="overview-panel-heading">
            <div>
              <h2>Recorded activity</h2>
              <p>
                Showing {logs.length} of {data?.total ?? logs.length} matching
                events, newest first. Times are shown in India Standard Time.
              </p>
            </div>
          </div>
          {logs.length ? (
            <div className="staff-hr-table audit-log-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Account & role</th>
                    <th scope="col">Action</th>
                    <th scope="col">Event details</th>
                    <th scope="col">Request context</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatTimestamp(log.created_at)}</td>
                      <td>
                        <strong>{log.user_name || "Unknown account"}</strong>
                        <small>{log.user_role || "Not recorded"}</small>
                      </td>
                      <td>
                        <span
                          className={`overview-status ${log.action === "LOGIN_SUCCESS" ? "is-approved" : ["LOGIN_FAILED", "LOGIN_BLOCKED"].includes(log.action) ? "is-rejected" : ""}`}
                        >
                          {labels[log.action] ||
                            String(log.action)
                              .replaceAll("_", " ")
                              .toLowerCase()}
                        </span>
                      </td>
                      <td className="audit-description">
                        {log.description}
                        <small>
                          {log.entity_type} /{" "}
                          {log.entity_id || "No matching account"}
                        </small>
                      </td>
                      <td>
                        <span>{log.ip_address || "Not recorded"}</span>
                        <small
                          className="audit-user-agent"
                          title={log.user_agent}
                        >
                          {log.user_agent || "Browser not recorded"}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="No matching activity"
              description="Choose another action or search. New authentication and administrative events will appear here."
            />
          )}
        </section>
      </DashboardFeedback>
    </div>
  );
}

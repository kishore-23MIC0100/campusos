import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Plus,
  Users,
  X,
} from "lucide-react";
import { api } from "../../services/api";
import { AccessibleDialog } from "../../components/common/AccessibleDialog";
import { useToast } from "../../context/ToastContext";
import {
  DashboardFeedback,
  DashboardHeader,
  EmptyState,
  MetricGrid,
  useWorkspaceData,
} from "../dashboard/WorkspaceOverview";

const blank = () => ({
  fullName: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  staffCategory: "GENERAL",
  qualification: "",
  experienceYears: 0,
  dateOfJoining: "",
  employmentType: "Full-Time",
  status: "ACTIVE",
  baseSalary: 0,
  bankName: "",
  accountNo: "",
  ifscCode: "",
  panNo: "",
  assignedSubjects: "",
  assignedClasses: "",
});
type Form = ReturnType<typeof blank>;
const currency = (value: unknown) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
export function StaffManagementPage() {
  const { showToast } = useToast();
  const load = useCallback(async () => {
    const [stats, records] = await Promise.all([
      api.getStaffStats(),
      api.getStaffList(),
    ]);
    return { stats, staff: records.staff };
  }, []);
  const { data, loading, error, refresh } = useWorkspaceData(load);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [detail, setDetail] = useState<{ staff: any; payrolls: any[] } | null>(
    null,
  );
  const [detailBusy, setDetailBusy] = useState(false);
  const staff = (data?.staff || []).filter(
    (member) =>
      (category === "ALL" || member.staff_category === category) &&
      (status === "ALL" || member.status === status) &&
      [
        member.full_name,
        member.employee_id,
        member.designation,
        member.department,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
  );
  const categories = data?.stats.categories || [];
  const categoryName = (id: string) =>
    categories.find((item) => item.id === id)?.name || "Other support staff";
  function openForm(member?: any) {
    setEditing(member || null);
    setFormError("");
    if (member) {
      const list = (value: unknown) => {
        try {
          const parsed = typeof value === "string" ? JSON.parse(value) : value;
          return Array.isArray(parsed)
            ? parsed
                .map((item) =>
                  typeof item === "string"
                    ? item
                    : [item.grade, item.section].filter(Boolean).join(" "),
                )
                .join(", ")
            : "";
        } catch {
          return "";
        }
      };
      setForm({
        fullName: member.full_name || "",
        email: member.email || "",
        phone: member.phone || "",
        department: member.department || "",
        designation: member.designation || "",
        staffCategory: member.staff_category || "GENERAL",
        qualification: member.qualification || "",
        experienceYears: member.experience_years ?? 0,
        dateOfJoining: member.date_of_joining || "",
        employmentType: member.employment_type || "Full-Time",
        status: member.status || "ACTIVE",
        baseSalary: member.base_salary ?? 0,
        bankName: member.bank_name || "",
        accountNo: member.account_no || "",
        ifscCode: member.ifsc_code || "",
        panNo: member.pan_no || "",
        assignedSubjects: list(member.assigned_subjects),
        assignedClasses: list(member.assigned_classes),
      });
    } else setForm(blank());
    setOpen(true);
  }
  function field<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        role: form.staffCategory === "FACULTY" ? "TEACHER" : "STAFF",
        assignedSubjects: form.assignedSubjects
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        assignedClasses: form.assignedClasses
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      };
      if (editing) await api.updateStaffMember(editing.id, payload);
      else await api.createStaffMember(payload);
      setOpen(false);
      showToast(
        editing ? "Staff record updated." : "Staff record added.",
        "success",
      );
      refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save this record.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function showDetail(member: any) {
    setDetail({ staff: member, payrolls: [] });
    setDetailBusy(true);
    try {
      setDetail(await api.getStaffMember(member.id));
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not load staff details.",
        "error",
      );
    } finally {
      setDetailBusy(false);
    }
  }
  async function archive(member: any) {
    if (
      !window.confirm(
        `Archive ${member.full_name}? Their HR history will be retained.`,
      )
    )
      return;
    try {
      await api.deleteStaffMember(member.id);
      setDetail(null);
      showToast("Staff record archived.", "success");
      refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not archive record.",
        "error",
      );
    }
  }
  return (
    <div className="workspace-overview">
      <DashboardHeader
        eyebrow="People & operations"
        title="Staff & human resources"
        description="Manage teachers, technicians, IT support, maintenance, housekeeping, security, transport, office, and other campus personnel."
        refresh={refresh}
        loading={loading}
        action={
          <button className="workspace-primary" onClick={() => openForm()}>
            <Plus size={16} />
            Add staff member
          </button>
        }
      />
      <DashboardFeedback loading={loading} error={error} refresh={refresh}>
        <MetricGrid
          items={[
            {
              label: "Personnel records",
              value: data?.stats.totalCount || 0,
              detail: "All recorded staff",
              icon: Users,
              featured: true,
            },
            {
              label: "Teaching faculty",
              value: data?.stats.totalFaculty || 0,
              detail: "Academic colleagues",
              icon: GraduationCap,
            },
            {
              label: "Support & technical staff",
              value: data?.stats.totalSupportStaff || 0,
              detail: "Non-teaching campus teams",
              icon: Briefcase,
            },
            {
              label: "Active staff",
              value: data?.stats.activeCount || 0,
              detail: `${data?.stats.onLeaveCount || 0} currently on leave`,
              icon: CheckCircle2,
            },
          ]}
        />
        <div className="staff-hr-toolbar">
          <input
            aria-label="Search personnel"
            placeholder="Search name, employee ID, job or department"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Filter personnel category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ALL">All staff categories</option>
            {categories.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name} ({data?.stats.categoryCounts[item.id] || 0})
              </option>
            ))}
          </select>
          <select
            aria-label="Filter employment status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All employment statuses</option>
            {["ACTIVE", "ON_LEAVE", "INACTIVE", "ARCHIVED"].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <Link to="/staff-services" className="workspace-secondary">
            View staff teams <ArrowUpRight size={15} />
          </Link>
        </div>
        <section className="overview-panel staff-directory-panel">
          <div className="overview-panel-heading">
            <div>
              <h2>Personnel directory</h2>
              <p>
                {staff.length} staff record{staff.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          {staff.length ? (
            <div className="staff-hr-table">
              <table>
                <thead>
                  <tr>
                    <th>Staff member</th>
                    <th>Category & designation</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.full_name}</strong>
                        <small>{member.employee_id}</small>
                      </td>
                      <td>
                        {categoryName(member.staff_category)}
                        <small>{member.designation}</small>
                      </td>
                      <td>{member.department || "Not recorded"}</td>
                      <td>
                        <span
                          className={`overview-status ${member.status === "ACTIVE" ? "is-approved" : ""}`}
                        >
                          {member.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => showDetail(member)}
                          aria-label={`View ${member.full_name}`}
                        >
                          View
                        </button>
                        <button
                          onClick={() => openForm(member)}
                          aria-label={`Edit ${member.full_name}`}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No matching personnel"
              description="Adjust your filters or add your first staff member."
            />
          )}
        </section>
      </DashboardFeedback>
      {open && (
        <AccessibleDialog
          title={editing ? "Edit staff member" : "Add staff member"}
          busy={busy}
          onClose={() => setOpen(false)}
          className="w-full max-w-3xl rounded-2xl bg-white p-6 sm:p-8"
        >
          <div className="staff-form-header">
            <h2>{editing ? "Edit staff record" : "Add staff member"}</h2>
            <button
              aria-label="Close staff form"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              <X size={18} />
            </button>
          </div>
          <p className="staff-hr-note">
            Choose the person’s actual job category and enter school records.
            Workspace sign-in is managed separately in Users & Access.
          </p>
          <form onSubmit={save}>
            <div className="staff-form">
              <label>
                Full name *
                <input
                  required
                  maxLength={120}
                  value={form.fullName}
                  onChange={(e) => field("fullName", e.target.value)}
                />
              </label>
              <label>
                Work email *
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => field("email", e.target.value)}
                />
              </label>
              <label>
                Staff category *
                <select
                  value={form.staffCategory}
                  onChange={(e) => field("staffCategory", e.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Job title / designation *
                <input
                  required
                  value={form.designation}
                  onChange={(e) => field("designation", e.target.value)}
                  placeholder="e.g. Campus Technician"
                />
              </label>
              <label>
                Department *
                <input
                  required
                  value={form.department}
                  onChange={(e) => field("department", e.target.value)}
                  placeholder="e.g. Technical services"
                />
              </label>
              <label>
                Work phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => field("phone", e.target.value)}
                />
              </label>
              <label>
                Qualifications
                <input
                  value={form.qualification}
                  onChange={(e) => field("qualification", e.target.value)}
                />
              </label>
              <label>
                Experience in years
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={form.experienceYears}
                  onChange={(e) =>
                    field("experienceYears", Number(e.target.value))
                  }
                />
              </label>
              <label>
                Joining date
                <input
                  type="date"
                  value={form.dateOfJoining}
                  onChange={(e) => field("dateOfJoining", e.target.value)}
                />
              </label>
              <label>
                Employment type
                <select
                  value={form.employmentType}
                  onChange={(e) => field("employmentType", e.target.value)}
                >
                  {[
                    "Full-Time",
                    "Part-Time",
                    "Contract",
                    "Full-Time Permanent",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Employment status
                <select
                  value={form.status}
                  onChange={(e) => field("status", e.target.value)}
                >
                  {["ACTIVE", "ON_LEAVE", "INACTIVE", "ARCHIVED"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value.replaceAll("_", " ")}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Monthly base salary (INR)
                <input
                  type="number"
                  min="0"
                  value={form.baseSalary}
                  onChange={(e) => field("baseSalary", Number(e.target.value))}
                />
              </label>
              <label>
                Bank name
                <input
                  value={form.bankName}
                  onChange={(e) => field("bankName", e.target.value)}
                />
              </label>
              <label>
                Account number
                <input
                  value={form.accountNo}
                  onChange={(e) => field("accountNo", e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label>
                IFSC code
                <input
                  value={form.ifscCode}
                  onChange={(e) => field("ifscCode", e.target.value)}
                />
              </label>
              <label>
                PAN number
                <input
                  value={form.panNo}
                  onChange={(e) => field("panNo", e.target.value)}
                  autoComplete="off"
                />
              </label>
              {form.staffCategory === "FACULTY" && (
                <>
                  <label>
                    Teaching subjects (comma separated)
                    <input
                      value={form.assignedSubjects}
                      onChange={(e) =>
                        field("assignedSubjects", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Allotted classes (comma separated)
                    <input
                      value={form.assignedClasses}
                      onChange={(e) => field("assignedClasses", e.target.value)}
                    />
                  </label>
                </>
              )}
            </div>
            {formError && (
              <p className="staff-form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="staff-form-footer">
              <button
                type="button"
                className="workspace-secondary"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="workspace-primary"
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Add staff member"}
              </button>
            </div>
          </form>
        </AccessibleDialog>
      )}
      {detail && (
        <AccessibleDialog
          title="Staff personnel record"
          onClose={() => setDetail(null)}
          className="w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8"
        >
          <div className="staff-form-header">
            <h2>{detail.staff.full_name}</h2>
            <button
              aria-label="Close personnel record"
              onClick={() => setDetail(null)}
            >
              <X size={18} />
            </button>
          </div>
          <p className="staff-hr-note">
            {detail.staff.designation} / {detail.staff.department}
            <br />
            {detail.staff.employee_id}
          </p>
          <dl className="staff-hr-detail">
            {[
              ["Category", categoryName(detail.staff.staff_category)],
              ["Email", detail.staff.email],
              ["Phone", detail.staff.phone],
              ["Qualifications", detail.staff.qualification],
              ["Joining date", detail.staff.date_of_joining],
              ["Employment", detail.staff.employment_type],
              ["Base salary", currency(detail.staff.base_salary)],
              ["Bank", detail.staff.bank_name],
              ["Account number", detail.staff.account_no],
              ["IFSC", detail.staff.ifsc_code],
              ["PAN", detail.staff.pan_no],
              ["Status", detail.staff.status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "Not recorded"}</dd>
              </div>
            ))}
          </dl>
          <h3>Recent payroll</h3>
          {detailBusy ? (
            <p role="status">Loading payroll…</p>
          ) : detail.payrolls.length ? (
            <div className="staff-hr-table">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Net pay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.payrolls.slice(0, 4).map((record) => (
                    <tr key={record.id}>
                      <td>
                        {record.month} {record.year}
                      </td>
                      <td>{currency(record.net_salary)}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="staff-hr-note">No payroll records available.</p>
          )}
          <div className="staff-form-footer">
            <button
              className="workspace-secondary"
              onClick={() => archive(detail.staff)}
            >
              Archive record
            </button>
            <button
              className="workspace-primary"
              onClick={() => {
                const member = detail.staff;
                setDetail(null);
                openForm(member);
              }}
            >
              Edit record
            </button>
          </div>
        </AccessibleDialog>
      )}
    </div>
  );
}

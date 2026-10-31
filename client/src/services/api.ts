// Same-origin requests work in production, local preview and on a shared LAN.
// Vite proxies /api in development; VITE_API_BASE is an optional explicit override.
const API_BASE = (
  (import.meta as ImportMeta & { env?: { VITE_API_BASE?: string } }).env
    ?.VITE_API_BASE || "/api"
).replace(/\/$/, "");
export const SESSION_EXPIRED_EVENT = "campusos:session-expired";

export interface User {
  id: string;
  email: string;
  username: string;
  role:
    | "SUPER_ADMIN"
    | "SCHOOL_ADMIN"
    | "TEACHER"
    | "STAFF"
    | "STUDENT"
    | "PARENT";
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
  department?: string;
  studentId?: string;
  admissionNo?: string;
  gradeSection?: string;
  bio?: string;
  mfaEnabled?: boolean;
  allottedClasses?: Array<{ grade: string; section: string }>;
  allottedSubjects?: string[];
  employeeId?: string;
}

export interface StaffCategory {
  id: string;
  name: string;
  description: string;
}
export interface StaffDirectoryEntry {
  id: string;
  employeeId: string;
  fullName: string;
  designation: string;
  department: string;
  category: string;
  email: string;
  phone: string;
  status: string;
}

// Storage is unavailable in some private-browser and embedded contexts. A
// memory fallback keeps sign-in usable without weakening server validation.
let memoryToken: string | null = null;
let memoryUser: User | null = null;
let memoryOnly = false;
const roles = new Set([
  "SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STAFF",
  "STUDENT",
  "PARENT",
]);

export function getToken(): string | null {
  try {
    return memoryOnly ? memoryToken : localStorage.getItem("campusos_token");
  } catch {
    return memoryToken;
  }
}

export function setToken(token: string) {
  memoryToken = token;
  try {
    localStorage.setItem("campusos_token", token);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
}

export function clearToken() {
  memoryToken = null;
  memoryUser = null;
  try {
    localStorage.removeItem("campusos_token");
    localStorage.removeItem("campusos_user");
  } catch {
    /* Storage may be disabled. */
  }
}

export function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem("campusos_user");
    if (!data) return memoryOnly ? memoryUser : null;
    const user = JSON.parse(data);
    return user &&
      typeof user.id === "string" &&
      typeof user.fullName === "string" &&
      roles.has(user.role) &&
      user.status === "APPROVED"
      ? (user as User)
      : null;
  } catch {
    return memoryUser;
  }
}

export function setStoredUser(user: User) {
  memoryUser = user;
  try {
    localStorage.setItem("campusos_user", JSON.stringify(user));
  } catch {
    /* Session stays in memory. */
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;
  constructor(message: string, status = 0, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function buildQuery(
  params?: Record<string, string | number | boolean | null | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "")
      query.set(key, String(value));
  }
  return query.toString();
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const publicAuth = /^\/auth\/(login|register|reset-password)$/.test(endpoint);
  const token = publicAuth ? null : getToken();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), 20000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout.signal])
    : timeout.signal;
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal,
    });
    const text = await response.text();
    let data: any = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new ApiError(
          response.ok
            ? "The server returned an unreadable response. Please try again."
            : "The service is temporarily unavailable. Please try again.",
          response.status,
        );
      }
    }
    if (!response.ok) {
      // Expired/removed accounts must leave every open workspace immediately.
      // A normal 403 on a disallowed operation does not log the user out.
      if (
        token &&
        (response.status === 401 ||
          (response.status === 403 && endpoint === "/auth/me"))
      ) {
        clearToken();
        if (typeof window !== "undefined")
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      throw new ApiError(
        data?.error || `Request failed (${response.status}). Please try again.`,
        response.status,
        data,
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      timeout.signal.aborted
        ? "The request timed out. Check your connection and try again."
        : "Unable to reach CampusOS. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Auth
  async login(identifier: string, password: string, expectedRole?: string) {
    const res = await apiFetch<{
      token: string;
      user: User;
      roleMismatchWarning?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, expectedRole }),
    });
    setToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async register(data: {
    fullName: string;
    email: string;
    username?: string;
    password: string;
    role: string;
    phone?: string;
    department?: string;
    gradeSection?: string;
    studentId?: string;
    notes?: string;
  }) {
    return apiFetch<{
      message: string;
      status: string;
      requestId: string;
      details: any;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return apiFetch<User>("/auth/me");
  },

  async resetPassword(identifier: string) {
    return apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiFetch<{ message: string; token: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    );
    setToken(response.token);
    return response;
  },

  // Users & RBAC
  async getUsers(params?: { role?: string; status?: string; search?: string }) {
    const query = buildQuery(params);
    return apiFetch<{ users: User[] }>(`/users?${query}`);
  },

  async approveUser(id: string) {
    return apiFetch<{ message: string; userId: string }>(
      `/users/${encodeURIComponent(id)}/approve`,
      { method: "PUT" },
    );
  },

  async rejectUser(id: string, reason?: string) {
    return apiFetch<{ message: string }>(
      `/users/${encodeURIComponent(id)}/reject`,
      {
        method: "PUT",
        body: JSON.stringify({ reason }),
      },
    );
  },

  async updateUserStatus(id: string, status: string) {
    return apiFetch<{ message: string }>(
      `/users/${encodeURIComponent(id)}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
    );
  },

  async getRolesAndPermissions() {
    return apiFetch<{ roles: any[]; permissions: any[] }>("/users/roles/all");
  },

  // Students
  async getStudents(params?: {
    grade?: string;
    section?: string;
    search?: string;
    status?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ students: any[] }>(`/students?${query}`);
  },

  async getStudent(id: string) {
    return apiFetch<{
      student: any;
      attendance: any[];
      performance: any[];
      homework: any[];
      leaves: any[];
    }>(`/students/${encodeURIComponent(id)}`);
  },

  async createStudent(data: any) {
    return apiFetch<{ message: string; studentId: string; id: string }>(
      "/students",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  async updateStudent(id: string, data: any) {
    return apiFetch<{ message: string }>(
      `/students/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  // Teachers
  async getTeachers(params?: { department?: string; search?: string }) {
    const query = buildQuery(params);
    return apiFetch<{ teachers: any[] }>(`/teachers?${query}`);
  },

  async getTeacher(id: string) {
    return apiFetch<{ teacher: any; timetable: any[]; activeHomework: any[] }>(
      `/teachers/${encodeURIComponent(id)}`,
    );
  },

  // Parents
  async getParents(params?: { search?: string }) {
    const query = buildQuery(params);
    return apiFetch<{ parents: any[] }>(`/parents?${query}`);
  },

  async getMyChildren() {
    return apiFetch<{ parent: any; children: any[] }>("/parents/my-children");
  },

  // Attendance
  async getAttendance(params?: {
    grade?: string;
    section?: string;
    date?: string;
    studentId?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ records: any[]; summary: any }>(`/attendance?${query}`);
  },

  async submitBulkAttendance(
    grade: string,
    section: string,
    date: string,
    records: any[],
  ) {
    return apiFetch<{ message: string; processedCount: number }>(
      "/attendance/bulk",
      {
        method: "POST",
        body: JSON.stringify({ grade, section, date, records }),
      },
    );
  },

  async getAttendanceAnalytics() {
    return apiFetch<{ trends: any[]; classDistribution: any[] }>(
      "/attendance/analytics",
    );
  },

  // Leave
  async getLeaves(params?: {
    status?: string;
    role?: string;
    search?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ leaves: any[]; analytics: any }>(`/leave?${query}`);
  },

  async submitLeave(data: {
    leaveType: string;
    fromDate: string;
    toDate: string;
    totalDays: number;
    reason: string;
    isEmergency?: boolean;
  }) {
    return apiFetch<{ message: string; leaveId: string }>("/leave", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async approveLeave(id: string, remarks?: string) {
    return apiFetch<{ message: string }>(
      `/leave/${encodeURIComponent(id)}/approve`,
      {
        method: "PUT",
        body: JSON.stringify({ remarks }),
      },
    );
  },

  async rejectLeave(id: string, remarks?: string) {
    return apiFetch<{ message: string }>(
      `/leave/${encodeURIComponent(id)}/reject`,
      {
        method: "PUT",
        body: JSON.stringify({ remarks }),
      },
    );
  },

  // Homework
  async getHomework(params?: {
    grade?: string;
    section?: string;
    subject?: string;
    search?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ homework: any[] }>(`/homework?${query}`);
  },

  async getHomeworkDetail(id: string) {
    return apiFetch<{ homework: any; submissions: any[] }>(
      `/homework/${encodeURIComponent(id)}`,
    );
  },

  async createHomework(data: any) {
    return apiFetch<{ message: string; homeworkId: string }>("/homework", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async submitHomework(id: string, content?: string, attachment?: string) {
    return apiFetch<{ message: string; submissionId: string }>(
      `/homework/${encodeURIComponent(id)}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ content, attachment }),
      },
    );
  },

  // Timetable
  async getTimetable(params?: {
    grade?: string;
    section?: string;
    teacherName?: string;
    day?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ slots: any[] }>(`/timetable?${query}`);
  },

  async createTimetableSlot(data: any) {
    return apiFetch<{ message: string; id: string }>("/timetable", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteTimetableSlot(id: string) {
    return apiFetch<{ message: string }>(
      `/timetable/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  // Events
  async getEvents(params?: { category?: string; search?: string }) {
    const query = buildQuery(params);
    return apiFetch<{ events: any[] }>(`/events?${query}`);
  },

  async createEvent(data: any) {
    return apiFetch<{ message: string; eventId: string }>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async rsvpEvent(id: string) {
    return apiFetch<{ message: string }>(
      `/events/${encodeURIComponent(id)}/rsvp`,
      { method: "POST" },
    );
  },

  // Announcements
  async getAnnouncements(params?: {
    category?: string;
    priority?: string;
    audience?: string;
    search?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ announcements: any[] }>(`/announcements?${query}`);
  },

  async createAnnouncement(data: any) {
    return apiFetch<{ message: string; announcementId: string }>(
      "/announcements",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  // Spotlight
  async getSpotlights(params?: { category?: string }) {
    const query = buildQuery(params);
    return apiFetch<{ spotlights: any[] }>(`/spotlight?${query}`);
  },

  async createSpotlight(data: any) {
    return apiFetch<{ message: string; spotlightId: string }>("/spotlight", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Performance
  async getPerformance(params?: {
    studentId?: string;
    grade?: string;
    term?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ records: any[]; subjectAverages: any[]; analytics: any }>(
      `/performance?${query}`,
    );
  },

  async recordPerformance(data: any) {
    return apiFetch<{ message: string; recordId: string }>("/performance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // School
  async getSchoolProfile() {
    return apiFetch<{ profile: any }>("/school/profile");
  },

  async updateSchoolProfile(data: any) {
    return apiFetch<{ message: string }>("/school/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getHierarchy() {
    return apiFetch<{ hierarchy: any[] }>("/school/hierarchy");
  },

  async getFacilities() {
    return apiFetch<{ facilities: any[] }>("/school/facilities");
  },

  async getClasses() {
    return apiFetch<{ classes: any[] }>("/school/classes");
  },

  async getSubjects() {
    return apiFetch<{ subjects: any[] }>("/school/subjects");
  },

  // Audit Logs
  async getAuditLogs(params?: {
    action?: string;
    entityType?: string;
    search?: string;
    limit?: number;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ logs: any[] }>(`/audit-logs?${query}`);
  },

  // Notifications
  async getNotifications() {
    return apiFetch<{ notifications: any[]; unreadCount: number }>(
      "/notifications",
    );
  },

  async markNotificationRead(id: string) {
    return apiFetch<{ message: string }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: "PUT" },
    );
  },

  async markAllNotificationsRead() {
    return apiFetch<{ message: string }>("/notifications/read-all", {
      method: "PUT",
    });
  },

  async deleteNotification(id: string) {
    return apiFetch<{ message: string }>(
      `/notifications/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  async clearAllNotifications() {
    return apiFetch<{ message: string }>("/notifications", {
      method: "DELETE",
    });
  },

  // Reports
  async getInstitutionalReport() {
    return apiFetch<{ metrics: any; institution: any }>("/reports/summary");
  },

  // Payroll Management
  async getPayrollSummary() {
    return apiFetch<{
      month: string;
      year: number;
      totalStaffCount: number;
      processedCount: number;
      paidCount: number;
      pendingCount: number;
      totalDisbursed: number;
      pendingDisbursements: number;
      totalDeductions: number;
      departmentBreakdown: Record<string, number>;
    }>("/payroll/summary");
  },

  async getPayrollRecords(params?: {
    month?: string;
    year?: number;
    department?: string;
    status?: string;
    search?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ records: any[] }>(`/payroll/records?${query}`);
  },

  async getEmployeePayslips(employeeId: string) {
    return apiFetch<{ records: any[] }>(
      `/payroll/employee/${encodeURIComponent(employeeId)}`,
    );
  },

  async generatePayroll(month: string, year: number) {
    return apiFetch<{ success: boolean; message: string }>(
      "/payroll/generate",
      {
        method: "POST",
        body: JSON.stringify({ month, year }),
      },
    );
  },

  async updatePayrollStatus(
    id: string,
    data: { status: string; paymentMethod?: string; paymentDate?: string },
  ) {
    return apiFetch<{ success: boolean; record: any }>(
      `/payroll/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  async getPayslip(id: string) {
    return apiFetch<{ payslip: any }>(
      `/payroll/${encodeURIComponent(id)}/payslip`,
    );
  },

  // Faculties & Staffs Details
  async getStaffDirectory(params?: { category?: string; search?: string }) {
    return apiFetch<{
      staff: StaffDirectoryEntry[];
      categories: StaffCategory[];
      categoryCounts: Record<string, number>;
      myProfile: StaffDirectoryEntry | null;
    }>(`/staff/directory?${buildQuery(params)}`);
  },

  async getStaffList(params?: {
    category?: string;
    department?: string;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ staff: any[]; categories: StaffCategory[] }>(
      `/staff?${query}`,
    );
  },

  async getStaffStats() {
    return apiFetch<{
      categories: StaffCategory[];
      categoryCounts: Record<string, number>;
      totalCount: number;
      totalFaculty: number;
      totalSupportStaff: number;
      departmentCounts: Record<string, number>;
      roleCounts: Record<string, number>;
      activeCount: number;
      onLeaveCount: number;
    }>("/staff/stats");
  },

  async getStaffMember(id: string) {
    return apiFetch<{ staff: any; payrolls: any[] }>(
      `/staff/${encodeURIComponent(id)}`,
    );
  },

  async createStaffMember(data: any) {
    return apiFetch<{ success: boolean; staff: any }>("/staff", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateStaffMember(id: string, data: any) {
    return apiFetch<{ success: boolean; staff: any }>(
      `/staff/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  async deleteStaffMember(id: string) {
    return apiFetch<{ success: boolean; message: string }>(
      `/staff/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  // Assessments Portal
  async getAssessments(params?: {
    grade?: string;
    section?: string;
    subject?: string;
    facultyId?: string;
    term?: string;
    search?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ assessments: any[] }>(`/assessments?${query}`);
  },

  async getAssessmentDetails(id: string) {
    return apiFetch<{
      assessment: any;
      marks: any[];
      analytics: any;
      submissions: any[];
    }>(`/assessments/${encodeURIComponent(id)}`);
  },

  async createAssessment(data: any) {
    return apiFetch<{
      success: boolean;
      assessment: any;
      enrolledCount: number;
    }>("/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateAssessmentMarks(
    id: string,
    marksList: Array<{
      studentId: string;
      marksObtained: number | null;
      feedback?: string;
      questionMarks?: Record<string, number>;
    }>,
  ) {
    return apiFetch<{ success: boolean; message: string }>(
      `/assessments/${encodeURIComponent(id)}/marks`,
      {
        method: "POST",
        body: JSON.stringify({ marksList }),
      },
    );
  },

  async updateAssessmentDeadline(id: string, dueAt: string) {
    return apiFetch<{ success: boolean; dueAt: string }>(
      `/assessments/${encodeURIComponent(id)}/deadline`,
      { method: "PATCH", body: JSON.stringify({ dueAt }) },
    );
  },

  async deleteAssessment(id: string) {
    return apiFetch<{ success: boolean; message: string }>(
      `/assessments/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  async submitAssessment(
    id: string,
    data: {
      file?: { name: string; type: string; data: string };
      answers?: Record<string, string>;
      notes?: string;
    },
  ) {
    return apiFetch<{ success: boolean; submission: any }>(
      `/assessments/${encodeURIComponent(id)}/submit`,
      { method: "POST", body: JSON.stringify(data) },
    );
  },

  async startAssessment(id: string) {
    return apiFetch<{ startedAt: string; endsAt: string }>(
      `/assessments/${encodeURIComponent(id)}/start`,
      { method: "POST", body: JSON.stringify({}) },
    );
  },

  async getAssessmentSubmissionFile(id: string, submissionId: string) {
    return apiFetch<{ file: { name: string; type: string; data: string } }>(
      `/assessments/${encodeURIComponent(id)}/submissions/${encodeURIComponent(submissionId)}/file`,
    );
  },

  async getStudentAssessments(studentId: string) {
    return apiFetch<{
      studentId: string;
      totalAssessments: number;
      gradedAssessments: number;
      assessments: any[];
      subjectBreakdown: any[];
    }>(`/assessments/student/${encodeURIComponent(studentId)}`);
  },

  // Transportation Management
  async getTransportOverview() {
    return apiFetch<{
      totalRoutes: number;
      activeRoutes: number;
      totalVehicles: number;
      gpsActiveVehicles: number;
      totalFleetCapacity: number;
      totalStudentsAllocated: number;
      utilizationRate: number;
    }>("/transport/overview");
  },

  async getTransportRoutes(params?: { status?: string; search?: string }) {
    const query = buildQuery(params);
    return apiFetch<{ routes: any[] }>(`/transport/routes?${query}`);
  },

  async getRouteDetails(id: string) {
    return apiFetch<{ route: any }>(
      `/transport/routes/${encodeURIComponent(id)}`,
    );
  },

  async createTransportRoute(data: any) {
    return apiFetch<{ success: boolean; route: any }>("/transport/routes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTransportRoute(id: string, data: any) {
    return apiFetch<{ success: boolean; route: any }>(
      `/transport/routes/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  async deleteTransportRoute(id: string) {
    return apiFetch<{ success: boolean; message: string }>(
      `/transport/routes/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  async getTransportVehicles() {
    return apiFetch<{ vehicles: any[] }>("/transport/vehicles");
  },

  async getTransportAllocations(params?: {
    routeId?: string;
    studentId?: string;
    search?: string;
  }) {
    const query = buildQuery(params);
    return apiFetch<{ allocations: any[] }>(`/transport/allocations?${query}`);
  },

  async allocateStudentTransport(data: any) {
    return apiFetch<{ success: boolean; allocation: any }>(
      "/transport/allocate",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  async removeTransportAllocation(id: string) {
    return apiFetch<{ success: boolean; message: string }>(
      `/transport/allocations/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  async simulateTransitProgress(routeId: string) {
    return apiFetch<{
      success: boolean;
      status: string;
      currentTransitStep: number;
    }>(`/transport/routes/${encodeURIComponent(routeId)}/simulate-transit`, {
      method: "POST",
    });
  },
};

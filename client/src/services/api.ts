const API_BASE = 'http://localhost:4000/api';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
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

// Token helper
export function getToken(): string | null {
  return localStorage.getItem('campusos_token');
}

export function setToken(token: string) {
  localStorage.setItem('campusos_token', token);
}

export function clearToken() {
  localStorage.removeItem('campusos_token');
  localStorage.removeItem('campusos_user');
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('campusos_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem('campusos_user', JSON.stringify(user));
}

// Generic fetcher
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.error || 'Network error occurred.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async login(identifier: string, password: string, expectedRole?: string) {
    const res = await apiFetch<{ token: string; user: User; roleMismatchWarning?: string }>('/auth/login', {
      method: 'POST',
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
    return apiFetch<{ message: string; status: string; requestId: string; details: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return apiFetch<User>('/auth/me');
  },

  async resetPassword(identifier: string) {
    return apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  },

  // Users & RBAC
  async getUsers(params?: { role?: string; status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ users: User[] }>(`/users?${query}`);
  },

  async approveUser(id: string) {
    return apiFetch<{ message: string; userId: string }>(`/users/${id}/approve`, { method: 'PUT' });
  },

  async rejectUser(id: string, reason?: string) {
    return apiFetch<{ message: string }>(`/users/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async updateUserStatus(id: string, status: string) {
    return apiFetch<{ message: string }>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getRolesAndPermissions() {
    return apiFetch<{ roles: any[]; permissions: any[] }>('/users/roles/all');
  },

  // Students
  async getStudents(params?: { grade?: string; section?: string; search?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ students: any[] }>(`/students?${query}`);
  },

  async getStudent(id: string) {
    return apiFetch<{ student: any; attendance: any[]; performance: any[]; homework: any[]; leaves: any[] }>(`/students/${id}`);
  },

  async createStudent(data: any) {
    return apiFetch<{ message: string; studentId: string; id: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStudent(id: string, data: any) {
    return apiFetch<{ message: string }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Teachers
  async getTeachers(params?: { department?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ teachers: any[] }>(`/teachers?${query}`);
  },

  async getTeacher(id: string) {
    return apiFetch<{ teacher: any; timetable: any[]; activeHomework: any[] }>(`/teachers/${id}`);
  },

  // Parents
  async getParents(params?: { search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ parents: any[] }>(`/parents?${query}`);
  },

  async getMyChildren() {
    return apiFetch<{ parent: any; children: any[] }>('/parents/my-children');
  },

  // Attendance
  async getAttendance(params?: { grade?: string; section?: string; date?: string; studentId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ records: any[]; summary: any }>(`/attendance?${query}`);
  },

  async submitBulkAttendance(grade: string, section: string, date: string, records: any[]) {
    return apiFetch<{ message: string; processedCount: number }>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ grade, section, date, records }),
    });
  },

  async getAttendanceAnalytics() {
    return apiFetch<{ trends: any[]; classDistribution: any[] }>('/attendance/analytics');
  },

  // Leave
  async getLeaves(params?: { status?: string; role?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ leaves: any[]; analytics: any }>(`/leave?${query}`);
  },

  async submitLeave(data: { leaveType: string; fromDate: string; toDate: string; totalDays: number; reason: string; isEmergency?: boolean }) {
    return apiFetch<{ message: string; leaveId: string }>('/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approveLeave(id: string, remarks?: string) {
    return apiFetch<{ message: string }>(`/leave/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    });
  },

  async rejectLeave(id: string, remarks?: string) {
    return apiFetch<{ message: string }>(`/leave/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    });
  },

  // Homework
  async getHomework(params?: { grade?: string; section?: string; subject?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ homework: any[] }>(`/homework?${query}`);
  },

  async getHomeworkDetail(id: string) {
    return apiFetch<{ homework: any; submissions: any[] }>(`/homework/${id}`);
  },

  async createHomework(data: any) {
    return apiFetch<{ message: string; homeworkId: string }>('/homework', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitHomework(id: string, content?: string, attachment?: string) {
    return apiFetch<{ message: string; submissionId: string }>(`/homework/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ content, attachment }),
    });
  },

  // Timetable
  async getTimetable(params?: { grade?: string; section?: string; teacherName?: string; day?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ slots: any[] }>(`/timetable?${query}`);
  },

  async createTimetableSlot(data: any) {
    return apiFetch<{ message: string; id: string }>('/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteTimetableSlot(id: string) {
    return apiFetch<{ message: string }>(`/timetable/${id}`, { method: 'DELETE' });
  },

  // Events
  async getEvents(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ events: any[] }>(`/events?${query}`);
  },

  async createEvent(data: any) {
    return apiFetch<{ message: string; eventId: string }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async rsvpEvent(id: string) {
    return apiFetch<{ message: string }>(`/events/${id}/rsvp`, { method: 'POST' });
  },

  // Announcements
  async getAnnouncements(params?: { category?: string; priority?: string; audience?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ announcements: any[] }>(`/announcements?${query}`);
  },

  async createAnnouncement(data: any) {
    return apiFetch<{ message: string; announcementId: string }>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Spotlight
  async getSpotlights(params?: { category?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ spotlights: any[] }>(`/spotlight?${query}`);
  },

  async createSpotlight(data: any) {
    return apiFetch<{ message: string; spotlightId: string }>('/spotlight', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Performance
  async getPerformance(params?: { studentId?: string; grade?: string; term?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ records: any[]; subjectAverages: any[]; analytics: any }>(`/performance?${query}`);
  },

  async recordPerformance(data: any) {
    return apiFetch<{ message: string; recordId: string }>('/performance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // School
  async getSchoolProfile() {
    return apiFetch<{ profile: any }>('/school/profile');
  },

  async updateSchoolProfile(data: any) {
    return apiFetch<{ message: string }>('/school/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getHierarchy() {
    return apiFetch<{ hierarchy: any[] }>('/school/hierarchy');
  },

  async getFacilities() {
    return apiFetch<{ facilities: any[] }>('/school/facilities');
  },

  async getClasses() {
    return apiFetch<{ classes: any[] }>('/school/classes');
  },

  async getSubjects() {
    return apiFetch<{ subjects: any[] }>('/school/subjects');
  },

  // Audit Logs
  async getAuditLogs(params?: { action?: string; entityType?: string; search?: string; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ logs: any[] }>(`/audit-logs?${query}`);
  },

  // Notifications
  async getNotifications() {
    return apiFetch<{ notifications: any[]; unreadCount: number }>('/notifications');
  },

  async markNotificationRead(id: string) {
    return apiFetch<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead() {
    return apiFetch<{ message: string }>('/notifications/read-all', { method: 'PUT' });
  },

  // Reports
  async getInstitutionalReport() {
    return apiFetch<{ metrics: any; institution: any }>('/reports/summary');
  },
};

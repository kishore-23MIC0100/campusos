import React, { useState } from 'react';
import {
  UserCheck, Mail, Phone, MapPin, Clock, Calendar, MessageSquare,
  Send, Sparkles, Shield, CheckCircle, GraduationCap, Building2,
  CheckCircle2, X, AlertCircle, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ClassTeacherInfo {
  name: string;
  salutation?: string;
  designation: string;
  qualification: string;
  department: string;
  employeeId: string;
  roomNumber: string;
  email: string;
  phone: string;
  officeHours: string;
  avatarUrl: string;
  classGrade: string;
  classSection: string;
  bio: string;
}

const TEACHER_PROFILES: Record<string, ClassTeacherInfo> = {
  'Grade 10A': {
    name: 'Mrs. Priya Nair',
    salutation: 'Mrs.',
    designation: 'Senior Mathematics Faculty & Grade 10 Lead Mentor',
    qualification: 'M.Sc Mathematics (Gold Medalist), B.Ed (Top Honors)',
    department: 'Department of Mathematics',
    employeeId: 'EMP-MTH-101',
    roomNumber: 'Room 204 (Math Block) • Homeroom Room 301',
    email: 'priya.nair@campusos.edu',
    phone: '+91 98450 11223',
    officeHours: 'Mon - Fri, 03:30 PM - 04:30 PM',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    classGrade: 'Grade 10',
    classSection: 'A',
    bio: '12+ years of secondary education leadership. Serves as academic mentor for Grade 10 students, supervising daily homeroom attendance, CBSE board registrations, and Olympiad mentoring.',
  },
  'Grade 7A': {
    name: 'Elena Rostova',
    salutation: 'Prof.',
    designation: 'Associate Professor of Computer Science & Grade 7 Lead Mentor',
    qualification: 'M.Tech Artificial Intelligence, B.Tech Computer Science',
    department: 'Department of Computer Science',
    employeeId: 'EMP-CS-103',
    roomNumber: 'Room 112 (Turing Tech Center)',
    email: 'elena.rostova@campusos.edu',
    phone: '+91 98450 77889',
    officeHours: 'Tue & Thu, 03:30 PM - 04:45 PM',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    classGrade: 'Grade 7',
    classSection: 'A',
    bio: 'Specialist in computational thinking and robotics pedagogy. Coordinates middle school foundational academic progress and student advisory.',
  },
};

export const ClassTeacherCard: React.FC<{
  classKey?: string; // e.g. 'Grade 10A' or 'Grade 7A'
  studentName?: string;
  isParentView?: boolean;
}> = ({ classKey = 'Grade 10A', studentName = 'Arav Patel', isParentView = false }) => {
  const teacher = TEACHER_PROFILES[classKey] || TEACHER_PROFILES['Grade 10A'];

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);

  // Message Form state
  const [messageSubject, setMessageSubject] = useState('Academic Progress & Homework Inquiry');
  const [messageBody, setMessageBody] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  // Consultation state
  const [consultDate, setConsultDate] = useState('2026-09-18');
  const [consultSlot, setConsultSlot] = useState('03:30 PM - 04:00 PM');
  const [consultMode, setConsultMode] = useState<'In-Person (Room 204)' | 'Virtual Video Conference'>('In-Person (Room 204)');
  const [consultReason, setConsultReason] = useState('Quarterly Term Progress Review');
  const [consultSuccess, setConsultSuccess] = useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSending(true);
    setTimeout(() => {
      setMessageSending(false);
      setShowMessageModal(false);
      setMessageSuccess(`Message dispatched directly to ${teacher.name}'s institutional inbox.`);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => setMessageSuccess(null), 5000);
      setMessageBody('');
    }, 800);
  };

  const handleBookConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConsultModal(false);
    setConsultSuccess(`1-on-1 Consultation scheduled with ${teacher.name} on ${consultDate} at ${consultSlot}. Calendar invite dispatched.`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setConsultSuccess(null), 6000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-7 space-y-6 relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-50/70 via-indigo-50/30 to-transparent rounded-bl-full pointer-events-none -z-0" />

      {/* Success Notification Banners */}
      {messageSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>{messageSuccess}</span>
        </div>
      )}

      {consultSuccess && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>{consultSuccess}</span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100/70 text-teal-800 border border-teal-200">
                Official Class Mentor
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {teacher.classGrade} - Section {teacher.classSection}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 font-display mt-0.5">
              Class Teacher & Academic Mentor
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMessageModal(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConsultModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Book 1-on-1 Meeting</span>
          </button>
        </div>
      </div>

      {/* Teacher Profile & Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative z-10">
        {/* Left: Photo & Identification */}
        <div className="md:col-span-4 flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="relative">
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md ring-4 ring-teal-50"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center border-2 border-white shadow-sm" title="Verified Faculty Lead">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>

          <h4 className="text-base font-extrabold text-slate-900 font-display mt-3">
            {teacher.name}
          </h4>
          <p className="text-xs font-semibold text-teal-700 mt-0.5">
            {teacher.designation}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200/80 w-full flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Employee ID:</span>
            <span className="font-bold text-slate-800">{teacher.employeeId}</span>
          </div>

          <div className="mt-1 w-full flex items-center justify-between text-[11px] text-slate-500">
            <span>Homeroom:</span>
            <span className="font-bold text-slate-800">Room 301</span>
          </div>
        </div>

        {/* Right: Key Contact & Office Details */}
        <div className="md:col-span-8 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {teacher.bio}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Department</div>
                <div className="text-xs font-bold text-slate-800">{teacher.department}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{teacher.qualification}</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Faculty Room</div>
                <div className="text-xs font-bold text-slate-800">{teacher.roomNumber}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Academic Wing 2</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Official Email</div>
                <a
                  href={`mailto:${teacher.email}`}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  {teacher.email}
                </a>
                <div className="text-[10px] text-slate-400 mt-0.5">Direct institutional inbox</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Office Telephone</div>
                <div className="text-xs font-bold text-slate-800">{teacher.phone}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Homeroom Ext: 301</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-teal-950 font-semibold">
              <Clock className="w-4 h-4 text-teal-700 flex-shrink-0" />
              <span>Office Hours for Consultations: <strong>{teacher.officeHours}</strong></span>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-teal-200/80 text-teal-900 font-extrabold text-[10px]">
              Available Today
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💬 MESSAGE CLASS TEACHER MODAL                                            */}
      {/* ========================================================================= */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 animate-scaleIn relative">
            <button
              type="button"
              onClick={() => setShowMessageModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={teacher.avatarUrl}
                alt={teacher.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  Message {teacher.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {isParentView ? `Parent Dialogue regarding ${studentName}` : `Student Inquiry from ${studentName}`}
                </p>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Matter *</label>
                <select
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="Academic Progress & Homework Inquiry">Academic Progress & Homework Inquiry</option>
                  <option value="Attendance Discrepancy & Leave Verification">Attendance Discrepancy & Leave Verification</option>
                  <option value="CBSE Board Registration & Hall Ticket Query">CBSE Board Registration & Hall Ticket Query</option>
                  <option value="Special Recommendation / Olympiad Nomination">Special Recommendation / Olympiad Nomination</option>
                  <option value="General Guidance & Pastoral Support">General Guidance & Pastoral Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder={`Dear ${teacher.name}, I am writing to consult regarding...`}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-600 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Reply sent to: <strong>{isParentView ? 'Parent Email & WhatsApp' : 'Student Dashboard'}</strong></span>
                <span className="text-teal-700 font-bold">Encrypted Dialogue</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={messageSending}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {messageSending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send to Teacher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📅 SCHEDULE 1-ON-1 CONSULTATION MODAL                                     */}
      {/* ========================================================================= */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 animate-scaleIn relative">
            <button
              type="button"
              onClick={() => setShowConsultModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  Book 1-on-1 Consultation
                </h3>
                <p className="text-xs text-slate-500">
                  Appointment with {teacher.name} ({teacher.officeHours})
                </p>
              </div>
            </div>

            <form onSubmit={handleBookConsultation} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={consultDate}
                    onChange={(e) => setConsultDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Time Slot *</label>
                  <select
                    value={consultSlot}
                    onChange={(e) => setConsultSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-indigo-600"
                  >
                    <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                    <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                    <option value="04:30 PM - 05:00 PM">04:30 PM - 05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['In-Person (Room 204)', 'Virtual Video Conference'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setConsultMode(mode)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        consultMode === mode
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agenda / Reason for Meeting *</label>
                <input
                  type="text"
                  required
                  value={consultReason}
                  onChange={(e) => setConsultReason(e.target.value)}
                  placeholder="e.g. Discuss Term 1 Mathematics Assessment & Focus Areas"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConsultModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

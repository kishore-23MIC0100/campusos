import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap, Users, HeartHandshake, Building2, Shield,
  FileText, ArrowRight, Smartphone, PhoneCall, MessageSquare,
  ExternalLink, Bell, Sparkles, CheckCircle2, ChevronRight, X,
  Clock, Download, Info, Check, ShieldCheck, HelpCircle, Laptop,
  Zap, ArrowUpRight, Activity, Globe, Star
} from 'lucide-react';

interface NoticeItem {
  id: string;
  title: string;
  category: string;
  date: string;
  isNew?: boolean;
  priority: 'HIGH' | 'NORMAL';
  content: string;
  pdfSize: string;
}

const SPOTLIGHT_NOTICES: NoticeItem[] = [
  {
    id: 'not_1',
    title: 'Day Boarder & Bus Transport Route Pass Renewal 2026-27',
    category: 'Transportation & Logistics',
    date: 'Sep 10, 2026',
    isNew: true,
    priority: 'HIGH',
    pdfSize: '1.2 MB',
    content: 'Online portal registration is now active for day boarder bus routes, smart RFID card renewals, and pickup stop modifications for the upcoming term. Parents are requested to verify route schedules and complete fee confirmation before Sep 30, 2026.',
  },
  {
    id: 'not_2',
    title: 'Term-1 Preparatory Assessment & Board Examination Schedule',
    category: 'Academic Affairs',
    date: 'Sep 08, 2026',
    isNew: true,
    priority: 'HIGH',
    pdfSize: '840 KB',
    content: 'The official examination timetable and revision syllabi for Grades 9 through 12 have been published. Detailed subject-wise blueprint, practical exam dates, and hall ticket download links are available in the Student & Parent dashboards.',
  },
  {
    id: 'not_3',
    title: 'Hostel & Residential Wing Vacating Authorization Form',
    category: 'Residential Life',
    date: 'Sep 05, 2026',
    priority: 'NORMAL',
    pdfSize: '620 KB',
    content: 'Boarding students requiring leave for industrial internships, STEM workshops, or medical reasons must submit their electronic consent form with parental and mentor endorsement at least 48 hours prior to checkout.',
  },
  {
    id: 'not_4',
    title: 'Autumn Parent-Teacher Dialogue (PTM) Slot Booking',
    category: 'Family Relations',
    date: 'Sep 02, 2026',
    priority: 'NORMAL',
    pdfSize: '510 KB',
    content: 'Parents can now reserve direct 15-minute consultation slots with class mentors and subject specialists via the Parent Portal. Both physical campus visits and virtual video meet options are supported.',
  },
  {
    id: 'not_5',
    title: 'National Merit Scholarship & Academic Concession Applications',
    category: 'Financial Aid',
    date: 'Aug 28, 2026',
    priority: 'NORMAL',
    pdfSize: '950 KB',
    content: 'Applications are invited for the Oakridge Merit Scholarship honoring students with outstanding performance in National Olympiads, Sports Championships, and ICSE/CBSE board distinctions.',
  },
];

export const PortalGateway: React.FC = () => {
  const navigate = useNavigate();
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const roleGateways = [
    {
      id: 'student',
      title: 'Student Portal',
      tagline: 'Scholars & Learners',
      path: '/student/login',
      gradient: 'from-blue-600 to-indigo-600',
      glowColor: 'rgba(99, 102, 241, 0.2)',
      borderGlow: 'rgba(99, 102, 241, 0.15)',
      badgeClass: 'badge-iris',
      icon: <GraduationCap className="w-6 h-6" />,
      features: [
        'Live study schedule & period alerts',
        'Homework submission & teacher feedback',
        'Digital gradebook & term progress GPA',
      ],
      userHint: 'Roll No. (e.g. STU-2026-8841)',
    },
    {
      id: 'teacher',
      title: 'Faculty & Staff',
      tagline: 'Teachers & Dept. Leads',
      path: '/teacher/login',
      gradient: 'from-cyan-600 to-teal-600',
      glowColor: 'rgba(6, 182, 212, 0.2)',
      borderGlow: 'rgba(6, 182, 212, 0.15)',
      badgeClass: 'badge-cyan',
      icon: <Users className="w-6 h-6" />,
      features: [
        '30-second rapid classroom roll call',
        'Assignment distribution & evaluation',
        'Student diagnostic & progress records',
      ],
      userHint: 'Staff Email (e.g. priya.nair@campusos.edu)',
    },
    {
      id: 'parent',
      title: 'Parent & Family',
      tagline: 'Parents & Guardians',
      path: '/parent/login',
      gradient: 'from-amber-500 to-orange-600',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      borderGlow: 'rgba(245, 158, 11, 0.15)',
      badgeClass: 'badge-amber',
      icon: <HeartHandshake className="w-6 h-6" />,
      features: [
        'Real-time daily attendance notifications',
        'Report cards, teacher dialogues & PTM',
        'Instant school fee payments & receipts',
      ],
      userHint: 'Mobile # (e.g. 98765 43210)',
    },
    {
      id: 'admin',
      title: 'Admin Console',
      tagline: 'Principal & Governance',
      path: '/admin/login',
      gradient: 'from-iris-600 to-purple-700',
      glowColor: 'rgba(124, 58, 237, 0.2)',
      borderGlow: 'rgba(124, 58, 237, 0.15)',
      badgeClass: 'badge-iris',
      icon: <Building2 className="w-6 h-6" />,
      features: [
        'Unified operations & enrollment control',
        'Multi-role verification & access queue',
        'Real-time institutional KPI analytics',
      ],
      userHint: 'Admin Email (e.g. admin@campusos.edu)',
    },
  ];

  return (
    <div className="campus-gateway min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      {/* Aurora Background */}
      <div className="campus-gateway-scene" aria-hidden="true" />

      {/* Top Bar */}
      <header className="campus-gateway-header sticky top-0 z-30" style={{
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iris-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-iris-600/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-display tracking-tight">CampusOS</div>
              <div className="text-[9px] font-bold text-iris-400 uppercase tracking-widest">Gateway Hub</div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-400"
              style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[11px]">All Systems Online</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white font-bold transition-all cursor-pointer"
              style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Help Desk</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)',
              }}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explore Campus</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="campus-gateway-hero relative z-10 pt-12 pb-6 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 badge badge-iris">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unified Institutional Access</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-tight">
          <span className="text-white">Select Your </span>
          <span className="gradient-text">Authorized Portal</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-2xl mx-auto leading-relaxed">
          Access attendance, timetables, coursework, school fees, and operations through your dedicated role-secured console.
        </p>
      </section>

      {/* Role Gateway Cards */}
      <main className="campus-gateway-main max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 relative z-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {roleGateways.map((card, i) => (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`campus-gateway-card relative rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-500 animate-fadeInUp stagger-${i + 1} ${
                hoveredCard === card.id ? '-translate-y-2' : ''
              }`}
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                border: `1px solid ${hoveredCard === card.id ? card.borderGlow : 'rgba(148, 163, 184, 0.08)'}`,
                boxShadow: hoveredCard === card.id
                  ? `0 20px 50px rgba(0,0,0,0.3), 0 0 60px ${card.glowColor}`
                  : '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              {/* Top gradient accent */}
              <div className={`h-1 w-full bg-gradient-to-r ${card.gradient}`} />

              {/* Ambient glow on hover */}
              {hoveredCard === card.id && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: `radial-gradient(circle at 50% 0%, ${card.glowColor}, transparent 60%)`,
                }} />
              )}

              <div className="p-6 flex flex-col justify-between flex-1 space-y-5 relative">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      {card.icon}
                    </div>
                    <span className={`${card.badgeClass} badge text-[9px]`}>
                      {card.tagline}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white font-display tracking-tight mb-1 group-hover:text-slate-50 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sign in with {card.userHint}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 py-3 text-xs" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
                  {card.features.map((feat, j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                      </div>
                      <span className="text-slate-400 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(card.path); }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-white bg-gradient-to-r ${card.gradient} hover:shadow-lg active:scale-[0.98]`}
                  style={{ boxShadow: `0 4px 15px ${card.glowColor}` }}
                >
                  <span>Launch {card.title}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Lower Section: Notices + Help */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Notices */}
          <div className="campus-gateway-panel lg:col-span-7 rounded-2xl p-6"
            style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
          >
            <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-600/15">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Institutional Circulars</h3>
                  <p className="text-xs text-slate-500">Official notices & schedules</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">AY 2026–27</span>
            </div>

            <div className="space-y-1">
              {SPOTLIGHT_NOTICES.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => setSelectedNotice(notice)}
                  className="w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-800/30"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                      style={{
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.12)',
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 text-iris-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                          {notice.title}
                        </span>
                        {notice.isNew && (
                          <span className="badge badge-rose text-[8px] py-0">NEW</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{notice.category}</span>
                        <span>•</span>
                        <span>{notice.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
                    >
                      {notice.pdfSize}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-iris-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 mt-4 flex items-center justify-between text-xs text-slate-500"
              style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}
            >
              <span className="font-medium">Authenticated by Principal's Desk</span>
              <button
                type="button"
                onClick={() => setSelectedNotice(SPOTLIGHT_NOTICES[0])}
                className="font-bold text-iris-400 hover:text-iris-300 cursor-pointer transition-colors"
              >
                Latest Circular →
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* Mobile Apps */}
            <div className="campus-gateway-panel rounded-2xl p-6"
              style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
            >
              <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/15">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Mobile Apps</h3>
                  <p className="text-xs text-slate-500">iOS & Android</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Parent App */}
                <div className="rounded-xl p-3 text-center space-y-2"
                  style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}
                >
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Parent App</div>
                  <div className="space-y-1.5">
                    <button type="button" onClick={() => alert('CampusOS Parent App ready for Android.')}
                      className="w-full py-2 px-3 rounded-lg flex items-center justify-center text-[11px] font-bold text-white cursor-pointer transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}
                    >
                      Google Play
                    </button>
                    <button type="button" onClick={() => alert('CampusOS Parent App ready for iOS.')}
                      className="w-full py-2 px-3 rounded-lg flex items-center justify-center text-[11px] font-bold text-white cursor-pointer transition-all hover:brightness-110"
                      style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
                    >
                      App Store
                    </button>
                  </div>
                </div>

                {/* Student App */}
                <div className="rounded-xl p-3 text-center space-y-2"
                  style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}
                >
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Student App</div>
                  <div className="space-y-1.5">
                    <button type="button" onClick={() => alert('CampusOS Student App ready for Android.')}
                      className="w-full py-2 px-3 rounded-lg flex items-center justify-center text-[11px] font-bold text-white cursor-pointer transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 2px 8px rgba(99,102,241,0.2)' }}
                    >
                      Google Play
                    </button>
                    <button type="button" onClick={() => alert('CampusOS Student App ready for iOS.')}
                      className="w-full py-2 px-3 rounded-lg flex items-center justify-center text-[11px] font-bold text-white cursor-pointer transition-all hover:brightness-110"
                      style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
                    >
                      App Store
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Helpdesk */}
            <div className="campus-gateway-help rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(6, 182, 212, 0.1))',
                border: '1px solid rgba(124, 58, 237, 0.15)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 100% 0%, rgba(124, 58, 237, 0.08), transparent 50%)',
              }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold font-display text-white">Campus Helpdesk</h4>
                  </div>
                  <span className="badge badge-emerald text-[8px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Mon–Sat 8–4:30
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  For password recovery, mobile updates, or roll number assistance.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <div className="text-[9px] text-cyan-400 uppercase font-bold tracking-wider mb-1">School Line</div>
                    <div className="font-bold text-white">+91 (080) 2845-7800</div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <div className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider mb-1">WhatsApp</div>
                    <div className="font-bold text-white">+91 98000 12345</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="campus-gateway-footer relative z-10 py-5 px-4 text-xs text-slate-600 mt-10" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>© 2026 Oakridge International & CampusOS Systems. All rights reserved.</div>
          <div className="flex items-center gap-4 text-slate-500 font-semibold">
            <span>CBSE: 9801</span>
            <span>•</span>
            <span>Code: 40182</span>
            <span>•</span>
            <button type="button" onClick={() => setShowSupportModal(true)} className="text-iris-400 hover:text-iris-300 cursor-pointer transition-colors">
              Help Desk
            </button>
          </div>
        </div>
      </footer>

      {/* Notice Modal */}
      {selectedNotice && (
        <div className="campus-gateway-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedNotice(null)}
        >
          <div className="campus-gateway-modal rounded-2xl max-w-lg w-full p-6 sm:p-8 relative animate-scaleIn"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedNotice(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-iris-400 uppercase mb-2">
              <FileText className="w-4 h-4" />
              <span>{selectedNotice.category} • {selectedNotice.date}</span>
            </div>

            <h3 className="text-lg font-bold text-white font-display mb-3">
              {selectedNotice.title}
            </h3>

            <div className="p-4 rounded-xl text-xs text-slate-300 leading-relaxed space-y-2 mb-6"
              style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.06)' }}
            >
              <p>{selectedNotice.content}</p>
              <div className="pt-2 font-mono text-[11px] text-slate-600" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}>
                Ref: REF-CIR-{selectedNotice.id.toUpperCase()} • {selectedNotice.pdfSize}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => alert(`Downloading: ${selectedNotice.title}`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer text-cyan-300"
                style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="campus-gateway-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowSupportModal(false)}
        >
          <div className="campus-gateway-modal rounded-2xl max-w-md w-full p-6 sm:p-7 relative animate-scaleIn"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-600/15">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Oakridge Help Desk</h3>
                <p className="text-xs text-slate-500">Official Support Line</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              For login issues, mobile number updates, or student roll number assistance.
            </p>

            <div className="space-y-2.5 mb-5">
              <div className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.06)' }}
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">School Line</div>
                    <div className="text-sm font-bold text-white">+91 (080) 2845-7800</div>
                  </div>
                </div>
                <span className="badge badge-emerald text-[9px]">8am-4:30pm</span>
              </div>

              <div className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] font-bold text-emerald-400 uppercase">WhatsApp</div>
                    <div className="text-sm font-bold text-white">+91 98000 12345</div>
                  </div>
                </div>
                <span className="badge badge-emerald text-[9px]">Fast Reply</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)' }}
            >
              Return to Gateway
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

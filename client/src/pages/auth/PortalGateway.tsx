import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../../components/brand/BrandLogo';
import {
  GraduationCap, Users, HeartHandshake, Building2, Shield,
  FileText, ArrowRight, Smartphone, PhoneCall, MessageSquare,
  ExternalLink, Bell, Sparkles, CheckCircle2, ChevronRight, X,
  Clock, Download, Info, Check, ShieldCheck, HelpCircle, Laptop
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
    title: 'Autumn Parent-Teacher Dialogue (PTM) One-on-One Slot Booking',
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

  const roleGateways = [
    {
      id: 'student',
      title: 'Student Portal',
      tagline: 'Scholars & Learners',
      path: '/student/login',
      themeGradient: 'from-blue-600 via-blue-700 to-indigo-800',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      borderHover: 'hover:border-blue-400 group-hover:shadow-blue-500/10',
      iconGlow: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20',
      icon: <GraduationCap className="w-7 h-7" />,
      heroImage: '/assets/heroes/student_hero.jpg',
      features: [
        'Live study schedule & period alerts',
        'Homework submission & teacher feedback',
        'Digital gradebook & term progress GPA',
      ],
      userHint: 'Sign in with Roll No. (e.g. STU-2026-8841)',
    },
    {
      id: 'teacher',
      title: 'Faculty & Staff',
      tagline: 'Teachers & Department Leads',
      path: '/teacher/login',
      themeGradient: 'from-teal-600 via-teal-700 to-emerald-800',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      borderHover: 'hover:border-teal-400 group-hover:shadow-teal-500/10',
      iconGlow: 'bg-teal-600 text-white shadow-lg shadow-teal-500/30',
      buttonClass: 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20',
      icon: <Users className="w-7 h-7" />,
      heroImage: '/assets/heroes/teacher_hero.jpg',
      features: [
        '30-second rapid classroom roll call',
        'Assignment distribution & evaluation',
        'Student diagnostic & progress records',
      ],
      userHint: 'Sign in with Staff Email (e.g. priya.nair@campusos.edu)',
    },
    {
      id: 'parent',
      title: 'Parent & Family',
      tagline: 'Parents & Guardians',
      path: '/parent/login',
      themeGradient: 'from-amber-600 via-amber-700 to-orange-800',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      borderHover: 'hover:border-amber-400 group-hover:shadow-amber-500/10',
      iconGlow: 'bg-amber-600 text-white shadow-lg shadow-amber-500/30',
      buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20',
      icon: <HeartHandshake className="w-7 h-7" />,
      heroImage: '/assets/heroes/parent_hero.jpg',
      features: [
        'Real-time daily attendance notifications',
        'Report cards, teacher dialogues & PTM',
        'Instant school fee payments & receipts',
      ],
      userHint: 'Sign in with Mobile # (e.g. 98765 43210)',
    },
    {
      id: 'admin',
      title: 'Institutional Admin',
      tagline: 'Principal & Governance Office',
      path: '/admin/login',
      themeGradient: 'from-slate-900 via-slate-850 to-indigo-950',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      borderHover: 'hover:border-indigo-400 group-hover:shadow-indigo-500/10',
      iconGlow: 'bg-slate-900 text-white shadow-lg shadow-slate-900/30',
      buttonClass: 'bg-slate-900 hover:bg-slate-950 text-white shadow-md shadow-slate-900/20',
      icon: <Building2 className="w-7 h-7" />,
      heroImage: '/assets/heroes/admin_hero.jpg',
      features: [
        'Unified operations & enrollment control',
        'Multi-role verification & access queue',
        'Real-time institutional KPI analytics',
      ],
      userHint: 'Sign in with Admin Email (e.g. admin@campusos.edu)',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-teal-500 selection:text-white relative overflow-x-hidden">
      
      {/* Subtle Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-70" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP INSTITUTIONAL BAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Institution Identity */}
          <BrandLogo
            variant="light"
            size="md"
            badgeText="Gateway Hub"
            to="/"
          />

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[11px]">System Status: Online</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">School Desk</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs"
            >
              <span>Explore 3D Campus</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. INSPIRING HERO BANNER */}
      <section className="relative z-10 pt-8 pb-4 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold shadow-2xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Single Unified Institutional Access Point</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-display tracking-tight leading-tight">
          Select Your Authorized Portal
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
          Access attendance records, timetables, coursework grading, school fees, and operations through your dedicated role-secured console.
        </p>
      </section>

      {/* 3. FOUR DISTINCT ROLE GATEWAY CARDS */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 relative z-10 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleGateways.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              className={`bg-white rounded-3xl border border-slate-200/90 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.14)] ${card.borderHover} transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group hover:-translate-y-1.5 relative`}
            >
              {/* Top Accent Gradient Header */}
              <div className={`h-2.5 w-full bg-gradient-to-r ${card.themeGradient}`} />

              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-5">
                
                {/* Header with Icon Badge & Role Category */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${card.iconGlow}`}>
                      {card.icon}
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${card.badgeClass}`}>
                      {card.tagline}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight mb-1 group-hover:text-blue-900 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {card.userHint}
                  </p>
                </div>

                {/* 3 Key Bullet Highlights */}
                <div className="space-y-2 py-2 border-y border-slate-100 text-xs text-slate-700">
                  {card.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium text-slate-600 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Single Primary Action Button */}
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(card.path);
                    }}
                    className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer ${card.buttonClass}`}
                  >
                    <span>Launch {card.title}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. LOWER SECTION: SPOTLIGHT NOTICES + MOBILE APP SUITE & HELPDESK */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* LEFT: SPOTLIGHT CIRCULARS & NOTICES */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center font-bold">
                    <Bell className="w-4 h-4 text-red-600 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 font-display">
                      Institutional Spotlight & Circulars
                    </h3>
                    <p className="text-xs text-slate-500">Official academic notices, circulars and schedules</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                  Academic Year 2026–27
                </span>
              </div>

              {/* List of Circulars */}
              <div className="space-y-2">
                {SPOTLIGHT_NOTICES.map((notice) => (
                  <button
                    key={notice.id}
                    type="button"
                    onClick={() => setSelectedNotice(notice)}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/80 flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                            {notice.title}
                          </span>
                          {notice.isNew && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase tracking-wider">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{notice.category}</span>
                          <span>•</span>
                          <span>{notice.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {notice.pdfSize}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Directly authenticated by Principal’s Academic Desk</span>
              <button
                type="button"
                onClick={() => setSelectedNotice(SPOTLIGHT_NOTICES[0])}
                className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
              >
                Inspect Latest Circular →
              </button>
            </div>
          </div>

          {/* RIGHT: OFFICIAL MOBILE APPS & CAMPUS HELPDESK */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Mobile App Downloads */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    Official Mobile Applications
                  </h3>
                  <p className="text-xs text-slate-500">Real-time alerts for iOS and Android</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Parent App */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-2.5">
                  <div className="text-xs font-bold text-emerald-800">
                    Parent App (Family)
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => alert('CampusOS Parent App is ready for Android rollout.')}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                        alt="Google Play"
                        className="h-5 w-auto"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('CampusOS Parent App is ready for iOS rollout.')}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                        alt="App Store"
                        className="h-5 w-auto"
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Attendance & Fee Alerts</p>
                </div>

                {/* Student App */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-2.5">
                  <div className="text-xs font-bold text-blue-800">
                    Student App (Learner)
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => alert('CampusOS Student App is ready for Android rollout.')}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                        alt="Google Play"
                        className="h-5 w-auto"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('CampusOS Student App is ready for iOS rollout.')}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                        alt="App Store"
                        className="h-5 w-auto"
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Timetable & LMS Submissions</p>
                </div>
              </div>
            </div>

            {/* School Helpdesk Card */}
            <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-teal-400" />
                  <h4 className="text-sm font-bold font-display">Campus Helpdesk & IT Cell</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Mon–Sat 8:00 AM – 4:30 PM
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                For login password recovery, mobile number updates, or student roll number assistance, contact our administrative helpdesk directly.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">School Line</div>
                  <div className="font-bold text-white mt-0.5">+91 (080) 2845-7800</div>
                </div>

                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-emerald-300 uppercase font-semibold">WhatsApp Desk</div>
                  <div className="font-bold text-white mt-0.5">+91 98000 12345</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 5. INSTITUTIONAL FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 text-xs text-slate-600 mt-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            © 2026 Oakridge International Educational Institutions & CampusOS Software Systems. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-semibold">
            <span>CBSE Affiliation: 9801</span>
            <span>•</span>
            <span>School Code: 40182</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              Help Desk
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: Notice Inspector */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setSelectedNotice(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase mb-2">
              <FileText className="w-4 h-4" />
              <span>{selectedNotice.category} • {selectedNotice.date}</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 font-display mb-3">
              {selectedNotice.title}
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2 mb-6">
              <p>{selectedNotice.content}</p>
              <div className="pt-2 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                Official Reference ID: REF-CIR-{selectedNotice.id.toUpperCase()} • File Size: {selectedNotice.pdfSize}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading official circular document: ${selectedNotice.title}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer border border-blue-200"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: School Desk Support */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Oakridge Helpdesk Support</h3>
                <p className="text-xs text-slate-500">Official Assistance for Parents, Teachers & Students</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              If you are having trouble logging in or need to update your registered mobile number or student roll number, our school office is ready to help.
            </p>

            <div className="space-y-2.5 mb-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase">School Office Line</div>
                    <div className="text-sm font-bold text-slate-900">+91 (080) 2845-7800</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  8am - 4:30pm
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">WhatsApp Support Desk</div>
                    <div className="text-sm font-bold text-emerald-950">+91 98000 12345</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Fast Reply
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs cursor-pointer"
            >
              Return to Gateway
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

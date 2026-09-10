import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RealisticCampusBackground, REALISTIC_HOTSPOTS } from '../components/3d/RealisticCampusBackground';
import { HotspotInfo } from '../components/3d/CampusCanvas';
import { BrandLogo } from '../components/brand/BrandLogo';
import { useAuth } from '../context/AuthContext';
import {
  Building2, GraduationCap, Users, HeartHandshake, Shield, Sparkles,
  ArrowRight, CheckCircle2, ChevronRight, Activity, Calendar, Trophy,
  BookOpen, Lock, Compass, Eye, Bell, Award, Layers, Terminal, Sparkle, Camera,
  PhoneCall, Check, ExternalLink, Download, FileText, Phone, MessageSquare
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, reduceMotion, setReduceMotion } = useAuth();
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [drawerHotspot, setDrawerHotspot] = useState<HotspotInfo | null>(null);

  // Calculate scroll progress (0 to 1) based on window scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(1, Math.max(0, window.scrollY / scrollHeight));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectHotspot = (id: string) => {
    setActiveHotspotId(id);
    const found = REALISTIC_HOTSPOTS.find((h) => h.id === id);
    if (found) {
      setDrawerHotspot({
        id: found.id,
        name: found.name,
        category: found.category,
        description: found.description,
        stats: found.stats,
        icon: found.icon,
        position: [0, 0, 0],
        cameraTarget: [0, 0, 0],
      });
    }
  };

  const closeDrawer = () => {
    setDrawerHotspot(null);
    setActiveHotspotId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-teal-500 selection:text-white relative overflow-x-hidden">
      
      {/* 1. TOP INSTITUTIONAL LIGHT NAVIGATION BAR */}
      <nav className="fixed top-0 inset-x-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-xl bg-white/95 border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Re-Designed Clean Minimalist Brand Logo */}
          <BrandLogo variant="light" size="md" />

          {/* Clean Right Actions (No Clunky Emoji Pills) */}
          <div className="flex items-center gap-3">
            {/* Reduce Motion toggle */}
            <button
              type="button"
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                reduceMotion
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
              title="Toggle Reduced Motion"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">{reduceMotion ? 'Reduced Motion' : 'Motion: Active'}</span>
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Enter Workspace ({user.role})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Portal Gateway</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 2. REALISTIC INDIAN CAMPUS PHOTOGRAPHIC BACKGROUND */}
      <RealisticCampusBackground
        scrollProgress={scrollProgress}
        activeHotspot={activeHotspotId}
        onSelectHotspot={handleSelectHotspot}
      />

      {/* 3. SCROLL-DRIVEN LIGHT-THEME NARRATIVE SECTIONS */}
      <div className="relative z-10 space-y-36 sm:space-y-48 pb-32">
        
        {/* PHASE 0%: HERO OVERVIEW CARD */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 max-w-7xl mx-auto pt-24 pb-12">
          <div className="max-w-2xl bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] space-y-6 animate-fadeIn relative overflow-hidden text-slate-900">
            {/* Top decorative gradient accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-blue-600 to-amber-500" />

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Next-Gen Indian School Operating System</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Academic Session 2026–27 Active</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-display tracking-tight leading-[1.08]">
              Welcome to <span className="bg-gradient-to-r from-teal-700 via-blue-800 to-indigo-900 bg-clip-text text-transparent">CampusOS</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              An intelligent, production-ready school management platform engineered for CBSE, ICSE & International institutions in India — featuring smart RFID attendance, NEP 2020 diagnostics, and digital governance.
            </p>


            {/* Live Institutional KPI Cards */}
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 shadow-xs max-w-lg grid grid-cols-3 gap-2 text-center">
              <div className="py-1">
                <div className="text-2xl font-black text-slate-900 font-display">2,481</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Students</div>
              </div>
              <div className="border-x border-slate-200 py-1">
                <div className="text-2xl font-black text-teal-700 font-display">97.8%</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Attendance</div>
              </div>
              <div className="py-1">
                <div className="text-2xl font-black text-amber-700 font-display">148</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Faculty</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm shadow-md shadow-teal-700/20 hover:shadow-lg transition-all flex items-center gap-2 group"
              >
                <span>Launch Institutional Gateway</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-teal-200" />
              </Link>

              <button
                type="button"
                onClick={() => handleSelectHotspot('stem')}
                className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 shadow-2xs transition-colors flex items-center gap-2 cursor-pointer hover:border-teal-500"
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Inspect STEM & AI Hub</span>
              </button>
            </div>

            {/* Live Campus Telemetry Badges */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Bengaluru / Hyderabad Campus
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <Sparkle className="w-3 h-3 text-amber-600" />
                Solar Grid: 142 kW Active
              </span>
              <span>•</span>
              <span className="text-teal-700 font-bold">Air Quality: 18 AQI (Pristine)</span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-slate-800 font-extrabold animate-bounce bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 w-fit shadow-md">
            <div className="w-2 h-2 rounded-full bg-teal-600" />
            <span>Scroll down to inspect academic wings & facilities</span>
          </div>
        </section>

        {/* PHASE 20%: ADMINISTRATIVE PAVILION */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="max-w-xl bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)] space-y-4 ml-auto text-slate-900">
            <div className="text-xs uppercase font-extrabold tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 w-fit flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Institutional Governance • Secretariat</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Sarojini Naidu Administrative Wing & Secretariat
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Centralized administrative headquarters managing school admissions, CBSE board registrations, student fee collection, teacher payroll, and governance approvals.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectHotspot('admin')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Administrative Pavilion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* PHASE 40%: STEM & AI ROBOTICS BLOCK */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="max-w-xl bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)] space-y-4 text-slate-900">
            <div className="text-xs uppercase font-extrabold tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 w-fit flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Atal Innovation Mission • STEM Labs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Dr. APJ Abdul Kalam STEM & AI Wing
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Advanced robotics bays, 3D additive printing stations, physics experimentation chambers, and AI computing suites fostering future innovators and scientists.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectHotspot('stem')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect STEM & AI Wing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* PHASE 60%: NALANDA KNOWLEDGE HUB & LIBRARY */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="max-w-xl bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)] space-y-4 ml-auto text-slate-900">
            <div className="text-xs uppercase font-extrabold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 w-fit flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Digital Archives • 60,000+ Volumes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Nalanda Knowledge Rotunda & Library
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Curved double-height glass library with automated RFID book checkout, digital repository access, IEEE subscriptions, and silent research alcoves.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectHotspot('library')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Library Rotunda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* PHASE 80%: MAJOR DHYAN CHAND SPORTS COMPLEX */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="max-w-xl bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)] space-y-4 text-slate-900">
            <div className="text-xs uppercase font-extrabold tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>Olympic Athletics & Sports Arena</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Major Dhyan Chand Sports Complex
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              8-lane synthetic athletics track, FIFA-grade football turf, covered grandstand pavilion, cricket training nets, and championship badminton courts.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectHotspot('sports')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Sports Arena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* PHASE 100%: ROLE PORTALS SHOWCASE */}
        <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold shadow-2xs">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Dedicated Institutional Workspaces</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 font-display">
              Four tailored experiences. One unified ecosystem.
            </h2>
            <p className="text-base text-slate-600">
              Select your role to enter your dedicated high-productivity portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Admin Portal */}
            <Link
              to="/admin/login"
              className="group p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-400 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display mb-1.5">
                  School Admin
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                  Institutional analytics, user verification queue, timetable management & governance.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:text-indigo-900">
                <span>Enter Admin Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Teacher Portal */}
            <Link
              to="/teacher/login"
              className="group p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-teal-400 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display mb-1.5">
                  Faculty & Teaching
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                  One-tap classroom attendance, assignment grading, syllabus tracking & schedule.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-900">
                <span>Enter Teacher Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Student Portal */}
            <Link
              to="/student/login"
              className="group p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-blue-400 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display mb-1.5">
                  Student Learning
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                  Homework submissions, live timetable, digital report cards & campus events.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900">
                <span>Enter Student Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 4. Parent Portal */}
            <Link
              to="/parent/login"
              className="group p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-amber-400 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display mb-1.5">
                  Parent & Family
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                  Real-time attendance alerts, fee receipts, teacher messaging & leave notes.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:text-amber-900">
                <span>Enter Parent Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* 4. INTERACTIVE BUILDING DRAWER PREVIEW (Light Theme) */}
      {drawerHotspot && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white/98 backdrop-blur-2xl border-l border-slate-200 shadow-2xl p-6 sm:p-8 flex flex-col justify-between animate-slideLeft text-slate-900">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                <drawerHotspot.icon className="w-4 h-4 text-teal-600" />
                <span>{drawerHotspot.category}</span>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-900 font-display mb-3">
              {drawerHotspot.name}
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
              {drawerHotspot.description}
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-teal-800 font-mono font-bold mb-6">
              {drawerHotspot.stats}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Direct Module Access</div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/student/login"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>Student LMS</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                </Link>
                <Link
                  to="/teacher/login"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                </Link>
                <Link
                  to="/parent/login"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>Fee Receipts</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                </Link>
                <Link
                  to="/admin/login"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Launch Institutional Gateway</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

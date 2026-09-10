import React, { useMemo } from 'react';
import { Building, GraduationCap, Trophy, BookOpen, Users, Compass, Sparkles, MapPin } from 'lucide-react';
import { HotspotInfo } from './CampusCanvas';

interface RealisticCampusBackgroundProps {
  scrollProgress: number; // 0 to 1
  activeHotspot: string | null;
  onSelectHotspot: (hotspotId: string) => void;
  viewMode?: 'ground' | 'aerial' | 'auto';
}

export const REALISTIC_HOTSPOTS = [
  {
    id: 'admin',
    name: 'Sarojini Naidu Administrative Wing',
    category: 'Principal & Governance Secretariat',
    posGround: { x: 70, y: 40 },
    posAerial: { x: 70, y: 40 },
    description: 'Premier administrative pavilion hosting the Principal Office, Admissions Secretariat, Board Examination Cell, and Student Accounts.',
    stats: 'CBSE Affiliated (AFF-9801) • ISO 9001:2025 Certified',
    icon: Building,
  },
  {
    id: 'stem',
    name: 'Dr. APJ Abdul Kalam STEM & AI Wing',
    category: 'Robotics, AI & Atal Tinkering Labs',
    posGround: { x: 22, y: 38 },
    posAerial: { x: 22, y: 38 },
    description: 'High-tech glass academic block with Atal Tinkering Labs, robotics prototyping bays, biotech cleanrooms, and solar-powered facilities.',
    stats: 'Atal Innovation Mission Hub • 142 kW Solar Grid',
    icon: Sparkles,
  },
  {
    id: 'sports',
    name: 'Major Dhyan Chand Sports Complex',
    category: 'Olympic Synthetic Track & Arena',
    posGround: { x: 92, y: 50 },
    posAerial: { x: 92, y: 50 },
    description: 'Multi-sport athletics arena with synthetic running track, international standard football turf, cricket practice nets, and indoor courts.',
    stats: '18 State Championships • National School Games Host',
    icon: Trophy,
  },
  {
    id: 'plaza',
    name: 'Tagore Central Quadrangle & Walkway',
    category: 'Assemblies & Student Life',
    posGround: { x: 52, y: 84 },
    posAerial: { x: 52, y: 84 },
    description: 'Lush landscaped pedestrian boulevard lined with Gulmohar and Ashoka trees, amphitheatre steps, and solar smart lighting.',
    stats: 'Eco-Pristine Campus • 18 AQI Clean Air Zone',
    icon: Users,
  }
];

export const RealisticCampusBackground: React.FC<RealisticCampusBackgroundProps> = ({
  scrollProgress = 0,
  activeHotspot,
  onSelectHotspot,
  viewMode = 'auto',
}) => {
  // Determine crossfade interpolation between panoramic views based on scroll
  const currentImage = useMemo(() => {
    if (scrollProgress < 0.25) return '/indian_modern_school_campus.jpg';
    if (scrollProgress < 0.55) return '/indian_stem_robotics_wing.jpg';
    if (scrollProgress < 0.80) return '/indian_library_auditorium.jpg';
    return '/indian_sports_complex.jpg';
  }, [scrollProgress]);

  // Dynamic zoom & subtle parallax pan
  const scale = 1 + (scrollProgress % 0.25) * 0.12;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto select-none bg-slate-100">
      
      {/* 1. PHOTOREALISTIC INDIAN CAMPUS PANORAMA */}
      <div className="absolute inset-0 transition-all duration-1000 ease-out will-change-transform">
        <img
          src={currentImage}
          alt="Modern Indian International School Campus"
          className="w-full h-full object-cover object-center filter brightness-[1.03] contrast-[1.02] transition-all duration-700"
          style={{
            transform: `scale(${scale})`,
          }}
        />
      </div>

      {/* 2. CINEMATIC LIGHT THEME AMBIENT OVERLAYS */}
      {/* Subtle daylight gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-transparent to-blue-50/20 pointer-events-none" />
      
      {/* Soft left white vignette to give pristine contrast to left light-cards */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-1/2 bg-gradient-to-r from-slate-900/40 via-slate-900/15 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-900/30 to-transparent pointer-events-none" />

      {/* 3. INTERACTIVE INDIAN CAMPUS HOTSPOT BEACONS (Crisp Light Badges) */}
      {REALISTIC_HOTSPOTS.map((hotspot) => {
        const isSelected = activeHotspot === hotspot.id;
        const Icon = hotspot.icon;

        return (
          <div
            key={hotspot.id}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{
              left: `${hotspot.posGround.x}%`,
              top: `${hotspot.posGround.y}%`,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectHotspot(hotspot.id);
              }}
              className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 shadow-lg cursor-pointer select-none whitespace-nowrap backdrop-blur-md ${
                isSelected
                  ? 'bg-teal-700 border-teal-500 text-white ring-4 ring-teal-300/60 scale-110 shadow-teal-700/20'
                  : 'bg-white/95 hover:bg-white border-slate-300 hover:border-teal-600 text-slate-900 hover:scale-105 shadow-slate-900/10'
              }`}
            >
              {/* Radar pulse beacon */}
              <div className="relative flex items-center justify-center">
                <span className={`animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full opacity-75 ${isSelected ? 'bg-amber-400' : 'bg-teal-500'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSelected ? 'bg-amber-400' : 'bg-teal-600'}`} />
              </div>

              <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-300' : 'text-teal-700'}`} />
              <span className="text-xs font-extrabold tracking-wide font-sans">{hotspot.name}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

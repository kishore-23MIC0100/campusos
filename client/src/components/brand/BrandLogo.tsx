import React from 'react';
import { Link } from 'react-router-dom';

export interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  hideIcon?: boolean;
  className?: string;
  to?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  showBadge = true,
  badgeText = 'CBSE AFF-9801',
  hideIcon = false,
  className = '',
  to = '/',
}) => {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const svgSizes = {
    sm: 'w-4.5 h-4.5',
    md: 'w-5.5 h-5.5',
    lg: 'w-6.5 h-6.5',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-[11px] px-2.5 py-0.5',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  const content = (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      {/* 1. Sleek Modern Academic Crest Emblem */}
      {!hideIcon && (
        <div
          className={`${iconSizes[size]} relative flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 ring-1 ring-white/15 overflow-hidden flex-shrink-0`}
        >
          {/* Subtle Ambient Background Highlight */}
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-500/20 rounded-full blur-md pointer-events-none" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-blue-500/20 rounded-full blur-md pointer-events-none" />

          {/* Precision Vector Academic Emblem */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${svgSizes[size]} relative z-10`}
          >
            <defs>
              <linearGradient id="campusShieldStroke" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="0.5" stopColor="#0D9488" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="campusBookFill" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#14B8A6" stopOpacity="0.3" />
                <stop offset="1" stopColor="#0EA5E9" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="campusTorch" x1="16" y1="5" x2="16" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#0D9488" />
              </linearGradient>
            </defs>

            {/* Outer Hex-Faceted Academic Shield */}
            <path
              d="M16 2.8L27.5 7.8V16.8C27.5 23.3 22.4 29.1 16 30.5C9.6 29.1 4.5 23.3 4.5 16.8V7.8L16 2.8Z"
              stroke="url(#campusShieldStroke)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Open Book Wings Geometry */}
            <path
              d="M16 11.5L8.5 15.5V9.5L16 6.5L23.5 9.5V15.5L16 11.5Z"
              fill="url(#campusBookFill)"
              stroke="#2DD4BF"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />

            {/* Central Spire / Spire of Knowledge */}
            <path
              d="M16 7.5V23.5"
              stroke="url(#campusTorch)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Base Graduation Chevron */}
            <path
              d="M11 20L16 23.5L21 20"
              stroke="#38BDF8"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Apex Beacon Light */}
            <circle cx="16" cy="5.2" r="1.3" fill="#FBBF24" />
          </svg>
        </div>
      )}

      {/* 2. Brand Typography & Affiliation Badging */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${textSizes[size]} font-black tracking-tight font-display leading-none ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Campus<span className="text-teal-600 font-black">OS</span>
          </span>

          {showBadge && (
            <span
              className={`${badgeSizes[size]} font-extrabold uppercase tracking-wider rounded-full border leading-none ${
                isDark
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  : 'bg-teal-50 text-teal-800 border-teal-200 shadow-2xs'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {showSubtitle && (
          <p
            className={`${subtitleSizes[size]} font-semibold leading-tight mt-1 truncate ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Oakridge International Educational Institutions
          </p>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
};


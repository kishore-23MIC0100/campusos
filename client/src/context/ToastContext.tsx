import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2, AlertCircle, AlertTriangle, Info, X,
  BellRing, Sparkles, ExternalLink, ShieldAlert, Volume2, VolumeX,
  Copy, Check
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number; // in milliseconds, default 4500
  confetti?: boolean;
  playSound?: boolean;
  action?: ToastAction;
}

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  createdAt: number;
  duration: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string, type?: ToastType) => string;
  success: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Web Audio API Synthesizer for rich, zero-dependency notification chimes
function playChime(type: ToastType, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (type === 'success') {
      // 3-tone arpeggio (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);

        noteGain.gain.setValueAtTime(0, now + idx * 0.08);
        noteGain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

        osc.connect(noteGain);
        noteGain.connect(gain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.38);
      });
    } else if (type === 'error') {
      // Gentle warning chord
      const freqs = [360, 290];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.09);

        noteGain.gain.setValueAtTime(0.15, now + idx * 0.09);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.28);

        osc.connect(noteGain);
        noteGain.connect(gain);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.3);
      });
    } else if (type === 'warning') {
      // Attention chime
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Info harmonic chime
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (e) {
    // Quiet fail on browser policies
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('campusos_sound_notif') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('campusos_sound_notif', String(next));
      } catch {}
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((options: ToastOptions | string, typeOverride?: ToastType): string => {
    const opts: ToastOptions = typeof options === 'string' ? { message: options } : options;
    const type = typeOverride || opts.type || 'info';
    const id = opts.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const duration = opts.duration ?? (type === 'error' ? 6500 : 4800);

    const newToast: ToastItem = {
      ...opts,
      id,
      type,
      duration,
      createdAt: Date.now(),
    };

    // Play subtle synthesized chime
    if (opts.playSound !== false) {
      playChime(type, soundEnabled);
    }

    // Trigger celebration confetti for milestone successes
    if (
      opts.confetti ||
      (type === 'success' &&
        opts.confetti !== false &&
        (opts.message.toLowerCase().includes('approved') ||
          opts.message.toLowerCase().includes('submitted') ||
          opts.message.toLowerCase().includes('success') ||
          opts.message.toLowerCase().includes('published')))
    ) {
      try {
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { y: 0.12, x: 0.88 },
          colors: ['#0D9488', '#2DD4BF', '#3B82F6', '#F59E0B', '#6366F1'],
        });
      } catch (e) {
        // ignore if not loaded
      }
    }

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep maximum 5 on screen

    return id;
  }, [soundEnabled]);

  const success = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    return showToast({ message, title: title || 'Success', type: 'success', confetti: true, ...options });
  }, [showToast]);

  const error = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    return showToast({ message, title: title || 'Action Failed', type: 'error', ...options });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    return showToast({ message, title: title || 'Attention Required', type: 'warning', ...options });
  }, [showToast]);

  const info = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    return showToast({ message, title: title || 'Notice', type: 'info', ...options });
  }, [showToast]);

  // Patch global window.alert to render our animated toast instead of the browser dialog
  useEffect(() => {
    const originalAlert = window.alert;
    (window as any).alert = (msg?: any) => {
      const text = String(msg || '');
      const isError = text.toLowerCase().includes('fail') || text.toLowerCase().includes('error') || text.toLowerCase().includes('invalid');
      const isWarn = text.toLowerCase().includes('warn') || text.toLowerCase().includes('attention') || text.toLowerCase().includes('require');
      const isSuccess = text.toLowerCase().includes('success') || text.toLowerCase().includes('submitted') || text.toLowerCase().includes('approved') || text.toLowerCase().includes('saved') || text.toLowerCase().includes('created');

      if (isError) {
        error(text, 'System Notice');
      } else if (isSuccess) {
        success(text, 'Success Completed');
      } else if (isWarn) {
        warning(text, 'Notice Alert');
      } else {
        info(text, 'Notification');
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [success, error, warning, info]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismissToast, clearAll, soundEnabled, toggleSound }}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Sub-component: Floating Animated Container
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}> = ({ toasts, onDismiss, soundEnabled, onToggleSound }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 max-w-md w-full sm:w-[420px] pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast, index) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={() => onDismiss(toast.id)}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
      ))}
    </div>
  );
};

// Sub-component: Individual Animated Toast Card
const ToastCard: React.FC<{
  toast: ToastItem;
  index: number;
  onDismiss: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}> = ({ toast, index, onDismiss, soundEnabled, onToggleSound }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef(Date.now());

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 280);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(`${toast.title ? toast.title + ': ' : ''}${toast.message}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  useEffect(() => {
    if (toast.duration <= 0) return;

    const interval = 25;
    const timer = setInterval(() => {
      if (isPaused) return;

      const totalElapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, toast.duration - totalElapsed);
      const pct = (remaining / toast.duration) * 100;
      setProgress(pct);

      if (remaining <= 0) {
        clearInterval(timer);
        handleDismiss();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration, isPaused]);

  // Style Tokens per Type
  const styles = {
    success: {
      bg: 'bg-white/95 border-teal-500/40 shadow-teal-900/15',
      badgeBg: 'bg-teal-50 text-teal-600 border-teal-200/80',
      icon: <CheckCircle2 className="w-5 h-5 text-teal-600 animate-bounceOnce" />,
      progressBar: 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600',
      accentGlow: 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-teal-500/15 before:to-emerald-500/5 before:pointer-events-none',
      tag: 'border-teal-500/30 text-teal-800 bg-teal-50 font-extrabold',
    },
    error: {
      bg: 'bg-white/95 border-rose-500/40 shadow-rose-900/15',
      badgeBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600 animate-wiggle" />,
      progressBar: 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-600',
      accentGlow: 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-rose-500/15 before:to-red-500/5 before:pointer-events-none',
      tag: 'border-rose-500/30 text-rose-800 bg-rose-50 font-extrabold',
    },
    warning: {
      bg: 'bg-white/95 border-amber-500/40 shadow-amber-900/15',
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />,
      progressBar: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600',
      accentGlow: 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-amber-500/15 before:to-yellow-500/5 before:pointer-events-none',
      tag: 'border-amber-500/30 text-amber-800 bg-amber-50 font-extrabold',
    },
    info: {
      bg: 'bg-white/95 border-navy-500/40 shadow-navy-900/15',
      badgeBg: 'bg-navy-50 text-navy-600 border-navy-200/80',
      icon: <BellRing className="w-5 h-5 text-navy-600 animate-ring" />,
      progressBar: 'bg-gradient-to-r from-navy-600 via-blue-400 to-navy-700',
      accentGlow: 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-navy-500/15 before:to-blue-500/5 before:pointer-events-none',
      tag: 'border-navy-500/30 text-navy-800 bg-navy-50 font-extrabold',
    },
  }[toast.type];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`
        pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl
        transition-all duration-300 ease-out transform
        ${styles.bg}
        ${styles.accentGlow}
        ${isExiting ? 'opacity-0 translate-x-12 scale-95' : 'opacity-100 translate-x-0 scale-100'}
        animate-toastSlideIn hover:shadow-3xl hover:-translate-y-0.5 group
      `}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="p-4 flex items-start gap-3.5 relative z-10">
        {/* Animated Icon Avatar */}
        <div className={`p-2.5 rounded-xl border flex-shrink-0 shadow-sm ${styles.badgeBg} relative group-hover:scale-105 transition-transform`}>
          {styles.icon}
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-current animate-ping opacity-75" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.tag}`}>
              {toast.type}
            </span>
            {toast.title && (
              <h4 className="text-xs font-extrabold text-slate-900 font-display truncate">
                {toast.title}
              </h4>
            )}
            <span className="text-[10px] text-slate-400 ml-auto font-mono">
              Just now
            </span>
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed break-words">
            {toast.message}
          </p>

          {/* Action Button & Utilities */}
          <div className="flex items-center gap-2 mt-2.5">
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  handleDismiss();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <span>{toast.action.label}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Right action icons: Sound Toggle & Close Button */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            className="text-slate-300 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-all"
            title={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Animated Remaining Progress Countdown Bar */}
      {toast.duration > 0 && (
        <div className="h-1.5 w-full bg-slate-100 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${styles.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

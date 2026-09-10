import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Shield, User, Bell, Compass, Key, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, reduceMotion, setReduceMotion } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setSavedSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
          <Settings className="w-4 h-4" />
          <span>User Preferences & Security</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your session credentials, accessibility toggles, and notification preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Security settings and password updated successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.fullName || 'User'}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
            />
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user?.fullName}</h3>
              <div className="text-xs text-teal-700 font-semibold">{user?.email}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Role: {user?.role}</div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-500">Username:</span><span className="font-mono font-bold">{user?.username}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-500">Phone:</span><span className="font-mono">{user?.phone || '+91 98000 00000'}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-500">Department:</span><span>{user?.department || 'General Campus'}</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500">Security Clearance:</span><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">APPROVED ACTIVE</span></div>
          </div>
        </div>

        {/* Accessibility & 3D Motion */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display mb-1">Accessibility & Graphics</h3>
            <p className="text-xs text-slate-500">Tune 3D campus performance and visual motion.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-600" />
                <span>Reduce 3D Motion</span>
              </div>
              <p className="text-[11px] text-slate-500">Disables intense scroll-driven camera movements.</p>
            </div>

            <button
              type="button"
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                reduceMotion ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                  reduceMotion ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Change Account Password</h4>
            <div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New secure password"
                className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

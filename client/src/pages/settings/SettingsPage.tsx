import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Compass, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const SettingsPage: React.FC = () => {
  const { user, reduceMotion, setReduceMotion } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSavedSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    if (newPassword.length < 12 || newPassword.length > 128) {
      setError('Use a password with 12 to 128 characters.');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSavedSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update your password. Please try again.');
    } finally { setSaving(false); }
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
        <div role="status" className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Your password was changed. Other active sessions have been signed out.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} className="h-16 w-16 rounded-2xl border border-slate-200 object-cover" /> : <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-lg font-bold text-teal-800">{user?.fullName.split(' ').map(part => part[0]).slice(0, 2).join('')}</div>}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user?.fullName}</h3>
              <div className="text-xs text-teal-700 font-semibold">{user?.email}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Role: {user?.role}</div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-500">Username:</span><span className="font-mono font-bold">{user?.username}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-500">Phone:</span><span className="font-mono">{user?.phone || 'Not provided'}</span></div>
            <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-500">Department:</span><span>{user?.department || 'Not assigned'}</span></div>
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
              role="switch"
              aria-checked={reduceMotion}
              aria-label="Reduce 3D motion"
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Change account password</h4>
            <p className="text-xs text-slate-500">Choose at least 12 characters. Your other sessions will be signed out.</p>
            {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
            <label className="block text-xs font-semibold text-slate-700">Current password
              <input type="password" required autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} maxLength={128} disabled={saving} className="glass-input mt-1 w-full rounded-xl px-3.5 py-2 text-xs" />
            </label>
            <div>
              <input
                type="password"
                required
                aria-label="New password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                disabled={saving}
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
                aria-label="Confirm new password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                disabled={saving}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs transition-colors"
            >
              {saving ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

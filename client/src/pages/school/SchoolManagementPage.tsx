import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, Users, Save, CheckCircle2, Shield, MapPin, Mail, Phone,
  Calendar, Layers, Sparkles
} from 'lucide-react';

export const SchoolManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, hierRes, facRes, clsRes] = await Promise.all([
          api.getSchoolProfile(),
          api.getHierarchy(),
          api.getFacilities(),
          api.getClasses(),
        ]);
        setProfile(profRes.profile || {});
        setHierarchy(hierRes.hierarchy || []);
        setFacilities(facRes.facilities || []);
        setClasses(clsRes.classes || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await api.updateSchoolProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <Building2 className="w-4 h-4" />
            <span>Institution Configuration & Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            School Management & Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Campus identity, academic accreditation, leadership hierarchy, and facilities.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>School credentials and configuration updated successfully.</span>
        </div>
      )}

      {/* Profile Form */}
      {profile && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display">Institution Profile & Affiliation</h3>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">School Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliation / Registration #</label>
              <input
                type="text"
                value={profile.affiliation_no || ''}
                onChange={(e) => setProfile({ ...profile, affiliation_no: e.target.value })}
                className="glass-input w-full px-3.5 py-2 text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Principal</label>
              <input
                type="text"
                value={profile.principal_name || ''}
                onChange={(e) => setProfile({ ...profile, principal_name: e.target.value })}
                className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
              />
            </div>
          </div>
        </form>
      )}

      {/* Leadership Hierarchy */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-display">Leadership Hierarchy & Key Officers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hierarchy.map((mgt) => (
            <div key={mgt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={mgt.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={mgt.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-300"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{mgt.name}</h4>
                  <div className="text-[10px] font-semibold text-teal-700">{mgt.designation}</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500">{mgt.responsibilities}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

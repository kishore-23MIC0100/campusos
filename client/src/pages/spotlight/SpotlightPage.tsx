import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles, Award, Trophy, Plus, Search, Quote, Calendar, User, X
} from 'lucide-react';

export const SpotlightPage: React.FC = () => {
  const { user } = useAuth();
  const [spotlights, setSpotlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New spotlight form
  const [title, setTitle] = useState('');
  const [badgeLabel, setBadgeLabel] = useState('STUDENT OF THE MONTH');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('Student Council STEM Lead');
  const [category, setCategory] = useState('STUDENT_ACHIEVEMENT');
  const [story, setStory] = useState('');
  const [metricsHighlight, setMetricsHighlight] = useState('1st Rank Nationally');
  const [citationQuote, setCitationQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSpotlights = async () => {
    try {
      const res = await api.getSpotlights();
      setSpotlights(res.spotlights || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpotlights();
  }, []);

  const handleCreateSpotlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !recipientName || !story) return;

    setSubmitting(true);
    try {
      await api.createSpotlight({
        title,
        badgeLabel,
        recipientName,
        recipientRole,
        category,
        story,
        metricsHighlight,
        citationQuote,
      });

      setShowCreateModal(false);
      setTitle('');
      setRecipientName('');
      setStory('');
      loadSpotlights();
    } catch (err: any) {
      alert(err.message || 'Failed to curate spotlight.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Campus Honors & Editorial Spotlight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Oakridge Spotlight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Celebrating extraordinary student laureates, faculty breakthroughs, and sports victories.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Curate New Spotlight</span>
          </button>
        )}
      </div>

      {/* Editorial Magazine Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {spotlights.map((spot) => (
          <div
            key={spot.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden flex flex-col justify-between hover:shadow-card-hover transition-all"
          >
            <div>
              <div className="relative h-56 bg-navy-950 overflow-hidden">
                <img
                  src={spot.recipient_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={spot.recipient_name}
                  className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-navy-900/90 backdrop-blur-md text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                  {spot.badge_label}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
                  {spot.recipient_role}
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display leading-tight">
                  {spot.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {spot.story}
                </p>

                {spot.citation_quote && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border-l-4 border-teal-600 text-xs text-slate-700 italic flex items-start gap-2">
                    <Quote className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{spot.citation_quote}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0">
              <div className="p-3 rounded-2xl bg-navy-900 text-white text-xs font-mono font-semibold flex items-center justify-between">
                <span>Metrics Highlight:</span>
                <span className="text-teal-300">{spot.metrics_highlight}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Curate Spotlight */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-slate-900 font-display mb-1">Curate Campus Spotlight</h3>
            <p className="text-xs text-slate-500 mb-6">Create editorial feature honoring exceptional achievement.</p>

            <form onSubmit={handleCreateSpotlight} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feature Headline *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. National Robotics Olympiad 1st Rank"
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Arav Patel (Grade 10A)"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Title</label>
                  <input
                    type="text"
                    value={badgeLabel}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    placeholder="e.g. STUDENT OF THE MONTH"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Story & Citation *</label>
                <textarea
                  required
                  rows={3}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Describe the milestone, competition details, and institutional impact..."
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Metrics Highlight</label>
                  <input
                    type="text"
                    value={metricsHighlight}
                    onChange={(e) => setMetricsHighlight(e.target.value)}
                    placeholder="e.g. 1st Rank Nationally"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Quote</label>
                  <input
                    type="text"
                    value={citationQuote}
                    onChange={(e) => setCitationQuote(e.target.value)}
                    placeholder="Short inspiring thought..."
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition-all mt-3"
              >
                {submitting ? 'Publishing...' : 'Publish Spotlight Story'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

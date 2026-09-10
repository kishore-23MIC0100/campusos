import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Plus, Search, MapPin, Clock, Users, Trophy,
  Sparkles, CheckCircle2, X, ChevronRight, Tag
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState<string | null>(null);

  // New Event form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('ACADEMIC');
  const [newDate, setNewDate] = useState('2026-10-15');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [newVenue, setNewVenue] = useState('Grand Auditorium');
  const [newDescription, setNewDescription] = useState('');
  const [newCapacity, setNewCapacity] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = async () => {
    try {
      const res = await api.getEvents({ category, search });
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [category, search]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue || !newDescription) return;

    setSubmitting(true);
    try {
      await api.createEvent({
        title: newTitle,
        category: newCategory,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        venue: newVenue,
        description: newDescription,
        maxCapacity: newCapacity,
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to publish event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRSVP = async (id: string, title: string) => {
    try {
      await api.rsvpEvent(id);
      setRsvpSuccess(`RSVP Confirmed for "${title}". Digital pass generated.`);
      loadEvents();
      setTimeout(() => setRsvpSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to RSVP.');
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Campus Events & Ceremonies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Events & Occasions Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Oakridge International School • Symposia, Athletics Championships & Parent Dialogues
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Event</span>
          </button>
        )}
      </div>

      {rsvpSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{rsvpSuccess}</span>
        </div>
      )}

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, venue, organizer..."
            className="glass-input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          {['ALL', 'ACADEMIC', 'SPORTS', 'MEETING', 'CULTURAL'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                category === cat
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((evt) => (
          <div key={evt.id} className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden flex flex-col justify-between hover:shadow-card-hover transition-all">
            <div className="relative h-44 bg-navy-900 overflow-hidden">
              <img
                src={evt.banner_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80'}
                alt={evt.title}
                className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-navy-950/80 backdrop-blur-md text-[10px] font-extrabold text-teal-300 border border-white/20">
                {evt.category}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {evt.description}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span>{evt.date} ({evt.start_time} - {evt.end_time})</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{evt.venue}</span></div>
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" /><span>{evt.participants_count} Attending / {evt.max_capacity} Capacity</span></div>
              </div>

              <button
                type="button"
                onClick={() => handleRSVP(evt.id, evt.title)}
                className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>RSVP & Get Digital Pass</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Create Event */}
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

            <h3 className="text-2xl font-bold text-slate-900 font-display mb-1">Create Institutional Event</h3>
            <p className="text-xs text-slate-500 mb-6">Schedule campus event with registration capacity.</p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual STEM & Robotics Summit 2026"
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl bg-white"
                  >
                    <option value="ACADEMIC">Academic Summit</option>
                    <option value="SPORTS">Athletics / Sports</option>
                    <option value="MEETING">Parent-Teacher Meeting</option>
                    <option value="CULTURAL">Cultural Gala</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue *</label>
                  <input
                    type="text"
                    required
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Grand Auditorium"
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value, 10))}
                    className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Outline key schedule highlights, keynote speakers, and participant guidelines..."
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition-all mt-3"
              >
                {submitting ? 'Publishing...' : 'Publish Campus Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

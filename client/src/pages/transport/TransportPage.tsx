import { AccessibleDialog } from '../../components/common/AccessibleDialog';
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Bus, MapPin, Navigation, Phone, Users, ShieldCheck, Plus, CheckCircle2, Clock, ChevronRight, X, UserPlus, Trash2, Radio } from 'lucide-react';

export const TransportPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [searchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'routes' | 'roster' | 'fleet'>('routes');

  // Modals
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);

  // New Route Form
  const [routeForm, setRouteForm] = useState({
    routeNumber: '', routeName: '', startPoint: '', endPoint: '', morningStartTime: '', eveningStartTime: '',
    busNumber: '', driverName: '', driverPhone: '', attendantName: '', attendantPhone: '', stops: [] as any[],
  });

  // Allocate Student Form
  const [allocForm, setAllocForm] = useState({
    studentId: '',
    studentName: '',
    gradeSection: '',
    routeId: '',
    routeName: '',
    stopId: '',
    stopName: '',
    pickupTime: '',
    parentPhone: ''
  });

  const loadData = async () => {
    setLoading(true); setLoadError('');
    try {
      const [ovRes, rtRes, vhRes, alcRes, studentsRes] = await Promise.all([
        api.getTransportOverview(),
        api.getTransportRoutes({ search: searchQuery.trim() || undefined }),
        api.getTransportVehicles(),
        api.getTransportAllocations({ search: searchQuery.trim() || undefined }),
        isSuperAdmin ? api.getStudents() : Promise.resolve({ students: [] })
      ]);
      setOverview(ovRes);
      setRoutes(rtRes.routes || []);
      setVehicles(vhRes.vehicles || []);
      setAllocations(alcRes.allocations || []);
      setStudentOptions(studentsRes.students || []);

      setSelectedRoute((previous: any) => (rtRes.routes || []).find((route: any) => route.id === previous?.id) || rtRes.routes?.[0] || null);
    } catch (err: any) {
      setLoadError(err.message || 'Transport details could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.createTransportRoute(routeForm);
      showToast('New bus route registered successfully', 'success');
      setShowAddRouteModal(false);
      loadData();
      setSelectedRoute(res.route);
    } catch (err: any) {
      showToast(err.message || 'Failed to create route', 'error');
    } finally { setSubmitting(false); }
  };

  const handleAllocateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const targetRoute = routes.find(r => r.id === allocForm.routeId) || routes[0];
      if (!targetRoute || !studentOptions.some(student => student.id === allocForm.studentId)) throw new Error('Select a registered student and a campus route.');
      const payload = {
        ...allocForm,
        routeId: targetRoute?.id,
        routeName: `${targetRoute?.route_number} - ${targetRoute?.route_name}`,
      };
      await api.allocateStudentTransport(payload);
      showToast('Student assigned to bus route successfully', 'success');
      setShowAllocateModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to allocate student', 'error');
    } finally { setSubmitting(false); }
  };

  const handleRemoveAllocation = async (id: string) => {
    if (!window.confirm('Remove this student from the transport roster?')) return;
    try {
      await api.removeTransportAllocation(id);
      showToast('Allocation removed', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove allocation', 'error');
    }
  };

  if (loading) return <div role="status" className="space-y-5"><div className="h-32 animate-pulse rounded-2xl bg-slate-200/50" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200/50" />)}</div><p className="text-sm text-slate-500">Loading campus transport records...</p></div>;
  if (loadError) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-800"><h1 className="text-lg font-semibold">Transport records unavailable</h1><p className="mt-2 text-sm">{loadError}</p><button onClick={loadData} className="mt-5 rounded-xl border border-rose-300 px-4 py-2 text-sm">Try again</button></div>;
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Bus className="w-3.5 h-3.5" />
              Campus Fleet, Routes & Commute Logistics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Transportation & Fleet Management
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Manage recorded routes, stop schedules, vehicle information and student transport assignments.
            </p>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAllocateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Allocate Student
              </button>
              <button
                type="button"
                onClick={() => setShowAddRouteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Bus Route
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Bus Routes</div>
            <div className="text-2xl font-black text-navy-900 mt-1">
              {overview?.totalRoutes ?? routes.length}
            </div>
            <div className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {overview?.activeRoutes ?? 0} recorded active routes
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recorded GPS Status</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {overview?.gpsActiveVehicles ?? 0} / {vehicles.length}
            </div>
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Status recorded by the school
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrolled Student Commuters</div>
            <div className="text-2xl font-black text-navy-900 mt-1">
              {overview?.totalStudentsAllocated ?? allocations.length}
            </div>
            <div className="text-xs text-teal-600 font-bold mt-1">
              {overview?.utilizationRate ?? 0}% Bus Capacity Utilized
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Fleet Seating</div>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {overview?.totalFleetCapacity ?? 0} Seats
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {vehicles.length} vehicles on record
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'routes'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Bus Routes & Timetables ({routes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Student Transport Roster ({allocations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'fleet'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Vehicle Fleet & Compliance ({vehicles.length})
        </button>
      </div>

      {/* TAB 1: ROUTES & TIMETABLES */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Routes List */}
          <div className="lg:col-span-1 space-y-3">
            {routes.map((r) => {
              const isSelected = selectedRoute?.id === r.id;
              const isInTransit = r.status === 'IN_TRANSIT';
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoute(r)}
                  className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {r.route_number}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">{r.route_name}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isInTransit
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                          : r.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">From: {r.start_point}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>AM: {r.morning_start_time} • PM: {r.evening_start_time}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700 font-bold">{r.bus_number}</span>
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      {r.stopsCount ?? 0} Stops • {r.studentCount || 0} Students
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Route Stop Timeline & Simulator */}
          <div className="lg:col-span-2">
            {selectedRoute ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-black text-xs">
                        {selectedRoute.route_number}
                      </span>
                      <h3 className="text-lg font-black text-navy-900">{selectedRoute.route_name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Vehicle: <strong className="text-slate-800">{selectedRoute.bus_number}</strong> • Terminal: {selectedRoute.end_point}
                    </p>
                  </div>


                </div>

                {/* Driver & Attendant Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Designated Driver</div>
                      <div className="font-extrabold text-slate-900">{selectedRoute.driver_name}</div>
                      <a href={`tel:${selectedRoute.driver_phone}`} className="text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {selectedRoute.driver_phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Bus Attendant</div>
                      <div className="font-extrabold text-slate-900">{selectedRoute.attendant_name || 'Not assigned'}</div>
                      <a href={`tel:${selectedRoute.attendant_phone}`} className="text-teal-700 font-bold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {selectedRoute.attendant_phone || 'Not provided'}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Stop Sequence Timeline */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                    Scheduled Route Stops & ETA Timeline
                  </h4>
                  {!selectedRoute.stops?.length && <p className="mb-3 text-xs text-slate-500">No route stops recorded.</p>}
                  <div className="space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {(selectedRoute.stops || []).map((st: any, idx: number) => {
                      const isFirst = idx === 0;
                      const isLast = idx === (selectedRoute.stops.length - 1);
                      return (
                        <div key={st.id || idx} className="relative flex items-start justify-between gap-4 text-xs">
                          <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                            isLast ? 'bg-emerald-600 ring-emerald-200' : isFirst ? 'bg-amber-500 ring-amber-200' : 'bg-slate-400 ring-slate-200'
                          }`} />

                          <div>
                            <div className="font-extrabold text-slate-900">{st.stop_name}</div>
                            <div className="text-[11px] text-slate-500">{st.landmark || 'Designated boarding bay'}</div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-800">AM: {st.morning_time}</div>
                            <div className="font-mono text-[11px] text-slate-400">PM: {st.evening_time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400">
                Select a route from the list to view its stop sequence and recorded route information.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT ROSTER */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-navy-900">
              Student Transport Allotment Directory ({allocations.length} Active)
            </h3>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowAllocateModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                + Assign Student
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Grade & Section</th>
                  <th className="py-3 px-4">Assigned Bus Route</th>
                  <th className="py-3 px-4">Designated Pickup Stop</th>
                  <th className="py-3 px-4">Scheduled Time</th>
                  <th className="py-3 px-4">Parent Emergency Contact</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {!allocations.length && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No transport allocations recorded.</td></tr>}
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{a.student_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{a.grade_section}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        {a.route_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">{a.stop_name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{a.pickup_time}</td>
                    <td className="py-3.5 px-4">
                      <a href={`tel:${a.parent_phone}`} className="text-teal-700 font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {a.parent_phone}
                      </a>
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveAllocation(a.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove Allocation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE FLEET */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!vehicles.length && <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No vehicles recorded.</p>}
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {v.vehicle_number}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-2">{v.model}</h4>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    {v.gps_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-3 rounded-2xl text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Seating Capacity</span>
                    <div className="font-black text-navy-900 mt-0.5">{v.capacity} Passengers</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Fuel / Propulsion</span>
                    <div className="font-bold text-teal-700 mt-0.5">{v.fuel_type}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Speed Governor</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{v.speed_limit_kmh ? `${v.speed_limit_kmh} km/h` : 'Not recorded'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Fitness Validity</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{v.fitness_expiry || 'Not recorded'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                Assigned Route: <strong className="text-slate-800">{v.assigned_route || 'Not assigned'}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ALLOCATE STUDENT */}
      {showAllocateModal && (
        <AccessibleDialog title="Assign student to transport" onClose={() => setShowAllocateModal(false)} busy={submitting} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-navy-900 font-extrabold text-base">
                <UserPlus className="w-5 h-5 text-amber-600" />
                Assign Student to Transport
              </div>
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                aria-label="Close dialog"
                disabled={submitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocateStudent} className="py-4 space-y-3 text-xs">
              <div>
                <label htmlFor="transport-field-1" className="block font-bold text-slate-700 mb-1">Registered student</label>
                <select id="transport-field-1" required aria-label="Registered student" value={allocForm.studentId} onChange={event => { const student = studentOptions.find(item => item.id === event.target.value); if (student) setAllocForm({ ...allocForm, studentId: student.id, studentName: `${student.first_name} ${student.last_name}`, gradeSection: `${student.grade} ${student.section}`, parentPhone: student.parent_phone || '' }); }} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"><option value="" disabled>Select a student</option>{studentOptions.map(student => <option key={student.id} value={student.id}>{student.first_name} {student.last_name} ({student.student_id})</option>)}</select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="transport-field-2" className="block font-bold text-slate-700 mb-1">Grade & Section</label>
                  <input id="transport-field-2"
                    type="text"
                    value={allocForm.gradeSection}
                    onChange={(e) => setAllocForm({ ...allocForm, gradeSection: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="transport-field-3" className="block font-bold text-slate-700 mb-1">Pickup Time</label>
                  <input id="transport-field-3"
                    type="text"
                    value={allocForm.pickupTime}
                    onChange={(e) => setAllocForm({ ...allocForm, pickupTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="transport-field-4" className="block font-bold text-slate-700 mb-1">Assign Bus Route</label>
                <select id="transport-field-4"
                  value={allocForm.routeId || (routes[0]?.id || '')}
                  onChange={(e) => setAllocForm({ ...allocForm, routeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_number} - {r.route_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="transport-field-5" className="block font-bold text-slate-700 mb-1">Designated Stop Name</label>
                <input id="transport-field-5"
                  type="text"
                  required
                  value={allocForm.stopName}
                  onChange={(e) => setAllocForm({ ...allocForm, stopName: e.target.value })}
                  placeholder="e.g. Pine Ridge Circle Gate 2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="transport-field-6" className="block font-bold text-slate-700 mb-1">Parent Contact Phone</label>
                <input id="transport-field-6"
                  type="text"
                  value={allocForm.parentPhone}
                  onChange={(e) => setAllocForm({ ...allocForm, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  {submitting ? 'Saving allocation...' : 'Confirm allocation'}
                </button>
              </div>
            </form>
        </AccessibleDialog>
      )}

      {/* MODAL: CREATE ROUTE */}
      {showAddRouteModal && (
        <AccessibleDialog title="Create bus route" onClose={() => setShowAddRouteModal(false)} busy={submitting} className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleIn my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="text-base font-extrabold text-navy-900">
                Create New Campus Bus Route
              </div>
              <button
                type="button"
                onClick={() => setShowAddRouteModal(false)}
                aria-label="Close dialog"
                disabled={submitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="transport-field-7" className="block font-bold text-slate-700 mb-1">Route Identifier</label>
                  <input id="transport-field-7"
                    type="text"
                    required
                    value={routeForm.routeNumber}
                    onChange={(e) => setRouteForm({ ...routeForm, routeNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="transport-field-8" className="block font-bold text-slate-700 mb-1">Assigned Coach</label>
                  <input id="transport-field-8"
                    type="text"
                    required
                    value={routeForm.busNumber}
                    onChange={(e) => setRouteForm({ ...routeForm, busNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="transport-field-9" className="block font-bold text-slate-700 mb-1">Route Title / Neighborhood Description</label>
                <input id="transport-field-9"
                  type="text"
                  required
                  value={routeForm.routeName}
                  onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="transport-field-10" className="block font-bold text-slate-700 mb-1">Origin Point</label>
                  <input id="transport-field-10"
                    required
                    type="text"
                    value={routeForm.startPoint}
                    onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="transport-field-11" className="block font-bold text-slate-700 mb-1">Morning Start Time</label>
                  <input id="transport-field-11"
                    type="text"
                    required
                    value={routeForm.morningStartTime}
                    onChange={(e) => setRouteForm({ ...routeForm, morningStartTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="transport-field-12" className="block font-bold text-slate-700 mb-1">Driver Full Name</label>
                  <input id="transport-field-12"
                    type="text"
                    required
                    value={routeForm.driverName}
                    onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="transport-field-13" className="block font-bold text-slate-700 mb-1">Driver Contact</label>
                  <input id="transport-field-13"
                    type="text"
                    required
                    value={routeForm.driverPhone}
                    onChange={(e) => setRouteForm({ ...routeForm, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3"><label className="block font-bold text-slate-700">Destination<input required value={routeForm.endPoint} onChange={event => setRouteForm({ ...routeForm, endPoint: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" /></label><label className="block font-bold text-slate-700">Evening start time<input required type="time" value={routeForm.eveningStartTime} onChange={event => setRouteForm({ ...routeForm, eveningStartTime: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" /></label></div>
              <p className="text-slate-500">Route stops can be added to the route record by the transport administrator.</p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  {submitting ? 'Saving route...' : 'Save bus route'}
                </button>
              </div>
            </form>
        </AccessibleDialog>
      )}
    </div>
  );
};

import express from 'express';
import { getDb } from '../db.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Transport Overview & Fleet Metrics
router.get('/overview', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const routes = db.prepare('SELECT * FROM transport_routes').all() as any[];
    const vehicles = db.prepare('SELECT * FROM transport_vehicles').all() as any[];
    const allocations = db.prepare('SELECT * FROM transport_allocations').all() as any[];

    const activeRoutes = routes.filter(r => r.status === 'ACTIVE' || r.status === 'IN_TRANSIT').length;
    const totalFleetCapacity = vehicles.reduce((acc, v) => acc + (Number(v.capacity) || 0), 0);
    const totalStudentsAllocated = allocations.length;
    const gpsActiveVehicles = vehicles.filter(v => v.gps_status === 'ONLINE').length;

    res.json({
      totalRoutes: routes.length,
      activeRoutes,
      totalVehicles: vehicles.length,
      gpsActiveVehicles,
      totalFleetCapacity,
      totalStudentsAllocated,
      utilizationRate: totalFleetCapacity > 0 ? Math.round((totalStudentsAllocated / totalFleetCapacity) * 100) : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Bus Routes with Stops & Driver Details
router.get('/routes', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { status, search } = req.query;
    let routes = db.prepare('SELECT * FROM transport_routes').all() as any[];
    const stops = db.prepare('SELECT * FROM transport_stops').all() as any[];
    const allocations = db.prepare('SELECT * FROM transport_allocations').all() as any[];

    if (status) {
      routes = routes.filter(r => (r.status || '').toUpperCase() === String(status).toUpperCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      routes = routes.filter(
        r =>
          (r.route_name && r.route_name.toLowerCase().includes(q)) ||
          (r.route_number && r.route_number.toLowerCase().includes(q)) ||
          (r.driver_name && r.driver_name.toLowerCase().includes(q))
      );
    }

    const enriched = routes.map(r => {
      const routeStops = stops
        .filter(s => s.route_id === r.id)
        .sort((a, b) => (Number(a.stop_sequence) || 0) - (Number(b.stop_sequence) || 0));
      const studentCount = allocations.filter(a => a.route_id === r.id).length;

      return {
        ...r,
        stops: routeStops,
        stopsCount: routeStops.length,
        studentCount,
      };
    });

    res.json({ routes: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Route with Complete Stop Sequence and Student Roster
router.get('/routes/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const route = (db.prepare('SELECT * FROM transport_routes').all() as any[]).find(r => r.id === id);

    if (!route) {
      return res.status(404).json({ error: 'Transport route not found' });
    }

    const stops = (db.prepare('SELECT * FROM transport_stops').all() as any[])
      .filter(s => s.route_id === id)
      .sort((a, b) => (Number(a.stop_sequence) || 0) - (Number(b.stop_sequence) || 0));

    const students = (db.prepare('SELECT * FROM transport_allocations').all() as any[]).filter(
      a => a.route_id === id
    );

    const vehicle = (db.prepare('SELECT * FROM transport_vehicles').all() as any[]).find(
      v => v.id === route.vehicle_id || v.vehicle_number === route.bus_number
    ) || {};

    res.json({
      route: {
        ...route,
        vehicle,
        stops,
        students,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create New Transport Route
router.post('/routes', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const {
      routeNumber, routeName, startPoint, endPoint, morningStartTime = '06:45 AM',
      eveningStartTime = '03:30 PM', busNumber, driverName, driverPhone,
      attendantName, attendantPhone, stops = []
    } = req.body;

    if (!routeNumber || !routeName || !startPoint) {
      return res.status(400).json({ error: 'Route number, name, and start point are required' });
    }

    const id = `rt_${Date.now()}`;
    const newRoute = {
      id,
      route_number: routeNumber,
      route_name: routeName,
      start_point: startPoint,
      end_point: endPoint || 'Oakridge International Main Campus',
      morning_start_time: morningStartTime,
      evening_start_time: eveningStartTime,
      bus_number: busNumber || 'KA-01-EQ-1044',
      driver_name: driverName || 'Raj Kumar',
      driver_phone: driverPhone || '+91 98450 99881',
      attendant_name: attendantName || 'Suresh Gowda',
      attendant_phone: attendantPhone || '+91 98450 99882',
      status: 'ACTIVE',
      current_transit_step: 0,
      created_at: new Date().toISOString(),
    };

    const routesTable = (db as any).data.transport_routes || [];
    routesTable.push(newRoute);

    // Insert stops
    const stopsTable = (db as any).data.transport_stops || [];
    stops.forEach((st: any, idx: number) => {
      stopsTable.push({
        id: `stp_${id}_${idx + 1}`,
        route_id: id,
        stop_name: st.stopName || st.name,
        stop_sequence: idx + 1,
        morning_time: st.morningTime || '07:00 AM',
        evening_time: st.eveningTime || '03:45 PM',
        landmark: st.landmark || '',
      });
    });

    (db as any).scheduleSave();
    res.status(201).json({ success: true, route: newRoute });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Transport Route
router.put('/routes/:id', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const routesTable = (db as any).data.transport_routes || [];
    const route = routesTable.find((r: any) => r.id === id);

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const {
      routeNumber, routeName, startPoint, endPoint, morningStartTime, eveningStartTime,
      busNumber, driverName, driverPhone, attendantName, attendantPhone, status
    } = req.body;

    if (routeNumber) route.route_number = routeNumber;
    if (routeName) route.route_name = routeName;
    if (startPoint) route.start_point = startPoint;
    if (endPoint) route.end_point = endPoint;
    if (morningStartTime) route.morning_start_time = morningStartTime;
    if (eveningStartTime) route.evening_start_time = eveningStartTime;
    if (busNumber) route.bus_number = busNumber;
    if (driverName) route.driver_name = driverName;
    if (driverPhone) route.driver_phone = driverPhone;
    if (attendantName) route.attendant_name = attendantName;
    if (attendantPhone) route.attendant_phone = attendantPhone;
    if (status) route.status = status;
    route.updated_at = new Date().toISOString();

    (db as any).scheduleSave();
    res.json({ success: true, route });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete Transport Route
router.delete('/routes/:id', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    (db as any).data.transport_routes = ((db as any).data.transport_routes || []).filter((r: any) => r.id !== id);
    (db as any).data.transport_stops = ((db as any).data.transport_stops || []).filter((s: any) => s.route_id !== id);
    (db as any).data.transport_allocations = ((db as any).data.transport_allocations || []).filter((a: any) => a.route_id !== id);

    (db as any).scheduleSave();
    res.json({ success: true, message: 'Route and associated stops/allocations removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get All Vehicles (Fleet)
router.get('/vehicles', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const vehicles = db.prepare('SELECT * FROM transport_vehicles').all() as any[];
    res.json({ vehicles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Get All Student Transport Allocations
router.get('/allocations', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { routeId, studentId, search } = req.query;
    let allocations = db.prepare('SELECT * FROM transport_allocations').all() as any[];

    if (routeId) {
      allocations = allocations.filter(a => a.route_id === routeId);
    }
    if (studentId) {
      allocations = allocations.filter(a => a.student_id === studentId);
    }
    if (search) {
      const q = String(search).toLowerCase();
      allocations = allocations.filter(
        a =>
          (a.student_name && a.student_name.toLowerCase().includes(q)) ||
          (a.route_name && a.route_name.toLowerCase().includes(q)) ||
          (a.stop_name && a.stop_name.toLowerCase().includes(q))
      );
    }

    res.json({ allocations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Allocate Student to Bus Route & Stop
router.post('/allocate', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { studentId, studentName, gradeSection, routeId, routeName, stopId, stopName, pickupTime, parentPhone } = req.body;

    if (!studentId || !routeId) {
      return res.status(400).json({ error: 'Student ID and Route ID are required' });
    }

    const allocationsTable = (db as any).data.transport_allocations || [];
    // Remove previous allocation if any
    (db as any).data.transport_allocations = allocationsTable.filter((a: any) => a.student_id !== studentId);

    const newAlloc = {
      id: `alc_${Date.now()}`,
      student_id: studentId,
      student_name: studentName || 'Enrolled Student',
      grade_section: gradeSection || 'Grade 10A',
      route_id: routeId,
      route_name: routeName || 'Assigned Route',
      stop_id: stopId || 'stp_1',
      stop_name: stopName || 'Designated Campus Stop',
      pickup_time: pickupTime || '07:15 AM',
      parent_phone: parentPhone || '+91 98765 43210',
      status: 'ALLOCATED',
      created_at: new Date().toISOString(),
    };

    (db as any).data.transport_allocations.push(newAlloc);
    (db as any).scheduleSave();

    res.status(201).json({ success: true, allocation: newAlloc });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Remove Allocation
router.delete('/allocations/:id', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    (db as any).data.transport_allocations = ((db as any).data.transport_allocations || []).filter((a: any) => a.id !== id);
    (db as any).scheduleSave();
    res.json({ success: true, message: 'Student transport allocation removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Live Transit Simulation (Toggle route transit status)
router.post('/routes/:id/simulate-transit', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const routes = (db as any).data.transport_routes || [];
    const route = routes.find((r: any) => r.id === id);

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const currentStatus = route.status || 'ACTIVE';
    if (currentStatus === 'ACTIVE') {
      route.status = 'IN_TRANSIT';
      route.current_transit_step = 1;
    } else if (currentStatus === 'IN_TRANSIT') {
      route.status = 'COMPLETED';
      route.current_transit_step = 4;
    } else {
      route.status = 'ACTIVE';
      route.current_transit_step = 0;
    }

    (db as any).scheduleSave();
    res.json({ success: true, status: route.status, currentTransitStep: route.current_transit_step });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

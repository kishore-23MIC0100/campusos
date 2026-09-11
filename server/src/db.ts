import fs from 'fs';
import path from 'path';

export interface DatabaseState {
  users: any[];
  roles: any[];
  permissions: any[];
  role_permissions: any[];
  students: any[];
  teachers: any[];
  parents: any[];
  classes: any[];
  subjects: any[];
  attendance_records: any[];
  homework: any[];
  homework_submissions: any[];
  leave_requests: any[];
  timetables: any[];
  events: any[];
  announcements: any[];
  spotlights: any[];
  performance_records: any[];
  school_profile: any[];
  management_hierarchy: any[];
  audit_logs: any[];
  notifications: any[];
  rooms_facilities: any[];
}

const defaultState: DatabaseState = {
  users: [],
  roles: [],
  permissions: [],
  role_permissions: [],
  students: [],
  teachers: [],
  parents: [],
  classes: [],
  subjects: [],
  attendance_records: [],
  homework: [],
  homework_submissions: [],
  leave_requests: [],
  timetables: [],
  events: [],
  announcements: [],
  spotlights: [],
  performance_records: [],
  school_profile: [],
  management_hierarchy: [],
  audit_logs: [],
  notifications: [],
  rooms_facilities: [],
};

class PureDatabase {
  private dataDir: string;
  private filePath: string;
  private data: DatabaseState;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, 'campusos_data.json');
    this.data = this.loadData();
  }

  private loadData(): DatabaseState {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return { ...defaultState, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('[Database Load Error] Using fresh default database state.', err);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  public save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database Save Error]', err);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.save(), 50);
  }

  public exec(sql: string) {
    // Schema creation helper
    return true;
  }

  public transaction(fn: (...args: any[]) => any) {
    return (...args: any[]) => {
      const result = fn(...args);
      this.save();
      return result;
    };
  }

  public prepare(sql: string) {
    const trimmed = sql.trim();
    const self = this;

    return {
      all(...params: any[]): any[] {
        return self.executeQuery(trimmed, params);
      },
      get(...params: any[]): any {
        const res = self.executeQuery(trimmed, params);
        return res.length > 0 ? res[0] : undefined;
      },
      run(...params: any[]): { changes: number; lastInsertRowid: number } {
        const changes = self.executeUpdate(trimmed, params);
        self.scheduleSave();
        return { changes, lastInsertRowid: Date.now() };
      }
    };
  }

  private executeQuery(sql: string, params: any[]): any[] {
    const lower = sql.toLowerCase();

    // Table extraction: SELECT ... FROM <table> WHERE ...
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) return [];

    const tableName = fromMatch[1].toLowerCase() as keyof DatabaseState;
    const table = this.data[tableName] || [];

    // Simple COUNT query
    if (lower.startsWith('select count(*)')) {
      return [{ count: table.length }];
    }

    let results = [...table];

    // Evaluate WHERE clauses if present
    if (/WHERE/i.test(sql)) {
      results = this.filterRecords(results, sql, params, tableName);
    }

    // ORDER BY
    if (/ORDER BY/i.test(sql)) {
      results = this.sortRecords(results, sql);
    }

    // LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      results = results.slice(0, limit);
    }

    return results;
  }

  private filterRecords(records: any[], sql: string, params: any[], tableName: string): any[] {
    let pIdx = 0;

    return records.filter(row => {
      // 1. Users login lookup: LOWER(email) = ? OR LOWER(username) = ? OR LOWER(student_id) = ? OR phone = ?
      if (tableName === 'users' && /LOWER\(email\)\s*=\s*\?/i.test(sql)) {
        const p1 = String(params[0] || '').toLowerCase();
        const p2 = String(params[1] || '').toLowerCase();
        const p3 = String(params[2] || '').toLowerCase();
        const p4 = String(params[3] || '');
        return (
          (row.email && row.email.toLowerCase() === p1) ||
          (row.username && row.username.toLowerCase() === p2) ||
          (row.student_id && row.student_id.toLowerCase() === p3) ||
          (row.phone && row.phone === p4)
        );
      }

      // 2. Users duplicate check: LOWER(email) = ? OR LOWER(username) = ?
      if (tableName === 'users' && /LOWER\(email\)\s*=\s*\?\s*OR\s*LOWER\(username\)\s*=\s*\?/i.test(sql)) {
        const p1 = String(params[0] || '').toLowerCase();
        const p2 = String(params[1] || '').toLowerCase();
        return (
          (row.email && row.email.toLowerCase() === p1) ||
          (row.username && row.username.toLowerCase() === p2)
        );
      }

      // 3. Simple ID lookup: WHERE id = ? OR student_id = ?
      if (/WHERE\s+id\s*=\s*\?\s*OR\s*student_id\s*=\s*\?/i.test(sql)) {
        const p1 = params[0];
        const p2 = params[1];
        return row.id === p1 || row.student_id === p2;
      }

      // 4. Simple ID lookup: WHERE id = ? OR employee_id = ?
      if (/WHERE\s+id\s*=\s*\?\s*OR\s*employee_id\s*=\s*\?/i.test(sql)) {
        const p1 = params[0];
        const p2 = params[1];
        return row.id === p1 || row.employee_id === p2;
      }

      // 5. Single ID lookup: WHERE id = ?
      if (/WHERE\s+id\s*=\s*\?/i.test(sql)) {
        return row.id === params[0];
      }

      // 5b. IN clause lookup: WHERE id IN (?, ?, ...)
      if (/WHERE\s+id\s+IN\s*\(/i.test(sql)) {
        return params.includes(row.id) || params.includes(row.student_id);
      }

      // 6. Generic parameter matching
      let matches = true;
      let curParam = 0;

      if (/AND\s+role\s*=\s*\?/i.test(sql)) {
        if (row.role !== params[curParam++]) return false;
      }
      if (/AND\s+status\s*=\s*\?/i.test(sql)) {
        if (row.status !== params[curParam++]) return false;
      }
      if (/AND\s+grade\s*=\s*\?/i.test(sql)) {
        if (row.grade !== params[curParam++]) return false;
      }
      if (/AND\s+section\s*=\s*\?/i.test(sql)) {
        if (row.section !== params[curParam++]) return false;
      }
      if (/AND\s+subject\s*=\s*\?/i.test(sql)) {
        if (row.subject !== params[curParam++]) return false;
      }
      if (/AND\s+department\s*=\s*\?/i.test(sql)) {
        if (row.department !== params[curParam++]) return false;
      }
      if (/AND\s+category\s*=\s*\?/i.test(sql)) {
        if (row.category !== params[curParam++]) return false;
      }
      if (/AND\s+priority\s*=\s*\?/i.test(sql)) {
        if (row.priority !== params[curParam++]) return false;
      }
      if (/AND\s+date\s*=\s*\?/i.test(sql)) {
        if (row.date !== params[curParam++]) return false;
      }
      if (/AND\s+student_id\s*=\s*\?/i.test(sql)) {
        if (row.student_id !== params[curParam++]) return false;
      }
      if (/AND\s+day_of_week\s*=\s*\?/i.test(sql)) {
        if (row.day_of_week !== params[curParam++]) return false;
      }

      // Search term matching
      if (/LIKE\s*\?/i.test(sql) && curParam < params.length) {
        const term = String(params[curParam] || '').replace(/%/g, '').toLowerCase();
        const jsonStr = JSON.stringify(row).toLowerCase();
        if (!jsonStr.includes(term)) return false;
      }

      // Timetable conflict checks
      if (/day_of_week\s*=\s*\?\s*AND\s*period_index\s*=\s*\?\s*AND\s*LOWER\(teacher_name\)\s*=\s*\?/i.test(sql)) {
        return row.day_of_week === params[0] && row.period_index == params[1] && (row.teacher_name || '').toLowerCase() === String(params[2]).toLowerCase();
      }
      if (/day_of_week\s*=\s*\?\s*AND\s*period_index\s*=\s*\?\s*AND\s*LOWER\(room_number\)\s*=\s*\?/i.test(sql)) {
        return row.day_of_week === params[0] && row.period_index == params[1] && (row.room_number || '').toLowerCase() === String(params[2]).toLowerCase();
      }

      // Homework student check
      if (/homework_id\s*=\s*\?\s*AND\s*student_id\s*=\s*\?/i.test(sql)) {
        return row.homework_id === params[0] && (row.student_id === params[1] || row.student_name === params[1]);
      }

      // Parent ID lookup: WHERE user_id = ? OR email = ?
      if (/user_id\s*=\s*\?\s*OR\s*email\s*=\s*\?/i.test(sql)) {
        return row.user_id === params[0] || (row.email && row.email === params[1]);
      }

      // Parent student lookup
      if (/parent_id\s*=\s*\?\s*OR\s*LOWER\(parent_name\)\s*LIKE\s*\?/i.test(sql)) {
        const term = String(params[1] || '').replace(/%/g, '').toLowerCase();
        return row.parent_id === params[0] || (row.parent_name && row.parent_name.toLowerCase().includes(term));
      }

      // Single parent / student ID check
      if (/WHERE\s+homework_id\s*=\s*\?/i.test(sql)) {
        return row.homework_id === params[0];
      }
      if (/WHERE\s+student_id\s*=\s*\?/i.test(sql)) {
        return row.student_id === params[0];
      }
      if (/WHERE\s+user_id\s*=\s*\?/i.test(sql)) {
        return row.user_id === params[0];
      }
      if (/WHERE\s+grade\s*=\s*\?\s*AND\s*section\s*=\s*\?/i.test(sql)) {
        return row.grade === params[0] && row.section === params[1];
      }

      return matches;
    });
  }

  private sortRecords(records: any[], sql: string): any[] {
    if (/status\s*=\s*['"]PENDING['"]/i.test(sql)) {
      records.sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
    } else if (/due_date/i.test(sql)) {
      records.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
    } else if (/date\s+DESC/i.test(sql)) {
      records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } else if (/date\s+ASC/i.test(sql)) {
      records.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } else if (/created_at\s+DESC/i.test(sql)) {
      records.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else if (/period_index/i.test(sql)) {
      records.sort((a, b) => (a.period_index || 0) - (b.period_index || 0));
    } else if (/roll_no/i.test(sql)) {
      records.sort((a, b) => (a.roll_no || 0) - (b.roll_no || 0));
    }
    return records;
  }

  private executeUpdate(sql: string, params: any[]): number {
    const trimmed = sql.trim();

    // 1. INSERT INTO <table> (...) VALUES (...)
    const insertMatch = trimmed.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
    if (insertMatch) {
      const tableName = insertMatch[1].toLowerCase() as keyof DatabaseState;
      const columns = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
      const newRow: any = { created_at: new Date().toISOString() };

      columns.forEach((col, i) => {
        newRow[col] = params[i] !== undefined ? params[i] : null;
      });

      if (!this.data[tableName]) {
        this.data[tableName] = [];
      }
      this.data[tableName].push(newRow);
      return 1;
    }

    // 2. UPDATE <table> SET ... WHERE ...
    const updateMatch = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const tableName = updateMatch[1].toLowerCase() as keyof DatabaseState;
      const table = this.data[tableName] || [];
      const setClause = updateMatch[2];
      const whereClause = updateMatch[3];

      let updatedCount = 0;

      // Extract set assignments
      const setFields = setClause.split(',').map(s => s.trim().split('=')[0].trim().toLowerCase());

      table.forEach(row => {
        let isMatch = false;
        if (/WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
          const targetId = params[params.length - 1];
          isMatch = row.id === targetId;
        } else {
          isMatch = true;
        }

        if (isMatch) {
          setFields.forEach((field, i) => {
            if (field !== 'updated_at') {
              row[field] = params[i];
            } else {
              row[field] = new Date().toISOString();
            }
          });
          row.updated_at = new Date().toISOString();
          updatedCount++;
        }
      });

      return updatedCount;
    }

    // 3. DELETE FROM <table> WHERE ...
    const deleteMatch = trimmed.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+(.+)/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1].toLowerCase() as keyof DatabaseState;
      const initialLen = (this.data[tableName] || []).length;

      if (/WHERE\s+id\s*=\s*\?/i.test(trimmed)) {
        const targetId = params[0];
        this.data[tableName] = (this.data[tableName] || []).filter(r => r.id !== targetId);
      } else if (/WHERE\s+grade\s*=\s*\?\s*AND\s*section\s*=\s*\?\s*AND\s*date\s*=\s*\?/i.test(trimmed)) {
        this.data[tableName] = (this.data[tableName] || []).filter(
          r => !(r.grade === params[0] && r.section === params[1] && r.date === params[2])
        );
      } else if (/WHERE\s+homework_id\s*=\s*\?\s*AND\s*student_id\s*=\s*\?/i.test(trimmed)) {
        this.data[tableName] = (this.data[tableName] || []).filter(
          r => !(r.homework_id === params[0] && r.student_id === params[1])
        );
      }

      return initialLen - (this.data[tableName] || []).length;
    }

    return 0;
  }
}

let dbInstance: PureDatabase | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new PureDatabase();
  }
  return dbInstance;
}

export function initDatabase() {
  return getDb();
}

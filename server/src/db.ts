import fs from 'fs';
import path from 'path';
import { Pool, type PoolClient } from 'pg';

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
  staff_details: any[];
  payrolls: any[];
  assessments: any[];
  assessment_marks: any[];
  transport_routes: any[];
  transport_vehicles: any[];
  transport_stops: any[];
  transport_allocations: any[];
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
  staff_details: [],
  payrolls: [],
  assessments: [],
  assessment_marks: [],
  transport_routes: [],
  transport_vehicles: [],
  transport_stops: [],
  transport_allocations: [],
};

export class PureDatabase {
  private dataDir: string;
  private filePath: string;
  private data: DatabaseState;
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly usesPostgres = Boolean(process.env.DATABASE_URL);
  private pool: Pool | null = null;
  private dirty = false;
  private requestTail: Promise<void> = Promise.resolve();

  constructor() {
    this.dataDir = path.resolve(process.env.CAMPUSOS_DATA_DIR || path.join(process.cwd(), 'data'));
    this.filePath = path.join(this.dataDir, 'campusos_data.json');
    // Production must never fall back to the checked-in/local JSON database.
    this.data = this.usesPostgres || process.env.VERCEL
      ? JSON.parse(JSON.stringify(defaultState))
      : this.loadData();
  }

  public async close() {
    if (this.saveTimeout) { clearTimeout(this.saveTimeout); this.saveTimeout = null; this.save(); }
    if (this.pool) await this.pool.end();
  }

  public hasUsers() {
    return this.data.users.length > 0;
  }

  private getPool() {
    if (!this.pool) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) throw new Error('DATABASE_URL is required for the deployed Scholaxys API.');
      this.pool = new Pool({
        connectionString,
        ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: true },
        max: 3,
        connectionTimeoutMillis: 10000,
        statement_timeout: 15000,
        idle_in_transaction_session_timeout: 60000,
      });
    }
    return this.pool;
  }

  /**
   * A request-scoped lock makes the JSON-backed query adapter safe across
   * Vercel function instances while retaining the existing synchronous route API.
   */
  public async beginRequest(): Promise<(commit?: boolean) => Promise<void>> {
    if (!this.usesPostgres) {
      if (process.env.VERCEL) throw new Error('DATABASE_URL is required for the deployed Scholaxys API.');
      return async () => {};
    }

    let releaseQueue!: () => void;
    const previous = this.requestTail;
    this.requestTail = new Promise<void>((resolve) => { releaseQueue = resolve; });
    await previous;

    let client: PoolClient | undefined;
    try {
      client = await this.getPool().connect();
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [694327]);
      await client.query(`
        CREATE TABLE IF NOT EXISTS campusos_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          state JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const result = await client.query('SELECT state FROM campusos_state WHERE id = 1 FOR UPDATE');
      if (result.rows[0]?.state) {
        const saved = typeof result.rows[0].state === 'string'
          ? JSON.parse(result.rows[0].state)
          : result.rows[0].state;
        this.data = { ...defaultState, ...saved };
      } else {
        this.data = JSON.parse(JSON.stringify(defaultState));
      }
      this.dirty = false;

      let finished = false;
      return async (commit = true) => {
        if (finished) return;
        finished = true;
        try {
          if (!commit) { await client!.query('ROLLBACK'); return; }
          if (this.dirty) {
            await client!.query(
              `INSERT INTO campusos_state (id, state, updated_at)
               VALUES (1, $1::jsonb, NOW())
               ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
              [JSON.stringify(this.data)],
            );
          }
          await client!.query('COMMIT');
        } catch (error) {
          await client!.query('ROLLBACK').catch(() => {});
          throw error;
        } finally {
          client!.release();
          releaseQueue();
        }
      };
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
      }
      releaseQueue();
      throw error;
    }
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
      throw new Error('Cannot read the Scholaxys database. Restore the data file before starting.', { cause: err });
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  public save() {
    if (this.usesPostgres) {
      this.dirty = true;
      return;
    }
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const temporaryPath = `${this.filePath}.tmp`;
      fs.writeFileSync(temporaryPath, JSON.stringify(this.data, null, 2), { encoding: 'utf-8', mode: 0o600 });
      fs.renameSync(temporaryPath, this.filePath);
    } catch (err) {
      throw new Error('Cannot persist the Scholaxys database.', { cause: err });
    }
  }

  public scheduleSave() {
    if (this.usesPostgres) {
      this.dirty = true;
      return;
    }
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.save(), 50);
  }

  public exec(sql: string) {
    // Schema creation helper
    return true;
  }

  public transaction(fn: (...args: any[]) => any) {
    return (...args: any[]) => {
      const snapshot = structuredClone(this.data);
      try { const result = fn(...args); this.save(); return result; } catch (error) { this.data = snapshot; throw error; }
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
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) throw new Error('Unsupported query');
    const tableName = fromMatch[1].toLowerCase() as keyof DatabaseState;
    let results = [...(this.data[tableName] || [])];
    const where = sql.match(/\bWHERE\s+([\s\S]+?)(?:\s+ORDER BY|\s+LIMIT|$)/i)?.[1];
    if (where) results = results.filter(this.predicate(where, params));
    if (/^SELECT\s+COUNT\(\*\)/i.test(sql)) return [{ count: results.length }];
    const order = sql.match(/ORDER BY\s+([\s\S]+?)(?:\s+LIMIT|$)/i)?.[1];
    if (order) {
      if (/CASE day_of_week/i.test(order)) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        results.sort((a, b) => days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week) || Number(a.period_index) - Number(b.period_index));
      } else if (/CASE WHEN status/i.test(order)) {
        results.sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING') || String(b.created_at || b.submitted_at || '').localeCompare(String(a.created_at || a.submitted_at || '')));
      } else {
        const fields = order.split(',').map(field => field.trim().split(/\s+/));
        results.sort((a, b) => {
          for (const [field, direction] of fields) {
            const left = a[field] ?? ''; const right = b[field] ?? '';
            const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true });
            if (comparison) return direction?.toUpperCase() === 'DESC' ? -comparison : comparison;
          }
          return 0;
        });
      }
    }
    const limit = sql.match(/LIMIT\s+(\d+)/i)?.[1];
    if (limit) results = results.slice(0, Number(limit));
    const projection = sql.match(/^SELECT\s+([\s\S]+?)\s+FROM/i)?.[1].trim();
    // Enforce SELECT projections: credentials and private fields must never leak
    // through endpoints that explicitly request public profile columns.
    if (projection && projection !== '*') {
      const fields = projection.split(',').map(field => field.trim());
      return results.map(row => Object.fromEntries(fields.map(field => [field, row[field]])));
    }
    return results;
  }

  /** Parse the small SQL expression subset used by the existing routes.
   * Unknown expressions fail closed instead of accidentally matching every row.
   * Values are bound as tokens, never interpolated or evaluated as JavaScript.
   */
  private predicate(expression: string, params: any[]): (row: any) => boolean {
    const tokens: any[] = expression.match(/\b(?:LOWER|LIKE|AND|OR|IN|IS|NOT|NULL)\b|[a-zA-Z_][a-zA-Z0-9_]*|\?|!=|<>|=|\(|\)|,|'(?:[^']|'')*'|"(?:[^"]|"")*"|\d+(?:\.\d+)?/gi) || [];
    let bound = 0;
    for (let i = 0; i < tokens.length; i++) if (tokens[i] === '?') tokens[i] = { value: params[bound++] };
    let index = 0;
    const peek = (value: string) => typeof tokens[index] === 'string' && tokens[index].toUpperCase() === value;
    const consume = (value: string) => { if (!peek(value)) throw new Error(`Unsupported database expression: expected ${value}`); index++; };
    type Value = (row: any) => any;
    const operand = (): Value => {
      const token = tokens[index++];
      if (token && typeof token === 'object') return () => token.value;
      if (typeof token !== 'string') throw new Error('Missing database operand');
      if (token.toUpperCase() === 'LOWER') { consume('('); const inner = operand(); consume(')'); return row => String(inner(row) ?? '').toLowerCase(); }
      if (token.toUpperCase() === 'NULL') return () => null;
      if (/^['"]/.test(token)) return () => token.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
      if (/^\d/.test(token)) return () => Number(token);
      return row => row[token.toLowerCase()];
    };
    const comparison = (): ((row: any) => boolean) => {
      if (peek('(')) { consume('('); const inner = or(); consume(')'); return inner; }
      const left = operand();
      if (peek('IN')) {
        consume('IN'); consume('('); const values = [operand()];
        while (peek(',')) { consume(','); values.push(operand()); }
        consume(')'); return row => values.some(value => String(left(row)) === String(value(row)));
      }
      if (peek('IS')) { consume('IS'); const negate = peek('NOT'); if (negate) consume('NOT'); consume('NULL'); return row => negate ? left(row) != null : left(row) == null; }
      const op = String(tokens[index++]).toUpperCase(); const right = operand();
      if (op === '=') return row => left(row) != null && right(row) != null && String(left(row)) === String(right(row));
      if (op === '!=' || op === '<>') return row => String(left(row)) !== String(right(row));
      if (op === 'LIKE') return row => {
        const pattern = String(right(row) ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.');
        return new RegExp(`^${pattern}$`, 'i').test(String(left(row) ?? ''));
      };
      throw new Error(`Unsupported database operator ${op}`);
    };
    const and = (): ((row: any) => boolean) => { let left = comparison(); while (peek('AND')) { consume('AND'); const prior = left; const right = comparison(); left = row => prior(row) && right(row); } return left; };
    const or = (): ((row: any) => boolean) => { let left = and(); while (peek('OR')) { consume('OR'); const prior = left; const right = and(); left = row => prior(row) || right(row); } return left; };
    const result = or();
    if (index !== tokens.length || bound !== params.length) throw new Error('Unsupported or incorrectly bound database expression');
    return result;
  }

  private executeUpdate(sql: string, params: any[]): number {
    const insert = sql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
    if (insert) {
      const tableName = insert[1].toLowerCase() as keyof DatabaseState;
      const columns = insert[2].split(',').map(column => column.trim().toLowerCase());
      if (columns.length !== params.length) throw new Error('Insert values do not match the declared columns.');
      const row: any = { created_at: new Date().toISOString() };
      columns.forEach((column, i) => { row[column] = params[i] ?? null; });
      this.data[tableName] ||= [];
      if (row.id && this.data[tableName].some(existing => existing.id === row.id)) throw new Error('Duplicate record identifier');
      this.data[tableName].push(row); return 1;
    }
    const update = sql.match(/^UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (update) {
      const tableName = update[1].toLowerCase() as keyof DatabaseState;
      let offset = 0;
      const assignments = update[2].split(',').map(assignment => {
        const match = assignment.trim().match(/^(\w+)\s*=\s*([\s\S]+)$/);
        if (!match) throw new Error('Invalid update assignment');
        const [, field, value] = match;
        if (value === '?') { const bound = params[offset++]; return (row: any) => { row[field] = bound; }; }
        if (/CURRENT_TIMESTAMP/i.test(value)) return (row: any) => { row[field] = new Date().toISOString(); };
        if (/^['"].*['"]$/.test(value)) return (row: any) => { row[field] = value.slice(1, -1); };
        if (/^\d+(?:\.\d+)?$/.test(value)) return (row: any) => { row[field] = Number(value); };
        const increment = value.match(/^(\w+)\s*\+\s*(\d+)$/);
        if (increment) return (row: any) => { row[field] = Number(row[increment[1]] || 0) + Number(increment[2]); };
        throw new Error('Unsupported update assignment');
      });
      const matches = update[3] ? this.predicate(update[3], params.slice(offset)) : () => true;
      let changes = 0;
      for (const row of this.data[tableName] || []) if (matches(row)) { assignments.forEach(assign => assign(row)); row.updated_at = new Date().toISOString(); changes++; }
      return changes;
    }
    const deletion = sql.match(/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+([\s\S]+)$/i);
    if (deletion) {
      const tableName = deletion[1].toLowerCase() as keyof DatabaseState;
      const matches = this.predicate(deletion[2], params);
      const before = (this.data[tableName] || []).length;
      this.data[tableName] = (this.data[tableName] || []).filter(row => !matches(row));
      return before - this.data[tableName].length;
    }
    throw new Error('Unsupported database mutation');
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

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  auditCsvCell,
  auditTimestamp,
} from "../client/src/services/audit-export.ts";
test("audit CSV preserves quoted multiline text while neutralizing spreadsheet formulas", () => {
  assert.equal(
    auditCsvCell('Review "approved", then\ncontinued'),
    '"Review ""approved"", then\ncontinued"',
  );
  assert.equal(auditCsvCell("=2+2"), '"\'=2+2"');
  assert.equal(auditCsvCell("  +2+2"), '"\'  +2+2"');
  assert.equal(auditCsvCell("@SUM(A1:A2)"), '"\'@SUM(A1:A2)"');
  assert.equal(auditCsvCell(null), '""');
});
test("audit timestamps use India time and handle missing or invalid records", () => {
  const timestamp = auditTimestamp("2026-10-31T18:20:00Z");
  assert.match(timestamp, /31 Oct 2026/);
  assert.match(timestamp, /11:50:00/);
  assert.equal(auditTimestamp("invalid"), "Not recorded");
  assert.equal(auditTimestamp(undefined), "Not recorded");
});

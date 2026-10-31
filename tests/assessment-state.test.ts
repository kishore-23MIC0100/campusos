import test from "node:test";
import assert from "node:assert/strict";
import { assessmentState } from "../client/src/services/assessment-state.ts";
const now = new Date("2026-11-01T12:00:00Z").getTime();
test("graded zero scores and used attempts are completed; future retakes remain open", () => {
  assert.equal(assessmentState({ marksObtained: 0 }, now), "COMPLETED");
  assert.equal(
    assessmentState(
      { submission: { attemptCount: 1 }, attemptsAllowed: 1 },
      now,
    ),
    "COMPLETED",
  );
  assert.equal(
    assessmentState(
      {
        submission: { attemptCount: 1 },
        attemptsAllowed: 2,
        marksObtained: null,
      },
      now,
    ),
    "OPEN",
  );
});
test("deadlines close unsubmitted work without hiding completed results", () => {
  assert.equal(
    assessmentState({ dueAt: "2026-10-31T12:00:00Z" }, now),
    "CLOSED",
  );
  assert.equal(
    assessmentState({ dueAt: "2026-10-31T12:00:00Z", marksObtained: 7 }, now),
    "COMPLETED",
  );
  assert.equal(assessmentState({ dueAt: "2026-11-03T12:00:00Z" }, now), "OPEN");
});

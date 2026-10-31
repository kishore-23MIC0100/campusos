import test from "node:test";
import assert from "node:assert/strict";
import { nextSchoolSchedule } from "../client/src/services/school-schedule.ts";

const slots = [
  { id: "second", day_of_week: "Monday", period_index: 2 },
  { id: "first", day_of_week: "Monday", period_index: 1 },
  { id: "friday", day_of_week: "Friday", period_index: 1 },
];
test("a weekend schedule names the next teaching day and sorts its periods", () => {
  const result = nextSchoolSchedule(slots, new Date("2026-11-01T05:00:00Z"));
  assert.equal(result.dayLabel, "Monday");
  assert.equal(result.isToday, false);
  assert.deepEqual(
    result.slots.map((slot) => slot.id),
    ["first", "second"],
  );
  assert.equal(slots[0].id, "second");
});
test("schedule selection follows the school timezone across UTC midnight", () => {
  const result = nextSchoolSchedule(slots, new Date("2026-11-01T19:00:00Z"));
  assert.equal(result.dayLabel, "Monday");
  assert.equal(result.isToday, true);
  assert.deepEqual(nextSchoolSchedule([]).slots, []);
});

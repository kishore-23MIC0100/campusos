type Slot = { day_of_week: string; period_index: number; [key: string]: any };

/** Keep weekend dashboards useful without describing Monday's classes as today. */
export function nextSchoolSchedule(slots: Slot[], now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)!.value;
  const start = new Date(
    `${value("year")}-${value("month")}-${value("day")}T12:00:00Z`,
  );
  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    const dayLabel = day.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    const matching = slots
      .filter((slot) => slot.day_of_week === dayLabel)
      .sort((a, b) => Number(a.period_index) - Number(b.period_index));
    if (matching.length)
      return { slots: matching, dayLabel, isToday: offset === 0 };
  }
  return { slots: [] as Slot[], dayLabel: "", isToday: false };
}

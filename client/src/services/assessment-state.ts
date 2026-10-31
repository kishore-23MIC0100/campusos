export function assessmentState(
  item: {
    submission?: { attemptCount?: number } | null;
    attemptsAllowed?: number;
    marksObtained?: number | null;
    dueAt?: string | null;
  },
  now: number,
) {
  const attempts = Number(item.submission?.attemptCount || 0);
  const allowed = Math.max(1, Number(item.attemptsAllowed || 1));
  if (
    attempts >= allowed ||
    (item.marksObtained !== null && item.marksObtained !== undefined)
  )
    return "COMPLETED" as const;
  if (item.dueAt && new Date(item.dueAt).getTime() < now)
    return "CLOSED" as const;
  return "OPEN" as const;
}

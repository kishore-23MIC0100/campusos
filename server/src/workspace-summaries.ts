type Row = Record<string, any>;

export function homeworkSummary(
  homework: Row,
  students: Row[],
  submissions: Row[],
) {
  const roster = students.filter(
    (student) =>
      student.grade === homework.grade &&
      student.section === homework.section &&
      (!student.status || student.status === "ACTIVE"),
  );
  let submittedCount = 0,
    gradedCount = 0;
  for (const student of roster) {
    const identifiers = new Set(
      [student.id, student.student_id, student.user_id].filter(Boolean),
    );
    const latest = submissions
      .filter(
        (item) =>
          item.homework_id === homework.id && identifiers.has(item.student_id),
      )
      .sort((a, b) =>
        String(b.submission_date || b.created_at || "").localeCompare(
          String(a.submission_date || a.created_at || ""),
        ),
      )[0];
    if (!latest) continue;
    submittedCount++;
    if (
      latest.status === "GRADED" ||
      (latest.grade !== null &&
        latest.grade !== undefined &&
        latest.grade !== "") ||
      (latest.marks_obtained !== null &&
        latest.marks_obtained !== undefined &&
        latest.marks_obtained !== "")
    )
      gradedCount++;
  }
  return { assignedCount: roster.length, submittedCount, gradedCount };
}

export const payrollMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function payrollFilters(
  query: Record<string, any>,
  defaultPeriod = false,
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.SCHOOL_TIMEZONE || "Asia/Kolkata",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date());
  const rawMonth =
    query.month === undefined && defaultPeriod
      ? parts.find((part) => part.type === "month")!.value
      : String(query.month || "ALL");
  const month =
    rawMonth.toUpperCase() === "ALL"
      ? "ALL"
      : payrollMonths.find(
          (item) => item.toLowerCase() === rawMonth.toLowerCase(),
        );
  const rawYear =
    query.year === undefined && defaultPeriod
      ? parts.find((part) => part.type === "year")!.value
      : query.year;
  const year = rawYear === undefined ? undefined : Number(rawYear);
  if (
    !month ||
    (year !== undefined &&
      (!Number.isInteger(year) || year < 1900 || year > 2200))
  )
    throw new Error("Choose a valid payroll month and year.");
  return {
    month,
    year,
    department: String(query.department || "ALL"),
    status: String(query.status || "ALL"),
    search: String(query.search || "")
      .trim()
      .toLowerCase(),
  };
}
export function filterPayroll(
  records: Row[],
  filters: ReturnType<typeof payrollFilters>,
) {
  return records.filter(
    (record) =>
      (filters.month === "ALL" ||
        String(record.month).toLowerCase() === filters.month.toLowerCase()) &&
      (filters.year === undefined || Number(record.year) === filters.year) &&
      (filters.department === "ALL" ||
        String(record.department || "").toLowerCase() ===
          filters.department.toLowerCase()) &&
      (filters.status === "ALL" ||
        String(record.payment_status || "").toUpperCase() ===
          filters.status.toUpperCase()) &&
      (!filters.search ||
        [record.employee_name, record.employee_id, record.designation].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(filters.search),
        )),
  );
}

export function auditTimestamp(value: unknown): string {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}
export function auditCsvCell(value: unknown): string {
  let text = String(value ?? "");
  // Spreadsheet viewers may evaluate formula cells even when CSV-quoted.
  if (/^(?:\s*[=+@-]|[\t\r\n])/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function escapeIcsText(value: string): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

export function toIcsDate(value: string): string {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  return `${match[1]}${match[2]}${match[3]}`;
}

export function toIcsTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildInspectionIcs(params: {
  uid: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  alarmMinutesBefore?: number;
}): string {
  const start = toIcsDate(params.startDate);
  if (!start) return "";

  const end = toIcsDate(params.endDate || params.startDate) || start;
  const endPlusOne = new Date(Number(end.slice(0, 4)), Number(end.slice(4, 6)) - 1, Number(end.slice(6, 8)) + 1);
  const endDate = `${endPlusOne.getFullYear()}${String(endPlusOne.getMonth() + 1).padStart(2, "0")}${String(endPlusOne.getDate()).padStart(2, "0")}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Orey Acores//Gestor Naval//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(params.uid)}`,
    `DTSTAMP:${toIcsTimestamp()}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${escapeIcsText(params.title)}`,
  ];

  if (params.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(params.description)}`);
  }
  if (params.location) {
    lines.push(`LOCATION:${escapeIcsText(params.location)}`);
  }

  if (params.alarmMinutesBefore && params.alarmMinutesBefore > 0) {
    lines.push(
      "BEGIN:VALARM",
      `TRIGGER:-PT${params.alarmMinutesBefore}M`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(params.title)}`,
      "END:VALARM",
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcsFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

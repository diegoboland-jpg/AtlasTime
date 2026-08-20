export const WORK_START_OPTIONS = Array.from({ length: 48 }, (_, index) => index / 2);
export const WORK_END_OPTIONS = Array.from({ length: 48 }, (_, index) => (index + 1) / 2);

export function formatWorkHour(value: number) {
  if (value === 24) return "24:00";
  const hour = Math.floor(value);
  const minutes = Math.round((value - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function adjustWorkHours(start: number, end: number, field: "start" | "end", value: number) {
  if (field === "start") {
    const nextStart = Math.min(value, 23.5);
    return { workStart: nextStart, workEnd: nextStart >= end ? Math.min(24, nextStart + 0.5) : end };
  }
  const nextEnd = Math.max(0.5, value);
  return { workStart: nextEnd <= start ? Math.max(0, nextEnd - 0.5) : start, workEnd: nextEnd };
}

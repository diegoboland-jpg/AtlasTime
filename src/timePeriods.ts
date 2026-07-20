export type TimePeriodKey = "night" | "morning" | "lunch" | "afternoon" | "dinner" | "evening";

export type TimePeriod = {
  key: TimePeriodKey;
  label: string;
};

export function timePeriodForHour(hour: number): TimePeriod {
  const normalized = ((Math.trunc(hour) % 24) + 24) % 24;
  if (normalized < 6) return { key: "night", label: "Night" };
  if (normalized < 12) return { key: "morning", label: "Morning" };
  if (normalized < 15) return { key: "lunch", label: "Lunch time" };
  if (normalized < 19) return { key: "afternoon", label: "Afternoon" };
  if (normalized < 22) return { key: "dinner", label: "Dinner time" };
  return { key: "evening", label: "Evening" };
}

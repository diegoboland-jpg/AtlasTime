export type Person = {
  id: string;
  name: string;
  city: string;
  country?: string;
  countryCode?: string;
  timeZone: string;
  workStart: number;
  workEnd: number;
};

export type HourScore = {
  utcHour: number;
  available: number;
  total: number;
  penalty: number;
  score: number;
};

export type PlannerState = {
  date: string;
  hour: number;
  title: string;
  durationMinutes: number;
  eventMode: "timed" | "all-day";
  location: string;
  notes: string;
};

export type SavedGroup = {
  id: string;
  name: string;
  people: Person[];
  planner: PlannerState;
  updatedAt: string;
};

export type SharedGroupPayload = {
  version: 1;
  name: string;
  people: Person[];
  planner: PlannerState;
};

export type Person = {
  id: string;
  contactId?: string;
  name: string;
  email?: string;
  phone?: string;
  availabilityRequestStatus?: "not-requested" | "requested" | "shared" | "declined" | "expired" | "blocked";
  availabilityRequestedAt?: string;
  city: string;
  country?: string;
  countryCode?: string;
  timeZone: string;
  workStart: number;
  workEnd: number;
};

export type ContactRecord = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  availabilityRequestStatus?: Person["availabilityRequestStatus"];
  availabilityRequestedAt?: string;
  city: string;
  country?: string;
  countryCode?: string;
  timeZone: string;
  workStart: number;
  workEnd: number;
  updatedAt: string;
};

export type HourScore = {
  utcHour: number;
  available: number;
  total: number;
  penalty: number;
  score: number;
  calendarConflicts?: number;
};

export type BusyPeriod = { start: string; end: string };

export type PersonAvailability = {
  status: "pending" | "expired" | "revoked" | "shared" | "declined";
  provider: "google" | "outlook" | "combined" | null;
  providers?: Array<"google" | "outlook">;
  timeMin: string;
  timeMax: string;
  busy: BusyPeriod[];
};

export type AvailabilityByPerson = Record<string, PersonAvailability | undefined>;

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

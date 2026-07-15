export type Person = {
  id: string;
  name: string;
  city: string;
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

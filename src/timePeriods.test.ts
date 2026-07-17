import { describe, expect, it } from "vitest";
import { timePeriodForHour } from "./timePeriods";

describe("time-of-day periods", () => {
  it.each([
    [0, "night", "Night"],
    [5, "night", "Night"],
    [6, "morning", "Morning"],
    [10, "morning", "Morning"],
    [11, "lunch", "Lunch time"],
    [13, "lunch", "Lunch time"],
    [14, "afternoon", "Afternoon"],
    [17, "afternoon", "Afternoon"],
    [18, "dinner", "Dinner time"],
    [20, "dinner", "Dinner time"],
    [21, "evening", "Evening"],
    [23, "evening", "Evening"],
  ])("classifies %i:00 as %s", (hour, key, label) => {
    expect(timePeriodForHour(hour)).toEqual({ key, label });
  });

  it("normalizes hours outside the 24-hour range", () => {
    expect(timePeriodForHour(25).key).toBe("night");
    expect(timePeriodForHour(-1).key).toBe("evening");
  });
});

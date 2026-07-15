import { RotateCcw } from "lucide-react";
import type { HourScore } from "../types";

type TimeSliderProps = {
  selectedHour: number;
  selectedScore: HourScore | undefined;
  onHourChange: (hour: number) => void;
  onNow: () => void;
};

export function TimeSlider({ selectedHour, selectedScore, onHourChange, onNow }: TimeSliderProps) {
  const hourLabel = `${String(selectedHour).padStart(2, "0")}:00 UTC`;
  const available = selectedScore?.available ?? 0;
  const total = selectedScore?.total ?? 0;

  return (
    <section className="time-slider-section" aria-labelledby="time-slider-heading">
      <h2 className="sr-only" id="time-slider-heading">Explore meeting hours</h2>
      <div className="slider-panel">
        <div>
          <span>Selected meeting hour</span>
          <strong>{hourLabel}</strong>
        </div>
        <input
          className="time-slider"
          type="range"
          min="0"
          max="23"
          step="1"
          value={selectedHour}
          onChange={(event) => onHourChange(Number(event.target.value))}
          aria-label="Selected UTC meeting hour"
          aria-valuetext={`${hourLabel}, ${available} of ${total} available`}
        />
        <div className="slider-actions">
          <p>{available}/{total} available - score {selectedScore?.score ?? 0}</p>
          <button type="button" onClick={onNow} title="Return to the current UTC date and hour">
            <RotateCcw size={14} /> Now
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Selected meeting time {hourLabel}. {available} of {total} entries are within working hours.
      </p>
    </section>
  );
}

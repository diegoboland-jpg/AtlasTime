import { useEffect, useState } from "react";

type Props = {
  value: string;
  describedBy?: string;
  onCommit: (value: string) => void;
};

function parseTime(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2})(?::?)(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatMinutes(totalMinutes: number) {
  const wrapped = (totalMinutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

export function ExactTimeInput({ value, describedBy, onCommit }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  function commit() {
    const parsed = parseTime(draft);
    if (parsed === null) {
      setDraft(value);
      return;
    }

    const normalized = formatMinutes(parsed);
    setDraft(normalized);
    onCommit(normalized);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      pattern="[0-2]?[0-9]:?[0-5][0-9]"
      placeholder="HH:MM"
      value={draft}
      aria-describedby={describedBy}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
          return;
        }
        if (event.key === "Escape") {
          setDraft(value);
          event.currentTarget.blur();
          return;
        }
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

        event.preventDefault();
        const current = parseTime(draft) ?? parseTime(value) ?? 0;
        const next = formatMinutes(current + (event.key === "ArrowUp" ? 15 : -15));
        setDraft(next);
        onCommit(next);
      }}
    />
  );
}

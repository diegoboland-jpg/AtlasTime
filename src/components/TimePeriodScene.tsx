import type { TimePeriodKey } from "../timePeriods";

type TimePeriodSceneProps = {
  period: TimePeriodKey;
  compact?: boolean;
};

function Stars() {
  return (
    <g className="scene-stars">
      <circle cx="20" cy="17" r="1.6" />
      <circle cx="43" cy="10" r="1.2" />
      <circle cx="72" cy="18" r="1.5" />
      <circle cx="99" cy="9" r="1.1" />
      <path d="M89 26h6M92 23v6" />
    </g>
  );
}

function Horizon() {
  return (
    <g className="scene-landscape">
      <path className="scene-horizon-far" d="M3 61c16-13 33-16 51-5 18 11 38 10 63-5v21H3z" />
      <path className="scene-horizon" d="M3 65c22-10 39-7 57 0 18 7 34 7 57-2v9H3z" />
    </g>
  );
}

function UtensilPair() {
  return (
    <g className="scene-utensils">
      <path d="M30 43v22M25 43v9c0 4 10 4 10 0v-9M57 43v22M57 43c8 3 9 12 0 15" />
    </g>
  );
}

export function TimePeriodScene({ period, compact = false }: TimePeriodSceneProps) {
  return (
    <svg
      className={`time-period-scene scene-${period} ${compact ? "compact" : ""}`}
      viewBox="0 0 120 72"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {period === "night" && (
        <>
          <Stars />
          <path className="scene-moon" d="M76 13a17 17 0 1 0 15 27A14 14 0 0 1 76 13z" />
          <Horizon />
        </>
      )}

      {period === "morning" && (
        <>
          <g className="scene-sun scene-sunrise">
            <circle cx="82" cy="45" r="11" />
            <path d="M82 26v7M62 45h8M94 31l-5 6M70 31l5 6M94 45h8" />
          </g>
          <g className="scene-coffee">
            <path className="scene-vessel" d="M18 51h22v12H18zM40 54h4a5 5 0 0 1 0 8h-4" />
            <path className="scene-saucer" d="M14 65h32" />
            <path className="scene-steam steam-one" d="M23 47c-4-5 4-6 0-11" />
            <path className="scene-steam steam-two" d="M32 47c-4-5 4-6 0-11" />
          </g>
          <Horizon />
        </>
      )}

      {period === "lunch" && (
        <>
          <g className="scene-sun scene-high-sun">
            <circle cx="91" cy="19" r="9" />
            <path d="M91 4v6M91 28v6M76 19h6M100 19h6M80 8l5 5M97 25l5 5M102 8l-5 5M85 25l-5 5" />
          </g>
          <circle className="scene-plate" cx="44" cy="55" r="12" />
          <circle className="scene-plate-inner" cx="44" cy="55" r="6" />
          <UtensilPair />
        </>
      )}

      {period === "afternoon" && (
        <>
          <g className="scene-sun scene-afternoon-sun">
            <circle cx="91" cy="23" r="11" />
            <path d="M91 6v7M91 33v7M74 23h7M101 23h7" />
          </g>
          <g className="scene-cloud">
            <path className="scene-cloud-back" d="M43 39h35c0-7-7-10-13-7-5-8-17-5-17 3-4-1-7 1-5 4z" />
            <path className="scene-cloud-front" d="M18 51h43c1-9-8-13-15-9-5-12-22-8-22 4-5-1-9 1-6 5z" />
          </g>
          <Horizon />
        </>
      )}

      {period === "dinner" && (
        <>
          <g className="scene-sun scene-sunset">
            <circle cx="87" cy="49" r="12" />
            <path d="M87 29v8M67 49h8M99 35l-6 6M75 35l6 6M99 49h8" />
          </g>
          <circle className="scene-plate" cx="44" cy="54" r="12" />
          <circle className="scene-plate-inner" cx="44" cy="54" r="6" />
          <UtensilPair />
          <Horizon />
        </>
      )}

      {period === "evening" && (
        <>
          <Stars />
          <path className="scene-moon scene-moonrise" d="M82 29a14 14 0 1 0 13 22A12 12 0 0 1 82 29z" />
          <path className="scene-evening-glow" d="M50 57c18-13 39-13 58 0" />
          <Horizon />
        </>
      )}
    </svg>
  );
}

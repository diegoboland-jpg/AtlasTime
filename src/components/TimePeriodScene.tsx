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

function LunchSetting() {
  return (
    <g className="scene-lunch-setting" data-meal-design="bowl-and-spoon">
      <path className="scene-bowl" d="M24 50h32c-1 10-7 15-16 15S26 60 24 50z" />
      <path className="scene-bowl-rim" d="M21 50h38" />
      <path className="scene-spoon" d="M67 44c0 4-5 5-6 1-1-3 1-6 4-6 2 0 3 2 2 5zm-4 4-7 18" />
      <path className="scene-steam steam-one" d="M33 46c-4-5 4-6 0-11" />
      <path className="scene-steam steam-two" d="M44 46c-4-5 4-6 0-11" />
    </g>
  );
}

function DinnerSetting() {
  return (
    <g className="scene-dinner-setting" data-meal-design="plate-fork-knife">
      <circle className="scene-plate" cx="44" cy="54" r="12" />
      <circle className="scene-plate-inner" cx="44" cy="54" r="6" />
      <g className="scene-fork">
        <path d="M23 40v11M28 40v11M33 40v11M28 51v16M23 48c0 5 10 5 10 0" />
      </g>
      <path className="scene-knife" d="M61 39c7 5 8 13 2 20v8h-5V39z" />
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
          <LunchSetting />
        </>
      )}

      {period === "afternoon" && (
        <>
          <path className="scene-sun-track" d="M48 51c14-27 36-39 62-29" />
          <g className="scene-sun scene-afternoon-orbit" data-ray-set="complete-eight">
            <circle cx="88" cy="25" r="10" />
            <path d="M88 8v7M88 35v7M71 25h7M98 25h7M76 13l5 5M100 13l-5 5" />
            <path className="scene-afternoon-short-rays" d="M80 32l-4 4M96 32l4 4" />
          </g>
          <path className="scene-afternoon-rays" d="M82 38 66 63h39L94 38z" />
          <Horizon />
        </>
      )}

      {period === "dinner" && (
        <>
          <g className="scene-sun scene-sunset">
            <circle cx="87" cy="49" r="12" />
            <path d="M87 29v8M67 49h8M99 35l-6 6M75 35l6 6M99 49h8" />
          </g>
          <DinnerSetting />
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

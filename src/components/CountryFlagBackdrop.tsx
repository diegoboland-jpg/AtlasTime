import type { CSSProperties } from "react";

type Props = {
  countryCode?: string;
};

const stripeColors: Record<string, string[]> = {
  AR: ["#74acdf", "#fff", "#74acdf"], AU: ["#012169", "#012169", "#012169"],
  BR: ["#009b3a", "#ffdf00", "#009b3a"], CA: ["#d80621", "#fff", "#d80621"],
  CL: ["#fff", "#fff", "#d52b1e"], CN: ["#de2910", "#de2910", "#de2910"],
  CO: ["#fcd116", "#003893", "#ce1126"], FR: ["#0055a4", "#fff", "#ef4135"],
  DE: ["#000", "#dd0000", "#ffce00"], IN: ["#ff9933", "#fff", "#138808"],
  IT: ["#009246", "#fff", "#ce2b37"], JP: ["#fff", "#fff", "#fff"],
  MX: ["#006847", "#fff", "#ce1126"], NZ: ["#012169", "#012169", "#012169"],
  PE: ["#d91023", "#fff", "#d91023"], PH: ["#0038a8", "#fff", "#ce1126"],
  PT: ["#046a38", "#da291c", "#da291c"], RU: ["#fff", "#0039a6", "#d52b1e"],
  SG: ["#ef3340", "#ef3340", "#fff"], ES: ["#aa151b", "#f1bf00", "#aa151b"],
  TH: ["#a51931", "#f4f5f8", "#2d2a4a"], AE: ["#00732f", "#fff", "#000"],
  GB: ["#012169", "#fff", "#c8102e"], US: ["#b22234", "#fff", "#b22234"],
};

function flagSvg(countryCode: string) {
  const colors = stripeColors[countryCode];
  if (!colors) return null;
  const vertical = ["CA", "FR", "IT", "MX", "PE", "PT"].includes(countryCode);
  const stripes = vertical
    ? colors.map((color, index) => `<path fill="${color}" d="M${index * 40} 0h40v80H${index * 40}z"/>`).join("")
    : colors.map((color, index) => `<path fill="${color}" d="M0 ${index * 26.67}h120v26.67H0z"/>`).join("");
  const emblem = countryCode === "BR"
    ? '<path fill="#ffdf00" d="M60 11 108 40 60 69 12 40z"/><circle cx="60" cy="40" r="17" fill="#002776"/>'
    : countryCode === "JP"
      ? '<circle cx="60" cy="40" r="19" fill="#bc002d"/>'
      : countryCode === "IN"
        ? '<circle cx="60" cy="40" r="8" fill="none" stroke="#000080" stroke-width="2"/>'
        : countryCode === "US"
          ? '<path fill="#3c3b6e" d="M0 0h52v43H0z"/>'
          : countryCode === "CL"
            ? '<path fill="#0039a6" d="M0 0h40v40H0z"/>'
            : countryCode === "PH"
              ? '<path fill="#fff" d="M0 0 48 40 0 80z"/><circle cx="14" cy="40" r="6" fill="#fcd116"/>'
              : countryCode === "CN"
                ? '<circle cx="22" cy="20" r="8" fill="#ffde00"/>'
                : "";
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">${stripes}${emblem}</svg>`)}`;
}

export function CountryFlagBackdrop({ countryCode }: Props) {
  const normalized = countryCode?.trim().toUpperCase() ?? "";
  const source = flagSvg(normalized);
  if (!source) return null;
  return (
    <span
      className="country-flag-backdrop"
      aria-hidden="true"
      data-country-code={normalized}
      style={{ "--country-flag": `url("${source}")` } as CSSProperties}
    />
  );
}

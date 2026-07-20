export type CityOption = {
  id?: string;
  label: string;
  city: string;
  country: string;
  countryCode?: string;
  timeZone: string;
  latitude?: number;
  longitude?: number;
  source?: "network" | "cache" | "offline";
};

const countryCodes: Record<string, string> = {
  Argentina: "AR", Australia: "AU", Brazil: "BR", Canada: "CA", Chile: "CL", China: "CN",
  Colombia: "CO", France: "FR", Germany: "DE", India: "IN", Italy: "IT", Japan: "JP",
  Mexico: "MX", "New Zealand": "NZ", Peru: "PE", Philippines: "PH", Portugal: "PT",
  Russia: "RU", Singapore: "SG", Spain: "ES", Thailand: "TH", "United Arab Emirates": "AE",
  "United Kingdom": "GB", "United States": "US",
};

const baseCityOptions: Array<Omit<CityOption, "countryCode">> = [
  { label: "Curitiba, Brazil", city: "Curitiba", country: "Brazil", timeZone: "America/Sao_Paulo" },
  { label: "São Paulo, Brazil", city: "São Paulo", country: "Brazil", timeZone: "America/Sao_Paulo" },
  { label: "Rio de Janeiro, Brazil", city: "Rio de Janeiro", country: "Brazil", timeZone: "America/Sao_Paulo" },
  { label: "Brasília, Brazil", city: "Brasília", country: "Brazil", timeZone: "America/Sao_Paulo" },
  { label: "Buenos Aires, Argentina", city: "Buenos Aires", country: "Argentina", timeZone: "America/Argentina/Buenos_Aires" },
  { label: "Barcelona, Spain", city: "Barcelona", country: "Spain", timeZone: "Europe/Madrid" },
  { label: "Madrid, Spain", city: "Madrid", country: "Spain", timeZone: "Europe/Madrid" },
  { label: "Granada, Spain", city: "Granada", country: "Spain", timeZone: "Europe/Madrid" },
  { label: "Porto, Portugal", city: "Porto", country: "Portugal", timeZone: "Europe/Lisbon" },
  { label: "Lisbon, Portugal", city: "Lisbon", country: "Portugal", timeZone: "Europe/Lisbon" },
  { label: "London, United Kingdom", city: "London", country: "United Kingdom", timeZone: "Europe/London" },
  { label: "Paris, France", city: "Paris", country: "France", timeZone: "Europe/Paris" },
  { label: "Berlin, Germany", city: "Berlin", country: "Germany", timeZone: "Europe/Berlin" },
  { label: "Rome, Italy", city: "Rome", country: "Italy", timeZone: "Europe/Rome" },
  { label: "Moscow, Russia", city: "Moscow", country: "Russia", timeZone: "Europe/Moscow" },
  { label: "New York, United States", city: "New York", country: "United States", timeZone: "America/New_York" },
  { label: "Chicago, United States", city: "Chicago", country: "United States", timeZone: "America/Chicago" },
  { label: "Denver, United States", city: "Denver", country: "United States", timeZone: "America/Denver" },
  { label: "Los Angeles, United States", city: "Los Angeles", country: "United States", timeZone: "America/Los_Angeles" },
  { label: "Toronto, Canada", city: "Toronto", country: "Canada", timeZone: "America/Toronto" },
  { label: "Vancouver, Canada", city: "Vancouver", country: "Canada", timeZone: "America/Vancouver" },
  { label: "Mexico City, Mexico", city: "Mexico City", country: "Mexico", timeZone: "America/Mexico_City" },
  { label: "Bogotá, Colombia", city: "Bogotá", country: "Colombia", timeZone: "America/Bogota" },
  { label: "Lima, Peru", city: "Lima", country: "Peru", timeZone: "America/Lima" },
  { label: "Santiago, Chile", city: "Santiago", country: "Chile", timeZone: "America/Santiago" },
  { label: "Dubai, United Arab Emirates", city: "Dubai", country: "United Arab Emirates", timeZone: "Asia/Dubai" },
  { label: "Delhi, India", city: "Delhi", country: "India", timeZone: "Asia/Kolkata" },
  { label: "Mumbai, India", city: "Mumbai", country: "India", timeZone: "Asia/Kolkata" },
  { label: "Kochi, India", city: "Kochi", country: "India", timeZone: "Asia/Kolkata" },
  { label: "Singapore, Singapore", city: "Singapore", country: "Singapore", timeZone: "Asia/Singapore" },
  { label: "Tokyo, Japan", city: "Tokyo", country: "Japan", timeZone: "Asia/Tokyo" },
  { label: "Manila, Philippines", city: "Manila", country: "Philippines", timeZone: "Asia/Manila" },
  { label: "Bangkok, Thailand", city: "Bangkok", country: "Thailand", timeZone: "Asia/Bangkok" },
  { label: "Hong Kong, China", city: "Hong Kong", country: "China", timeZone: "Asia/Hong_Kong" },
  { label: "Sydney, Australia", city: "Sydney", country: "Australia", timeZone: "Australia/Sydney" },
  { label: "Melbourne, Australia", city: "Melbourne", country: "Australia", timeZone: "Australia/Melbourne" },
  { label: "Auckland, New Zealand", city: "Auckland", country: "New Zealand", timeZone: "Pacific/Auckland" }
];

export const cityOptions: CityOption[] = baseCityOptions.map((option) => ({
  ...option,
  countryCode: countryCodes[option.country],
}));

export function getCityByLabel(label: string): CityOption | undefined {
  return cityOptions.find((option) => option.label === label);
}

export function getCityByPlace(city: string, timeZone: string): CityOption | undefined {
  const normalizedCity = city.trim().toLocaleLowerCase();
  return cityOptions.find((option) => option.timeZone === timeZone
    && option.city.toLocaleLowerCase() === normalizedCity);
}

export function getCountryByTimeZone(timeZone: string): Pick<CityOption, "country" | "countryCode"> | undefined {
  const match = cityOptions.find((option) => option.timeZone === timeZone);
  return match ? { country: match.country, countryCode: match.countryCode } : undefined;
}

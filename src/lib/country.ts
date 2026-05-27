/**
 * Convert a country name (as stored in MusicMeta.country) to its flag emoji.
 * Best-effort: covers common spellings. Unknown names return "" — no flag.
 */

const NAME_TO_CODE: Record<string, string> = {
  // Asia
  "south korea":             "KR",
  "korea, south":            "KR",
  "korea":                   "KR",
  "republic of korea":       "KR",
  "north korea":             "KP",
  "korea, north":            "KP",
  "japan":                   "JP",
  "china":                   "CN",
  "people's republic of china": "CN",
  "taiwan":                  "TW",
  "republic of china":       "TW",
  "hong kong":               "HK",
  "macau":                   "MO",
  "thailand":                "TH",
  "vietnam":                 "VN",
  "philippines":             "PH",
  "indonesia":               "ID",
  "malaysia":                "MY",
  "singapore":               "SG",
  "india":                   "IN",
  "pakistan":                "PK",
  "bangladesh":              "BD",
  // Americas
  "united states":           "US",
  "united states of america":"US",
  "usa":                     "US",
  "us":                      "US",
  "canada":                  "CA",
  "mexico":                  "MX",
  "brazil":                  "BR",
  "argentina":               "AR",
  "chile":                   "CL",
  "colombia":                "CO",
  "peru":                    "PE",
  // Europe
  "united kingdom":          "GB",
  "uk":                      "GB",
  "great britain":           "GB",
  "england":                 "GB",
  "scotland":                "GB",
  "germany":                 "DE",
  "france":                  "FR",
  "italy":                   "IT",
  "spain":                   "ES",
  "portugal":                "PT",
  "netherlands":             "NL",
  "belgium":                 "BE",
  "switzerland":             "CH",
  "austria":                 "AT",
  "ireland":                 "IE",
  "sweden":                  "SE",
  "norway":                  "NO",
  "denmark":                 "DK",
  "finland":                 "FI",
  "iceland":                 "IS",
  "poland":                  "PL",
  "czech republic":          "CZ",
  "czechia":                 "CZ",
  "russia":                  "RU",
  "ukraine":                 "UA",
  "turkey":                  "TR",
  "greece":                  "GR",
  // Oceania
  "australia":               "AU",
  "new zealand":             "NZ",
  // Middle East / Africa
  "israel":                  "IL",
  "saudi arabia":            "SA",
  "united arab emirates":    "AE",
  "uae":                     "AE",
  "egypt":                   "EG",
  "south africa":            "ZA",
  "nigeria":                 "NG",
  "morocco":                 "MA",
};

export function flagFromCode(code: string | undefined | null): string {
  if (!code) return "";
  const c = code.trim().toUpperCase();
  if (c.length !== 2) return "";
  const base = 0x1f1e6 - 0x41;
  return [...c]
    .map((ch) => String.fromCodePoint(ch.charCodeAt(0) + base))
    .join("");
}

export function flagFromCountryName(name: string | undefined | null): string {
  if (!name) return "";
  const code = NAME_TO_CODE[name.toLowerCase().trim()];
  return code ? flagFromCode(code) : "";
}

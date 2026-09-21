// app/_utils/whatsapp.ts
import { Country } from 'country-state-city';

export interface CountryDialInfo {
  name: string;
  iso: string;
  dial: string;   // no leading +
  minLen: number;
  maxLen: number;
}

// Known national-number digit lengths for common countries — used for
// stricter length validation. Anything not listed falls back to a generic
// 6-14 digit range so we don't wrongly reject valid numbers we don't know.
const KNOWN_LENGTHS: Record<string, { minLen: number; maxLen: number }> = {
  PK: { minLen: 10, maxLen: 10 },
  IN: { minLen: 10, maxLen: 10 },
  US: { minLen: 10, maxLen: 10 },
  CA: { minLen: 10, maxLen: 10 },
  GB: { minLen: 10, maxLen: 10 },
  AE: { minLen: 9, maxLen: 9 },
  SA: { minLen: 9, maxLen: 9 },
  QA: { minLen: 8, maxLen: 8 },
  KW: { minLen: 8, maxLen: 8 },
  OM: { minLen: 8, maxLen: 8 },
  BH: { minLen: 8, maxLen: 8 },
  BD: { minLen: 10, maxLen: 10 },
  CN: { minLen: 11, maxLen: 11 },
  DE: { minLen: 10, maxLen: 11 },
  AU: { minLen: 9, maxLen: 9 },
  FR: { minLen: 9, maxLen: 9 },
};
const DEFAULT_LEN = { minLen: 6, maxLen: 14 };

// Built once from country-state-city — same library the Demographic page
// already uses for its country-code picker, so codes stay consistent
// across the app instead of maintaining a second hardcoded list.
export const COUNTRY_DIAL_CODES: CountryDialInfo[] = Country.getAllCountries()
  .filter(c => c.phonecode)
  .map(c => {
    const dial = c.phonecode.replace('+', '').trim();
    const len = KNOWN_LENGTHS[c.isoCode] || DEFAULT_LEN;
    return { name: c.name, iso: c.isoCode, dial, ...len };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const PAKISTAN_DEFAULT: CountryDialInfo =
  COUNTRY_DIAL_CODES.find(c => c.iso === 'PK') || COUNTRY_DIAL_CODES[0];

export const stripLeadingZero = (num: string) => num.replace(/^0+/, '');

export const validatePhoneForCountry = (
  nationalNumber: string,
  country: CountryDialInfo
): { valid: boolean; message?: string } => {
  const digits = stripLeadingZero(nationalNumber.replace(/\D/g, ''));
  if (!digits) return { valid: false, message: 'Enter a phone number' };
  if (digits.length < country.minLen || digits.length > country.maxLen) {
    const range = country.minLen === country.maxLen
      ? `${country.minLen}`
      : `${country.minLen}-${country.maxLen}`;
    return {
      valid: false,
      message: `${country.name} numbers should be ${range} digits (no leading 0 or country code)`,
    };
  }
  return { valid: true };
};

// Find a country by its dial code, e.g. patient.countryCode = "+92" or "92".
const findCountryByDialCode = (dialCode?: string | null): CountryDialInfo | null => {
  if (!dialCode) return null;
  const clean = dialCode.replace(/\D/g, '');
  if (!clean) return null;
  const exact = COUNTRY_DIAL_CODES.find(c => c.dial === clean);
  if (exact) return exact;
  const sorted = [...COUNTRY_DIAL_CODES].sort((a, b) => b.dial.length - a.dial.length);
  return sorted.find(c => clean.startsWith(c.dial)) || null;
};

// Resolve country + local number from the patient's stored countryCode
// (e.g. "+92") and phoneNumber (e.g. "3001234567" or "03001234567").
// Falls back to guessing a dial-code prefix on the raw phone digits, then
// finally defaults to Pakistan if nothing matches.
export const resolveCountryAndLocal = (
  storedCountryCode?: string | null,
  storedPhone?: string | null
): { country: CountryDialInfo; local: string } => {
  const byCode = findCountryByDialCode(storedCountryCode);
  const rawDigits = (storedPhone || '').replace(/\D/g, '');

  if (byCode) {
    return { country: byCode, local: stripLeadingZero(rawDigits) };
  }

  if (rawDigits) {
    const sorted = [...COUNTRY_DIAL_CODES].filter(c => c.dial).sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      // require enough leftover digits so we don't match a dial-code
      // prefix against what's actually just the start of a local number
      if (rawDigits.startsWith(c.dial) && rawDigits.length - c.dial.length >= 6) {
        return { country: c, local: stripLeadingZero(rawDigits.slice(c.dial.length)) };
      }
    }
  }

  return { country: PAKISTAN_DEFAULT, local: stripLeadingZero(rawDigits) };
};

export const buildWhatsAppLink = (country: CountryDialInfo, localNumber: string, message: string) => {
  const digits = stripLeadingZero(localNumber.replace(/\D/g, ''));
  const fullNumber = `${country.dial}${digits}`;
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
};
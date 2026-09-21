// app/_utils/unitConversions.ts

interface FormattedValue {
  value: string;
  unit: string;
}

/**
 * The raw `Temperature` value in the DB is always stored in Celsius,
 * regardless of what `temperatureUnit` says. This function uses `temperatureUnit`
 * to decide what to DISPLAY it as — converting C → F only if the unit says Fahrenheit.
 */
export function formatTemperature(
  value?: string | number | null,
  unit?: string | null
): FormattedValue | null {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;

  const wantsFahrenheit = (unit ?? '').toLowerCase().includes('f');

  if (wantsFahrenheit) {
    const fahrenheit = (num * 9) / 5 + 32;
    return {
      value: Number.isInteger(fahrenheit) ? fahrenheit.toFixed(0) : fahrenheit.toFixed(1),
      unit: '°F',
    };
  }

  return {
    value: Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1),
    unit: '°C',
  };
}

/**
 * The raw `Height` value in the DB is always stored in centimeters,
 * regardless of what `heightUnit` says. This function uses `heightUnit`
 * to decide what to DISPLAY it as — converting cm → ft only if the unit says feet.
 */
export function formatHeight(
  value?: string | number | null,
  unit?: string | null
): FormattedValue | null {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;

  const lower = (unit ?? '').toLowerCase();
  const wantsFeet = lower.includes('ft') || lower.includes('feet');

  if (wantsFeet) {
    const feet = num / 30.48;
    return { value: feet.toFixed(1), unit: 'ft' };
  }

  return {
    value: Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1),
    unit: 'cm',
  };
}
// 1. Define exactly what a Parser looks like
interface HardwareParser {
  pattern: RegExp;
  keys?: string[]; // Optional: for simple flat data
  transform?: (match: RegExpMatchArray) => any; // Optional: for complex/nested data (BP)
}

export const HARDWARE_PARSERS: HardwareParser[] = [
  {
    pattern: /^O(\d{1,3}):(\d{1,3}):X$/,
    keys: ['Spo2', 'PulseRate']
  },
  {
    pattern: /^T([\d.]+)P$/,
    keys: ['Temperature']
  },
  {
    pattern: /^W([\d.]+)S$/,
    keys: ['Weight']
  },
  {
    pattern: /^B:(\d{2,3}):(\d{2,3})$/,
    transform: (match) => ({
      BP: { value1: match[1], value2: match[2] }
    })
  }
];
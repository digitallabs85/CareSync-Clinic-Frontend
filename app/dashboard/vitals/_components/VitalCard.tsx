import React, { useEffect, useState } from 'react';
import { VitalType } from '../../../_utils/types';
import { VITAL_CONFIGS } from '../../../_utils/data/constants';

const VITAL_RANGES: Partial<Record<VitalType, string>> = {
  [VitalType.BMI]: 'Normal BMI: 18.5 - 24.9',
  [VitalType.BLOOD_OXYGEN]: 'Min: 90%, Max: 100%',
  [VitalType.PULSE_RATE]: 'Min: 40, Max: 100 beats per minute',
  [VitalType.BLOOD_PRESSURE]: 'Systolic: 120-140, Diastolic: 80-90',
};

export const getVitalRange = (field: string): string | undefined => {
  const map: Record<string, VitalType> = {
    Systolic: VitalType.BLOOD_PRESSURE,
    Diastolic: VitalType.BLOOD_PRESSURE,
    BloodOxygen: VitalType.BLOOD_OXYGEN,
    PulseRate: VitalType.PULSE_RATE,
    bmi: VitalType.BMI,
  };
  const vitalType = map[field];
  if (!vitalType) return undefined;
  return VITAL_RANGES[vitalType];
};

export const CARD_SPACING = {
  cardPadding: 'p-2.5 md:p-3.5',
  cardRadius: 'rounded-2xl',
  headerGap: 'gap-1.5',
  headerMargin: 'mb-1',
  titleMargin: '',
  iconPadding: 'p-2',
  togglePadding: 'px-1.5 py-0.5',
  valueRowGap: 'gap-x-2',
  valueText: 'text-xl md:text-3xl',
  unitText: 'text-xs md:text-sm',
  rangeMargin: 'mt-1',
  rangeText: 'text-[11px] md:text-xs',
  timestampMargin: 'mt-0.5',
  timestampText: 'text-[9px] md:text-[10px]',
} as const;

const SIZE_PRESETS = {
  sm: { cardPadding: 'p-2 md:p-2.5', iconPadding: 'p-1.5', valueText: 'text-lg md:text-2xl' },
  md: {},
  lg: { cardPadding: 'p-4 md:p-6', iconPadding: 'p-3', valueText: 'text-3xl md:text-5xl' },
} as const;

export type ValueOrigin = 'auto' | 'manual';
type ValueKey = 'value' | 'value1' | 'value2';

interface VitalCardProps {
  type: VitalType;
  value?: string;
  value1?: string;
  value2?: string;
  onChange?: (value: string) => void;
  onChange1?: (value1: string) => void;
  onChange2?: (value2: string) => void;
  isEditable?: boolean;
  timestamp?: string | number | Date;
  isDualValue?: boolean;
  customContent?: React.ReactNode;
  toggleHeightUnit?: () => void;
  heightUnit?: string;
  toggleTempUnit?: () => void;
  tempUnit?: string;
  size?: keyof typeof SIZE_PRESETS;
  valueOrigin?: ValueOrigin;
  resetKey?: string | number;
  onUserInput?: () => void;
}

const VitalCard: React.FC<VitalCardProps> = ({
  type,
  value,
  value1,
  value2,
  onChange,
  onChange1,
  onChange2,
  customContent,
  isEditable = true,
  timestamp,
  toggleHeightUnit,
  heightUnit,
  toggleTempUnit,
  tempUnit,
  isDualValue = false,
  size = 'md',
  valueOrigin,
  resetKey,
  onUserInput,
}) => {
  const config = VITAL_CONFIGS[type];
  const S = { ...CARD_SPACING, ...SIZE_PRESETS[size] };

  /* ---------------------------------------------------------------- *
   *  ORIGIN TRACKING — dead simple:
   *  A field is "manual" (green) the moment the user types in it,
   *  and stays manual until the parent resets the card (resetKey).
   *  Anything that arrives purely via props (localStorage / API)
   *  is "auto" (black).
   * ---------------------------------------------------------------- */
  const [manualFields, setManualFields] = useState<Partial<Record<ValueKey, boolean>>>({});

  useEffect(() => {
    setManualFields({});
  }, [resetKey]);

  const isManual = (key: ValueKey): boolean => {
    if (valueOrigin === 'manual') return true;
    if (valueOrigin === 'auto') return false;
    return !!manualFields[key];
  };

  const valueColor = (key: ValueKey): string =>
    isManual(key) ? 'text-skeuo-green!' : 'text-skeuo-text!';

  const handleEdit = (key: ValueKey, next: string, cb?: (v: string) => void) => {
    setManualFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    onUserInput?.();          // <-- notify parent
    cb?.(next);
  };

  const rangeText =
    type === VitalType.TEMPERATURE
      ? tempUnit === '°F'
        ? 'Normal Temp: 98.6°F / 37.0°C'
        : 'Normal Temp: 37.0°C / 98.6°F'
      : VITAL_RANGES[type];

  return (
    <div
      className={`bg-white ${S.cardPadding} ${S.cardRadius} shadow-md shadow-black/5 border border-skeuo-surface flex flex-col items-start hover:border-skeuo-red/20 hover:shadow-lg hover:shadow-black/10 transition-all group w-full`}
    >
      {/* ---------- Header ---------- */}
      <div className={`flex justify-between items-center w-full ${S.headerMargin} ${S.headerGap}`}>
        <h3 className={`text-skeuo-red tracking-wider text-[11px] md:text-xs font-semibold uppercase ${S.titleMargin}`}>
          {type}
        </h3>

        <div className={`flex ${S.headerGap} items-center`}>
          {type === VitalType.HEIGHT && toggleHeightUnit && (
            <button
              onClick={toggleHeightUnit}
              className="flex items-center gap-0.5 bg-skeuo-surface rounded-lg p-0.5 text-[10px] md:text-xs font-bold shrink-0"
            >
              <span className={`${S.togglePadding} rounded-md transition-colors ${heightUnit === 'ft' ? 'bg-skeuo-red text-white' : 'text-skeuo-muted'}`}>ft</span>
              <span className={`${S.togglePadding} rounded-md transition-colors ${heightUnit === 'cm' ? 'bg-skeuo-red text-white' : 'text-skeuo-muted'}`}>cm</span>
            </button>
          )}

          {type === VitalType.TEMPERATURE && toggleTempUnit && (
            <button
              onClick={toggleTempUnit}
              className="flex items-center gap-0.5 bg-skeuo-surface rounded-lg p-0.5 text-[10px] md:text-xs font-bold shrink-0"
            >
              <span className={`${S.togglePadding} rounded-md transition-colors ${tempUnit === '°C' ? 'bg-skeuo-red text-white' : 'text-skeuo-muted'}`}>°C</span>
              <span className={`${S.togglePadding} rounded-md transition-colors ${tempUnit === '°F' ? 'bg-skeuo-red text-white' : 'text-skeuo-muted'}`}>°F</span>
            </button>
          )}

          <div className={`${S.iconPadding} rounded-lg bg-skeuo-surface group-hover:bg-skeuo-red/10 transition-colors`}>
            {config.icon('w-4 h-4 md:w-5 md:h-5 text-skeuo-red')}
          </div>
        </div>
      </div>

      {/* ---------- Value row ---------- */}
      <div className="flex items-baseline justify-between w-full [&>div>span:first-child]:text-xl! [&>div>span:first-child]:md:text-3xl! [&>div>span:first-child]:font-bold! [&>div>input]:text-xl! [&>div>input]:md:text-3xl! [&>div>input]:font-bold!">
        {customContent ? (
          customContent
        ) : isEditable ? (
          isDualValue ? (
            <div className="flex items-baseline">
              <input
                type="number"
                value={value1 ?? ''}
                placeholder="--"
                onChange={(e) => handleEdit('value1', e.target.value, onChange1)}
                className={`${S.valueText} font-bold ${valueColor('value1')} border-b-2 border-transparent focus:border-skeuo-red focus:outline-none rounded px-0.5 ${value1 && value1.length > 2 ? 'w-14 md:w-16' : 'w-10 md:w-12'} transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
              <span className={`${S.valueText} font-bold text-skeuo-muted/50`}>/</span>
              <input
                type="number"
                value={value2 ?? ''}
                placeholder="--"
                onChange={(e) => handleEdit('value2', e.target.value, onChange2)}
                className={`${S.valueText} text-end font-bold ${valueColor('value2')} border-b-2 border-transparent focus:border-skeuo-red focus:outline-none rounded px-0.5 ${value2 && value2.length > 2 ? 'w-14 md:w-16' : 'w-10 md:w-12'} transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
            </div>
          ) : (
            <input
              type="number"
              value={value ?? ''}
              placeholder="--"
              onChange={(e) => handleEdit('value', e.target.value, onChange)}
              className={`${S.valueText} font-bold ${valueColor('value')} border-b-2 border-transparent focus:border-skeuo-red focus:outline-none w-[55%] rounded px-0.5 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
          )
        ) : (
          <span className={`${S.valueText} font-bold ${valueColor('value')}`}>{value || '--'}</span>
        )}

        {!customContent && (
          <span className={`${S.unitText} text-skeuo-muted font-medium`}>
            {type === VitalType.TEMPERATURE && tempUnit ? tempUnit : config.unit}
          </span>
        )}
      </div>

      {/* ---------- Range hint ---------- */}
      {rangeText && (
        <p className={`${S.rangeMargin} ${S.rangeText} text-skeuo-muted font-medium leading-tight`}>{rangeText}</p>
      )}

      {/* ---------- Timestamp ---------- */}
      {timestamp && (
        <p className={`${S.timestampMargin} ${S.timestampText} text-skeuo-muted font-medium`}>
          {new Date(timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      )}
    </div>
  );
};

export default VitalCard;
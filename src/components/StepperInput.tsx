import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

interface StepperInputProps {
  value: number;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
  allowDecimal?: boolean;
  onChange: (next: number) => void;
  ariaLabel: string;
  accent?: 'blue' | 'emerald';
}

export function StepperInput({
  value,
  step,
  min = 0,
  max = 999,
  unit,
  allowDecimal = false,
  onChange,
  ariaLabel,
  accent = 'blue',
}: StepperInputProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused ? draft : String(value);

  const clampAndRound = (num: number): number => {
    const clamped = Math.min(max, Math.max(min, num));
    return Math.round(clamped * 100) / 100;
  };

  const handleStep = (direction: -1 | 1) => {
    const next = clampAndRound(value + direction * step);
    setDraft(String(next));
    onChange(next);
  };

  const handleInputChange = (raw: string) => {
    const normalized = raw.replace(',', '.');
    setDraft(normalized);
    if (normalized === '' || normalized === '.') return;
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      onChange(clampAndRound(parsed));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = Number(draft.replace(',', '.'));
    if (draft.trim() === '' || Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const clean = clampAndRound(parsed);
    setDraft(String(clean));
    onChange(clean);
  };

  const focusRing =
    accent === 'emerald'
      ? 'focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/40'
      : 'focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/40';

  return (
    <div
      className={`flex items-center rounded-xl bg-[#0e121b] border border-slate-700/70 overflow-hidden transition-colors ${focusRing}`}
    >
      <button
        type="button"
        onClick={() => handleStep(-1)}
        aria-label={`${ariaLabel}: уменьшить на ${step}`}
        className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 shrink-0 text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/80 active:scale-95 transition select-none touch-manipulation"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="flex items-baseline justify-center flex-1 min-w-[54px] px-1">
        <input
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          value={displayValue}
          aria-label={ariaLabel}
          onFocus={(e) => {
            setDraft(String(value));
            setIsFocused(true);
            e.target.select();
          }}
          onBlur={handleBlur}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full max-w-[60px] bg-transparent text-center text-base sm:text-sm font-semibold text-white outline-none tabular-nums"
        />
        {unit && (
          <span className="text-[11px] text-slate-400 font-medium ml-0.5 select-none">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => handleStep(1)}
        aria-label={`${ariaLabel}: увеличить на ${step}`}
        className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 shrink-0 text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/80 active:scale-95 transition select-none touch-manipulation"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

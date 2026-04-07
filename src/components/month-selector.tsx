"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { recentMonths, formatMonth, isCurrentMonth } from "@/lib/months";

interface MonthSelectorProps {
  value: string;
  onChange: (month: string) => void;
}

const months = recentMonths(12);

export default function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const currentIdx = months.indexOf(value);

  function goPrev() {
    const nextIdx = currentIdx + 1;
    if (nextIdx < months.length) onChange(months[nextIdx]);
  }

  function goNext() {
    const nextIdx = currentIdx - 1;
    if (nextIdx >= 0) onChange(months[nextIdx]);
  }

  const canGoNext = currentIdx > 0;
  const canGoPrev = currentIdx < months.length - 1;
  const isCurrent = isCurrentMonth(value);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goPrev}
        disabled={!canGoPrev}
        className="p-1.5 rounded-lg text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors disabled:opacity-0 disabled:pointer-events-none"
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="text-sm font-semibold text-brand-dark min-w-[130px] text-center">
        {formatMonth(value)}
        {isCurrent && (
          <span className="text-[10px] font-medium text-brand-accent ml-1.5">
            current
          </span>
        )}
      </span>

      <button
        onClick={goNext}
        disabled={!canGoNext}
        className="p-1.5 rounded-lg text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-colors disabled:opacity-0 disabled:pointer-events-none"
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

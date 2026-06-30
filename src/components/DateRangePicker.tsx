"use client";

import { useState, useCallback } from "react";

interface DateRangePickerProps {
  blockedDates: Set<string>;
  onSelect: (start: string, end: string) => void;
  selectedStart: string | null;
  selectedEnd: string | null;
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayString(): string {
  const d = new Date();
  return toDateString(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function rangeContainsBlocked(start: string, end: string, blocked: Set<string>): boolean {
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur <= last) {
    if (blocked.has(cur.toISOString().split("T")[0])) return true;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return false;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function DateRangePicker({
  blockedDates,
  onSelect,
  selectedStart,
  selectedEnd,
}: DateRangePickerProps) {
  const today = todayString();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [picking, setPicking] = useState<"start" | "end">("start");

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((v) => v - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((v) => v + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = useCallback((dateStr: string) => {
    if (dateStr < today || blockedDates.has(dateStr)) return;

    if (picking === "start" || !selectedStart) {
      onSelect(dateStr, dateStr);
      setPicking("end");
    } else {
      let start = selectedStart;
      let end = dateStr;
      if (end < start) [start, end] = [end, start];
      if (rangeContainsBlocked(start, end, blockedDates)) {
        onSelect(dateStr, dateStr);
        setPicking("end");
        return;
      }
      onSelect(start, end);
      setPicking("start");
    }
  }, [picking, selectedStart, blockedDates, onSelect, today]);

  const isInRange = (dateStr: string) => {
    if (!selectedStart || !selectedEnd || selectedStart === selectedEnd) return false;
    const s = selectedStart < selectedEnd ? selectedStart : selectedEnd;
    const e = selectedStart < selectedEnd ? selectedEnd : selectedStart;
    return dateStr > s && dateStr < e;
  };

  const isSelected = (dateStr: string) => {
    return dateStr === selectedStart || dateStr === selectedEnd;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  return (
    <div className="select-none w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-200 rounded-lg transition-all cursor-pointer text-sm font-bold text-slate-600"
        >
          ←
        </button>
        <span className="font-bold text-sm text-slate-700">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-200 rounded-lg transition-all cursor-pointer text-sm font-bold text-slate-600"
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 font-semibold text-slate-400">
        {DAY_NAMES.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toDateString(viewYear, viewMonth, day);
          const isPast = dateStr < today;
          const isBlocked = blockedDates.has(dateStr);
          const sel = isSelected(dateStr);
          const inRange = isInRange(dateStr);

          let cls = "";
          if (isPast) {
            cls = "p-2.5 w-full text-xs bg-slate-100 text-slate-300 rounded-xl cursor-not-allowed line-through";
          } else if (isBlocked) {
            cls = "p-2.5 w-full text-xs bg-slate-200 text-slate-400 rounded-xl cursor-not-allowed opacity-40";
          } else if (sel) {
            cls = "p-2.5 w-full text-xs bg-indigo-600 text-white font-bold rounded-xl ring-2 ring-indigo-600 cursor-pointer";
          } else if (inRange) {
            cls = "p-2.5 w-full text-xs bg-indigo-100 text-indigo-700 font-semibold rounded-xl cursor-pointer";
          } else {
            cls = "p-2.5 w-full text-xs bg-emerald-100 text-emerald-800 font-bold rounded-xl hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer";
          }

          return (
            <button
              key={day}
              disabled={isPast || isBlocked}
              onClick={() => handleDayClick(dateStr)}
              className={cls}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {picking === "end" && selectedStart && (
        <p className="mt-3 text-xs text-indigo-600 font-medium text-center">
          Now tap an end date to complete your range
        </p>
      )}
    </div>
  );
}

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

  const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const year2 = viewMonth === 11 ? viewYear + 1 : viewYear;

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

  const isSelected = (dateStr: string) =>
    dateStr === selectedStart || dateStr === selectedEnd;

  const renderMonth = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    return (
      <div>
        {/* Month label */}
        <p className="text-center text-sm font-bold text-slate-700 mb-3">
          {MONTH_NAMES[month]} {year}
        </p>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid — each cell is a bus-seat shape */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty leading cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="flex flex-col items-center gap-[3px]">
              <div className="h-1.5" />
              <div className="h-8 w-full" />
            </div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = toDateString(year, month, day);
            const isPast = dateStr < today;
            const isBlocked = blockedDates.has(dateStr);
            const isToday = dateStr === today;
            const sel = isSelected(dateStr);
            const inRange = isInRange(dateStr);

            // ── seat headrest color ──
            let headrest = "bg-slate-200";
            // ── seat body classes ──
            let seat = "bg-slate-100 text-slate-300 cursor-not-allowed";
            let strikethrough = false;

            if (isPast) {
              headrest = "bg-slate-200";
              seat = "bg-slate-100 text-slate-300 cursor-not-allowed";
              strikethrough = true;
            } else if (isBlocked) {
              headrest = "bg-red-200";
              seat = "bg-red-50 text-red-300 cursor-not-allowed opacity-60";
              strikethrough = true;
            } else if (sel) {
              headrest = "bg-indigo-400";
              seat = "bg-indigo-600 text-white shadow-md shadow-indigo-300 cursor-pointer";
            } else if (inRange) {
              headrest = "bg-indigo-200";
              seat = "bg-indigo-100 text-indigo-700 font-semibold cursor-pointer";
            } else if (isToday) {
              headrest = "bg-sky-400";
              seat = "bg-sky-100 text-sky-800 ring-1 ring-sky-400 cursor-pointer font-bold";
            } else {
              headrest = "bg-emerald-300";
              seat = "bg-emerald-100 text-emerald-800 font-semibold cursor-pointer hover:bg-emerald-200 hover:shadow-sm hover:ring-1 hover:ring-indigo-400 transition-all";
            }

            return (
              <div key={day} className="flex flex-col items-center gap-[3px]">
                {/* Headrest — the "top of the seat back" */}
                <div className={`w-4 h-1.5 rounded-full transition-colors duration-150 ${headrest}`} />
                {/* Seat body */}
                <button
                  disabled={isPast || isBlocked}
                  onClick={() => handleDayClick(dateStr)}
                  className={`w-full h-8 text-[11px] font-bold transition-all duration-150 ${seat} ${strikethrough ? "line-through" : ""}`}
                  style={{ borderRadius: "5px 5px 4px 4px" }}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="select-none w-full">
      {/* Navigation row */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 font-bold transition-all text-sm"
        >
          ←
        </button>

        <div className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-bold text-slate-700">
          <span>{MONTH_NAMES[viewMonth].slice(0, 3)} {viewYear}</span>
          <span className="text-slate-300 font-normal">|</span>
          <span>{MONTH_NAMES[month2].slice(0, 3)} {year2}</span>
        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 font-bold transition-all text-sm"
        >
          →
        </button>
      </div>

      {/* Two months side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {renderMonth(viewYear, viewMonth)}
        {renderMonth(year2, month2)}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-end gap-5 flex-wrap text-[11px] text-slate-400">
        {[
          { headrest: "bg-emerald-300", seat: "bg-emerald-100", label: "Available" },
          { headrest: "bg-indigo-400", seat: "bg-indigo-600", label: "Selected" },
          { headrest: "bg-indigo-200", seat: "bg-indigo-100", label: "Range" },
          { headrest: "bg-red-200", seat: "bg-red-50", label: "Booked" },
        ].map(({ headrest, seat, label }) => (
          <div key={label} className="flex flex-col items-center gap-[3px]">
            <div className={`w-3 h-1 rounded-full ${headrest}`} />
            <div className={`w-5 h-4 rounded-sm ${seat}`} />
            <span className="mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* Picking hint */}
      {picking === "end" && selectedStart && (
        <p className="mt-3 text-xs text-indigo-600 font-semibold text-center animate-fade-in">
          Now tap an end date to complete your range
        </p>
      )}
    </div>
  );
}

import type { Trip, DayPlan, ItineraryItem } from '../types.ts';

/**
 * Formats a local Date object to 'YYYY-MM-DD' without UTC timezone shift
 */
export function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object (midnight local time)
 */
export function parseDateStr(dateStr: string): Date {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Adds a specified number of days to a 'YYYY-MM-DD' string and returns 'YYYY-MM-DD'
 */
export function addDaysToDateStr(dateStr: string, daysToAdd: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + daysToAdd);
  return formatDateStr(d);
}

/**
 * Calculates number of inclusive days between startDate and endDate ('YYYY-MM-DD')
 */
export function calculateInclusiveDays(startDateStr: string, endDateStr: string): number {
  const start = parseDateStr(startDateStr);
  const end = parseDateStr(endDateStr);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Synchronizes a Trip's startDate, endDate, and days[] array so that:
 * 1. Every DayPlan has sequential dayNumber (1..N) and sequential dates starting from startDate.
 * 2. If endDate is after or before the current days count, days[] is expanded or trimmed (preserving any existing items by merging into the last day if trimmed, or expanding with new days).
 */
export function syncTripDatesAndDays(
  trip: Trip,
  newStartDate: string,
  newEndDate?: string,
  preserveDaysCount: boolean = false
): Trip {
  const startStr = newStartDate || trip.startDate || formatDateStr(new Date());
  let targetDaysCount = trip.days.length || 1;

  if (!preserveDaysCount && newEndDate) {
    targetDaysCount = calculateInclusiveDays(startStr, newEndDate);
  }

  // Clamp reasonable max days (e.g., 60 days) to prevent accidental huge ranges
  targetDaysCount = Math.min(Math.max(1, targetDaysCount), 60);

  const computedEndDate = addDaysToDateStr(startStr, targetDaysCount - 1);

  const updatedDays: DayPlan[] = [];
  for (let i = 0; i < targetDaysCount; i++) {
    const dayNum = i + 1;
    const dateStr = addDaysToDateStr(startStr, i);
    const existingDay = trip.days[i];

    if (existingDay) {
      updatedDays.push({
        ...existingDay,
        dayNumber: dayNum,
        date: dateStr,
      });
    } else {
      updatedDays.push({
        id: `day-${Date.now()}-${dayNum}-${Math.random().toString(36).substring(2, 6)}`,
        dayNumber: dayNum,
        date: dateStr,
        themeTitle: `第 ${dayNum} 天 自由探索`,
        items: [],
      });
    }
  }

  // If days were reduced and old days beyond targetDaysCount had items, merge them into the last day so user never loses data
  if (trip.days.length > targetDaysCount) {
    const overflowItems: ItineraryItem[] = [];
    for (let i = targetDaysCount; i < trip.days.length; i++) {
      if (trip.days[i].items && trip.days[i].items.length > 0) {
        overflowItems.push(...trip.days[i].items);
      }
    }
    if (overflowItems.length > 0 && updatedDays.length > 0) {
      const lastIdx = updatedDays.length - 1;
      updatedDays[lastIdx] = {
        ...updatedDays[lastIdx],
        items: [...updatedDays[lastIdx].items, ...overflowItems].sort((a, b) =>
          a.time.localeCompare(b.time)
        ),
      };
    }
  }

  return {
    ...trip,
    startDate: startStr,
    endDate: computedEndDate,
    days: updatedDays,
  };
}

/**
 * Updates the date of a specific DayPlan and cascades sequential dates to all days in the trip.
 * E.g. if Day 2 is set to 2025-11-11, Day 1 becomes 2025-11-10, Day 3 becomes 2025-11-12, etc.
 */
export function updateDayDateAndCascade(trip: Trip, dayNumber: number, newDayDateStr: string): Trip {
  const offset = dayNumber - 1;
  const newStartDate = addDaysToDateStr(newDayDateStr, -offset);
  return syncTripDatesAndDays(trip, newStartDate, undefined, true);
}

/**
 * Adds a new day at the end of the trip and updates trip.endDate
 */
export function addDayToTrip(trip: Trip): Trip {
  const newDayNum = trip.days.length + 1;
  const startStr = trip.startDate || formatDateStr(new Date());
  const newDateStr = addDaysToDateStr(startStr, newDayNum - 1);

  const newDay: DayPlan = {
    id: `day-${Date.now()}-${newDayNum}`,
    dayNumber: newDayNum,
    date: newDateStr,
    themeTitle: `第 ${newDayNum} 天 自由探索`,
    items: [],
  };

  const nextDays = [...trip.days, newDay];
  return syncTripDatesAndDays(
    { ...trip, days: nextDays },
    startStr,
    newDateStr,
    true
  );
}

/**
 * Removes a specific day from the trip (if more than 1 day exists), re-numbers remaining days and updates endDate
 */
export function removeDayFromTrip(trip: Trip, dayNumberToRemove: number): Trip {
  if (trip.days.length <= 1) return trip;
  const filteredDays = trip.days.filter((d) => d.dayNumber !== dayNumberToRemove);
  return syncTripDatesAndDays(
    { ...trip, days: filteredDays },
    trip.startDate,
    undefined,
    true
  );
}

/**
 * Re-calculates sequential start/end times for items in a day after reordering (Up/Down or Drag & Drop)
 */
export function getDurationMins(start: string, end?: string): number {
  if (!start || !start.includes(':')) return 60;
  if (!end || !end.includes(':')) return 60;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 60;
}

export function addMinsToTime(time: string, mins: number): string {
  if (!time || !time.includes(':')) return '10:00';
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(23 * 60 + 59, Math.max(0, h * 60 + m + mins));
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/**
 * Swaps two adjacent items in a day's itinerary AND swaps/adjusts their time slots so the order is preserved and logical!
 */
export function moveItineraryItemOrder(
  items: ItineraryItem[],
  index: number,
  direction: 'up' | 'down'
): ItineraryItem[] {
  const targetIdx = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= items.length || targetIdx < 0 || targetIdx >= items.length) {
    return items;
  }

  const cloned = items.map((it) => ({ ...it }));
  const itemA = cloned[index];
  const itemB = cloned[targetIdx];

  // Determine which is earlier in position
  const firstIdx = Math.min(index, targetIdx);
  const secondIdx = Math.max(index, targetIdx);

  const earlierTime = cloned[firstIdx].time;
  const firstItemAfterSwap = cloned[secondIdx];
  const secondItemAfterSwap = cloned[firstIdx];

  const dur1 = getDurationMins(firstItemAfterSwap.time, firstItemAfterSwap.endTime);
  const dur2 = getDurationMins(secondItemAfterSwap.time, secondItemAfterSwap.endTime);
  const gap = Math.max(
    15,
    firstItemAfterSwap.transportToNext?.durationMinutes ||
      secondItemAfterSwap.transportToNext?.durationMinutes ||
      30
  );

  // Swap positions in array
  cloned[firstIdx] = firstItemAfterSwap;
  cloned[secondIdx] = secondItemAfterSwap;

  // Adjust times so firstIdx starts at earlierTime, and secondIdx starts after firstIdx
  cloned[firstIdx].time = earlierTime;
  cloned[firstIdx].endTime = addMinsToTime(earlierTime, dur1);

  const nextStart = addMinsToTime(cloned[firstIdx].endTime, gap);
  cloned[secondIdx].time = nextStart;
  cloned[secondIdx].endTime = addMinsToTime(nextStart, dur2);

  return cloned;
}

/**
 * Reorders days in a trip from fromIndex to toIndex (e.g. via drag-and-drop),
 * maintaining chronological dates and re-indexing dayNumbers (1..N).
 */
export function reorderDaysInTrip(trip: Trip, fromIndex: number, toIndex: number): Trip {
  if (
    fromIndex < 0 ||
    fromIndex >= trip.days.length ||
    toIndex < 0 ||
    toIndex >= trip.days.length ||
    fromIndex === toIndex
  ) {
    return trip;
  }

  const clonedDays = [...trip.days];
  const [movedDay] = clonedDays.splice(fromIndex, 1);
  clonedDays.splice(toIndex, 0, movedDay);

  const startStr = trip.startDate || clonedDays[0]?.date || formatDateStr(new Date());
  const updatedDays: DayPlan[] = clonedDays.map((day, idx) => ({
    ...day,
    dayNumber: idx + 1,
    date: addDaysToDateStr(startStr, idx),
  }));

  return {
    ...trip,
    days: updatedDays,
  };
}

/**
 * Swaps two specific days in a trip by day numbers,
 * preserving chronological dates and sequential dayNumber.
 */
export function swapTwoDaysInTrip(trip: Trip, dayNumA: number, dayNumB: number): Trip {
  if (dayNumA === dayNumB) return trip;
  const idxA = trip.days.findIndex((d) => d.dayNumber === dayNumA);
  const idxB = trip.days.findIndex((d) => d.dayNumber === dayNumB);
  if (idxA === -1 || idxB === -1) return trip;

  const clonedDays = [...trip.days];
  const temp = clonedDays[idxA];
  clonedDays[idxA] = clonedDays[idxB];
  clonedDays[idxB] = temp;

  const startStr = trip.startDate || clonedDays[0]?.date || formatDateStr(new Date());
  const updatedDays: DayPlan[] = clonedDays.map((day, idx) => ({
    ...day,
    dayNumber: idx + 1,
    date: addDaysToDateStr(startStr, idx),
  }));

  return {
    ...trip,
    days: updatedDays,
  };
}

/**
 * Moves an itinerary item from one day to another day
 */
export function moveItemToAnotherDay(
  trip: Trip,
  itemId: string,
  fromDayNum: number,
  toDayNum: number
): Trip {
  if (fromDayNum === toDayNum) return trip;
  const fromDay = trip.days.find((d) => d.dayNumber === fromDayNum);
  const toDay = trip.days.find((d) => d.dayNumber === toDayNum);
  if (!fromDay || !toDay) return trip;

  const itemToMove = fromDay.items.find((it) => it.id === itemId);
  if (!itemToMove) return trip;

  const newFromItems = fromDay.items.filter((it) => it.id !== itemId);
  const newToItems = [...toDay.items, itemToMove].sort((a, b) => a.time.localeCompare(b.time));

  const updatedDays = trip.days.map((day) => {
    if (day.dayNumber === fromDayNum) {
      return { ...day, items: newFromItems };
    }
    if (day.dayNumber === toDayNum) {
      return { ...day, items: newToItems };
    }
    return day;
  });

  return {
    ...trip,
    days: updatedDays,
  };
}

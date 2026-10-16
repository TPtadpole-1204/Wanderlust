import type { Trip } from '../types.ts';
import { loadSavedTrips, saveTrips, setActiveTripId } from './storage.ts';

export interface ImportResult {
  success: boolean;
  message: string;
  importedTripCount?: number;
}

/**
 * Serializes all Wanderlust app data from localStorage into a clean JSON string
 */
export function serializeAllData(): string {
  const data: Record<string, string> = {};

  // Try Object.keys first
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key && (key.startsWith('travel_planner_') || key.startsWith('travel_weather_'))) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
  } catch (_) {}

  // Fallback to indexed loop if Object.keys did not yield items
  if (Object.keys(data).length === 0 && typeof localStorage.length === 'number') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = typeof localStorage.key === 'function' ? localStorage.key(i) : null;
      if (key && (key.startsWith('travel_planner_') || key.startsWith('travel_weather_'))) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Deserializes and restores data from a JSON string.
 * Supports:
 * 1. Full localStorage backup object ({ "travel_planner_app_trips": ... })
 * 2. Single Trip object ({ "title": "...", "days": [...] })
 * 3. Array of Trip objects (Trip[])
 */
export function deserializeAndRestoreData(jsonString: string): ImportResult {
  try {
    if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
      return { success: false, message: '匯入檔案內容為空。' };
    }

    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || data === null) {
      return { success: false, message: '無效的 JSON 結構格式。' };
    }

    // Case 1: Full localStorage backup format
    let hasBackupKeys = false;
    for (const key of Object.keys(data)) {
      if (key.startsWith('travel_planner_') || key.startsWith('travel_weather_')) {
        hasBackupKeys = true;
        break;
      }
    }

    if (hasBackupKeys) {
      let restoredCount = 0;
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
          if (key === 'travel_planner_app_trips') {
            try {
              const trips = JSON.parse(value);
              if (Array.isArray(trips)) restoredCount = trips.length;
            } catch (_) {}
          }
        }
      }
      return {
        success: true,
        message: `成功還原 Wanderlust 完整備份（包含 ${restoredCount} 個旅程與快取設定）！`,
        importedTripCount: restoredCount,
      };
    }

    // Case 2: Array of Trips
    if (Array.isArray(data) && data.length > 0 && data[0].title && Array.isArray(data[0].days)) {
      const existing = loadSavedTrips();
      const newTrips = [...existing];
      for (const t of data as Trip[]) {
        const idx = newTrips.findIndex((x) => x.id === t.id);
        if (idx >= 0) {
          newTrips[idx] = t;
        } else {
          newTrips.push(t);
        }
      }
      saveTrips(newTrips);
      setActiveTripId(data[0].id);
      return {
        success: true,
        message: `成功匯入 ${data.length} 個旅程！`,
        importedTripCount: data.length,
      };
    }

    // Case 3: Single Trip object
    if (data.title && Array.isArray(data.days)) {
      const singleTrip = data as Trip;
      if (!singleTrip.id) {
        singleTrip.id = `trip-import-${Date.now()}`;
      }
      const existing = loadSavedTrips();
      const existingIdx = existing.findIndex((x) => x.id === singleTrip.id);
      let updated: Trip[];
      if (existingIdx >= 0) {
        updated = [...existing];
        updated[existingIdx] = singleTrip;
      } else {
        updated = [singleTrip, ...existing];
      }
      saveTrips(updated);
      setActiveTripId(singleTrip.id);
      return {
        success: true,
        message: `成功匯入旅程「${singleTrip.title}」！`,
        importedTripCount: 1,
      };
    }

    return {
      success: false,
      message: '無法識別此檔案格式，請確認是否為 Wanderlust 備份檔或標準行程 JSON。',
    };
  } catch (error: any) {
    console.error('Failed to import data:', error);
    return {
      success: false,
      message: `資料匯入失敗：${error?.message || '檔案格式錯誤'}`,
    };
  }
}

/**
 * Downloads all data as a backup JSON file
 */
export function exportAllData() {
  const jsonContent = serializeAllData();
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wanderlust_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a single trip as a JSON file
 */
export function exportSingleTrip(trip: Trip) {
  const jsonContent = JSON.stringify(trip, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (trip.title || 'trip').replace(/[\\/:*?"<>|]/g, '_');
  a.download = `${safeTitle}_wanderlust.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Backward compatible wrapper for legacy imports
 */
export function importAllData(jsonString: string): boolean {
  const result = deserializeAndRestoreData(jsonString);
  return result.success;
}

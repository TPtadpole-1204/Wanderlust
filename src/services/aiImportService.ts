import type {
  Trip,
  DayPlan,
  ItineraryItem,
  FlightInfo,
  AttractionBookmark,
  ChecklistItem,
  Coordinates,
  Collaborator,
  TransportOption,
} from '../types.ts';
import { syncTripDatesAndDays, addDaysToDateStr, calculateInclusiveDays } from './itineraryUtils.ts';

export interface AIImportResult {
  success: boolean;
  trip?: Trip;
  error?: string;
  warning?: string;
}

export const AI_PROMPT_INSTRUCTION = `請扮演專業旅遊規劃顧問，為我設計一份結構完整且可執行的旅遊行程。
請嚴格只輸出合法 JSON 格式，且直接使用 Markdown 程式碼區塊包裹（\`\`\`json ... \`\`\`），不要輸出任何額外的開場白或說明文字。

輸出 JSON 結構規格如下：
{
  "title": "行程標題 (如：東京秋季楓葉與美食 5 天 4 夜)",
  "destination": "目的地城市 (如：日本 東京 (Tokyo, Japan))",
  "countryCode": "國家兩碼 (如：JP, KR, US, FR, TH)",
  "startDate": "出發日期 (格式 YYYY-MM-DD，如：2025-10-15)",
  "endDate": "結束日期 (格式 YYYY-MM-DD，如：2025-10-19)",
  "baseCurrency": "本國計價幣別 (如：TWD)",
  "targetCurrency": "目的地當地幣別 (如：JPY, KRW, EUR, USD)",
  "totalBudget": 50000,
  "notes": "全旅程行前必讀須知、交通票券建議或注意事項",
  "checklist": [
    { "category": "重要證件", "label": "護照 (有效期限 6 個月以上)", "checked": false },
    { "category": "網路通訊", "label": "日本 eSIM / 漫遊開通", "checked": false },
    { "category": "交通票券", "label": "綁定手機 Suica / Pasmo", "checked": false }
  ],
  "flights": [
    {
      "flightNumber": "JX800",
      "airline": "星宇航空",
      "departureAirport": "TPE (桃園機場 T1)",
      "departureCity": "台北 Taipei",
      "departureTime": "2025-10-15 08:30",
      "arrivalAirport": "NRT (成田機場 T2)",
      "arrivalCity": "東京 Tokyo",
      "arrivalTime": "2025-10-15 12:45",
      "terminal": "T1",
      "gate": "B6",
      "status": "ON_TIME",
      "seat": "12A",
      "bookingRef": "STX8993K"
    }
  ],
  "days": [
    {
      "dayNumber": 1,
      "date": "2025-10-15",
      "themeTitle": "抵達東京與新宿繁華夜景",
      "notes": "第一天出關後先至飯店寄放行李，避免拖行李逛街",
      "accommodation": {
        "name": "新宿燦路都廣場大飯店 (Hotel Sunroute Plaza Shinjuku)",
        "address": "東京都渋谷区代々木2-3-1",
        "phone": "+81 3-3375-3211",
        "checkInTime": "15:00",
        "coords": { "lat": 35.6865, "lng": 139.7005 }
      },
      "items": [
        {
          "time": "13:30",
          "endTime": "14:45",
          "title": "成田特快 N'EX 前往新宿",
          "category": "transport",
          "locationName": "成田機場第2航廈站",
          "address": "千葉縣成田市古込",
          "coords": { "lat": 35.7647, "lng": 140.3863 },
          "cost": 3200,
          "currency": "JPY",
          "notes": "於 B1 JR 售票機取票，搭乘全車指定席",
          "transportToNext": {
            "mode": "bullet_train",
            "durationMinutes": 65,
            "distanceText": "75 km",
            "routes": [
              { "label": "Google Maps 推薦鐵路路線", "url": "https://www.google.com/maps/dir/?api=1&origin=成田機場&destination=新宿站&travelmode=transit" }
            ]
          },
          "transportOptions": [
            {
              "mode": "bullet_train",
              "durationMinutes": 65,
              "distanceText": "75 km",
              "cost": 3200,
              "routes": [
                { "label": "JR 成田特快 N'EX", "url": "https://www.google.com/maps/dir/?api=1&origin=成田機場&destination=新宿站&travelmode=transit" }
              ]
            },
            {
              "mode": "bus",
              "durationMinutes": 90,
              "distanceText": "75 km",
              "cost": 1300,
              "routes": [
                { "label": "利木津巴士直達", "url": "https://www.google.com/maps/dir/?api=1&origin=成田機場&destination=新宿站&travelmode=transit" }
              ]
            }
          ]
        },
        {
          "time": "15:00",
          "endTime": "15:45",
          "title": "飯店辦理入住 & 寄放行李",
          "category": "stay",
          "locationName": "新宿燦路都廣場大飯店",
          "address": "東京都渋谷区代々木2-3-1",
          "coords": { "lat": 35.6865, "lng": 139.7005 },
          "notes": "出示訂房代碼 STX8993K 辦理入住",
          "transportToNext": {
            "mode": "walk",
            "durationMinutes": 10,
            "distanceText": "650 m"
          }
        }
      ]
    }
  ],
  "attractions": [
    {
      "title": "東京鐵塔 (Tokyo Tower)",
      "category": "sightseeing",
      "city": "東京港區",
      "address": "東京都港区芝公園4丁目2-8",
      "coords": { "lat": 35.6586, "lng": 139.7454 },
      "rating": 4.6,
      "openingHours": "09:00 - 23:00",
      "estimatedCost": 1200,
      "currency": "JPY",
      "notes": "建議傍晚前抵達可同時欣賞夕陽與點燈夜景",
      "imageUrl": "https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&w=600&q=80",
      "tags": ["夜景", "經典地標", "瞭望台"],
      "isWishlist": true
    }
  ]
}`;

// Fallback coordinates for common travel destinations
const CITY_COORDS_MAP: Record<string, Coordinates> = {
  tokyo: { lat: 35.6762, lng: 139.6503 },
  東京: { lat: 35.6762, lng: 139.6503 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  京都: { lat: 35.0116, lng: 135.7681 },
  osaka: { lat: 34.6937, lng: 135.5023 },
  大阪: { lat: 34.6937, lng: 135.5023 },
  fukuoka: { lat: 33.5904, lng: 130.4017 },
  福岡: { lat: 33.5904, lng: 130.4017 },
  hokkaido: { lat: 43.0642, lng: 141.3469 },
  北海道: { lat: 43.0642, lng: 141.3469 },
  taipei: { lat: 25.033, lng: 121.5654 },
  台北: { lat: 25.033, lng: 121.5654 },
  seoul: { lat: 37.5665, lng: 126.978 },
  首爾: { lat: 37.5665, lng: 126.978 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  曼谷: { lat: 13.7563, lng: 100.5018 },
  paris: { lat: 48.8566, lng: 2.3522 },
  巴黎: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  倫敦: { lat: 51.5074, lng: -0.1278 },
};

function getCityCoords(destination: string): Coordinates {
  const lower = destination.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS_MAP)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return { lat: 35.6762, lng: 139.6503 };
}

/**
 * Strips markdown code blocks and excess whitespace from AI output
 */
export function extractJsonFromAiString(rawText: string): string {
  let cleaned = rawText.trim();

  // Match ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(codeBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // If there are leading non-JSON characters before first { or [
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    cleaned = cleaned.substring(startIdx);
  }

  // If there are trailing characters after last } or ]
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  let endIdx = cleaned.length;
  if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
    endIdx = lastBrace + 1;
  } else if (lastBracket !== -1) {
    endIdx = lastBracket + 1;
  }

  if (endIdx < cleaned.length) {
    cleaned = cleaned.substring(0, endIdx);
  }

  return cleaned;
}

/**
 * Parses, sanitizes, and validates AI JSON into a full typed Trip object
 */
export function parseAndValidateAIImport(
  rawInput: string,
  fallbackCollaborators: Collaborator[] = []
): AIImportResult {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return { success: false, error: '請貼上 AI 輸出的 JSON 內容。' };
  }

  const cleanedJson = extractJsonFromAiString(rawInput);
  let parsed: any;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (err: any) {
    return {
      success: false,
      error: `JSON 語法解析失敗：${err?.message || '請確認格式是否為標準合法的 JSON 格式'}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: false, error: '解析結果非有效 JSON 物件。' };
  }

  if (!parsed.title && !parsed.days) {
    return { success: false, error: 'JSON 缺少核心行程資訊，請確認包含 title 與 days 陣列。' };
  }

  const now = Date.now();
  const tripTitle = String(parsed.title || '我的 AI 規劃行程').trim();
  const destination = String(parsed.destination || '海外城市').trim();
  const defaultCoords = getCityCoords(destination);

  // Normalize days
  const rawDays: any[] = Array.isArray(parsed.days) ? parsed.days : [];
  if (rawDays.length === 0) {
    return { success: false, error: '行程中的 days 陣列不可為空，至少需包含 1 天規劃。' };
  }

  const startDate = parsed.startDate || (rawDays[0]?.date ? String(rawDays[0].date) : new Date().toISOString().split('T')[0]);
  const endDate =
    parsed.endDate ||
    (rawDays[rawDays.length - 1]?.date
      ? String(rawDays[rawDays.length - 1].date)
      : addDaysToDateStr(startDate, rawDays.length - 1));

  const validCategories = new Set([
    'sightseeing',
    'food',
    'shopping',
    'stay',
    'transport',
    'entertainment',
    'other',
  ]);

  const validTransportModes = new Set([
    'walk',
    'subway',
    'bus',
    'taxi',
    'bullet_train',
    'car',
  ]);

  const sanitizedDays: DayPlan[] = rawDays.map((d: any, dIdx: number) => {
    const dayNumber = typeof d.dayNumber === 'number' ? d.dayNumber : dIdx + 1;
    const date = d.date ? String(d.date) : addDaysToDateStr(startDate, dIdx);
    const themeTitle = d.themeTitle ? String(d.themeTitle) : `第 ${dayNumber} 天行程`;

    // Accommodation sanitize
    let accommodation: DayPlan['accommodation'] = undefined;
    if (d.accommodation && typeof d.accommodation === 'object') {
      const acc = d.accommodation;
      const accCoords: Coordinates =
        acc.coords && typeof acc.coords.lat === 'number' && typeof acc.coords.lng === 'number'
          ? { lat: acc.coords.lat, lng: acc.coords.lng }
          : defaultCoords;

      accommodation = {
        name: String(acc.name || '精選住宿'),
        address: String(acc.address || ''),
        coords: accCoords,
        checkInTime: acc.checkInTime ? String(acc.checkInTime) : '15:00',
        phone: acc.phone ? String(acc.phone) : undefined,
      };
    }

    // Items sanitize
    const rawItems: any[] = Array.isArray(d.items) ? d.items : [];
    const items: ItineraryItem[] = rawItems.map((item: any, itIdx: number) => {
      const time = typeof item.time === 'string' && /^\d{1,2}:\d{2}$/.test(item.time)
        ? (item.time.length === 4 ? `0${item.time}` : item.time)
        : '09:00';

      const endTime = typeof item.endTime === 'string' && /^\d{1,2}:\d{2}$/.test(item.endTime)
        ? (item.endTime.length === 4 ? `0${item.endTime}` : item.endTime)
        : undefined;

      const category = validCategories.has(item.category) ? item.category : 'sightseeing';

      const coords: Coordinates =
        item.coords && typeof item.coords.lat === 'number' && typeof item.coords.lng === 'number'
          ? { lat: item.coords.lat, lng: item.coords.lng }
          : defaultCoords;

      // Transport to next sanitize
      let transportToNext: ItineraryItem['transportToNext'] = undefined;
      if (item.transportToNext && typeof item.transportToNext === 'object') {
        const t = item.transportToNext;
        const mode = validTransportModes.has(t.mode) ? t.mode : 'subway';
        transportToNext = {
          mode,
          durationMinutes: typeof t.durationMinutes === 'number' ? t.durationMinutes : 15,
          distanceText: t.distanceText ? String(t.distanceText) : undefined,
          cost: typeof t.cost === 'number' ? t.cost : undefined,
          routes: Array.isArray(t.routes)
            ? t.routes.map((r: any) => ({
                label: String(r.label || '導航路線'),
                url: String(r.url || ''),
              }))
            : undefined,
        };
      }

      // Transport options sanitize
      let transportOptions: TransportOption[] | undefined = undefined;
      if (Array.isArray(item.transportOptions) && item.transportOptions.length > 0) {
        transportOptions = item.transportOptions.map((opt: any) => ({
          mode: validTransportModes.has(opt.mode) ? opt.mode : 'subway',
          durationMinutes: typeof opt.durationMinutes === 'number' ? opt.durationMinutes : 20,
          distanceText: opt.distanceText ? String(opt.distanceText) : undefined,
          cost: typeof opt.cost === 'number' ? opt.cost : undefined,
          routes: Array.isArray(opt.routes)
            ? opt.routes.map((r: any) => ({
                label: String(r.label || '路線'),
                url: String(r.url || ''),
              }))
            : undefined,
        }));
      } else if (transportToNext) {
        transportOptions = [transportToNext];
      }

      return {
        id: item.id ? String(item.id) : `item-${now}-${dIdx}-${itIdx}`,
        time,
        endTime,
        title: String(item.title || `行程項目 ${itIdx + 1}`),
        category,
        locationName: String(item.locationName || item.title || '地點'),
        address: item.address ? String(item.address) : undefined,
        coords,
        cost: typeof item.cost === 'number' ? item.cost : undefined,
        currency: item.currency ? String(item.currency) : (parsed.targetCurrency || 'JPY'),
        notes: item.notes ? String(item.notes) : undefined,
        transportToNext,
        transportOptions,
        referenceLinks: Array.isArray(item.referenceLinks)
          ? item.referenceLinks.map((rl: any) => ({
              label: String(rl.label || '參考連結'),
              url: String(rl.url || ''),
            }))
          : undefined,
        attachments: Array.isArray(item.attachments) ? item.attachments.map(String) : [],
        completed: Boolean(item.completed),
      };
    });

    return {
      id: d.id ? String(d.id) : `day-${now}-${dIdx + 1}`,
      dayNumber,
      date,
      themeTitle,
      items,
      accommodation,
      notes: d.notes ? String(d.notes) : undefined,
    };
  });

  // Flights sanitize
  const flights: FlightInfo[] = Array.isArray(parsed.flights)
    ? parsed.flights.map((f: any, fIdx: number) => ({
        id: f.id ? String(f.id) : `fl-ai-${now}-${fIdx}`,
        flightNumber: String(f.flightNumber || 'FLIGHT'),
        airline: String(f.airline || '航空公司'),
        departureAirport: String(f.departureAirport || 'TPE'),
        departureCity: String(f.departureCity || '台北'),
        departureTime: String(f.departureTime || `${startDate} 08:00`),
        arrivalAirport: String(f.arrivalAirport || 'DEST'),
        arrivalCity: String(f.arrivalCity || destination),
        arrivalTime: String(f.arrivalTime || `${startDate} 12:00`),
        terminal: f.terminal ? String(f.terminal) : undefined,
        gate: f.gate ? String(f.gate) : undefined,
        baggageClaim: f.baggageClaim ? String(f.baggageClaim) : undefined,
        status: f.status || 'ON_TIME',
        seat: f.seat ? String(f.seat) : undefined,
        bookingRef: f.bookingRef ? String(f.bookingRef) : undefined,
      }))
    : [];

  // Attractions bookmarks sanitize
  const attractions: AttractionBookmark[] = Array.isArray(parsed.attractions)
    ? parsed.attractions.map((att: any, attIdx: number) => ({
        id: att.id ? String(att.id) : `att-ai-${now}-${attIdx}`,
        title: String(att.title || '口袋景點'),
        category: validCategories.has(att.category) ? att.category : 'sightseeing',
        city: String(att.city || destination),
        address: String(att.address || ''),
        coords:
          att.coords && typeof att.coords.lat === 'number' && typeof att.coords.lng === 'number'
            ? { lat: att.coords.lat, lng: att.coords.lng }
            : defaultCoords,
        rating: typeof att.rating === 'number' ? att.rating : 4.5,
        openingHours: att.openingHours ? String(att.openingHours) : undefined,
        estimatedCost: typeof att.estimatedCost === 'number' ? att.estimatedCost : undefined,
        currency: att.currency ? String(att.currency) : (parsed.targetCurrency || 'JPY'),
        notes: String(att.notes || ''),
        imageUrl:
          att.imageUrl ||
          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
        tags: Array.isArray(att.tags) ? att.tags.map(String) : ['推薦景點'],
        isWishlist: att.isWishlist !== undefined ? Boolean(att.isWishlist) : true,
        googleMapsUrl: att.googleMapsUrl ? String(att.googleMapsUrl) : undefined,
      }))
    : [];

  // Checklist sanitize
  const checklist: ChecklistItem[] = Array.isArray(parsed.checklist)
    ? parsed.checklist.map((item: any, cIdx: number) => ({
        id: item.id ? String(item.id) : `chk-ai-${now}-${cIdx}`,
        category: String(item.category || '行前清單'),
        label: String(item.label || item.title || '清單項目'),
        checked: Boolean(item.checked),
      }))
    : [
        { id: `chk-1-${now}`, category: '重要證件', label: '護照 (效期 6 個月以上)', checked: false },
        { id: `chk-2-${now}`, category: '網路通訊', label: '當地 eSIM / 上網卡開通', checked: false },
        { id: `chk-3-${now}`, category: '交通票券', label: '綁定交通卡 (Suica / IC 卡)', checked: false },
      ];

  // Collaborators fallback
  const defaultCollabs: Collaborator[] =
    fallbackCollaborators.length > 0
      ? fallbackCollaborators
      : [
          {
            id: 'user-owner',
            name: '我 (Alex)',
            avatar: '🦊',
            role: 'owner',
            isOnline: true,
            color: '#3B82F6',
          },
        ];

  const constructedTrip: Trip = {
    id: parsed.id ? String(parsed.id) : `trip-ai-${now}`,
    title: tripTitle,
    destination,
    countryCode: String(parsed.countryCode || 'JP').toUpperCase(),
    startDate,
    endDate,
    coverImage:
      parsed.coverImage ||
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
    baseCurrency: String(parsed.baseCurrency || 'TWD').toUpperCase(),
    targetCurrency: String(parsed.targetCurrency || 'JPY').toUpperCase(),
    totalBudget: typeof parsed.totalBudget === 'number' ? parsed.totalBudget : 50000,
    shareCode: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
    offlineReady: false,
    collaborators: defaultCollabs,
    flights,
    attractions,
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    days: sanitizedDays,
    notes: parsed.notes ? String(parsed.notes) : undefined,
    checklist,
  };

  // Sync dates and days smoothly ensuring inclusive range is respected
  const inclusiveRange = calculateInclusiveDays(startDate, endDate);
  const targetDaysCount = Math.max(sanitizedDays.length, inclusiveRange);
  const effectiveEndDate = addDaysToDateStr(startDate, targetDaysCount - 1);

  const finalTrip = syncTripDatesAndDays(constructedTrip, startDate, effectiveEndDate, false);

  return {
    success: true,
    trip: finalTrip,
  };
}

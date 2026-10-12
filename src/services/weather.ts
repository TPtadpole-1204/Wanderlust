import type { Trip } from '../types.ts';

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  weatherText: string;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'drizzle' | 'rain' | 'snow' | 'lightning' | 'fog';
  tempMax: number;
  tempMin: number;
  precipProbability: number; // 0 - 100
  uvIndex?: number;
}

export interface CurrentWeather {
  temp: number;
  apparentTemp: number;
  humidity: number;
  weatherCode: number;
  weatherText: string;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'drizzle' | 'rain' | 'snow' | 'lightning' | 'fog';
  isDay: boolean;
  windSpeed: number; // km/h
}

export interface TripWeatherData {
  tripId: string;
  queriedDestination?: string;
  cityName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  updatedAt: string; // ISO
  current: CurrentWeather;
  daily: DailyForecast[];
  isCachedOffline?: boolean;
}

// Popular travel destinations coordinates lookup
const POPULAR_DESTINATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  tokyo: { lat: 35.6895, lng: 139.6917, name: '東京 (Tokyo)' },
  東京: { lat: 35.6895, lng: 139.6917, name: '東京' },
  osaka: { lat: 34.6937, lng: 135.5023, name: '大阪 (Osaka)' },
  大阪: { lat: 34.6937, lng: 135.5023, name: '大阪' },
  kyoto: { lat: 35.0116, lng: 135.7681, name: '京都 (Kyoto)' },
  京都: { lat: 35.0116, lng: 135.7681, name: '京都' },
  okinawa: { lat: 26.2124, lng: 127.6809, name: '沖繩 (Okinawa)' },
  沖繩: { lat: 26.2124, lng: 127.6809, name: '沖繩' },
  sapporo: { lat: 43.0618, lng: 141.3545, name: '札幌 (Sapporo)' },
  札幌: { lat: 43.0618, lng: 141.3545, name: '札幌' },
  hokkaido: { lat: 43.0618, lng: 141.3545, name: '北海道 (Hokkaido)' },
  北海道: { lat: 43.0618, lng: 141.3545, name: '北海道' },
  fukuoka: { lat: 33.5904, lng: 130.4017, name: '福岡 (Fukuoka)' },
  福岡: { lat: 33.5904, lng: 130.4017, name: '福岡' },
  nagoya: { lat: 35.1815, lng: 136.9066, name: '名古屋 (Nagoya)' },
  名古屋: { lat: 35.1815, lng: 136.9066, name: '名古屋' },
  nara: { lat: 34.6851, lng: 135.8048, name: '奈良 (Nara)' },
  奈良: { lat: 34.6851, lng: 135.8048, name: '奈良' },
  yokohama: { lat: 35.4437, lng: 139.6380, name: '橫濱 (Yokohama)' },
  橫濱: { lat: 35.4437, lng: 139.6380, name: '橫濱' },
  kobe: { lat: 34.6901, lng: 135.1956, name: '神戶 (Kobe)' },
  神戶: { lat: 34.6901, lng: 135.1956, name: '神戶' },
  sendai: { lat: 38.2682, lng: 140.8694, name: '仙台 (Sendai)' },
  仙台: { lat: 38.2682, lng: 140.8694, name: '仙台' },
  seoul: { lat: 37.5665, lng: 126.9780, name: '首爾 (Seoul)' },
  首爾: { lat: 37.5665, lng: 126.9780, name: '首爾' },
  busan: { lat: 35.1796, lng: 129.0756, name: '釜山 (Busan)' },
  釜山: { lat: 35.1796, lng: 129.0756, name: '釜山' },
  jeju: { lat: 33.4996, lng: 126.5312, name: '濟州島 (Jeju)' },
  濟州: { lat: 33.4996, lng: 126.5312, name: '濟州島' },
  bangkok: { lat: 13.7563, lng: 100.5018, name: '曼谷 (Bangkok)' },
  曼谷: { lat: 13.7563, lng: 100.5018, name: '曼谷' },
  'chiang mai': { lat: 18.7883, lng: 98.9853, name: '清邁 (Chiang Mai)' },
  清邁: { lat: 18.7883, lng: 98.9853, name: '清邁' },
  phuket: { lat: 7.8804, lng: 98.3923, name: '普吉島 (Phuket)' },
  普吉島: { lat: 7.8804, lng: 98.3923, name: '普吉島' },
  taipei: { lat: 25.0330, lng: 121.5654, name: '台北 (Taipei)' },
  台北: { lat: 25.0330, lng: 121.5654, name: '台北' },
  台中: { lat: 24.1477, lng: 120.6736, name: '台中' },
  高雄: { lat: 22.6273, lng: 120.3014, name: '高雄' },
  台南: { lat: 22.9997, lng: 120.2270, name: '台南' },
  花蓮: { lat: 23.9872, lng: 121.6016, name: '花蓮' },
  hongkong: { lat: 22.3193, lng: 114.1694, name: '香港 (Hong Kong)' },
  香港: { lat: 22.3193, lng: 114.1694, name: '香港' },
  singapore: { lat: 1.3521, lng: 103.8198, name: '新加坡 (Singapore)' },
  新加坡: { lat: 1.3521, lng: 103.8198, name: '新加坡' },
  london: { lat: 51.5074, lng: -0.1278, name: '倫敦 (London)' },
  倫敦: { lat: 51.5074, lng: -0.1278, name: '倫敦' },
  paris: { lat: 48.8566, lng: 2.3522, name: '巴黎 (Paris)' },
  巴黎: { lat: 48.8566, lng: 2.3522, name: '巴黎' },
  rome: { lat: 41.9028, lng: 12.4964, name: '羅馬 (Rome)' },
  羅馬: { lat: 41.9028, lng: 12.4964, name: '羅馬' },
  newyork: { lat: 40.7128, lng: -74.0060, name: '紐約 (New York)' },
  紐約: { lat: 40.7128, lng: -74.0060, name: '紐約' },
  sydney: { lat: -33.8688, lng: 151.2093, name: '雪梨 (Sydney)' },
  雪梨: { lat: -33.8688, lng: 151.2093, name: '雪梨' },
};

/**
 * Maps WMO weather code to user-friendly Chinese description and icon type
 */
export function interpretWmoCode(code: number): { text: string; iconType: DailyForecast['iconType'] } {
  switch (code) {
    case 0:
      return { text: '晴朗', iconType: 'sun' };
    case 1:
      return { text: '大致晴朗', iconType: 'sun' };
    case 2:
      return { text: '多雲時晴', iconType: 'cloud-sun' };
    case 3:
      return { text: '陰天多雲', iconType: 'cloud' };
    case 45:
    case 48:
      return { text: '起霧', iconType: 'fog' };
    case 51:
    case 53:
    case 55:
      return { text: '毛毛雨', iconType: 'drizzle' };
    case 56:
    case 57:
      return { text: '凍毛毛雨', iconType: 'drizzle' };
    case 61:
      return { text: '小雨', iconType: 'drizzle' };
    case 63:
      return { text: '降雨', iconType: 'rain' };
    case 65:
      return { text: '大雨傾盆', iconType: 'rain' };
    case 66:
    case 67:
      return { text: '凍雨', iconType: 'rain' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { text: '降雪', iconType: 'snow' };
    case 80:
    case 81:
    case 82:
      return { text: '短暫陣雨', iconType: 'rain' };
    case 85:
    case 86:
      return { text: '局部陣雪', iconType: 'snow' };
    case 95:
      return { text: '雷陣雨', iconType: 'lightning' };
    case 96:
    case 99:
      return { text: '雷雨夾冰雹', iconType: 'lightning' };
    default:
      return { text: '多雲', iconType: 'cloud-sun' };
  }
}

/**
 * Determine coordinates for a trip by destination keyword, itinerary items, or geocoding API
 */
export async function resolveTripCoordinates(trip: Trip): Promise<{ lat: number; lng: number; name: string }> {
  const destLower = (trip.destination || '').toLowerCase();

  // 1. Check if any popular city name is in destination
  for (const [key, val] of Object.entries(POPULAR_DESTINATIONS)) {
    if (destLower.includes(key.toLowerCase())) {
      return { lat: val.lat, lng: val.lng, name: val.name };
    }
  }

  // 2. Clean string and try Open-Meteo Geocoding API first if destination is set
  const cleanName = (trip.destination || '')
    .replace(/[(),]/g, ' ')
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.length > 1)[0] || trip.destination;

  if (cleanName) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=zh&format=json`;
      const res = await fetch(geoUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const top = data.results[0];
          return {
            lat: top.latitude,
            lng: top.longitude,
            name: `${top.name}${top.country ? `, ${top.country}` : ''}`,
          };
        }
      }
    } catch (err) {
      console.warn('Geocoding fallback failed:', err);
    }
  }

  // 3. Fallback: Check if any items in the trip have coordinates
  for (const day of trip.days) {
    if (day.accommodation?.coords && day.accommodation.coords.lat !== 0) {
      return {
        lat: day.accommodation.coords.lat,
        lng: day.accommodation.coords.lng,
        name: day.accommodation.name || trip.destination,
      };
    }
    for (const item of day.items) {
      if (item.coords && item.coords.lat !== 0 && item.coords.lng !== 0) {
        return {
          lat: item.coords.lat,
          lng: item.coords.lng,
          name: item.locationName || trip.destination,
        };
      }
    }
  }

  // Default fallback: Tokyo
  return { lat: 35.6895, lng: 139.6917, name: trip.destination || '東京' };
}

const STORAGE_PREFIX = 'travel_weather_v2_';

/**
 * Retrieve cached weather from local storage
 */
export function getCachedTripWeather(tripId: string, destination?: string): TripWeatherData | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tripId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (destination && parsed.queriedDestination && parsed.queriedDestination !== destination) {
      return null;
    }
    return { ...parsed, isCachedOffline: true };
  } catch {
    return null;
  }
}

/**
 * Fetch real-time and 14-day weather forecast from Open-Meteo
 */
export async function fetchTripWeather(trip: Trip, forceRefresh = false): Promise<TripWeatherData | null> {
  const cached = getCachedTripWeather(trip.id, trip.destination);

  // Return cached if fresh within 2 hours and not forced
  if (cached && !forceRefresh) {
    const updated = new Date(cached.updatedAt).getTime();
    const now = Date.now();
    if (now - updated < 2 * 60 * 60 * 1000) {
      return cached;
    }
  }

  try {
    const coords = await resolveTripCoordinates(trip);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=14`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned status ${res.status}`);

    const data = await res.json();

    const curWmo = interpretWmoCode(data.current?.weather_code ?? 0);
    const current: CurrentWeather = {
      temp: Math.round(data.current?.temperature_2m ?? 20),
      apparentTemp: Math.round(data.current?.apparent_temperature ?? 20),
      humidity: Math.round(data.current?.relative_humidity_2m ?? 50),
      weatherCode: data.current?.weather_code ?? 0,
      weatherText: curWmo.text,
      iconType: curWmo.iconType,
      isDay: Boolean(data.current?.is_day ?? 1),
      windSpeed: Math.round(data.current?.wind_speed_10m ?? 10),
    };

    const daily: DailyForecast[] = [];
    if (data.daily && data.daily.time) {
      for (let i = 0; i < data.daily.time.length; i++) {
        const code = data.daily.weather_code[i] ?? 0;
        const wmo = interpretWmoCode(code);
        daily.push({
          date: data.daily.time[i],
          weatherCode: code,
          weatherText: wmo.text,
          iconType: wmo.iconType,
          tempMax: Math.round(data.daily.temperature_2m_max[i] ?? 24),
          tempMin: Math.round(data.daily.temperature_2m_min[i] ?? 16),
          precipProbability: Math.round(data.daily.precipitation_probability_max[i] ?? 10),
          uvIndex: data.daily.uv_index_max ? Math.round(data.daily.uv_index_max[i] ?? 5) : undefined,
        });
      }
    }

    const weatherData: TripWeatherData = {
      tripId: trip.id,
      queriedDestination: trip.destination,
      cityName: coords.name,
      latitude: coords.lat,
      longitude: coords.lng,
      timezone: data.timezone || 'Asia/Tokyo',
      updatedAt: new Date().toISOString(),
      current,
      daily,
      isCachedOffline: false,
    };

    // Cache locally for offline use
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${trip.id}`, JSON.stringify(weatherData));
    } catch (e) {
      console.warn('Failed to save weather cache:', e);
    }

    return weatherData;
  } catch (err) {
    console.warn('Failed to fetch live weather from Open-Meteo:', err);
    // Return cached if available, even if stale
    if (cached) {
      return { ...cached, isCachedOffline: true };
    }
    return null;
  }
}

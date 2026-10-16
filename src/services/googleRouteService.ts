import type { Coordinates, TransportOption } from '../types.ts';

export interface RoutePlace {
  title: string;
  locationName?: string;
  address?: string;
  coords?: Coordinates;
}

export interface GoogleRouteOption {
  mode: TransportOption['mode'];
  modeLabel: string;
  icon: string;
  durationMinutes: number;
  durationText: string;
  distanceText: string;
  distanceKm: number;
  googleMapsUrl: string;
  recommended: boolean;
  notes: string;
}

export interface GoogleRoutePlan {
  originName: string;
  destinationName: string;
  straightDistanceKm: number;
  googleMapsUniversalUrl: string;
  options: GoogleRouteOption[];
}

/**
 * Calculates Haversine straight-line distance in kilometers between two lat/lng coordinates.
 */
export function calculateHaversineDistanceKm(coords1: Coordinates, coords2: Coordinates): number {
  if (
    !coords1 ||
    !coords2 ||
    coords1.lat === undefined ||
    coords1.lng === undefined ||
    coords2.lat === undefined ||
    coords2.lng === undefined ||
    (coords1.lat === 0 && coords1.lng === 0) ||
    (coords2.lat === 0 && coords2.lng === 0)
  ) {
    return 2.5; // reasonable urban default
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const lat1 = (coords1.lat * Math.PI) / 180;
  const lat2 = (coords2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Builds an official Google Maps Directions URL between origin and destination.
 * Works seamlessly across web browsers, iOS Google Maps app, and Android Google Maps app.
 */
export function buildGoogleMapsRouteUrl(
  origin: string,
  destination: string,
  mode: 'transit' | 'walking' | 'driving' | 'bicycling' = 'transit',
  originCoords?: Coordinates,
  destCoords?: Coordinates
): string {
  const originQuery =
    originCoords && originCoords.lat && originCoords.lng
      ? `${originCoords.lat},${originCoords.lng}`
      : origin;

  const destQuery =
    destCoords && destCoords.lat && destCoords.lng
      ? `${destCoords.lat},${destCoords.lng}`
      : destination;

  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams({
    origin: originQuery,
    destination: destQuery,
    travelmode: mode,
  });

  return `${baseUrl}&${params.toString()}`;
}

/**
 * Generates comprehensive Google recommended route options between two itinerary items.
 */
export function getGoogleRouteRecommendations(
  from: RoutePlace,
  to: RoutePlace,
  destinationCity?: string
): GoogleRoutePlan {
  const originName = (from.locationName || from.title || '起點').trim();
  const destName = (to.locationName || to.title || '目的地').trim();

  // Determine if city prefix is needed for query robustness
  const originFull = destinationCity && !originName.includes(destinationCity) ? `${destinationCity} ${originName}` : originName;
  const destFull = destinationCity && !destName.includes(destinationCity) ? `${destinationCity} ${destName}` : destName;

  const distanceKm =
    from.coords && to.coords
      ? calculateHaversineDistanceKm(from.coords, to.coords)
      : 2.5;

  const distanceText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} 公尺` : `${distanceKm} 公里`;

  // Estimate walking: avg 4.2 km/h + traffic light pauses
  const walkMinutes = Math.max(3, Math.round((distanceKm / 4.2) * 60));
  // Estimate transit: city transit ~20km/h + 6-10 min wait/walk to station
  const transitMinutes = Math.max(10, Math.round((distanceKm / 22) * 60 + 8));
  // Estimate driving/taxi: city roads ~25km/h + 3 min pickup
  const driveMinutes = Math.max(5, Math.round((distanceKm / 26) * 60 + 4));

  const options: GoogleRouteOption[] = [];

  // Transit (Subway / Bus / Train)
  const transitUrl = buildGoogleMapsRouteUrl(originFull, destFull, 'transit', from.coords, to.coords);
  options.push({
    mode: 'subway',
    modeLabel: '🚇 大眾運輸 (地鐵 / 電車 / 公車)',
    icon: '🚇',
    durationMinutes: transitMinutes,
    durationText: `約 ${transitMinutes} 分鐘`,
    distanceText,
    distanceKm,
    googleMapsUrl: transitUrl,
    recommended: distanceKm >= 1.0,
    notes: 'Google 推薦最佳捷運/公車班次與換乘月台指引',
  });

  // Walking (if within walkable range, e.g. <= 3.5 km)
  const walkUrl = buildGoogleMapsRouteUrl(originFull, destFull, 'walking', from.coords, to.coords);
  options.push({
    mode: 'walk',
    modeLabel: '🚶 步行路線',
    icon: '🚶',
    durationMinutes: walkMinutes,
    durationText: `約 ${walkMinutes} 分鐘`,
    distanceText,
    distanceKm,
    googleMapsUrl: walkUrl,
    recommended: distanceKm < 1.0,
    notes: distanceKm < 1.0 ? '距離近推薦步行，沿途可漫步探索街景' : '步行距離稍長，建議穿著舒適步鞋',
  });

  // Driving / Taxi
  const driveUrl = buildGoogleMapsRouteUrl(originFull, destFull, 'driving', from.coords, to.coords);
  options.push({
    mode: 'taxi',
    modeLabel: '🚕 計程車 / 🚗 駕車路線',
    icon: '🚕',
    durationMinutes: driveMinutes,
    durationText: `約 ${driveMinutes} 分鐘`,
    distanceText,
    distanceKm,
    googleMapsUrl: driveUrl,
    recommended: false,
    notes: '避開尖峰時段，行李較多或同伴多人共乘更划算',
  });

  // If long distance (e.g. > 35 km, e.g. between cities or airport)
  if (distanceKm > 35) {
    options.push({
      mode: 'bullet_train',
      modeLabel: '🚄 特急鐵路 / 新幹線',
      icon: '🚄',
      durationMinutes: Math.max(25, Math.round((distanceKm / 110) * 60 + 15)),
      durationText: `約 ${Math.max(25, Math.round((distanceKm / 110) * 60 + 15))} 分鐘`,
      distanceText,
      distanceKm,
      googleMapsUrl: transitUrl,
      recommended: true,
      notes: '長途跨城推薦搭乘高速鐵路或特急列車',
    });
  }

  const universalUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originFull)}&destination=${encodeURIComponent(destFull)}`;

  return {
    originName,
    destinationName: destName,
    straightDistanceKm: distanceKm,
    googleMapsUniversalUrl: universalUrl,
    options,
  };
}

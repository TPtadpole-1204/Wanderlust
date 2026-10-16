import type { PlaceCategory, Coordinates } from '../types.ts';

export interface ParsedGoogleMapInfo {
  title: string;
  address: string;
  city?: string;
  coords?: Coordinates;
  category: PlaceCategory;
  tags: string[];
  originalUrl: string;
  resolvedUrl?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: string;
  openingHours?: string;
  phone?: string;
}

/**
 * Infers a PlaceCategory and default tags from a place title and optional address/notes.
 */
export function inferCategoryAndTags(text: string): { category: PlaceCategory; tags: string[] } {
  const lower = text.toLowerCase();
  const tags: string[] = [];

  if (/神社|寺|神宮|天滿宮|稻荷|大社|\bshrine\b|\btemple\b/.test(lower)) {
    tags.push('必訪景點', '地標名勝');
    return { category: 'sightseeing', tags };
  }

  if (
    /拉麵|ラーメン|\bramen\b|afuri|阿夫利|一蘭|ichiran|無敵家|壽司|寿司|\bsushi\b|敘々苑|叙々苑|燒肉|焼肉|\byakiniku\b|和牛|\bwagyu\b|牛たん|牛舌|利久|咖啡|カフェ|\bcafe\b|\bcoffee\b|blue bottle|藍瓶|harbs|甜點|蛋糕|居酒屋|食堂|餐廳|美食|牛丼|烏龍麵|うどん|蕎麥|そば|咖哩|カレー|天婦羅|てんぷら|海鮮|市場|築地|豐洲|串燒|炸豬排|とんかつ|鬆餅|抹茶|茶屋|\bbakery\b|麵包|\bbistro\b|\bbar\b|レストラン/.test(
      lower
    )
  ) {
    tags.push('美食探店');
    if (/咖啡|カフェ|\bcafe\b|\bcoffee\b|blue bottle|藍瓶|harbs|甜點|蛋糕|鬆餅|抹茶/.test(lower)) tags.push('下午茶');
    if (/拉麵|ラーメン|\bramen\b|afuri|阿夫利|一蘭|ichiran|無敵家/.test(lower)) tags.push('拉麵');
    if (/燒肉|焼肉|\byakiniku\b|和牛|\bwagyu\b|敘々苑|叙々苑/.test(lower)) tags.push('燒肉');
    return { category: 'food', tags };
  }

  if (
    /百貨|商場|購物|\bshopping\b|\bmall\b|\boutlet\b|ドン・キホーテ|唐吉訶德|donki|藥妝|ビックカメラ|bic camera|yodobashi|ヨドバシ|伊勢丹|isetan|丸井|parco|lumine|銀座six|表參道|竹下通|商店街|市集|セレクトショップ|古著|澀谷sky|shibuya|harajuku/.test(
      lower
    )
  ) {
    tags.push('逛街購物');
    return { category: 'shopping', tags };
  }

  if (
    /飯店|酒店|旅館|\bhotel\b|\bhostel\b|\binn\b|\bresort\b|溫泉旅館|アパホテル|\bapa\b|東橫inn|toyoko|dormy|ドーミーイン|星野|hoshino|airbnb|民宿/.test(
      lower
    )
  ) {
    tags.push('住宿推薦');
    return { category: 'stay', tags };
  }

  if (
    /迪士尼|disney|環球影城|usj|universal|teamlab|美術館|博物館|\bmuseum\b|\bgallery\b|水族館|aquarium|動物園|\bzoo\b|遊樂園|展望台|\bsky\b|\btower\b|巨蛋|\bdome\b|演唱會|展覽|劇場|吉卜力|ghibli|哈利波特|ワーナー/.test(
      lower
    )
  ) {
    tags.push('熱門體驗');
    if (/展望台|\bsky\b|\btower\b|夜景/.test(lower)) tags.push('夜景打卡');
    return { category: 'entertainment', tags };
  }

  tags.push('必訪景點');
  if (/神社|寺|神宮|天滿宮|稻荷|城|公園|庭園|山|湖|海|川|橋|鐵塔|晴空塔/.test(lower)) {
    tags.push('地標名勝');
  }
  return { category: 'sightseeing', tags };
}

/**
 * Synchronously parses a Google Maps URL or shared text snippet (e.g. from Google Maps app "Share" -> "Copy"):
 * Examples supported:
 * 1. Full URL: https://www.google.com/maps/place/淺草寺/@35.7147651,139.7966553,17z/data=!3m1!4b1!4m6!3m5!1s0x60188ec1a4463df1:0x6c0d289a8292810d!8m2!3d35.7147651!4d139.7966553
 * 2. Search URL: https://www.google.com/maps/search/?api=1&query=AFURI+Harajuku
 * 3. Query params: https://maps.google.com/?q=東京鐵塔&ll=35.6585805,139.7454329
 * 4. Mobile share text with short link:
 *    "AFURI 原宿 (阿夫利)
 *    1 Chome-1-7 Jingumae, Shibuya City, Tokyo
 *    https://maps.app.goo.gl/xyz123"
 * 5. Coordinates in `@lat,lng` or `!3dlat!4dlng`
 */
/**
 * Unwraps Google Consent redirect URLs (`https://consent.google.com/ml?continue=...`)
 * and recursively decodes URL-encoded characters up to 2 times.
 */
export function unwrapGoogleMapsUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  try {
    const u = new URL(url);
    if (u.hostname.includes('consent.google') && u.searchParams.get('continue')) {
      url = u.searchParams.get('continue') || url;
    } else if (u.searchParams.get('link') && u.searchParams.get('link')!.includes('google.com/maps')) {
      url = u.searchParams.get('link')!;
    }
  } catch {
    // ignore
  }
  // Decode percent-encoded URLs up to 2 times if needed
  for (let i = 0; i < 2; i++) {
    try {
      if (url.includes('%25') || url.includes('%3A') || url.includes('%2F')) {
        url = decodeURIComponent(url);
      }
    } catch {
      break;
    }
  }
  return url;
}

export function parseGoogleMapsInput(rawInput: string, fallbackCity = '東京'): ParsedGoogleMapInfo | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Extract all URLs if present (prefer a full google.com/maps URL over a short goo.gl URL if both exist)
  const allUrls = trimmed.match(/https?:\/\/[^\s]+/gi) || [];
  const unwrappedUrls = allUrls.map(unwrapGoogleMapsUrl);
  const fullMapsUrl = unwrappedUrls.find((u) => /google\.[a-z.]+\/maps/i.test(u));
  const extractedUrl = fullMapsUrl || unwrappedUrls[0] || '';
  const originalShortOrFirstUrl = allUrls[0] || '';

  // Also check if user pasted multi-line share text from mobile Google Maps app
  const nonUrlLines = trimmed
    .replace(/https?:\/\/[^\s]+/gi, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let title = '';
  let address = '';
  let coords: Coordinates | undefined;

  if (extractedUrl) {
    try {
      const decodedUrl = decodeURIComponent(extractedUrl.replace(/\+/g, ' '));

      // 1. Extract accurate pin coordinates from `!3d<lat>!4d<lng>` first (this is the actual place pin, whereas @lat,lng is viewport center)
      const pinMatch = decodedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (pinMatch) {
        coords = {
          lat: parseFloat(pinMatch[1]),
          lng: parseFloat(pinMatch[2]),
        };
      } else {
        // Fallback to `@lat,lng` viewport center
        const atMatch = decodedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
          coords = {
            lat: parseFloat(atMatch[1]),
            lng: parseFloat(atMatch[2]),
          };
        }
      }

      // 2. Extract place name from `/maps/place/<PlaceName>/`
      const placePathMatch = decodedUrl.match(/\/maps\/place\/([^/@?]+)/i);
      if (placePathMatch && placePathMatch[1]) {
        const rawPlace = placePathMatch[1].trim();
        title = rawPlace;
      }

      // 3. Extract from `/maps/search/<Query>`
      if (!title) {
        const searchPathMatch = decodedUrl.match(/\/maps\/search\/([^/@?]+)/i);
        if (searchPathMatch && searchPathMatch[1] && searchPathMatch[1] !== '') {
          title = searchPathMatch[1].trim();
        }
      }

      // 4. Check URL query parameters (`q`, `query`, `ll`, `center`, `destination`)
      const urlObj = new URL(extractedUrl);
      const qParam =
        urlObj.searchParams.get('query') ||
        urlObj.searchParams.get('q') ||
        urlObj.searchParams.get('destination') ||
        urlObj.searchParams.get('daddr');

      if (qParam) {
        const cleanQ = decodeURIComponent(qParam.replace(/\+/g, ' ')).trim();
        const coordOnlyMatch = cleanQ.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
        if (coordOnlyMatch) {
          if (!coords) {
            coords = {
              lat: parseFloat(coordOnlyMatch[1]),
              lng: parseFloat(coordOnlyMatch[2]),
            };
          }
        } else if (!title) {
          title = cleanQ;
        } else if (!address && cleanQ !== title) {
          address = cleanQ;
        }
      }

      const llParam = urlObj.searchParams.get('ll') || urlObj.searchParams.get('center');
      if (llParam && !coords) {
        const llMatch = llParam.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (llMatch) {
          coords = {
            lat: parseFloat(llMatch[1]),
            lng: parseFloat(llMatch[2]),
          };
        }
      }
    } catch {
      // Ignore malformed URL parsing errors and fall back to text lines
    }
  }

  // Merge with non-URL lines if available (e.g., from mobile share text or when short URL has no path info)
  let extractedRating: number | undefined;
  const ratingTextMatch =
    trimmed.match(/(?:★|⭐)\s*([1-5](?:\.\d)?)/) ||
    trimmed.match(/\b([1-5]\.\d)\s*(?:★|⭐|顆星|分|\([\d,]+\))/) ||
    trimmed.match(/(?:評分|Rating)[:：\s]*([1-5](?:\.\d)?)/i);
  if (ratingTextMatch && ratingTextMatch[1]) {
    const r = parseFloat(ratingTextMatch[1]);
    if (r >= 1 && r <= 5) extractedRating = r;
  } else {
    const starsOnlyMatch = trimmed.match(/(★{1,5})(☆{0,4})/);
    if (starsOnlyMatch && starsOnlyMatch[1]) {
      extractedRating = starsOnlyMatch[1].length;
    }
  }

  if (nonUrlLines.length > 0) {
    // Filter out lines that are purely star ratings like "4.5 ★★★★★ (15,680)"
    const cleanNonUrlLines = nonUrlLines.filter(
      (l) => !/^[1-5](\.\d)?\s*[★☆⭐\s()0-9,，]+$/.test(l) && !/^[★☆⭐\s]+$/.test(l)
    );
    // Detect if any line is a phone number
    let phoneFound: string | undefined;
    const remainingLines: string[] = [];
    for (const l of cleanNonUrlLines) {
      const phoneMatch = l.match(/(?:電話|TEL|Phone)?[:：\s]*(\+?\d{1,4}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{3,9})/i);
      if (phoneMatch && !phoneFound && l.replace(/[^\d+]/g, '').length >= 8) {
        phoneFound = phoneMatch[1].trim();
      } else {
        remainingLines.push(l);
      }
    }

    const linesToUse = remainingLines.length > 0 ? remainingLines : cleanNonUrlLines;
    if (!title) {
      title = linesToUse[0].replace(/^["「『]|["」』]$/g, '').trim();
      if (linesToUse.length > 1) {
        address = linesToUse.slice(1).join(', ').trim();
      }
    } else if (!address) {
      address = linesToUse.join(', ').trim();
    }
  }

  // If title has a middle-dot (`·`) or comma embedded with address, split title and address cleanly
  if (title && !address) {
    if (title.includes('·')) {
      const dotParts = title.split('·').map((s) => s.trim()).filter(Boolean);
      if (dotParts.length >= 2) {
        title = dotParts[0];
        address = dotParts.slice(1).join(', ');
      }
    } else {
      const parts = title.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        title = parts[0];
        address = parts.slice(1).join(', ');
      }
    }
  }

  // Check if trimmed raw text has explicit phone pattern
  let extractedPhone: string | undefined;
  const explicitPhoneMatch = trimmed.match(
    /(?:電話|TEL|Phone|Tel)[:：\s]+(\+?\d{1,4}[- ]\d{1,4}[- ]\d{3,8}(?:[- ]\d{1,6})?)/i
  );
  if (explicitPhoneMatch && explicitPhoneMatch[1].replace(/[^\d+]/g, '').length >= 8) {
    extractedPhone = explicitPhoneMatch[1].trim();
  } else {
    const rawPhoneMatch = trimmed.match(
      /(?:^|\n)\s*(?:電話|TEL|Phone|Tel)?[:：\s]*(\+?\d{2,4}[- ]\d{1,4}[- ]\d{3,8}(?:[- ]\d{1,6})?)/i
    );
    if (rawPhoneMatch && rawPhoneMatch[1].replace(/[^\d+]/g, '').length >= 9) {
      extractedPhone = rawPhoneMatch[1].trim();
    }
  }

  if (!title && !coords && !extractedUrl) {
    return null;
  }

  const finalTitle = title || (coords ? `Google 地圖標記 (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : '');
  const finalAddress = address || finalTitle;
  const { category, tags } = inferCategoryAndTags(`${finalTitle} ${finalAddress}`);

  return {
    title: finalTitle,
    address: finalAddress,
    city: fallbackCity,
    coords,
    category,
    tags,
    originalUrl: originalShortOrFirstUrl || extractedUrl || trimmed,
    resolvedUrl: fullMapsUrl,
    rating: extractedRating,
    phone: extractedPhone,
  };
}

/**
 * Enriches a parsed Google Map entry using:
 * 1. Local server `/api/resolve-gmap` (instant HTTP 302 redirect inspection + real star rating & hours)
 * 2. Public CORS-friendly `unshorten.me/json/...` (with Google Consent URL unwrapping)
 * 3. Public `r.jina.ai` Google Maps place reader (extracts exact decimal star rating e.g. 4.5, review count, and opening hours)
 * 4. Public `api.microlink.io` OpenGraph metadata fallback (extracts place title, address, star count, and thumbnail photo)
 * 5. OpenStreetMap Nominatim reverse/forward geocoding for full localized address & coordinates
 */
export async function resolveAndEnrichGoogleMapsInput(
  rawInput: string,
  fallbackCity = '東京'
): Promise<ParsedGoogleMapInfo> {
  let workingInput = rawInput.trim();
  let resolvedUrl: string | undefined;
  let extractedImageUrl: string | undefined;
  let extractedMicrolinkAddress: string | undefined;
  let extractedRating: number | undefined;
  let extractedReviewCount: string | undefined;
  let extractedOpeningHours: string | undefined;

  // Check if it contains a shortened Google Maps link (maps.app.goo.gl or goo.gl/maps)
  const shortUrlMatch = workingInput.match(/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\/[^\s]+/i);
  const hasNonUrlTitle = workingInput.replace(/https?:\/\/[^\s]+/gi, '').trim().length > 0;

  if (shortUrlMatch) {
    const shortUrl = shortUrlMatch[0];

    // Strategy A: Try local dev/server endpoint `/api/resolve-gmap` first (fast, preserves zh-TW place name + exact rating)
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const localResp = await fetch(`/api/resolve-gmap?url=${encodeURIComponent(shortUrl)}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (localResp.ok) {
        const contentType = localResp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await localResp.json();
          if (data?.resolvedUrl && data.resolvedUrl !== shortUrl) {
            resolvedUrl = unwrapGoogleMapsUrl(data.resolvedUrl);
            workingInput = `${workingInput}\n${resolvedUrl}`;
          }
          if (typeof data?.rating === 'number' && data.rating >= 1 && data.rating <= 5) {
            extractedRating = data.rating;
          }
          if (data?.reviewCount) {
            extractedReviewCount = data.reviewCount;
          }
          if (data?.openingHours) {
            extractedOpeningHours = data.openingHours;
          }
          if (data?.imageUrl) {
            extractedImageUrl = data.imageUrl;
          }
        }
      }
    } catch {
      // Ignore if running on static GitHub Pages without /api/resolve-gmap
    }

    // Strategy B: Try `unshorten.me` JSON endpoint (works on static GitHub Pages with CORS `*`)
    if (!resolvedUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const unshortenResp = await fetch(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (unshortenResp.ok) {
          const data = await unshortenResp.json();
          if (data?.resolved_url) {
            const unwrapped = unwrapGoogleMapsUrl(data.resolved_url);
            if (unwrapped && unwrapped !== shortUrl) {
              resolvedUrl = unwrapped;
              workingInput = `${workingInput}\n${resolvedUrl}`;
            }
          }
        }
      } catch {
        // Ignore network errors and try Strategy C
      }
    }

    // Strategy C: Try `api.microlink.io` to get OpenGraph title, address, and place thumbnail image
    if (!resolvedUrl || !hasNonUrlTitle || !extractedImageUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3800);
        const mlResp = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(shortUrl)}`, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (mlResp.ok) {
          const mlData = await mlResp.json();
          const ogTitle: string = mlData?.data?.title || '';
          const ogDesc: string = mlData?.data?.description || '';
          const ogImg: string = mlData?.data?.image?.url || '';
          if (ogImg && ogImg.startsWith('http') && !ogImg.includes('web_maps_icon')) {
            extractedImageUrl = ogImg;
          }
          if (!extractedRating && ogDesc) {
            const decMatch = ogDesc.match(/\b([1-5]\.\d)\b/);
            if (decMatch) {
              extractedRating = parseFloat(decMatch[1]);
            } else {
              const starMatch = ogDesc.match(/(★{1,5})/);
              if (starMatch) {
                extractedRating = starMatch[1].length;
              }
            }
          }
          if (ogTitle && !/^Google (Maps|地圖)$/i.test(ogTitle.trim())) {
            const cleanOg = ogTitle.replace(/\s*-\s*Google (Maps|地圖).*$/i, '').trim();
            if (cleanOg.includes('·')) {
              const dotParts = cleanOg.split('·').map((s) => s.trim()).filter(Boolean);
              if (dotParts.length >= 2) {
                extractedMicrolinkAddress = dotParts.slice(1).join(', ');
              }
            }
            if (!resolvedUrl && cleanOg) {
              workingInput = `${cleanOg}\n${workingInput}`;
            }
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }

  const parsed = parseGoogleMapsInput(workingInput, fallbackCity);
  if (!parsed) {
    throw new Error('無法從輸入的內容識別出有效的 Google 地圖網址或景點資訊');
  }

  if (resolvedUrl) {
    parsed.resolvedUrl = resolvedUrl;
  }

  // If we have a full Google Maps `/maps/place/` URL (either directly pasted or resolved via unshorten.me on GitHub Pages)
  // and we still don't have the exact decimal rating (or openingHours), fetch via CORS-friendly `r.jina.ai`
  const targetPlaceUrl = parsed.resolvedUrl || parsed.originalUrl;
  if (
    targetPlaceUrl &&
    /google\.[a-z.]+\/maps\/place\//i.test(targetPlaceUrl) &&
    (extractedRating === undefined || Number.isInteger(extractedRating))
  ) {
    try {
      const u = new URL(targetPlaceUrl);
      const cleanPlaceUrl = u.origin + u.pathname;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const jinaResp = await fetch(`https://r.jina.ai/${cleanPlaceUrl}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (jinaResp.ok) {
        const jinaData = await jinaResp.json();
        const content: string = jinaData?.data?.content || '';
        const mRating =
          content.match(/5\s+4\s+3\s+2\s+1\s+([1-5]\.\d)/) ||
          content.match(/\b([1-5]\.\d)\s*\n+\s*\([\d,]+\)/);
        if (mRating && mRating[1]) {
          const rVal = parseFloat(mRating[1]);
          if (rVal >= 1 && rVal <= 5) extractedRating = rVal;
        }
        const mReviews = content.match(/\(([\d,]{1,9})\)/);
        if (mReviews && mReviews[1]) {
          extractedReviewCount = mReviews[1];
        }
        const mHours = content.match(
          /(\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*[–-]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)|\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2})/i
        );
        if (mHours && mHours[1] && !extractedOpeningHours) {
          extractedOpeningHours = mHours[1].trim();
        }
      }
    } catch {
      // Ignore Jina network errors
    }
  }

  if (extractedImageUrl) {
    parsed.imageUrl = extractedImageUrl;
  }
  if (extractedRating !== undefined) {
    parsed.rating = extractedRating;
  }
  if (extractedReviewCount) {
    parsed.reviewCount = extractedReviewCount;
  }
  if (extractedOpeningHours) {
    parsed.openingHours = extractedOpeningHours;
  }

  // If we have coordinates, or if we have a place title without coordinates/address, try Nominatim to enrich address & coords
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    if (parsed.coords) {
      // Reverse geocode for full address or when title is still missing/generic
      if (!parsed.address || parsed.address === parsed.title || !parsed.title || parsed.title.startsWith('Google 地圖標記')) {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsed.coords.lat}&lon=${parsed.coords.lng}&zoom=18&addressdetails=1`;
        const resp = await fetch(revUrl, {
          headers: { 'Accept-Language': 'zh-TW,ja,en' },
          signal: controller.signal,
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.display_name) {
            parsed.address = data.display_name;
          }
          if ((!parsed.title || parsed.title.startsWith('Google 地圖標記')) && (data?.name || data?.address?.amenity || data?.address?.tourism)) {
            parsed.title = data.name || data.address?.amenity || data.address?.tourism;
          }
          const detectedCity = data?.address?.city || data?.address?.town || data?.address?.province || data?.address?.state;
          if (detectedCity) {
            parsed.city = detectedCity.replace(/[都道府県市]$/, '');
          }
        }
      }
    } else if (parsed.title) {
      // Forward geocode the place title (or address) to get accurate coordinates
      const q = parsed.address && parsed.address !== parsed.title ? `${parsed.title}, ${parsed.address}` : `${parsed.title} ${fallbackCity.split(' ')[0]}`.trim();
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
      const resp = await fetch(searchUrl, {
        headers: { 'Accept-Language': 'zh-TW,ja,en' },
        signal: controller.signal,
      });
      if (resp.ok) {
        const results = await resp.json();
        if (Array.isArray(results) && results.length > 0) {
          const best = results[0];
          parsed.coords = {
            lat: parseFloat(best.lat),
            lng: parseFloat(best.lon),
          };
          if (!parsed.address || parsed.address === parsed.title) {
            parsed.address = best.display_name || parsed.title;
          }
        }
      }
    }
    clearTimeout(timer);
  } catch {
    // Graceful fallback if offline or rate-limited
  }

  if ((!parsed.address || parsed.address === parsed.title) && extractedMicrolinkAddress) {
    parsed.address = extractedMicrolinkAddress;
  }

  // Re-evaluate category & tags once title and address are fully enriched
  const enrichedCategory = inferCategoryAndTags(`${parsed.title} ${parsed.address}`);
  parsed.category = enrichedCategory.category;
  parsed.tags = enrichedCategory.tags;

  return parsed;
}

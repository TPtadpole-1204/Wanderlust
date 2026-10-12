import { DEFAULT_RATES, POPULAR_CURRENCIES } from './storage.ts';

export interface ExchangeRateTable {
  rates: Record<string, number>; // relative to TWD (1 TWD = X currency)
  lastUpdated: string;
}

const STORAGE_KEY_RATES = 'travel_planner_rates';

let cachedRates: ExchangeRateTable = {
  rates: { ...DEFAULT_RATES },
  lastUpdated: new Date().toISOString(),
};

try {
  const storedRates = localStorage.getItem(STORAGE_KEY_RATES);
  if (storedRates) {
    const parsed = JSON.parse(storedRates);
    if (parsed && parsed.rates) {
      cachedRates = parsed;
    }
  }
} catch (e) {
  console.warn('Could not load cached rates', e);
}

export function getCachedRates(): ExchangeRateTable {
  return cachedRates;
}

function saveRatesToStorage(rates: ExchangeRateTable) {
  try {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates));
  } catch (e) {
    console.warn('Could not save rates', e);
  }
}

export function updateCustomRate(currencyCode: string, rateToBaseTWD: number): void {
  cachedRates.rates[currencyCode] = rateToBaseTWD;
  cachedRates.lastUpdated = new Date().toISOString();
  saveRatesToStorage(cachedRates);
}

/**
 * Convert amount from source currency to target currency
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = cachedRates.rates
): number {
  if (fromCurrency === toCurrency || amount === 0) return amount;

  const rateFrom = rates[fromCurrency] || 1;
  const rateTo = rates[toCurrency] || 1;

  // Convert from source to TWD (base), then from TWD to target
  // e.g. from JPY to TWD: amount / rateFrom (amount / 4.72)
  // e.g. from TWD to USD: amount * rateTo (amount * 0.031)
  const amountInTWD = fromCurrency === 'TWD' ? amount : amount / rateFrom;
  const targetAmount = toCurrency === 'TWD' ? amountInTWD : amountInTWD * rateTo;

  return Math.round(targetAmount * 100) / 100;
}



export async function fetchLiveRates(): Promise<{ success: boolean; rates: Record<string, number>; message: string }> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/TWD');
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    if (data && data.rates) {
      cachedRates = {
        rates: {
          ...DEFAULT_RATES,
          JPY: data.rates.JPY || DEFAULT_RATES.JPY,
          USD: data.rates.USD || DEFAULT_RATES.USD,
          EUR: data.rates.EUR || DEFAULT_RATES.EUR,
          KRW: data.rates.KRW || DEFAULT_RATES.KRW,
          THB: data.rates.THB || DEFAULT_RATES.THB,
          GBP: data.rates.GBP || DEFAULT_RATES.GBP,
          SGD: data.rates.SGD || DEFAULT_RATES.SGD,
          HKD: data.rates.HKD || DEFAULT_RATES.HKD,
          TWD: 1,
        },
        lastUpdated: new Date().toISOString(),
      };
      saveRatesToStorage(cachedRates);
      return { success: true, rates: cachedRates.rates, message: '匯率已更新至即時牌告匯率' };
    }
  } catch {
    // silently fallback
  }
  return { success: false, rates: cachedRates.rates, message: '無法取得最新匯率，使用離線基準' };
}

export function formatMoney(amount: number, currency: string = 'TWD'): string {
  const curr = POPULAR_CURRENCIES.find((c) => c.code === currency);
  const symbol = curr ? curr.symbol : currency;
  const formatted = new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: currency === 'JPY' || currency === 'KRW' || currency === 'TWD' ? 0 : 2,
  }).format(amount);

  return `${symbol} ${formatted}`;
}

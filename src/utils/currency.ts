export interface CountryCurrencyOption {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
}

export const COUNTRY_CURRENCIES: CountryCurrencyOption[] = [
  { countryCode: 'RW', countryName: 'Rwanda', currency: 'RWF', symbol: 'RWF' },
  { countryCode: 'US', countryName: 'United States', currency: 'USD', symbol: '$' },
  { countryCode: 'KE', countryName: 'Kenya', currency: 'KES', symbol: 'KSh' },
  { countryCode: 'UG', countryName: 'Uganda', currency: 'UGX', symbol: 'UGX' },
  { countryCode: 'TZ', countryName: 'Tanzania', currency: 'TZS', symbol: 'TZS' },
  { countryCode: 'BI', countryName: 'Burundi', currency: 'BIF', symbol: 'BIF' },
  { countryCode: 'CD', countryName: 'DR Congo', currency: 'CDF', symbol: 'CDF' },
  { countryCode: 'NG', countryName: 'Nigeria', currency: 'NGN', symbol: '₦' },
  { countryCode: 'GH', countryName: 'Ghana', currency: 'GHS', symbol: 'GH₵' },
  { countryCode: 'ZA', countryName: 'South Africa', currency: 'ZAR', symbol: 'R' },
  { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { countryCode: 'EU', countryName: 'Europe (Eurozone)', currency: 'EUR', symbol: '€' },
  { countryCode: 'CA', countryName: 'Canada', currency: 'CAD', symbol: 'CA$' },
  { countryCode: 'IN', countryName: 'India', currency: 'INR', symbol: '₹' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', currency: 'AED', symbol: 'AED' },
  { countryCode: 'AU', countryName: 'Australia', currency: 'AUD', symbol: 'A$' },
];

export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  RWF: 1385,
  KES: 129.2,
  UGX: 3690,
  TZS: 2660,
  BIF: 2940,
  CDF: 2850,
  NGN: 1650,
  GHS: 16.1,
  ZAR: 18.1,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.4,
  INR: 84.4,
  AED: 3.67,
  AUD: 1.54,
};

const ZERO_DECIMAL_CURRENCIES = new Set(['RWF', 'UGX', 'TZS', 'BIF', 'CDF', 'NGN']);

export function detectDefaultCountryCode(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzMap: Record<string, string> = {
      'Africa/Kigali': 'RW',
      'Africa/Nairobi': 'KE',
      'Africa/Kampala': 'UG',
      'Africa/Dar_es_Salaam': 'TZ',
      'Africa/Bujumbura': 'BI',
      'Africa/Kinshasa': 'CD',
      'Africa/Lubumbashi': 'CD',
      'Africa/Lagos': 'NG',
      'Africa/Accra': 'GH',
      'Africa/Johannesburg': 'ZA',
      'Europe/London': 'GB',
      'Asia/Kolkata': 'IN',
      'Asia/Dubai': 'AE',
    };
    if (tzMap[tz]) return tzMap[tz];
    if (tz.startsWith('Europe/')) return 'EU';
    if (tz.startsWith('Australia/')) return 'AU';

    const lang = typeof navigator !== 'undefined' ? navigator.language || '' : '';
    const region = lang.split('-')[1]?.toUpperCase();
    if (region && COUNTRY_CURRENCIES.some((c) => c.countryCode === region)) {
      return region;
    }
  } catch {
    // fallback below
  }
  return 'RW';
}

export function convertFromUsd(
  usdAmount: number,
  currency: string,
  rates: Record<string, number>
): number {
  const rate = rates[currency] ?? FALLBACK_EXCHANGE_RATES[currency] ?? 1;
  const raw = usdAmount * rate;
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(raw);
  }
  return Math.round(raw * 100) / 100;
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return `${Math.round(amount).toLocaleString()} ${currency}`;
  }
  const option = COUNTRY_CURRENCIES.find((c) => c.currency === currency);
  const symbol = option?.symbol || `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

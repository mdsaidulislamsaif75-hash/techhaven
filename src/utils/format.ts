import { CURRENCY_CONFIG } from '../data/mockData';
import { CountryCode, CurrencyCode, PaymentMethod } from '../types/store';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Credit / Debit Card',
  paypal: 'PayPal Express',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  payoneer: 'Payoneer Global',
  cod: 'Cash on Delivery (COD)',
};

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] || 'Credit / Debit Card';
}

export function getPaymentStatusLabel(method: PaymentMethod): 'Pay on Delivery' | 'Paid' {
  return method === 'cod' ? 'Pay on Delivery' : 'Paid';
}

export function convertUsdToCurrency(amountUsd: number, currency: CurrencyCode): number {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  return amountUsd * cfg.rate;
}

export function formatPrice(amountUsd: number, currency: CurrencyCode): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const converted = amountUsd * cfg.rate;
  const formatted = converted.toLocaleString('en-US', {
    minimumFractionDigits: converted >= 1000 && Number.isInteger(Math.round(converted)) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${cfg.symbol}${formatted}`;
}

export function getDiscountPercent(priceUsd: number, originalPriceUsd?: number): number {
  if (!originalPriceUsd || originalPriceUsd <= priceUsd) return 0;
  return Math.round(((originalPriceUsd - priceUsd) / originalPriceUsd) * 100);
}

export function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `id-${Date.now()}`;
}

export function formatFullAddress(addr: {
  streetAddress: string;
  apartment?: string;
  city: string;
  region: string;
  postalCode: string;
  country: CountryCode;
}): string {
  const countryNames: Record<CountryCode, string> = {
    US: 'United States',
    AE: 'United Arab Emirates',
    GB: 'United Kingdom',
    CA: 'Canada',
  };
  const line1 = addr.apartment ? `${addr.streetAddress}, ${addr.apartment}` : addr.streetAddress;
  return `${line1}, ${addr.city}, ${addr.region} ${addr.postalCode}, ${countryNames[addr.country]}`;
}

export interface PromoEvaluation {
  valid: boolean;
  code: string;
  discountUsd: number;
  freeShipping: boolean;
  label: string;
}

export function evaluatePromoCode(rawCode: string, subtotalUsd: number): PromoEvaluation {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, code: '', discountUsd: 0, freeShipping: false, label: '' };
  }
  if (code === 'SAVE10') {
    return {
      valid: true,
      code: 'SAVE10',
      discountUsd: Number((subtotalUsd * 0.1).toFixed(2)),
      freeShipping: false,
      label: '10% Instant Discount Applied',
    };
  }
  if (code === 'FREESHIP') {
    return {
      valid: true,
      code: 'FREESHIP',
      discountUsd: 0,
      freeShipping: true,
      label: 'Free International Shipping Applied',
    };
  }
  return {
    valid: false,
    code,
    discountUsd: 0,
    freeShipping: false,
    label: 'Invalid promo code. Try SAVE10 or FREESHIP.',
  };
}

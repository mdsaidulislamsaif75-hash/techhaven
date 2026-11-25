export type CurrencyCode = 'USD' | 'AED' | 'GBP' | 'CAD';

export type CountryCode = 'US' | 'AE' | 'GB' | 'CA';

export type PhoneDialCode = '+1' | '+971' | '+44';

export type ThemeMode = 'dark' | 'light';

export type AppPage = 'home' | 'shop' | 'product' | 'checkout' | 'account';

export type AccountTab = 'manage' | 'orders' | 'wishlist' | 'reviews' | 'returns';

export type ShippingTier = 'standard' | 'express';

export type PaymentMethod = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'payoneer' | 'cod';

export type AuthTabMode = 'signup' | 'login';

export interface CustomerSession {
  uid: string;
  displayName: string;
  email: string;
  phoneCode?: PhoneDialCode;
  phone?: string;
  photoURL?: string;
  preferredCurrency: CurrencyCode;
  provider: 'email' | 'google' | 'apple' | 'demo';
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested';

export interface ProductColorVariant {
  name: string;
  hex: string;
  image: string;
}

export interface ProductSizeVariant {
  label: string;
  priceDeltaUsd: number;
  skuSuffix: string;
  stock: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: string;
  isFromFirestore?: boolean;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  question: string;
  answer?: string;
  createdAt: string;
  isFromFirestore?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  brand: string;
  categoryId: string;
  category: string;
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  priceUsd: number;
  originalPriceUsd?: number;
  badge?: 'NEW' | 'SALE' | 'HOT';
  rating: number;
  reviewCount: number;
  stock: number;
  viewerCount: number;
  isFlashSale?: boolean;
  flashSoldPercent?: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isTopRated?: boolean;
  images: string[];
  colors: ProductColorVariant[];
  sizes: ProductSizeVariant[];
  compatibilityNote?: string;
  frequentlyBoughtWith: string[];
  reviews: ProductReview[];
  questions: ProductQuestion[];
}

export interface CategoryInfo {
  id: string;
  name: string;
  tagline: string;
  image: string;
  count: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantSku: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Office' | 'Other';
  country: CountryCode;
  fullName: string;
  email: string;
  phoneCode: PhoneDialCode;
  phone: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  region: string;
  postalCode: string;
  isDefault: boolean;
}

export interface OrderItemSnapshot {
  productId: string;
  title: string;
  variantSku: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPriceUsd: number;
  image: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  country: CountryCode;
  shippingTier: ShippingTier;
  courierName: string;
  trackingNumber: string;
  shippingAddress: string;
  deliveryNote?: string;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  subtotalUsd: number;
  discountUsd: number;
  shippingUsd: number;
  totalUsd: number;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  createdAt: string;
  isSample?: boolean;
}

export interface ShopFilters {
  query: string;
  categories: string[];
  brands: string[];
  minPriceUsd: number;
  maxPriceUsd: number;
  colors: string[];
  sizes: string[];
  minRating: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sortBy: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'error';
}

export interface SavedPaymentCard {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Amex';
  last4: string;
  expiry: string;
  holderName: string;
  isDefault: boolean;
}

export type LinkedWalletId = 'paypal' | 'payoneer' | 'apple_pay' | 'google_pay';

export interface LinkedWalletState {
  id: LinkedWalletId;
  label: string;
  connected: boolean;
  accountHint?: string;
}

export interface CommunicationPrefs {
  newsletter: boolean;
  smsOrderAlerts: boolean;
  backInStock: boolean;
}

export interface OfficialStore {
  id: string;
  name: string;
  brand: string;
  tagline: string;
  followersCount: number;
  verified: boolean;
  rating: number;
  badge: string;
}

export interface ReturnRequestRecord {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productTitle: string;
  productImage: string;
  reason: string;
  details?: string;
  status: 'Processing' | 'Approved' | 'Refunded';
  refundAmountUsd: number;
  createdAt: string;
}

export interface DeviceSessionRecord {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface CustomerAccountExtras {
  avatarUrl?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  defaultBillingAddressId?: string;
  savedCards: SavedPaymentCard[];
  linkedWallets: LinkedWalletState[];
  twoFactorEnabled: boolean;
  communicationPrefs: CommunicationPrefs;
  followedStoreIds: string[];
  returnRequests: ReturnRequestRecord[];
  cancellationReasons: Record<string, string>;
  deviceSessions: DeviceSessionRecord[];
}

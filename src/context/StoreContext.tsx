import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  COUNTRY_CONFIG,
  DEFAULT_ACCOUNT_EXTRAS,
  EXPRESS_SHIPPING_USD,
  FREE_SHIPPING_THRESHOLD_USD,
  IMG,
  OFFICIAL_STORES,
  PRODUCTS,
  SAMPLE_ADDRESSES,
  SAMPLE_ORDERS,
  STANDARD_SHIPPING_USD,
} from '../data/mockData';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import {
  AccountTab,
  AppPage,
  AuthTabMode,
  CartItem,
  CommunicationPrefs,
  CountryCode,
  CurrencyCode,
  CustomerAccountExtras,
  LinkedWalletId,
  OrderItemSnapshot,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  PhoneDialCode,
  Product,
  ProductQuestion,
  ProductReview,
  ReturnRequestRecord,
  SavedAddress,
  SavedPaymentCard,
  ShippingTier,
  ShopFilters,
  ThemeMode,
  ToastMessage,
} from '../types/store';
import { clampString, evaluatePromoCode, sanitizeId } from '../utils/format';
import { useAuth } from './AuthContext';

export const DEFAULT_FILTERS: ShopFilters = {
  query: '',
  categories: [],
  brands: [],
  minPriceUsd: 0,
  maxPriceUsd: 3000,
  colors: [],
  sizes: [],
  minRating: 0,
  inStockOnly: false,
  onSaleOnly: false,
  sortBy: 'featured',
};

const STORAGE_KEYS = {
  theme: 'th_theme_v1',
  currency: 'th_currency_intl_v2',
  cart: 'th_cart_intl_v2',
  wishlist: 'th_wishlist_v1',
  compare: 'th_compare_v1',
  recentViews: 'th_recent_views_v1',
  recentSearches: 'th_recent_searches_v1',
  addresses: 'th_addresses_intl_v2',
  orders: 'th_orders_intl_v2',
  sampleStatusOverrides: 'th_sample_order_overrides_v1',
  helpfulVotes: 'th_helpful_votes_v1',
  localReviews: 'th_local_reviews_v1',
  localQuestions: 'th_local_questions_v1',
  promo: 'th_promo_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

interface StoreContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  page: AppPage;
  navigate: (p: AppPage, opts?: { productId?: string; categoryId?: string; accountTab?: AccountTab; query?: string }) => void;
  selectedProductId: string;
  accountTab: AccountTab;
  setAccountTab: (tab: AccountTab) => void;
  shopFilters: ShopFilters;
  setShopFilters: React.Dispatch<React.SetStateAction<ShopFilters>>;
  resetShopFilters: () => void;
  cart: CartItem[];
  cartCount: number;
  cartSubtotalUsd: number;
  promoCode: string;
  applyPromoCode: (code: string) => { valid: boolean; message: string };
  clearPromoCode: () => void;
  addToCart: (product: Product, opts?: { colorName?: string; sizeName?: string; quantity?: number }) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  saveCartItemForLater: (itemId: string) => void;
  clearCart: () => void;
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  recentViewIds: string[];
  trackProductView: (productId: string) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  addresses: SavedAddress[];
  saveAddress: (addr: Omit<SavedAddress, 'id'> & { id?: string }) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultShippingAddress: (id: string) => Promise<void>;
  setDefaultBillingAddress: (id: string) => void;
  accountExtras: CustomerAccountExtras;
  updateAccountExtras: (partial: Partial<CustomerAccountExtras>) => void;
  addSavedCard: (card: Omit<SavedPaymentCard, 'id'>) => void;
  setDefaultSavedCard: (cardId: string) => void;
  removeSavedCard: (cardId: string) => void;
  toggleLinkedWallet: (walletId: LinkedWalletId, accountHint?: string) => void;
  toggleTwoFactor: () => void;
  revokeDeviceSession: (sessionId: string) => void;
  updateCommunicationPrefs: (partial: Partial<CommunicationPrefs>) => void;
  toggleFollowStore: (storeId: string) => void;
  orders: OrderRecord[];
  placeOrder: (payload: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    country: CountryCode;
    shippingTier: ShippingTier;
    shippingAddress: string;
    deliveryNote?: string;
    paymentMethod: PaymentMethod;
  }) => Promise<OrderRecord>;
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus, reasonNote?: string) => Promise<void>;
  submitReturnRequest: (payload: {
    orderId: string;
    productId: string;
    reason: string;
    details?: string;
  }) => Promise<ReturnRequestRecord | null>;
  reorderItems: (order: OrderRecord) => void;
  getReviewsForProduct: (productId: string) => ProductReview[];
  getUserReviews: () => ProductReview[];
  addReview: (payload: { productId: string; rating: number; title: string; comment: string; authorName: string }) => Promise<void>;
  updateReview: (review: ProductReview, payload: { rating: number; title: string; comment: string }) => Promise<void>;
  deleteReview: (review: ProductReview) => Promise<void>;
  upvoteReview: (review: ProductReview) => Promise<void>;
  helpfulVotedIds: string[];
  getQuestionsForProduct: (productId: string) => ProductQuestion[];
  addQuestion: (payload: { productId: string; question: string; authorName: string }) => Promise<void>;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  wishlistOpen: boolean;
  setWishlistOpen: (v: boolean) => void;
  compareOpen: boolean;
  setCompareOpen: (v: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (p: Product | null) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;
  authModalTab: AuthTabMode;
  setAuthModalTab: (tab: AuthTabMode) => void;
  authModalContext: 'checkout' | 'general';
  pendingCheckoutRedirect: boolean;
  openAuthModal: (opts?: { tab?: AuthTabMode; context?: 'checkout' | 'general'; redirectToCheckout?: boolean }) => void;
  closeAuthModal: () => void;
  policyModal: string | null;
  setPolicyModal: (v: string | null) => void;
  invoiceOrder: OrderRecord | null;
  setInvoiceOrder: (o: OrderRecord | null) => void;
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, profile, authReady, updateProfileFields } = useAuth();

  const [theme, setTheme] = useState<ThemeMode>(() => readStorage<ThemeMode>(STORAGE_KEYS.theme, 'dark'));
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = readStorage<string>(STORAGE_KEYS.currency, 'USD');
    return saved === 'AED' || saved === 'GBP' || saved === 'CAD' ? saved : 'USD';
  });
  const [page, setPage] = useState<AppPage>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCTS[0].id);
  const [accountTab, setAccountTab] = useState<AccountTab>('manage');
  const [shopFilters, setShopFilters] = useState<ShopFilters>(DEFAULT_FILTERS);

  const accountExtrasStorageKey = useMemo(
    () => `th_account_extras_v1_${profile?.uid || 'guest'}`,
    [profile?.uid]
  );

  const [accountExtras, setAccountExtras] = useState<CustomerAccountExtras>(() =>
    readStorage<CustomerAccountExtras>('th_account_extras_v1_guest', DEFAULT_ACCOUNT_EXTRAS)
  );

  useEffect(() => {
    const stored = readStorage<CustomerAccountExtras | null>(accountExtrasStorageKey, null);
    if (stored) {
      setAccountExtras(stored);
    } else {
      const seeded: CustomerAccountExtras = {
        ...DEFAULT_ACCOUNT_EXTRAS,
        savedCards: DEFAULT_ACCOUNT_EXTRAS.savedCards.map((c) => ({
          ...c,
          holderName: profile?.displayName || c.holderName,
        })),
        linkedWallets: DEFAULT_ACCOUNT_EXTRAS.linkedWallets.map((w) =>
          w.id === 'paypal' && profile?.email
            ? { ...w, accountHint: profile.email }
            : w
        ),
      };
      setAccountExtras(seeded);
      writeStorage(accountExtrasStorageKey, seeded);
    }
  }, [accountExtrasStorageKey, profile?.displayName, profile?.email]);

  const [localCart, setLocalCart] = useState<CartItem[]>(() => readStorage<CartItem[]>(STORAGE_KEYS.cart, []));
  const [cloudCart, setCloudCart] = useState<CartItem[]>([]);

  const [localWishlist, setLocalWishlist] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.wishlist, ['th-studio-anc-pro', 'th-watch-ultra-ti'])
  );
  const [cloudWishlist, setCloudWishlist] = useState<string[]>([]);

  const [compareIds, setCompareIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.compare, [])
  );
  const [recentViewIds, setRecentViewIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.recentViews, ['th-studio-anc-pro', 'th-watch-ultra-ti', 'th-aerobook-14'])
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.recentSearches, ['ANC Headphones', 'Titanium Watch', '100W GaN'])
  );

  const [localAddresses, setLocalAddresses] = useState<SavedAddress[]>(() =>
    readStorage<SavedAddress[]>(STORAGE_KEYS.addresses, SAMPLE_ADDRESSES)
  );
  const [cloudAddresses, setCloudAddresses] = useState<SavedAddress[]>([]);

  const [localOrders, setLocalOrders] = useState<OrderRecord[]>(() =>
    readStorage<OrderRecord[]>(STORAGE_KEYS.orders, [])
  );
  const [cloudOrders, setCloudOrders] = useState<OrderRecord[]>([]);
  const [sampleOverrides, setSampleOverrides] = useState<Record<string, OrderStatus>>(() =>
    readStorage<Record<string, OrderStatus>>(STORAGE_KEYS.sampleStatusOverrides, {})
  );

  const [promoCode, setPromoCode] = useState<string>(() => readStorage<string>(STORAGE_KEYS.promo, ''));
  const [helpfulVotedIds, setHelpfulVotedIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.helpfulVotes, [])
  );
  const [localReviews, setLocalReviews] = useState<ProductReview[]>(() =>
    readStorage<ProductReview[]>(STORAGE_KEYS.localReviews, [
      {
        id: 'rev-user-seed-1',
        productId: 'th-gan-100w',
        userId: 'self',
        authorName: 'Alexander Reed',
        rating: 5,
        title: 'Compact 100W GaN brick for international travel',
        comment:
          'Powers my AeroBook 14 and phone simultaneously with zero overheating. The UK and UAE snap-on plugs are super convenient.',
        helpfulCount: 4,
        verifiedPurchase: true,
        createdAt: '2026-11-14T11:15:00Z',
      },
    ])
  );
  const [cloudReviews, setCloudReviews] = useState<ProductReview[]>([]);
  const [localQuestions, setLocalQuestions] = useState<ProductQuestion[]>(() =>
    readStorage<ProductQuestion[]>(STORAGE_KEYS.localQuestions, [])
  );
  const [cloudQuestions, setCloudQuestions] = useState<ProductQuestion[]>([]);

  // Drawers & Modals
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthTabMode>('signup');
  const [authModalContext, setAuthModalContext] = useState<'checkout' | 'general'>('general');
  const [pendingCheckoutRedirect, setPendingCheckoutRedirect] = useState(false);
  const [policyModal, setPolicyModal] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRecord | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const openAuthModal = useCallback(
    (opts?: { tab?: AuthTabMode; context?: 'checkout' | 'general'; redirectToCheckout?: boolean }) => {
      setAuthModalTab(opts?.tab ?? (opts?.context === 'checkout' ? 'signup' : 'login'));
      setAuthModalContext(opts?.context ?? 'general');
      setPendingCheckoutRedirect(Boolean(opts?.redirectToCheckout));
      setAuthModalOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setPendingCheckoutRedirect(false);
  }, []);

  const addToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    writeStorage(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Sync currency with profile if signed in
  useEffect(() => {
    if (profile?.preferredCurrency) {
      setCurrencyState(profile.preferredCurrency);
      writeStorage(STORAGE_KEYS.currency, profile.preferredCurrency);
    }
  }, [profile?.preferredCurrency]);

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      setCurrencyState(next);
      writeStorage(STORAGE_KEYS.currency, next);
      if (user) {
        void updateProfileFields({ preferredCurrency: next });
      }
    },
    [user, updateProfileFields]
  );

  // Public Firestore Listeners: Reviews & Q&A
  useEffect(() => {
    const qReviews = query(collection(db, 'productReviews'), orderBy('createdAt', 'desc'));
    const unsubReviews = onSnapshot(
      qReviews,
      (snap) => {
        const items: ProductReview[] = snap.docs.map((d) => {
          const data = d.data();
          const created = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return {
            id: d.id,
            productId: String(data.productId || ''),
            userId: String(data.userId || ''),
            authorName: String(data.authorName || 'Verified Buyer'),
            rating: Number(data.rating || 5),
            title: String(data.title || ''),
            comment: String(data.comment || ''),
            helpfulCount: Number(data.helpfulCount || 0),
            verifiedPurchase: Boolean(data.verifiedPurchase),
            createdAt: created,
            isFromFirestore: true,
          };
        });
        setCloudReviews(items);
      },
      (err) => {
        console.warn('Reviews listener info:', err.message);
      }
    );

    const qQuestions = query(collection(db, 'productQuestions'), orderBy('createdAt', 'desc'));
    const unsubQuestions = onSnapshot(
      qQuestions,
      (snap) => {
        const items: ProductQuestion[] = snap.docs.map((d) => {
          const data = d.data();
          const created = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return {
            id: d.id,
            productId: String(data.productId || ''),
            userId: String(data.userId || ''),
            authorName: String(data.authorName || 'Customer'),
            question: String(data.question || ''),
            answer: data.answer ? String(data.answer) : undefined,
            createdAt: created,
            isFromFirestore: true,
          };
        });
        setCloudQuestions(items);
      },
      (err) => {
        console.warn('Questions listener info:', err.message);
      }
    );

    return () => {
      unsubReviews();
      unsubQuestions();
    };
  }, []);

  // Private Authenticated Firestore Listeners & Guest Cart Merge
  useEffect(() => {
    if (!authReady || !user) {
      setCloudCart([]);
      setCloudWishlist([]);
      setCloudAddresses([]);
      setCloudOrders([]);
      return;
    }

    const uid = user.uid;

    // Merge any guest cart items stored in localStorage into Firestore upon Google Sign-In
    const pendingGuestCart = readStorage<CartItem[]>(STORAGE_KEYS.cart, []);
    if (pendingGuestCart.length > 0) {
      void (async () => {
        for (const item of pendingGuestCart) {
          const itemId = sanitizeId(item.id);
          const docRef = doc(db, 'users', uid, 'cartItems', itemId);
          const path = `users/${uid}/cartItems/${itemId}`;
          try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const currentQty = Number(snap.data().quantity || 0);
              await updateDoc(docRef, {
                quantity: Math.min(25, currentQty + item.quantity),
                updatedAt: serverTimestamp(),
              });
            } else {
              await setDoc(docRef, {
                id: itemId,
                userId: uid,
                productId: sanitizeId(item.productId),
                variantSku: clampString(item.variantSku, 64),
                colorName: clampString(item.colorName, 60),
                sizeName: clampString(item.sizeName, 60),
                quantity: Math.max(1, Math.min(25, item.quantity)),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, path);
          }
        }
        setLocalCart([]);
        writeStorage(STORAGE_KEYS.cart, []);
      })();
    }

    const cartRef = query(collection(db, 'users', uid, 'cartItems'), where('userId', '==', uid));
    const unsubCart = onSnapshot(
      cartRef,
      (snap) => {
        const items: CartItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const prod = PRODUCTS.find((p) => p.id === d.productId);
          if (!prod) return;
          const sizeObj = prod.sizes.find((s) => s.label === d.sizeName);
          const unitPriceUsd = Number((prod.priceUsd + (sizeObj?.priceDeltaUsd ?? 0)).toFixed(2));
          items.push({
            id: docSnap.id,
            productId: String(d.productId),
            variantSku: String(d.variantSku || prod.sku),
            colorName: String(d.colorName || prod.colors[0]?.name || 'Standard'),
            sizeName: String(d.sizeName || prod.sizes[0]?.label || 'Standard'),
            quantity: Number(d.quantity || 1),
            unitPriceUsd,
          });
        });
        setCloudCart(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/cartItems`)
    );

    const wishRef = query(collection(db, 'users', uid, 'wishlist'), where('userId', '==', uid));
    const unsubWish = onSnapshot(
      wishRef,
      (snap) => {
        setCloudWishlist(snap.docs.map((d) => String(d.data().productId)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/wishlist`)
    );

    const addrRef = query(collection(db, 'users', uid, 'addresses'), where('userId', '==', uid));
    const unsubAddr = onSnapshot(
      addrRef,
      (snap) => {
        const items: SavedAddress[] = snap.docs
          .filter((docSnap) => Boolean(docSnap.data().streetAddress))
          .map((docSnap) => {
            const d = docSnap.data();
            const country: CountryCode =
              d.country === 'AE' || d.country === 'GB' || d.country === 'CA' ? d.country : 'US';
            const phoneCode: PhoneDialCode =
              d.phoneCode === '+971' || d.phoneCode === '+44' ? d.phoneCode : '+1';
            return {
              id: docSnap.id,
              label: d.label === 'Office' || d.label === 'Other' ? d.label : 'Home',
              country,
              fullName: String(d.fullName || ''),
              email: String(d.email || ''),
              phoneCode,
              phone: String(d.phone || ''),
              streetAddress: String(d.streetAddress || ''),
              apartment: d.apartment ? String(d.apartment) : undefined,
              city: String(d.city || ''),
              region: String(d.region || ''),
              postalCode: String(d.postalCode || ''),
              isDefault: Boolean(d.isDefault),
            };
          });
        setCloudAddresses(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/addresses`)
    );

    const ordRef = query(
      collection(db, 'users', uid, 'orders'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const unsubOrd = onSnapshot(
      ordRef,
      (snap) => {
        const items: OrderRecord[] = snap.docs
          .filter((docSnap) => typeof docSnap.data().totalUsd === 'number')
          .map((docSnap) => {
            const d = docSnap.data();
            const created = d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString();
            const country: CountryCode =
              d.country === 'AE' || d.country === 'GB' || d.country === 'CA' ? d.country : 'US';
            return {
              id: docSnap.id,
              orderNumber: String(d.orderNumber || docSnap.id),
              customerName: String(d.customerName || ''),
              customerPhone: String(d.customerPhone || ''),
              customerEmail: String(d.customerEmail || ''),
              country,
              shippingTier: d.shippingTier === 'express' ? 'express' : 'standard',
              courierName: String(d.courierName || 'DHL Express Worldwide'),
              trackingNumber: String(d.trackingNumber || 'DHL-0000000000'),
              shippingAddress: String(d.shippingAddress || ''),
              deliveryNote: d.deliveryNote ? String(d.deliveryNote) : undefined,
              paymentMethod:
                d.paymentMethod === 'paypal' ||
                d.paymentMethod === 'apple_pay' ||
                d.paymentMethod === 'google_pay' ||
                d.paymentMethod === 'payoneer' ||
                d.paymentMethod === 'cod'
                  ? d.paymentMethod
                  : 'card',
              promoCode: d.promoCode ? String(d.promoCode) : undefined,
              subtotalUsd: Number(d.subtotalUsd || 0),
              discountUsd: Number(d.discountUsd || 0),
              shippingUsd: Number(d.shippingUsd || 0),
              totalUsd: Number(d.totalUsd || 0),
              status: (d.status as OrderStatus) || 'placed',
              items: Array.isArray(d.items) ? (d.items as OrderItemSnapshot[]) : [],
              createdAt: created,
            };
          });
        setCloudOrders(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/orders`)
    );

    return () => {
      unsubCart();
      unsubWish();
      unsubAddr();
      unsubOrd();
    };
  }, [authReady, user]);

  // Active derived collections
  const cart = user ? cloudCart : localCart;
  const wishlistIds = user ? cloudWishlist : localWishlist;
  const addresses = useMemo(() => {
    if (user) {
      return cloudAddresses.length > 0 ? cloudAddresses : SAMPLE_ADDRESSES;
    }
    return localAddresses;
  }, [user, cloudAddresses, localAddresses]);

  const orders = useMemo(() => {
    const sampleWithOverrides = SAMPLE_ORDERS.map((o) =>
      sampleOverrides[o.id] ? { ...o, status: sampleOverrides[o.id] } : o
    );
    const activeReal = user ? cloudOrders : localOrders;
    return [...activeReal, ...sampleWithOverrides];
  }, [user, cloudOrders, localOrders, sampleOverrides]);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartSubtotalUsd = useMemo(
    () => Number(cart.reduce((acc, item) => acc + item.unitPriceUsd * item.quantity, 0).toFixed(2)),
    [cart]
  );

  // Navigation
  const trackProductView = useCallback((productId: string) => {
    setRecentViewIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 8);
      writeStorage(STORAGE_KEYS.recentViews, next);
      return next;
    });
  }, []);

  // Automatically redirect to Checkout after authenticating from the checkout gate
  useEffect(() => {
    if (isAuthenticated && pendingCheckoutRedirect) {
      setPendingCheckoutRedirect(false);
      setAuthModalOpen(false);
      setCartOpen(false);
      setQuickViewProduct(null);
      setPage('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAuthenticated, pendingCheckoutRedirect]);

  // If user logs out while on Checkout page, return to Home
  useEffect(() => {
    if (authReady && !isAuthenticated && page === 'checkout') {
      setPage('home');
    }
  }, [authReady, isAuthenticated, page]);

  const navigate = useCallback(
    (
      nextPage: AppPage,
      opts?: { productId?: string; categoryId?: string; accountTab?: AccountTab; query?: string }
    ) => {
      if (nextPage === 'checkout' && !isAuthenticated) {
        setCartOpen(false);
        setQuickViewProduct(null);
        openAuthModal({ tab: 'signup', context: 'checkout', redirectToCheckout: true });
        return;
      }
      if (opts?.productId) {
        setSelectedProductId(opts.productId);
        trackProductView(opts.productId);
      }
      if (opts?.categoryId) {
        setShopFilters({
          ...DEFAULT_FILTERS,
          categories: [opts.categoryId],
        });
      }
      if (opts?.query !== undefined) {
        setShopFilters((prev) => ({ ...prev, query: opts.query ?? '' }));
      }
      if (opts?.accountTab) {
        setAccountTab(opts.accountTab);
      }
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [trackProductView, isAuthenticated, openAuthModal]
  );

  const resetShopFilters = useCallback(() => {
    setShopFilters(DEFAULT_FILTERS);
  }, []);

  const addRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      writeStorage(STORAGE_KEYS.recentSearches, next);
      return next;
    });
  }, []);

  // Cart Actions
  const addToCart = useCallback(
    (
      product: Product,
      opts?: { colorName?: string; sizeName?: string; quantity?: number }
    ) => {
      const colorName = opts?.colorName || product.colors[0]?.name || 'Standard';
      const sizeObj =
        product.sizes.find((s) => s.label === opts?.sizeName) || product.sizes[0];
      const sizeName = sizeObj?.label || 'Standard';
      const variantSku = `${product.sku}-${sizeObj?.skuSuffix || 'STD'}`;
      const unitPriceUsd = Number((product.priceUsd + (sizeObj?.priceDeltaUsd ?? 0)).toFixed(2));
      const qtyToAdd = Math.max(1, Math.min(25, opts?.quantity ?? 1));
      const itemId = sanitizeId(`${product.id}_${variantSku}_${colorName}`);

      if (user) {
        const uid = user.uid;
        const existingItem = cloudCart.find((c) => c.id === itemId);
        const docRef = doc(db, 'users', uid, 'cartItems', itemId);
        const path = `users/${uid}/cartItems/${itemId}`;

        if (existingItem) {
          const nextQty = Math.min(25, existingItem.quantity + qtyToAdd);
          void updateDoc(docRef, {
            quantity: nextQty,
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
        } else {
          void setDoc(docRef, {
            id: itemId,
            userId: uid,
            productId: sanitizeId(product.id),
            variantSku: clampString(variantSku, 64),
            colorName: clampString(colorName, 60),
            sizeName: clampString(sizeName, 60),
            quantity: qtyToAdd,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
        }
      } else {
        setLocalCart((prev) => {
          const existing = prev.find((i) => i.id === itemId);
          let next: CartItem[];
          if (existing) {
            next = prev.map((i) =>
              i.id === itemId ? { ...i, quantity: Math.min(25, i.quantity + qtyToAdd) } : i
            );
          } else {
            next = [
              ...prev,
              {
                id: itemId,
                productId: product.id,
                variantSku,
                colorName,
                sizeName,
                quantity: qtyToAdd,
                unitPriceUsd,
              },
            ];
          }
          writeStorage(STORAGE_KEYS.cart, next);
          return next;
        });
      }

      addToast('Added to bag', `${product.title} (${sizeName})`, 'success');
    },
    [user, cloudCart, addToast]
  );

  const updateCartQuantity = useCallback(
    (itemId: string, delta: number) => {
      const target = cart.find((c) => c.id === itemId);
      if (!target) return;
      const nextQty = target.quantity + delta;

      if (user) {
        const uid = user.uid;
        const docRef = doc(db, 'users', uid, 'cartItems', itemId);
        const path = `users/${uid}/cartItems/${itemId}`;
        if (nextQty <= 0) {
          void deleteDoc(docRef).catch((err) => handleFirestoreError(err, OperationType.DELETE, path));
        } else {
          void updateDoc(docRef, {
            quantity: Math.min(25, nextQty),
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
        }
      } else {
        setLocalCart((prev) => {
          const next =
            nextQty <= 0
              ? prev.filter((i) => i.id !== itemId)
              : prev.map((i) =>
                  i.id === itemId ? { ...i, quantity: Math.min(25, nextQty) } : i
                );
          writeStorage(STORAGE_KEYS.cart, next);
          return next;
        });
      }
    },
    [cart, user]
  );

  const removeFromCart = useCallback(
    (itemId: string) => {
      if (user) {
        const uid = user.uid;
        const path = `users/${uid}/cartItems/${itemId}`;
        void deleteDoc(doc(db, 'users', uid, 'cartItems', itemId)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, path)
        );
      } else {
        setLocalCart((prev) => {
          const next = prev.filter((i) => i.id !== itemId);
          writeStorage(STORAGE_KEYS.cart, next);
          return next;
        });
      }
    },
    [user]
  );

  const clearCart = useCallback(() => {
    if (user) {
      const uid = user.uid;
      cloudCart.forEach((item) => {
        void deleteDoc(doc(db, 'users', uid, 'cartItems', item.id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}/cartItems/${item.id}`)
        );
      });
    } else {
      setLocalCart([]);
      writeStorage(STORAGE_KEYS.cart, []);
    }
  }, [user, cloudCart]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const exists = wishlistIds.includes(productId);
      const prod = PRODUCTS.find((p) => p.id === productId);

      if (user) {
        const uid = user.uid;
        const safePid = sanitizeId(productId);
        const docRef = doc(db, 'users', uid, 'wishlist', safePid);
        const path = `users/${uid}/wishlist/${safePid}`;
        if (exists) {
          void deleteDoc(docRef).catch((err) => handleFirestoreError(err, OperationType.DELETE, path));
        } else {
          void setDoc(docRef, {
            id: safePid,
            userId: uid,
            productId: safePid,
            createdAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
        }
      } else {
        setLocalWishlist((prev) => {
          const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
          writeStorage(STORAGE_KEYS.wishlist, next);
          return next;
        });
      }

      if (prod) {
        addToast(
          exists ? 'Removed from wishlist' : 'Saved to wishlist',
          prod.title,
          'info'
        );
      }
    },
    [wishlistIds, user, addToast]
  );

  const saveCartItemForLater = useCallback(
    (itemId: string) => {
      const item = cart.find((c) => c.id === itemId);
      if (!item) return;
      if (!wishlistIds.includes(item.productId)) {
        toggleWishlist(item.productId);
      }
      removeFromCart(itemId);
    },
    [cart, wishlistIds, toggleWishlist, removeFromCart]
  );

  // Compare
  const toggleCompare = useCallback(
    (productId: string) => {
      setCompareIds((prev) => {
        if (prev.includes(productId)) {
          const next = prev.filter((id) => id !== productId);
          writeStorage(STORAGE_KEYS.compare, next);
          return next;
        }
        if (prev.length >= 3) {
          addToast('Compare limit reached', 'You can compare up to 3 products side-by-side.', 'info');
          return prev;
        }
        const next = [...prev, productId];
        writeStorage(STORAGE_KEYS.compare, next);
        return next;
      });
    },
    [addToast]
  );

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    writeStorage(STORAGE_KEYS.compare, []);
  }, []);

  // Promo Code
  const applyPromoCode = useCallback(
    (rawCode: string): { valid: boolean; message: string } => {
      const res = evaluatePromoCode(rawCode, cartSubtotalUsd);
      if (res.valid) {
        setPromoCode(res.code);
        writeStorage(STORAGE_KEYS.promo, res.code);
        addToast('Promo code applied', res.label, 'success');
        return { valid: true, message: res.label };
      }
      addToast('Invalid promo code', res.label, 'error');
      return { valid: false, message: res.label };
    },
    [cartSubtotalUsd, addToast]
  );

  const clearPromoCode = useCallback(() => {
    setPromoCode('');
    writeStorage(STORAGE_KEYS.promo, '');
  }, []);

  // Saved Addresses
  const saveAddress = useCallback(
    async (addr: Omit<SavedAddress, 'id'> & { id?: string }) => {
      const id =
        addr.id && !addr.id.startsWith('addr-us-') && !addr.id.startsWith('addr-ae-')
          ? sanitizeId(addr.id)
          : sanitizeId(`addr_${Date.now()}`);

      const cleanAddr: SavedAddress = {
        id,
        label: addr.label,
        country: addr.country,
        fullName: clampString(addr.fullName, 120),
        email: clampString(addr.email, 160),
        phoneCode: addr.phoneCode,
        phone: clampString(addr.phone, 32),
        streetAddress: clampString(addr.streetAddress, 200),
        apartment: addr.apartment ? clampString(addr.apartment, 80) : undefined,
        city: clampString(addr.city, 80),
        region: clampString(addr.region, 80),
        postalCode: clampString(addr.postalCode, 24),
        isDefault: Boolean(addr.isDefault),
      };

      if (user) {
        const uid = user.uid;
        const docRef = doc(db, 'users', uid, 'addresses', id);
        const path = `users/${uid}/addresses/${id}`;
        const existsInCloud = cloudAddresses.some((a) => a.id === id);

        const payload: Record<string, unknown> = {
          label: cleanAddr.label,
          country: cleanAddr.country,
          fullName: cleanAddr.fullName,
          email: cleanAddr.email,
          phoneCode: cleanAddr.phoneCode,
          phone: cleanAddr.phone,
          streetAddress: cleanAddr.streetAddress,
          city: cleanAddr.city,
          region: cleanAddr.region,
          postalCode: cleanAddr.postalCode,
          isDefault: cleanAddr.isDefault,
          updatedAt: serverTimestamp(),
        };
        if (cleanAddr.apartment) payload.apartment = cleanAddr.apartment;

        try {
          if (existsInCloud) {
            await updateDoc(docRef, payload);
          } else {
            await setDoc(docRef, {
              ...payload,
              id,
              userId: uid,
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, existsInCloud ? OperationType.UPDATE : OperationType.CREATE, path);
        }
      } else {
        setLocalAddresses((prev) => {
          const exists = prev.some((a) => a.id === id);
          let next = exists ? prev.map((a) => (a.id === id ? cleanAddr : a)) : [cleanAddr, ...prev];
          if (cleanAddr.isDefault) {
            next = next.map((a) => ({ ...a, isDefault: a.id === id }));
          }
          writeStorage(STORAGE_KEYS.addresses, next);
          return next;
        });
      }
      addToast('Address saved', `${cleanAddr.label} address (${cleanAddr.city}) updated.`, 'success');
    },
    [user, cloudAddresses, addToast]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (user && cloudAddresses.some((a) => a.id === id)) {
        const uid = user.uid;
        const path = `users/${uid}/addresses/${id}`;
        try {
          await deleteDoc(doc(db, 'users', uid, 'addresses', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
      } else {
        setLocalAddresses((prev) => {
          const next = prev.filter((a) => a.id !== id);
          writeStorage(STORAGE_KEYS.addresses, next);
          return next;
        });
      }
      addToast('Address removed', undefined, 'info');
    },
    [user, cloudAddresses, addToast]
  );

  // Account Dashboard Extras Helpers & Mutations
  const persistAccountExtras = useCallback(
    (updater: (prev: CustomerAccountExtras) => CustomerAccountExtras) => {
      setAccountExtras((prev) => {
        const next = updater(prev);
        writeStorage(accountExtrasStorageKey, next);
        return next;
      });
    },
    [accountExtrasStorageKey]
  );

  const updateAccountExtras = useCallback(
    (partial: Partial<CustomerAccountExtras>) => {
      persistAccountExtras((prev) => ({ ...prev, ...partial }));
    },
    [persistAccountExtras]
  );

  const setDefaultShippingAddress = useCallback(
    async (id: string) => {
      if (user && cloudAddresses.length > 0) {
        const uid = user.uid;
        try {
          for (const addr of cloudAddresses) {
            const shouldBeDefault = addr.id === id;
            if (addr.isDefault !== shouldBeDefault) {
              await updateDoc(doc(db, 'users', uid, 'addresses', addr.id), {
                isDefault: shouldBeDefault,
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/addresses/${id}`);
        }
      } else {
        setLocalAddresses((prev) => {
          const next = prev.map((a) => ({ ...a, isDefault: a.id === id }));
          writeStorage(STORAGE_KEYS.addresses, next);
          return next;
        });
      }
      addToast('Default shipping updated', 'Your primary shipping address has been updated.', 'success');
    },
    [user, cloudAddresses, addToast]
  );

  const setDefaultBillingAddress = useCallback(
    (id: string) => {
      persistAccountExtras((prev) => ({ ...prev, defaultBillingAddressId: id }));
      addToast('Default billing updated', 'Your billing address preference is saved.', 'success');
    },
    [persistAccountExtras, addToast]
  );

  const addSavedCard = useCallback(
    (card: Omit<SavedPaymentCard, 'id'>) => {
      const id = sanitizeId(`card_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`);
      persistAccountExtras((prev) => {
        const nextCard: SavedPaymentCard = { ...card, id };
        const base = card.isDefault
          ? prev.savedCards.map((c) => ({ ...c, isDefault: false }))
          : prev.savedCards;
        return { ...prev, savedCards: [nextCard, ...base] };
      });
      addToast('Payment card saved', `${card.brand} •••• ${card.last4} added to your wallet.`, 'success');
    },
    [persistAccountExtras, addToast]
  );

  const setDefaultSavedCard = useCallback(
    (cardId: string) => {
      persistAccountExtras((prev) => ({
        ...prev,
        savedCards: prev.savedCards.map((c) => ({ ...c, isDefault: c.id === cardId })),
      }));
      addToast('Default card updated', undefined, 'success');
    },
    [persistAccountExtras, addToast]
  );

  const removeSavedCard = useCallback(
    (cardId: string) => {
      persistAccountExtras((prev) => {
        const remaining = prev.savedCards.filter((c) => c.id !== cardId);
        if (remaining.length > 0 && !remaining.some((c) => c.isDefault)) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }
        return { ...prev, savedCards: remaining };
      });
      addToast('Card removed', 'The saved payment card was removed.', 'info');
    },
    [persistAccountExtras, addToast]
  );

  const toggleLinkedWallet = useCallback(
    (walletId: LinkedWalletId, accountHint?: string) => {
      let nowConnected = false;
      let label = '';
      persistAccountExtras((prev) => ({
        ...prev,
        linkedWallets: prev.linkedWallets.map((w) => {
          if (w.id !== walletId) return w;
          nowConnected = !w.connected;
          label = w.label;
          return {
            ...w,
            connected: nowConnected,
            accountHint: nowConnected
              ? accountHint || w.accountHint || profile?.email || 'Verified Wallet'
              : w.accountHint,
          };
        }),
      }));
      if (label) {
        addToast(
          nowConnected ? `${label} connected` : `${label} unlinked`,
          nowConnected ? 'Available for express checkout.' : 'You can reconnect anytime.',
          'info'
        );
      }
    },
    [persistAccountExtras, profile?.email, addToast]
  );

  const toggleTwoFactor = useCallback(() => {
    persistAccountExtras((prev) => {
      const next = !prev.twoFactorEnabled;
      addToast(
        next ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled',
        next ? 'Extra login verification is active.' : 'You can re-enable 2FA anytime.',
        next ? 'success' : 'info'
      );
      return { ...prev, twoFactorEnabled: next };
    });
  }, [persistAccountExtras, addToast]);

  const revokeDeviceSession = useCallback(
    (sessionId: string) => {
      persistAccountExtras((prev) => ({
        ...prev,
        deviceSessions: prev.deviceSessions.filter((s) => s.id !== sessionId || s.current),
      }));
      addToast('Session revoked', 'The remote device has been signed out.', 'info');
    },
    [persistAccountExtras, addToast]
  );

  const updateCommunicationPrefs = useCallback(
    (partial: Partial<CommunicationPrefs>) => {
      persistAccountExtras((prev) => ({
        ...prev,
        communicationPrefs: { ...prev.communicationPrefs, ...partial },
      }));
      addToast('Preferences updated', 'Your communication preferences are saved.', 'success');
    },
    [persistAccountExtras, addToast]
  );

  const toggleFollowStore = useCallback(
    (storeId: string) => {
      const store = OFFICIAL_STORES.find((s) => s.id === storeId);
      const currentlyFollowing = accountExtras.followedStoreIds.includes(storeId);
      persistAccountExtras((prev) => ({
        ...prev,
        followedStoreIds: currentlyFollowing
          ? prev.followedStoreIds.filter((id) => id !== storeId)
          : [storeId, ...prev.followedStoreIds],
      }));
      if (store) {
        addToast(
          currentlyFollowing ? `Unfollowed ${store.name}` : `Following ${store.name}`,
          currentlyFollowing ? 'Removed from followed stores.' : 'You will receive new release alerts.',
          'info'
        );
      }
    },
    [accountExtras.followedStoreIds, persistAccountExtras, addToast]
  );

  // Place Order
  const placeOrder = useCallback(
    async (payload: {
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      country: CountryCode;
      shippingTier: ShippingTier;
      shippingAddress: string;
      deliveryNote?: string;
      paymentMethod: PaymentMethod;
    }): Promise<OrderRecord> => {
      const subtotalUsd = cartSubtotalUsd;
      const promoEval = evaluatePromoCode(promoCode, subtotalUsd);
      const discountUsd = promoEval.discountUsd;
      const qualifiesFreeStandard =
        subtotalUsd >= FREE_SHIPPING_THRESHOLD_USD || promoEval.freeShipping;
      const shippingUsd =
        payload.shippingTier === 'express'
          ? promoEval.freeShipping
            ? 0
            : EXPRESS_SHIPPING_USD
          : qualifiesFreeStandard
            ? 0
            : STANDARD_SHIPPING_USD;
      const totalUsd = Number(Math.max(0, subtotalUsd - discountUsd + shippingUsd).toFixed(2));

      const courierName =
        payload.shippingTier === 'express'
          ? COUNTRY_CONFIG[payload.country].defaultCourier
          : 'International Tracked Parcel';
      const trackingPrefix =
        payload.country === 'AE' ? 'ARX' : payload.country === 'GB' ? 'DHL' : payload.country === 'CA' ? 'UPS' : 'FDX';
      const trackingNumber = `${trackingPrefix}-${Math.floor(1000000000 + Math.random() * 8999999999)}`;

      const snapshots: OrderItemSnapshot[] = cart.slice(0, 30).map((item) => {
        const p = PRODUCTS.find((prod) => prod.id === item.productId);
        return {
          productId: item.productId,
          title: clampString(p?.title || 'Product', 140),
          variantSku: clampString(item.variantSku, 64),
          colorName: clampString(item.colorName, 60),
          sizeName: clampString(item.sizeName, 60),
          quantity: item.quantity,
          unitPriceUsd: item.unitPriceUsd,
          image: p?.images[0] || '',
        };
      });

      const orderId = sanitizeId(`ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const orderNumber = `TH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const record: OrderRecord = {
        id: orderId,
        orderNumber,
        customerName: clampString(payload.customerName, 120),
        customerPhone: clampString(payload.customerPhone, 40),
        customerEmail: clampString(payload.customerEmail || 'customer@techhaven.store', 160),
        country: payload.country,
        shippingTier: payload.shippingTier,
        courierName,
        trackingNumber,
        shippingAddress: clampString(payload.shippingAddress, 400),
        deliveryNote: payload.deliveryNote ? clampString(payload.deliveryNote, 240) : undefined,
        paymentMethod: payload.paymentMethod,
        promoCode: promoEval.valid ? promoEval.code : undefined,
        subtotalUsd,
        discountUsd,
        shippingUsd,
        totalUsd,
        status: 'placed',
        items: snapshots,
        createdAt: new Date().toISOString(),
      };

      if (user) {
        const uid = user.uid;
        const path = `users/${uid}/orders/${orderId}`;
        const firestoreDoc: Record<string, unknown> = {
          id: orderId,
          orderNumber: record.orderNumber,
          userId: uid,
          customerName: record.customerName,
          customerPhone: record.customerPhone,
          customerEmail: record.customerEmail,
          country: record.country,
          shippingTier: record.shippingTier,
          courierName: record.courierName,
          trackingNumber: record.trackingNumber,
          shippingAddress: record.shippingAddress,
          paymentMethod: record.paymentMethod,
          subtotalUsd: record.subtotalUsd,
          discountUsd: record.discountUsd,
          shippingUsd: record.shippingUsd,
          totalUsd: record.totalUsd,
          status: 'placed',
          items: snapshots,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (record.deliveryNote) firestoreDoc.deliveryNote = record.deliveryNote;
        if (record.promoCode) firestoreDoc.promoCode = record.promoCode;

        try {
          await setDoc(doc(db, 'users', uid, 'orders', orderId), firestoreDoc);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      } else {
        setLocalOrders((prev) => {
          const next = [record, ...prev];
          writeStorage(STORAGE_KEYS.orders, next);
          return next;
        });
      }

      clearCart();
      clearPromoCode();
      return record;
    },
    [cart, cartSubtotalUsd, promoCode, user, clearCart, clearPromoCode]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus, reasonNote?: string) => {
      const targetOrder = orders.find((o) => o.id === orderId);

      if (nextStatus === 'cancelled') {
        persistAccountExtras((prev) => ({
          ...prev,
          cancellationReasons: {
            ...prev.cancellationReasons,
            [orderId]: reasonNote?.trim() || 'Cancelled by customer prior to dispatch.',
          },
        }));
      }

      if (nextStatus === 'return_requested' && targetOrder) {
        const firstItem = targetOrder.items[0];
        persistAccountExtras((prev) => {
          const alreadyExists = prev.returnRequests.some((r) => r.orderId === orderId);
          if (alreadyExists) return prev;
          const newReturn: ReturnRequestRecord = {
            id: sanitizeId(`ret_${Date.now()}`),
            returnNumber: `RMA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            orderId: targetOrder.id,
            orderNumber: targetOrder.orderNumber,
            productId: firstItem?.productId || '',
            productTitle:
              targetOrder.items.length > 1
                ? `${firstItem?.title || 'Order Items'} (+${targetOrder.items.length - 1} more)`
                : firstItem?.title || 'Hardware Order',
            productImage: firstItem?.image || IMG.headphonesBlack,
            reason: reasonNote?.trim() || '7-Day Easy Return Request',
            details: reasonNote?.trim() || undefined,
            status: 'Processing',
            refundAmountUsd: targetOrder.totalUsd,
            createdAt: new Date().toISOString(),
          };
          return {
            ...prev,
            returnRequests: [newReturn, ...prev.returnRequests],
          };
        });
      }

      if (SAMPLE_ORDERS.some((s) => s.id === orderId)) {
        setSampleOverrides((prev) => {
          const next = { ...prev, [orderId]: nextStatus };
          writeStorage(STORAGE_KEYS.sampleStatusOverrides, next);
          return next;
        });
        addToast('Order updated', `Order status updated to ${nextStatus.replace(/_/g, ' ')}.`, 'info');
        return;
      }

      if (user) {
        const uid = user.uid;
        const path = `users/${uid}/orders/${orderId}`;
        try {
          await updateDoc(doc(db, 'users', uid, 'orders', orderId), {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
          addToast('Order updated', `Status changed to ${nextStatus.replace(/_/g, ' ')}.`, 'info');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        setLocalOrders((prev) => {
          const next = prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
          writeStorage(STORAGE_KEYS.orders, next);
          return next;
        });
        addToast('Order updated', `Status changed to ${nextStatus.replace(/_/g, ' ')}.`, 'info');
      }
    },
    [orders, user, addToast, persistAccountExtras]
  );

  const submitReturnRequest = useCallback(
    async (payload: {
      orderId: string;
      productId: string;
      reason: string;
      details?: string;
    }): Promise<ReturnRequestRecord | null> => {
      const targetOrder = orders.find((o) => o.id === payload.orderId);
      if (!targetOrder) return null;
      const item =
        targetOrder.items.find((i) => i.productId === payload.productId) || targetOrder.items[0];
      const newReturn: ReturnRequestRecord = {
        id: sanitizeId(`ret_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`),
        returnNumber: `RMA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: targetOrder.id,
        orderNumber: targetOrder.orderNumber,
        productId: item?.productId || payload.productId,
        productTitle: item?.title || 'TechHaven Product',
        productImage: item?.image || IMG.headphonesBlack,
        reason: clampString(payload.reason, 120),
        details: payload.details ? clampString(payload.details, 400) : undefined,
        status: 'Processing',
        refundAmountUsd: item ? Number((item.unitPriceUsd * item.quantity).toFixed(2)) : targetOrder.totalUsd,
        createdAt: new Date().toISOString(),
      };

      persistAccountExtras((prev) => ({
        ...prev,
        returnRequests: [newReturn, ...prev.returnRequests],
      }));

      if (targetOrder.status === 'delivered') {
        if (SAMPLE_ORDERS.some((s) => s.id === targetOrder.id)) {
          setSampleOverrides((prev) => {
            const next = { ...prev, [targetOrder.id]: 'return_requested' as OrderStatus };
            writeStorage(STORAGE_KEYS.sampleStatusOverrides, next);
            return next;
          });
        } else if (user) {
          await updateDoc(doc(db, 'users', user.uid, 'orders', targetOrder.id), {
            status: 'return_requested',
            updatedAt: serverTimestamp(),
          }).catch(() => undefined);
        } else {
          setLocalOrders((prev) => {
            const next = prev.map((o) =>
              o.id === targetOrder.id ? { ...o, status: 'return_requested' as OrderStatus } : o
            );
            writeStorage(STORAGE_KEYS.orders, next);
            return next;
          });
        }
      }

      addToast('Return request submitted', `${newReturn.returnNumber} is now processing.`, 'success');
      return newReturn;
    },
    [orders, user, persistAccountExtras, addToast]
  );

  const reorderItems = useCallback(
    (order: OrderRecord) => {
      order.items.forEach((snap) => {
        const prod = PRODUCTS.find((p) => p.id === snap.productId);
        if (prod) {
          addToCart(prod, {
            colorName: snap.colorName,
            sizeName: snap.sizeName,
            quantity: snap.quantity,
          });
        }
      });
      setCartOpen(true);
    },
    [addToCart]
  );

  // Reviews & Q&A
  const getReviewsForProduct = useCallback(
    (productId: string): ProductReview[] => {
      const seed = PRODUCTS.find((p) => p.id === productId)?.reviews ?? [];
      const cloud = cloudReviews.filter((r) => r.productId === productId);
      const local = localReviews.filter((r) => r.productId === productId);
      return [...cloud, ...local, ...seed];
    },
    [cloudReviews, localReviews]
  );

  const getUserReviews = useCallback((): ProductReview[] => {
    const uid = profile?.uid;
    const cloudMine = uid ? cloudReviews.filter((r) => r.userId === uid) : [];
    const localMine = localReviews.filter(
      (r) => r.userId === 'self' || (uid ? r.userId === uid : r.userId === 'guest')
    );
    return [...cloudMine, ...localMine];
  }, [cloudReviews, localReviews, profile?.uid]);

  const addReview = useCallback(
    async (payload: {
      productId: string;
      rating: number;
      title: string;
      comment: string;
      authorName: string;
    }) => {
      const reviewId = sanitizeId(`rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const safeRating = Math.max(1, Math.min(5, Math.round(payload.rating)));
      const safeTitle = clampString(payload.title, 120);
      const safeComment = clampString(payload.comment, 1000);
      const safeAuthor = clampString(payload.authorName || profile?.displayName || 'Verified Customer', 80);

      if (user) {
        const path = `productReviews/${reviewId}`;
        try {
          await setDoc(doc(db, 'productReviews', reviewId), {
            id: reviewId,
            productId: sanitizeId(payload.productId),
            userId: user.uid,
            authorName: safeAuthor,
            rating: safeRating,
            title: safeTitle,
            comment: safeComment,
            helpfulCount: 0,
            verifiedPurchase: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      } else {
        const newRev: ProductReview = {
          id: reviewId,
          productId: payload.productId,
          userId: profile?.uid || 'guest',
          authorName: safeAuthor,
          rating: safeRating,
          title: safeTitle,
          comment: safeComment,
          helpfulCount: 0,
          verifiedPurchase: Boolean(profile?.uid),
          createdAt: new Date().toISOString(),
        };
        setLocalReviews((prev) => {
          const next = [newRev, ...prev];
          writeStorage(STORAGE_KEYS.localReviews, next);
          return next;
        });
      }
      addToast('Review published', 'Thank you for sharing your feedback.', 'success');
    },
    [user, profile?.uid, profile?.displayName, addToast]
  );

  const updateReview = useCallback(
    async (
      review: ProductReview,
      payload: { rating: number; title: string; comment: string }
    ) => {
      const safeRating = Math.max(1, Math.min(5, Math.round(payload.rating)));
      const safeTitle = clampString(payload.title, 120);
      const safeComment = clampString(payload.comment, 1000);

      if (review.isFromFirestore && user) {
        const path = `productReviews/${review.id}`;
        try {
          await updateDoc(doc(db, 'productReviews', review.id), {
            rating: safeRating,
            title: safeTitle,
            comment: safeComment,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        setLocalReviews((prev) => {
          const next = prev.map((r) =>
            r.id === review.id
              ? { ...r, rating: safeRating, title: safeTitle, comment: safeComment }
              : r
          );
          writeStorage(STORAGE_KEYS.localReviews, next);
          return next;
        });
      }
      addToast('Review updated', 'Your review changes are now live.', 'success');
    },
    [user, addToast]
  );

  const deleteReview = useCallback(
    async (review: ProductReview) => {
      if (review.isFromFirestore && user) {
        const path = `productReviews/${review.id}`;
        try {
          await deleteDoc(doc(db, 'productReviews', review.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
      } else {
        setLocalReviews((prev) => {
          const next = prev.filter((r) => r.id !== review.id);
          writeStorage(STORAGE_KEYS.localReviews, next);
          return next;
        });
      }
      addToast('Review deleted', undefined, 'info');
    },
    [user, addToast]
  );

  const upvoteReview = useCallback(
    async (review: ProductReview) => {
      if (helpfulVotedIds.includes(review.id)) {
        addToast('Already upvoted', 'You already marked this review helpful.', 'info');
        return;
      }

      if (review.isFromFirestore && user) {
        const path = `productReviews/${review.id}`;
        try {
          await updateDoc(doc(db, 'productReviews', review.id), {
            helpfulCount: increment(1),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }

      setHelpfulVotedIds((prev) => {
        const next = [...prev, review.id];
        writeStorage(STORAGE_KEYS.helpfulVotes, next);
        return next;
      });
      addToast('Marked helpful', undefined, 'success');
    },
    [helpfulVotedIds, user, addToast]
  );

  const getQuestionsForProduct = useCallback(
    (productId: string): ProductQuestion[] => {
      const seed = PRODUCTS.find((p) => p.id === productId)?.questions ?? [];
      const cloud = cloudQuestions.filter((q) => q.productId === productId);
      const local = localQuestions.filter((q) => q.productId === productId);
      return [...cloud, ...local, ...seed];
    },
    [cloudQuestions, localQuestions]
  );

  const addQuestion = useCallback(
    async (payload: { productId: string; question: string; authorName: string }) => {
      const questionId = sanitizeId(`qa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const safeQuestion = clampString(payload.question, 400);
      const safeAuthor = clampString(payload.authorName || 'Customer', 80);

      if (user) {
        const path = `productQuestions/${questionId}`;
        try {
          await setDoc(doc(db, 'productQuestions', questionId), {
            id: questionId,
            productId: sanitizeId(payload.productId),
            userId: user.uid,
            authorName: safeAuthor,
            question: safeQuestion,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      } else {
        const newQ: ProductQuestion = {
          id: questionId,
          productId: payload.productId,
          userId: 'guest',
          authorName: safeAuthor,
          question: safeQuestion,
          createdAt: new Date().toISOString(),
        };
        setLocalQuestions((prev) => {
          const next = [newQ, ...prev];
          writeStorage(STORAGE_KEYS.localQuestions, next);
          return next;
        });
      }
      addToast('Question submitted', 'Our product specialists will reply shortly.', 'success');
    },
    [user, addToast]
  );

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        currency,
        setCurrency,
        page,
        navigate,
        selectedProductId,
        accountTab,
        setAccountTab,
        shopFilters,
        setShopFilters,
        resetShopFilters,
        cart,
        cartCount,
        cartSubtotalUsd,
        promoCode,
        applyPromoCode,
        clearPromoCode,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        saveCartItemForLater,
        clearCart,
        wishlistIds,
        toggleWishlist,
        compareIds,
        toggleCompare,
        clearCompare,
        recentViewIds,
        trackProductView,
        recentSearches,
        addRecentSearch,
        addresses,
        saveAddress,
        deleteAddress,
        setDefaultShippingAddress,
        setDefaultBillingAddress,
        accountExtras,
        updateAccountExtras,
        addSavedCard,
        setDefaultSavedCard,
        removeSavedCard,
        toggleLinkedWallet,
        toggleTwoFactor,
        revokeDeviceSession,
        updateCommunicationPrefs,
        toggleFollowStore,
        orders,
        placeOrder,
        updateOrderStatus,
        submitReturnRequest,
        reorderItems,
        getReviewsForProduct,
        getUserReviews,
        addReview,
        updateReview,
        deleteReview,
        upvoteReview,
        helpfulVotedIds,
        getQuestionsForProduct,
        addQuestion,
        cartOpen,
        setCartOpen,
        wishlistOpen,
        setWishlistOpen,
        compareOpen,
        setCompareOpen,
        quickViewProduct,
        setQuickViewProduct,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        authModalContext,
        pendingCheckoutRedirect,
        openAuthModal,
        closeAuthModal,
        policyModal,
        setPolicyModal,
        invoiceOrder,
        setInvoiceOrder,
        toasts,
        addToast,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

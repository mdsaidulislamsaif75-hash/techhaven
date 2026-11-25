import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Lock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Tag,
  Truck,
} from 'lucide-react';
import {
  COUNTRY_CONFIG,
  EXPRESS_SHIPPING_USD,
  FREE_SHIPPING_THRESHOLD_USD,
  PRODUCTS,
  STANDARD_SHIPPING_USD,
} from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  CountryCode,
  OrderRecord,
  PaymentMethod,
  PhoneDialCode,
  ShippingTier,
} from '../types/store';
import {
  evaluatePromoCode,
  formatFullAddress,
  formatPaymentMethodLabel,
  formatPrice,
  getPaymentStatusLabel,
} from '../utils/format';
import { SafeImage } from '../components/SafeImage';

const CONFETTI_PIECES = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  x: (i % 2 === 0 ? 1 : -1) * (35 + ((i * 29) % 140)),
  y: -(50 + ((i * 37) % 130)),
  rotate: (i * 45) % 360,
  color: i % 3 === 0 ? '#F97316' : i % 3 === 1 ? '#10B981' : '#38BDF8',
}));

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotalUsd,
    currency,
    addresses,
    promoCode,
    applyPromoCode,
    placeOrder,
    navigate,
    setInvoiceOrder,
    openAuthModal,
    addToast,
  } = useStore();
  const { user, isAuthenticated, profile } = useAuth();

  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

  const [country, setCountry] = useState<CountryCode>(defaultAddr?.country || 'US');
  const [fullName, setFullName] = useState(
    profile?.displayName || defaultAddr?.fullName || ''
  );
  const [email, setEmail] = useState(
    profile?.email || user?.email || defaultAddr?.email || ''
  );
  const [phoneCode, setPhoneCode] = useState<PhoneDialCode>(
    profile?.phoneCode || defaultAddr?.phoneCode || COUNTRY_CONFIG[defaultAddr?.country || 'US'].dialCode
  );
  const [phone, setPhone] = useState(profile?.phone || defaultAddr?.phone || '');
  const [streetAddress, setStreetAddress] = useState(defaultAddr?.streetAddress || '');
  const [apartment, setApartment] = useState(defaultAddr?.apartment || '');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [region, setRegion] = useState(defaultAddr?.region || '');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '');
  const [shippingTier, setShippingTier] = useState<ShippingTier>('standard');
  const [deliveryNote, setDeliveryNote] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardHolder, setCardHolder] = useState(profile?.displayName || defaultAddr?.fullName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paypalEmail, setPaypalEmail] = useState(profile?.email || defaultAddr?.email || '');
  const [payoneerEmail, setPayoneerEmail] = useState(profile?.email || defaultAddr?.email || '');

  const [promoInput, setPromoInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (profile?.displayName) {
      setFullName((prev) => prev || profile.displayName);
      setCardHolder((prev) => prev || profile.displayName);
    }
    const em = profile?.email || user?.email || '';
    if (em) {
      setEmail((prev) => prev || em);
      setPaypalEmail((prev) => prev || em);
      setPayoneerEmail((prev) => prev || em);
    }
    if (profile?.phoneCode) {
      setPhoneCode(profile.phoneCode);
    }
    if (profile?.phone) {
      setPhone((prev) => prev || profile.phone || '');
    }
  }, [profile, user]);

  const promoEval = evaluatePromoCode(promoCode, cartSubtotalUsd);
  const qualifiesFreeStandard =
    cartSubtotalUsd >= FREE_SHIPPING_THRESHOLD_USD || promoEval.freeShipping;
  const shippingUsd =
    cart.length === 0
      ? 0
      : shippingTier === 'express'
        ? promoEval.freeShipping
          ? 0
          : EXPRESS_SHIPPING_USD
        : qualifiesFreeStandard
          ? 0
          : STANDARD_SHIPPING_USD;
  const totalUsd = Number(Math.max(0, cartSubtotalUsd - promoEval.discountUsd + shippingUsd).toFixed(2));

  const countryCfg = COUNTRY_CONFIG[country];

  const handleCountryChange = (nextCountry: CountryCode) => {
    setCountry(nextCountry);
    setPhoneCode(COUNTRY_CONFIG[nextCountry].dialCode);
  };

  const fillFromSaved = (addrId: string) => {
    const found = addresses.find((a) => a.id === addrId);
    if (!found) return;
    setCountry(found.country);
    setFullName(found.fullName);
    setCardHolder(found.fullName);
    setPhoneCode(found.phoneCode);
    setPhone(found.phone);
    if (found.email) {
      setEmail(found.email);
      setPaypalEmail(found.email);
      setPayoneerEmail(found.email);
    }
    setStreetAddress(found.streetAddress);
    setApartment(found.apartment || '');
    setCity(found.city);
    setRegion(found.region);
    setPostalCode(found.postalCode);
    addToast('Address loaded', `Filled from "${found.label}" (${COUNTRY_CONFIG[found.country].name})`, 'info');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (
      fullName.trim().length < 2 ||
      phone.trim().length < 6 ||
      streetAddress.trim().length < 4 ||
      city.trim().length < 2 ||
      region.trim().length < 2 ||
      postalCode.trim().length < 3
    ) {
      addToast('Incomplete shipping address', 'Please complete all required international shipping fields.', 'error');
      return;
    }

    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\s+/g, '');
      if (cardHolder.trim().length < 2 || digits.length < 12 || cardExpiry.trim().length < 4 || cardCvc.trim().length < 3) {
        addToast('Card details required', 'Enter cardholder name, 16-digit card number, expiry (MM/YY), and CVC.', 'error');
        return;
      }
    }

    if (paymentMethod === 'paypal' && (!paypalEmail.includes('@') || paypalEmail.trim().length < 5)) {
      addToast('PayPal email required', 'Enter your PayPal account email to authorize Express Checkout.', 'error');
      return;
    }

    if (paymentMethod === 'payoneer' && (!payoneerEmail.includes('@') || payoneerEmail.trim().length < 5)) {
      addToast('Payoneer email required', 'Enter your Payoneer billing email to proceed.', 'error');
      return;
    }

    const formattedShippingAddress = formatFullAddress({
      streetAddress: streetAddress.trim(),
      apartment: apartment.trim() || undefined,
      city: city.trim(),
      region: region.trim(),
      postalCode: postalCode.trim(),
      country,
    });

    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerName: fullName,
        customerPhone: `${phoneCode} ${phone.trim()}`,
        customerEmail: email || 'customer@techhaven.store',
        country,
        shippingTier,
        shippingAddress: formattedShippingAddress,
        deliveryNote,
        paymentMethod,
      });
      setConfirmedOrder(order);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-24">
        <div className="relative rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-7 sm:p-10 text-center overflow-hidden shadow-2xl">
          <div className="relative inline-flex items-center justify-center mb-6">
            {CONFETTI_PIECES.map((c) => (
              <motion.span
                key={c.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: c.x,
                  y: c.y,
                  rotate: c.rotate,
                  scale: [0.6, 1.1, 0.8],
                }}
                transition={{ duration: 1.25, ease: 'easeOut' }}
                className="absolute w-2.5 h-2.5 rounded-sm pointer-events-none"
                style={{ backgroundColor: c.color }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center text-emerald-500"
            >
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Thank you, <strong className="text-slate-900 dark:text-white">{confirmedOrder.customerName}</strong>. Your order{' '}
            <span className="font-mono-num font-bold text-[#F97316]">{confirmedOrder.orderNumber}</span> is scheduled for dispatch.
          </p>

          <div className="text-left rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 p-4 sm:p-5 mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-xs text-slate-500">
              <span className="shrink-0">Shipping To</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 sm:text-right sm:max-w-xs">
                {confirmedOrder.shippingAddress}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-xs text-slate-500">
              <span className="shrink-0">Courier &amp; Tracking</span>
              <span className="font-mono-num font-semibold text-slate-800 dark:text-slate-200 sm:text-right">
                {confirmedOrder.courierName} · {confirmedOrder.trackingNumber}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-xs text-slate-500">
              <span className="shrink-0">Payment Method</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 sm:text-right">
                {formatPaymentMethodLabel(confirmedOrder.paymentMethod)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-xs text-slate-500">
              <span className="shrink-0">Payment Status</span>
              <span
                className={`inline-flex items-center self-start sm:self-auto px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  confirmedOrder.paymentMethod === 'cod'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {getPaymentStatusLabel(confirmedOrder.paymentMethod)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
              {confirmedOrder.items.map((item) => (
                <div key={item.variantSku + item.colorName} className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 truncate pr-4">
                    {item.quantity}× {item.title} ({item.sizeName})
                  </span>
                  <span className="font-mono-num font-semibold shrink-0">
                    {formatPrice(item.unitPriceUsd * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between text-base font-bold">
              <span>{confirmedOrder.paymentMethod === 'cod' ? 'Total Due on Delivery' : 'Total Charged'}</span>
              <span className="font-mono-num text-[#F97316]">
                {formatPrice(confirmedOrder.totalUsd, currency)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setInvoiceOrder(confirmedOrder)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm font-semibold inline-flex items-center gap-2 hover:border-[#F97316] cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              View Printable Invoice
            </button>
            <button
              type="button"
              onClick={() => navigate('account', { accountTab: 'orders' })}
              className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              Track Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Sign In Required for Checkout
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please create an account or sign in to complete your checkout. Your cart items are safely saved!
        </p>
        <button
          type="button"
          onClick={() => openAuthModal({ tab: 'signup', context: 'checkout', redirectToCheckout: true })}
          className="px-6 py-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer"
        >
          Sign Up or Login to Continue
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Your bag is empty
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Add hardware to your shopping bag before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="px-6 py-3 rounded-xl bg-[#F97316] text-white text-sm font-semibold cursor-pointer"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-16">
      <button
        type="button"
        onClick={() => navigate('shop')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#F97316] mb-5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Continue Shopping
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Global Express Checkout
        </h1>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Globe className="w-4 h-4 text-[#F97316]" />
          Shipping to USA, UAE, UK &amp; Canada
        </span>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick-Fill Saved Addresses */}
          {addresses.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#F97316]" />
                Quick-Fill from Saved Addresses
              </div>
              <div className="flex flex-wrap gap-2.5">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => fillFromSaved(addr.id)}
                    className="w-full sm:w-auto min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {addr.label} · {addr.city} ({COUNTRY_CONFIG[addr.country].code})
                    </div>
                    <div className="text-[11px] text-slate-500 truncate sm:max-w-[230px]">
                      {addr.streetAddress}, {addr.postalCode}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1. International Shipping Information */}
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              1. International Shipping Address
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Country / Region *
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
              >
                <option value="US">United States</option>
                <option value="AE">United Arab Emirates</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alexander Reed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                International Phone Number *
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value as PhoneDialCode)}
                  aria-label="Country dial code"
                  className="w-24 sm:w-28 min-h-[44px] px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num focus:outline-none focus:border-[#F97316] shrink-0"
                >
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+971">+971 (UAE)</option>
                  <option value="+44">+44 (UK)</option>
                </select>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={phoneCode === '+971' ? '50 555 0148' : phoneCode === '+44' ? '7700 900123' : '(212) 555-0194'}
                  className="min-w-0 flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="742 Mercer Street"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Apartment / Suite
                </label>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="Apt 8B"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={country === 'AE' ? 'Dubai' : country === 'GB' ? 'London' : country === 'CA' ? 'Toronto' : 'New York'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {countryCfg.regionLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder={country === 'AE' ? 'Dubai' : country === 'GB' ? 'Greater London' : country === 'CA' ? 'Ontario' : 'NY'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {countryCfg.postalLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={country === 'GB' ? 'E14 5AB' : country === 'CA' ? 'M5V 2T6' : '10012'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            {/* International Shipping Method Tiers */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Shipping Method *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShippingTier('standard')}
                  className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    shippingTier === 'standard'
                      ? 'border-[#F97316] bg-[#F97316]/10'
                      : 'border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-white">
                    <span>Standard International</span>
                    <span className="font-mono-num text-[#F97316]">
                      {qualifiesFreeStandard ? 'FREE' : formatPrice(STANDARD_SHIPPING_USD, currency)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    5–8 Business Days · Free over {formatPrice(FREE_SHIPPING_THRESHOLD_USD, currency)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShippingTier('express')}
                  className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    shippingTier === 'express'
                      ? 'border-[#F97316] bg-[#F97316]/10'
                      : 'border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-white">
                    <span>Express Courier Delivery</span>
                    <span className="font-mono-num text-[#F97316]">
                      {promoEval.freeShipping ? 'FREE' : formatPrice(EXPRESS_SHIPPING_USD, currency)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    2–4 Business Days via DHL / FedEx / Aramex
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g., Signature required at concierge desk"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          {/* 2. International Payment Methods */}
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                2. Payment Method
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold tracking-wider">
                <span className="px-2 py-0.5 rounded bg-blue-600/10 text-blue-500 border border-blue-500/20">VISA</span>
                <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">MASTERCARD</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">AMEX</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">COD</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {[
                { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
                { id: 'paypal' as PaymentMethod, label: 'PayPal', icon: Globe },
                { id: 'apple_pay' as PaymentMethod, label: 'Apple Pay', icon: Smartphone },
                { id: 'google_pay' as PaymentMethod, label: 'Google Pay', icon: Smartphone },
                { id: 'payoneer' as PaymentMethod, label: 'Payoneer', icon: Building2 },
                { id: 'cod' as PaymentMethod, label: 'Cash on Delivery', icon: Banknote },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`min-h-[60px] p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentMethod === m.id
                      ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <m.icon className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Cardholder Name *</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Alexander Reed"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Card Number (Visa / Mastercard / Amex) *
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 •••• •••• 4242"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm font-mono-num focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Expiry Date *</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm font-mono-num focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">CVC / CVV *</label>
                    <input
                      type="password"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="•••"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm font-mono-num focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.5 21H4.8a.8.8 0 01-.79-.92L6.2 4.1A1.2 1.2 0 017.39 3h6.46c2.97 0 4.82 1.48 4.44 4.16-.44 3.12-2.6 4.74-5.73 4.74H10.4l-.86 5.2-.02.12-.7 3.78H7.5z" />
                    </svg>
                    PayPal Express Checkout
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Buyer Protection Active
                  </span>
                </div>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="paypal-account@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authorized for <strong className="font-mono-num text-slate-800 dark:text-slate-200">{formatPrice(totalUsd, currency)}</strong> in {currency} with instant Express settlement.
                </p>
              </div>
            )}

            {(paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {paymentMethod === 'apple_pay' ? 'Apple Pay One-Tap Wallet' : 'Google Pay One-Tap Wallet'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tokenized biometric payment ready for{' '}
                    <strong className="font-mono-num text-slate-900 dark:text-white">{formatPrice(totalUsd, currency)}</strong>. No card entry required.
                  </p>
                </div>
                <span className="px-3.5 py-2 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold whitespace-nowrap self-start sm:self-center">
                  {paymentMethod === 'apple_pay' ? ' Pay Ready' : 'G Pay Ready'}
                </span>
              </div>
            )}

            {paymentMethod === 'payoneer' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F97316]">
                    Payoneer Global &amp; Business Checkout
                  </span>
                  <span className="text-[11px] text-slate-500">Multi-Currency USD / EUR / GBP</span>
                </div>
                <input
                  type="email"
                  value={payoneerEmail}
                  onChange={(e) => setPayoneerEmail(e.target.value)}
                  placeholder="billing@company.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct Payoneer balance settlement with automated commercial tax invoice generation.
                </p>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-emerald-500/30 dark:border-emerald-500/25 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Banknote className="w-4 h-4" />
                    Cash on Delivery (COD)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    Pay on Delivery · $0.00 Fee
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Pay in cash upon delivery when your order arrives at your doorstep. Please keep the exact order total of{' '}
                  <strong className="font-mono-num text-slate-900 dark:text-white">
                    {formatPrice(totalUsd, currency)}
                  </strong>{' '}
                  ready for our courier partner ({countryCfg.defaultCourier}).
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Zero upfront online charge
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Official warranty &amp; 7-day returns included
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)
          </h2>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => {
              const p = PRODUCTS.find((prod) => prod.id === item.productId);
              if (!p) return null;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <SafeImage
                    src={p.images[0]}
                    alt={p.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-900"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.quantity} × {item.sizeName} ({item.colorName})
                    </div>
                  </div>
                  <div className="text-xs font-bold font-mono-num shrink-0">
                    {formatPrice(item.unitPriceUsd * item.quantity, currency)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promo Quick Apply */}
          <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <div className="relative flex-1 min-w-0">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="SAVE10 or FREESHIP"
                className="w-full min-h-[42px] pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                applyPromoCode(promoInput);
                setPromoInput('');
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
            >
              Apply
            </button>
          </div>

          <div className="space-y-2 text-sm pt-2 border-t border-slate-200 dark:border-white/10">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono-num">{formatPrice(cartSubtotalUsd, currency)}</span>
            </div>
            {promoEval.discountUsd > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Promo ({promoCode})</span>
                <span className="font-mono-num">-{formatPrice(promoEval.discountUsd, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#F97316]" />
                {shippingTier === 'express' ? 'Express Courier' : 'Standard Intl'} ({countryCfg.code})
              </span>
              <span className="font-mono-num">
                {shippingUsd === 0 ? 'FREE' : formatPrice(shippingUsd, currency)}
              </span>
            </div>
            {paymentMethod === 'cod' && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <span className="inline-flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  Cash on Delivery (COD)
                </span>
                <span>Pay on Delivery ($0.00 Fee)</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-white/10">
              <span>{paymentMethod === 'cod' ? 'Due on Delivery' : 'Total'}</span>
              <span className="font-mono-num text-[#F97316]">{formatPrice(totalUsd, currency)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {paymentMethod === 'cod' ? <Banknote className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>
              {submitting
                ? 'Confirming Order...'
                : paymentMethod === 'cod'
                  ? `Place COD Order · ${formatPrice(totalUsd, currency)}`
                  : `Pay ${formatPrice(totalUsd, currency)}`}
            </span>
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>256-bit TLS encryption · COD available · 7-day easy returns</span>
          </div>
        </aside>
      </form>
    </div>
  );
};

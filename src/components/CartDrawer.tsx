import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Bookmark,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  FREE_SHIPPING_THRESHOLD_USD,
  PRODUCTS,
  STANDARD_SHIPPING_USD,
} from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { evaluatePromoCode, formatPrice } from '../utils/format';
import { SafeImage } from './SafeImage';

export const CartDrawer: React.FC = () => {
  const {
    cartOpen,
    setCartOpen,
    cart,
    cartSubtotalUsd,
    currency,
    promoCode,
    applyPromoCode,
    clearPromoCode,
    updateCartQuantity,
    removeFromCart,
    saveCartItemForLater,
    navigate,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ valid: boolean; msg: string } | null>(null);

  const promoEval = evaluatePromoCode(promoCode, cartSubtotalUsd);
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD_USD - cartSubtotalUsd);
  const progressPct = Math.min(100, Math.round((cartSubtotalUsd / FREE_SHIPPING_THRESHOLD_USD) * 100));
  const qualifiesFreeShipping = remainingForFree === 0 || promoEval.freeShipping;
  const estimatedShippingUsd = cart.length === 0 ? 0 : qualifiesFreeShipping ? 0 : STANDARD_SHIPPING_USD;
  const totalUsd = Math.max(0, cartSubtotalUsd - promoEval.discountUsd + estimatedShippingUsd);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyPromoCode(promoInput);
    setPromoFeedback({ valid: res.valid, msg: res.message });
    if (res.valid) setPromoInput('');
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50 no-print">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            aria-label="Shopping Bag"
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:max-w-md bg-white dark:bg-[#0B0F19] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#F97316]" />
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close bag"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#111827] border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">
                <Truck className="w-4 h-4 text-[#F97316] shrink-0" />
                {qualifiesFreeShipping ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Unlocked Free International Shipping!
                  </span>
                ) : (
                  <span>
                    Add <strong className="font-mono-num text-[#F97316]">{formatPrice(remainingForFree, currency)}</strong> more for FREE International Shipping
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${qualifiesFreeShipping ? 100 : progressPct}%` }}
                  transition={{ duration: 0.4 }}
                  className={`h-full rounded-full ${
                    qualifiesFreeShipping ? 'bg-emerald-500' : 'bg-[#F97316]'
                  }`}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    Your bag is empty
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                    Explore flagship headphones, creator laptops, and titanium wearables.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      navigate('shop');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const prod = PRODUCTS.find((p) => p.id === item.productId);
                  if (!prod) return null;
                  const img =
                    prod.colors.find((c) => c.name === item.colorName)?.image || prod.images[0];

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3.5 pb-4 border-b border-slate-100 dark:border-white/10 last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCartOpen(false);
                          navigate('product', { productId: prod.id });
                        }}
                        className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 cursor-pointer"
                      >
                        <SafeImage src={img} alt={prod.title} className="w-full h-full object-cover" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCartOpen(false);
                              navigate('product', { productId: prod.id });
                            }}
                            className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#F97316] text-left line-clamp-1 cursor-pointer"
                          >
                            {prod.title}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Remove item"
                            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.colorName} · {item.sizeName}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#F97316] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold font-mono-num">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#F97316] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-sm font-bold font-mono-num text-slate-900 dark:text-white">
                            {formatPrice(item.unitPriceUsd * item.quantity, currency)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => saveCartItemForLater(item.id)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer"
                        >
                          <Bookmark className="w-3 h-3" />
                          Save for Later
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Totals & Promo */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-[#111827] border-t border-slate-200 dark:border-white/10 space-y-4">
                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Promo code (SAVE10 or FREESHIP)"
                        className="w-full min-h-[42px] pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoCode && (
                    <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                      <span>Active: {promoCode} ({promoEval.label})</span>
                      <button
                        type="button"
                        onClick={() => {
                          clearPromoCode();
                          setPromoFeedback(null);
                        }}
                        className="text-slate-400 hover:text-red-500 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {promoFeedback && !promoFeedback.valid && (
                    <p className="text-xs text-red-500">{promoFeedback.msg}</p>
                  )}
                </form>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono-num">{formatPrice(cartSubtotalUsd, currency)}</span>
                  </div>
                  {promoEval.discountUsd > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount ({promoCode})</span>
                      <span className="font-mono-num">-{formatPrice(promoEval.discountUsd, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Estimated Shipping</span>
                    <span className="font-mono-num">
                      {estimatedShippingUsd === 0 ? 'FREE' : formatPrice(estimatedShippingUsd, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-white/10">
                    <span>Total</span>
                    <span className="font-mono-num text-[#F97316]">{formatPrice(totalUsd, currency)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    navigate('checkout');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, Heart, Minus, Plus, ShoppingBag, Star, Users, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/format';
import { SafeImage } from './SafeImage';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    currency,
    addToCart,
    wishlistIds,
    toggleWishlist,
    navigate,
  } = useStore();

  const [colorIdx, setColorIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setColorIdx(0);
    setSizeIdx(0);
    setQty(1);
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  const prod = quickViewProduct;
  const activeColor = prod.colors[colorIdx] || prod.colors[0];
  const activeSize = prod.sizes[sizeIdx] || prod.sizes[0];
  const activePrice = prod.priceUsd + (activeSize?.priceDeltaUsd ?? 0);
  const activeSku = `${prod.sku}-${activeSize?.skuSuffix || 'STD'}`;
  const isWishlisted = wishlistIds.includes(prod.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickViewProduct(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[90dvh] overflow-y-auto md:overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl grid grid-cols-1 md:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => setQuickViewProduct(null)}
            aria-label="Close quick view"
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-[#0B0F19]/85 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:text-[#F97316] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="h-52 sm:h-64 md:h-full bg-slate-100 dark:bg-slate-900 shrink-0">
            <SafeImage
              src={activeColor?.image || prod.images[0]}
              alt={prod.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 sm:p-6 flex flex-col justify-between md:max-h-[85dvh] md:overflow-y-auto">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span>{prod.brand} · {prod.category}</span>
                <span className="font-mono-num">SKU: {activeSku}</span>
              </div>

              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">
                {prod.title}
              </h3>

              <div className="flex items-center gap-3 mb-4 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-500 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {prod.rating.toFixed(1)} ({prod.reviewCount} reviews)
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  {prod.viewerCount} viewing now
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 mb-4">
                <span className="text-2xl font-bold font-mono-num text-[#F97316]">
                  {formatPrice(activePrice, currency)}
                </span>
                {prod.originalPriceUsd && (
                  <span className="text-sm font-mono-num text-slate-400 line-through">
                    {formatPrice(prod.originalPriceUsd + (activeSize?.priceDeltaUsd ?? 0), currency)}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 line-clamp-3">
                {prod.description}
              </p>

              {/* Color Selector */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Color: <span className="font-normal text-slate-500">{activeColor?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {prod.colors.map((c, idx) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColorIdx(idx)}
                      className={`w-7 h-7 rounded-full border transition-transform cursor-pointer ${
                        colorIdx === idx
                          ? 'ring-2 ring-[#F97316] ring-offset-2 ring-offset-white dark:ring-offset-[#111827] scale-105'
                          : 'border-slate-300 dark:border-white/20'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size/Variant Selector */}
              <div className="mb-5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Configuration
                </div>
                <div className="flex flex-wrap gap-2">
                  {prod.sizes.map((s, idx) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setSizeIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        sizeIdx === idx
                          ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                          : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="min-w-[40px] min-h-[42px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#F97316] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 text-sm font-semibold font-mono-num">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    aria-label="Increase quantity"
                    className="min-w-[40px] min-h-[42px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#F97316] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addToCart(prod, {
                      colorName: activeColor?.name,
                      sizeName: activeSize?.label,
                      quantity: qty,
                    });
                    setQuickViewProduct(null);
                  }}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Bag
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(prod.id)}
                  aria-label="Wishlist"
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'border-[#F97316] text-[#F97316] bg-[#F97316]/10'
                      : 'border-slate-200 dark:border-white/10 text-slate-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(prod, {
                      colorName: activeColor?.name,
                      sizeName: activeSize?.label,
                      quantity: qty,
                    });
                    setQuickViewProduct(null);
                    navigate('checkout');
                  }}
                  className="min-h-[42px] py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickViewProduct(null);
                    navigate('product', { productId: prod.id });
                  }}
                  className="min-h-[42px] py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:border-[#F97316] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Details
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

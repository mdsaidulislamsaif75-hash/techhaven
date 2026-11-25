import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GitCompare, ShoppingBag, Star, Trash2, X } from 'lucide-react';
import { PRODUCTS } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/format';
import { SafeImage } from './SafeImage';

export const CompareModal: React.FC = () => {
  const {
    compareOpen,
    setCompareOpen,
    compareIds,
    toggleCompare,
    clearCompare,
    addToCart,
    currency,
    navigate,
  } = useStore();

  const items = PRODUCTS.filter((p) => compareIds.includes(p.id));
  const allSpecKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item.specs)))
  ).slice(0, 6);

  return (
    <AnimatePresence>
      {compareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCompareOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl max-h-[90dvh] rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <GitCompare className="w-5 h-5 text-[#F97316] shrink-0" />
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  Hardware Comparison ({items.length}/3)
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCompare}
                    className="text-xs font-medium text-slate-500 hover:text-red-500 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCompareOpen(false)}
                  aria-label="Close comparison"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Select up to 3 products using the compare button on any product card.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareOpen(false);
                      navigate('shop');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold cursor-pointer"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[520px]">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white dark:bg-[#111827] w-28 sm:w-36 py-3 pr-3 sm:pr-4 text-xs font-semibold text-slate-500 align-top">
                          Product
                        </th>
                        {items.map((item) => (
                          <th key={item.id} className="p-3 align-top min-w-[180px]">
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-slate-900 mb-3">
                              <SafeImage
                                src={item.images[0]}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => toggleCompare(item.id)}
                                aria-label="Remove from compare"
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCompareOpen(false);
                                navigate('product', { productId: item.id });
                              }}
                              className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#F97316] text-left line-clamp-2 cursor-pointer"
                            >
                              {item.title}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
                      <tr>
                        <td className="sticky left-0 z-10 bg-white dark:bg-[#111827] py-3 pr-3 sm:pr-4 text-xs font-semibold text-slate-500">Price</td>
                        {items.map((item) => (
                          <td key={item.id} className="p-3 font-bold font-mono-num text-[#F97316]">
                            {formatPrice(item.priceUsd, currency)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="sticky left-0 z-10 bg-white dark:bg-[#111827] py-3 pr-3 sm:pr-4 text-xs font-semibold text-slate-500">Rating</td>
                        {items.map((item) => (
                          <td key={item.id} className="p-3">
                            <span className="inline-flex items-center gap-1 font-medium tabular-nums">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {item.rating.toFixed(1)} ({item.reviewCount})
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="sticky left-0 z-10 bg-white dark:bg-[#111827] py-3 pr-3 sm:pr-4 text-xs font-semibold text-slate-500">Availability</td>
                        {items.map((item) => (
                          <td key={item.id} className="p-3 text-xs font-semibold">
                            {item.stock > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                In Stock ({item.stock} units)
                              </span>
                            ) : (
                              <span className="text-red-500">Out of Stock</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      {allSpecKeys.map((specKey) => (
                        <tr key={specKey}>
                          <td className="sticky left-0 z-10 bg-white dark:bg-[#111827] py-3 pr-3 sm:pr-4 text-xs font-semibold text-slate-500">
                            {specKey}
                          </td>
                          {items.map((item) => (
                            <td
                              key={item.id}
                              className="p-3 text-xs text-slate-700 dark:text-slate-300"
                            >
                              {item.specs[specKey] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <td className="sticky left-0 z-10 bg-white dark:bg-[#111827] py-4 pr-3 sm:pr-4" />
                        {items.map((item) => (
                          <td key={item.id} className="p-3">
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Add to Bag
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

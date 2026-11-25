import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { PRODUCTS } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/format';
import { SafeImage } from './SafeImage';

export const WishlistDrawer: React.FC = () => {
  const {
    wishlistOpen,
    setWishlistOpen,
    wishlistIds,
    toggleWishlist,
    addToCart,
    setCartOpen,
    currency,
    navigate,
  } = useStore();

  const savedProducts = PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  return (
    <AnimatePresence>
      {wishlistOpen && (
        <div className="fixed inset-0 z-50 no-print">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWishlistOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            aria-label="Saved Wishlist"
            className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:max-w-md bg-white dark:bg-[#0B0F19] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
          >
            <div className="px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Heart className="w-5 h-5 text-[#F97316] fill-[#F97316]" />
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Saved Wishlist ({savedProducts.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWishlistOpen(false)}
                aria-label="Close wishlist"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {savedProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    No saved items yet
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
                    Tap the heart icon on any product to keep track of your favorite gear.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWishlistOpen(false);
                      navigate('shop');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                savedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex gap-3.5 pb-4 border-b border-slate-100 dark:border-white/10 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setWishlistOpen(false);
                        navigate('product', { productId: prod.id });
                      }}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 cursor-pointer"
                    >
                      <SafeImage src={prod.images[0]} alt={prod.title} className="w-full h-full object-cover" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWishlistOpen(false);
                            navigate('product', { productId: prod.id });
                          }}
                          className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#F97316] text-left line-clamp-1 cursor-pointer"
                        >
                          {prod.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(prod.id)}
                          aria-label="Remove from wishlist"
                          className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm font-bold font-mono-num text-[#F97316] mt-1">
                        {formatPrice(prod.priceUsd, currency)}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(prod);
                          setWishlistOpen(false);
                          setCartOpen(true);
                        }}
                        className="mt-2.5 min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Move to Bag
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

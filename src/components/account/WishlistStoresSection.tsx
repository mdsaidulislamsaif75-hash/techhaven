import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Heart,
  ShoppingBag,
  Star,
  Store,
  Trash2,
} from 'lucide-react';
import { OFFICIAL_STORES, PRODUCTS } from '../../data/mockData';
import { DEFAULT_FILTERS, useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';
import { SafeImage } from '../SafeImage';

export const WishlistStoresSection: React.FC = () => {
  const {
    wishlistIds,
    toggleWishlist,
    addToCart,
    currency,
    navigate,
    setShopFilters,
    accountExtras,
    toggleFollowStore,
  } = useStore();

  const [subTab, setSubTab] = useState<'wishlist' | 'stores'>('wishlist');
  const wishlistProducts = PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  const handleMoveToCart = (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    addToCart(product, { quantity: 1 });
    if (wishlistIds.includes(productId)) {
      toggleWishlist(productId);
    }
  };

  const handleVisitStore = (brand: string) => {
    setShopFilters({
      ...DEFAULT_FILTERS,
      brands: [brand],
    });
    navigate('shop');
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 w-fit max-w-full overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSubTab('wishlist')}
          className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            subTab === 'wishlist'
              ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          My Wishlist ({wishlistProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('stores')}
          className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            subTab === 'stores'
              ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Followed Stores ({accountExtras.followedStoreIds.length})
        </button>
      </div>

      {/* SUB-TAB 1: MY WISHLIST */}
      {subTab === 'wishlist' && (
        <>
          {wishlistProducts.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-10 text-center space-y-3">
              <Heart className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tap the heart icon on any TechHaven product to save it here for instant price monitoring and one-click cart transfer.
              </p>
              <button
                type="button"
                onClick={() => navigate('shop')}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
              >
                Explore Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {wishlistProducts.map((prod) => {
                const inStock = prod.stock > 0;
                return (
                  <div
                    key={prod.id}
                    className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => navigate('product', { productId: prod.id })}
                      className="text-left group cursor-pointer"
                    >
                      <div className="aspect-[4/3] bg-slate-100 dark:bg-[#0B0F19] overflow-hidden">
                        <SafeImage
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {prod.brand} · {prod.category}
                          </span>
                          <span
                            className={`font-semibold ${
                              inStock
                                ? prod.stock <= 5
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500'
                            }`}
                          >
                            {inStock ? (prod.stock <= 5 ? `Only ${prod.stock} left` : 'In Stock') : 'Out of Stock'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#F97316] transition-colors">
                          {prod.title}
                        </h3>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-base font-bold font-mono-num text-[#F97316]">
                            {formatPrice(prod.priceUsd, currency)}
                          </span>
                          {prod.originalPriceUsd && prod.originalPriceUsd > prod.priceUsd && (
                            <span className="text-xs font-mono-num text-slate-400 line-through">
                              {formatPrice(prod.originalPriceUsd, currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="px-4 pb-4 pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-white/10">
                      <button
                        type="button"
                        disabled={!inStock}
                        onClick={() => handleMoveToCart(prod.id)}
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Move to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(prod.id)}
                        aria-label={`Remove ${prod.title} from wishlist`}
                        className="min-w-[40px] min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 hover:border-red-500/40 inline-flex items-center justify-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: FOLLOWED STORES */}
      {subTab === 'stores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OFFICIAL_STORES.map((store) => {
            const isFollowing = accountExtras.followedStoreIds.includes(store.id);
            const displayFollowers = store.followersCount + (isFollowing ? 1 : 0);

            return (
              <div
                key={store.id}
                className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#F97316]/15 text-[#F97316] font-display font-bold text-base flex items-center justify-center shrink-0">
                      {store.brand.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {store.name}
                        </h3>
                        {store.verified && (
                          <CheckCircle2
                            aria-label="Verified Official Store"
                            className="w-4 h-4 text-sky-500 shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {store.tagline}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-mono-num">
                        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {store.rating.toFixed(1)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{displayFollowers.toLocaleString()} followers</span>
                        <span aria-hidden="true">·</span>
                        <span>{store.badge}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleFollowStore(store.id)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isFollowing
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#F97316] dark:hover:bg-[#F97316] dark:hover:text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVisitStore(store.brand)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#F97316] inline-flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                  >
                    Visit Store
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Eye, GitCompare, Heart, Loader2, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { formatPrice, getDiscountPercent } from '../utils/format';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout = 'grid',
  index = 0,
}) => {
  const {
    currency,
    navigate,
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    setQuickViewProduct,
  } = useStore();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [addState, setAddState] = useState<'idle' | 'loading' | 'added'>('idle');

  const isWishlisted = wishlistIds.includes(product.id);
  const isCompared = compareIds.includes(product.id);
  const discountPct = getDiscountPercent(product.priceUsd, product.originalPriceUsd);

  const primaryImage =
    product.colors[selectedColorIdx]?.image || product.images[0];
  const secondaryImage =
    product.images[1] && product.images[1] !== primaryImage
      ? product.images[1]
      : primaryImage;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (addState !== 'idle' || product.stock <= 0) return;
    setAddState('loading');
    setTimeout(() => {
      addToCart(product, {
        colorName: product.colors[selectedColorIdx]?.name,
        sizeName: product.sizes[0]?.label,
        quantity: 1,
      });
      setAddState('added');
      setTimeout(() => setAddState('idle'), 1300);
    }, 180);
  };

  const badgeLabel =
    discountPct > 0
      ? `-${discountPct}% SALE`
      : product.badge === 'NEW'
        ? 'NEW'
        : product.badge === 'HOT'
          ? 'HOT'
          : null;

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 'some' }}
        transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.24) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate('product', { productId: product.id })}
        className="group cursor-pointer rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 hover:border-[#F97316]/50 transition-all duration-200"
      >
        <div className="relative w-full sm:w-56 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
          <SafeImage
            src={primaryImage}
            alt={product.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              hovered && secondaryImage !== primaryImage ? 'opacity-0 scale-105' : 'group-hover:scale-105'
            }`}
          />
          {secondaryImage !== primaryImage && (
            <SafeImage
              src={secondaryImage}
              alt={`${product.title} alternate view`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                hovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}
          {badgeLabel && (
            <span
              className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide text-white ${
                discountPct > 0 ? 'bg-[#F97316]' : product.badge === 'NEW' ? 'bg-emerald-600' : 'bg-slate-900'
              }`}
            >
              {badgeLabel}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {product.brand} · {product.category}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold tabular-nums">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400 tabular-nums">({product.reviewCount})</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#F97316] transition-colors line-clamp-1">
              {product.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center gap-2 mt-3">
              {product.colors.map((c, idx) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColorIdx(idx);
                  }}
                  title={c.name}
                  aria-label={`Select color ${c.name}`}
                  className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                    selectedColorIdx === idx
                      ? 'ring-2 ring-[#F97316] ring-offset-2 ring-offset-white dark:ring-offset-[#111827] scale-110'
                      : 'border-slate-300 dark:border-white/20'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-bold font-mono-num text-slate-900 dark:text-white">
                {formatPrice(product.priceUsd, currency)}
              </span>
              {product.originalPriceUsd && (
                <span className="text-sm font-mono-num text-slate-400 line-through">
                  {formatPrice(product.originalPriceUsd, currency)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
                aria-label="Toggle wishlist"
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'border-[#F97316]/40 bg-[#F97316]/10 text-[#F97316]'
                    : 'border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompare(product.id);
                }}
                aria-label="Compare product"
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isCompared
                    ? 'border-[#F97316]/40 bg-[#F97316]/10 text-[#F97316]'
                    : 'border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GitCompare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickViewProduct(product);
                }}
                aria-label="Quick view"
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {addState === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : addState === 'added' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
                <span>{addState === 'added' ? 'Added' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate('product', { productId: product.id })}
      className="group cursor-pointer rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col hover:-translate-y-1 hover:border-[#F97316]/50 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-200"
    >
      {/* Product Media */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <SafeImage
          src={primaryImage}
          alt={product.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            hovered && secondaryImage !== primaryImage
              ? 'opacity-0 scale-105'
              : 'group-hover:scale-105'
          }`}
        />
        {secondaryImage !== primaryImage && (
          <SafeImage
            src={secondaryImage}
            alt={`${product.title} alternate angle`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              hovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          />
        )}

        {/* Top Row: Single Badge + Wishlist/Compare */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
          <div>
            {badgeLabel && (
              <span
                className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide text-white shadow-sm ${
                  discountPct > 0
                    ? 'bg-[#F97316]'
                    : product.badge === 'NEW'
                      ? 'bg-emerald-600'
                      : 'bg-slate-900/90'
                }`}
              >
                {badgeLabel}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors cursor-pointer ${
                isWishlisted
                  ? 'bg-[#F97316] border-[#F97316] text-white'
                  : 'bg-white/85 dark:bg-[#0B0F19]/80 border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-[#F97316]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCompare(product.id);
              }}
              aria-label="Compare product"
              title={isCompared ? 'Remove from compare' : 'Add to compare'}
              className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-[#F97316] border-[#F97316] text-white'
                  : 'bg-white/85 dark:bg-[#0B0F19]/80 border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-[#F97316]'
              }`}
            >
              <GitCompare className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickViewProduct(product);
              }}
              aria-label="Quick view"
              className="lg:hidden w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center border bg-white/85 dark:bg-[#0B0F19]/80 border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-[#F97316] transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide-up Hover Quick Action Bar */}
        <div
          className={`absolute inset-x-3 bottom-3 flex items-center gap-2 transition-all duration-200 ${
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white/95 dark:bg-[#0B0F19]/90 backdrop-blur-md text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/15 hover:border-[#F97316] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="truncate">{product.category} · {product.brand}</span>
            <span className="inline-flex items-center gap-1 shrink-0 text-slate-700 dark:text-slate-300 font-medium tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)}
              <span className="text-slate-400">({product.reviewCount})</span>
            </span>
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-[#F97316] transition-colors line-clamp-2 min-h-[2.75rem]">
            {product.title}
          </h3>

          {/* Color Swatches */}
          <div className="flex items-center gap-2 mt-2.5">
            {product.colors.map((c, idx) => (
              <button
                key={c.name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColorIdx(idx);
                }}
                title={c.name}
                aria-label={`Preview ${c.name}`}
                className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                  selectedColorIdx === idx
                    ? 'ring-2 ring-[#F97316] ring-offset-2 ring-offset-white dark:ring-offset-[#111827] scale-110'
                    : 'border-slate-300 dark:border-white/20'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.stock <= 5 && (
              <span className="ml-auto text-[11px] font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>

        {/* Price + Add to Cart */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono-num text-slate-900 dark:text-white">
                {formatPrice(product.priceUsd, currency)}
              </span>
              {product.originalPriceUsd && (
                <span className="text-xs font-mono-num text-slate-400 line-through">
                  {formatPrice(product.originalPriceUsd, currency)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
              addState === 'added'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#F97316] hover:bg-orange-600 text-white'
            }`}
          >
            {addState === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : addState === 'added' ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
            <span>{addState === 'added' ? 'Added ✓' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
};

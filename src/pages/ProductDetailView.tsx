import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  GitCompare,
  Heart,
  HelpCircle,
  Loader2,
  Maximize2,
  MessageSquare,
  Minus,
  PackagePlus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import { PRODUCTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatPrice, getDiscountPercent } from '../utils/format';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';

export const ProductDetailView: React.FC = () => {
  const {
    selectedProductId,
    navigate,
    currency,
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    getReviewsForProduct,
    addReview,
    upvoteReview,
    helpfulVotedIds,
    getQuestionsForProduct,
    addQuestion,
    applyPromoCode,
    addToast,
  } = useStore();
  const { user, profile } = useAuth();

  const product = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [compatOpen, setCompatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'qa'>('desc');
  const [addState, setAddState] = useState<'idle' | 'loading' | 'added'>('idle');

  // Review Filter & Form
  const [starFilter, setStarFilter] = useState<number>(0);
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revAuthor, setRevAuthor] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Q&A Form
  const [qaInput, setQaInput] = useState('');
  const [submittingQa, setSubmittingQa] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setColorIdx(0);
    setSizeIdx(0);
    setQty(1);
    setStarFilter(0);
  }, [product.id]);

  const gallery = useMemo(() => {
    const imgs = [...product.images];
    product.colors.forEach((c) => {
      if (c.image && !imgs.includes(c.image)) imgs.push(c.image);
    });
    return imgs;
  }, [product]);

  const activeColor = product.colors[colorIdx] || product.colors[0];
  const activeSize = product.sizes[sizeIdx] || product.sizes[0];
  const activePriceUsd = product.priceUsd + (activeSize?.priceDeltaUsd ?? 0);
  const activeOriginalUsd = product.originalPriceUsd
    ? product.originalPriceUsd + (activeSize?.priceDeltaUsd ?? 0)
    : undefined;
  const activeStock = activeSize?.stock ?? product.stock;
  const activeSku = `${product.sku}-${activeSize?.skuSuffix || 'STD'}`;
  const discountPct = getDiscountPercent(activePriceUsd, activeOriginalUsd);

  const isWishlisted = wishlistIds.includes(product.id);
  const isCompared = compareIds.includes(product.id);

  const allReviews = getReviewsForProduct(product.id);
  const filteredReviews = useMemo(
    () => (starFilter > 0 ? allReviews.filter((r) => r.rating === starFilter) : allReviews),
    [allReviews, starFilter]
  );
  const allQuestions = getQuestionsForProduct(product.id);

  const ratingBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = allReviews.filter((r) => r.rating === stars).length;
      const pct = allReviews.length > 0 ? Math.round((count / allReviews.length) * 100) : stars === 5 ? 85 : 0;
      return { stars, count, pct };
    });
  }, [allReviews]);

  const bundleAccessories = useMemo(
    () =>
      product.frequentlyBoughtWith
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 2),
    [product.frequentlyBoughtWith]
  );

  const bundleRawTotalUsd = useMemo(
    () => activePriceUsd + bundleAccessories.reduce((sum, a) => sum + a.priceUsd, 0),
    [activePriceUsd, bundleAccessories]
  );
  const bundleDiscountedUsd = Number((bundleRawTotalUsd * 0.9).toFixed(2));

  const relatedProducts = useMemo(
    () =>
      PRODUCTS.filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
        .concat(PRODUCTS.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId))
        .slice(0, 4),
    [product]
  );

  const handleAddToCart = () => {
    if (addState !== 'idle' || activeStock <= 0) return;
    setAddState('loading');
    setTimeout(() => {
      addToCart(product, {
        colorName: activeColor?.name,
        sizeName: activeSize?.label,
        quantity: qty,
      });
      setAddState('added');
      setTimeout(() => setAddState('idle'), 1400);
    }, 180);
  };

  const handleBuyNow = () => {
    addToCart(product, {
      colorName: activeColor?.name,
      sizeName: activeSize?.label,
      quantity: qty,
    });
    navigate('checkout');
  };

  const handleBundleAdd = () => {
    addToCart(product, {
      colorName: activeColor?.name,
      sizeName: activeSize?.label,
      quantity: 1,
    });
    bundleAccessories.forEach((acc) => addToCart(acc, { quantity: 1 }));
    applyPromoCode('SAVE10');
    addToast('Bundle added (10% Off)', 'SAVE10 discount automatically activated in your bag.', 'success');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (revTitle.trim().length < 2 || revComment.trim().length < 5) {
      addToast('Review incomplete', 'Please enter a short headline and comment.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await addReview({
        productId: product.id,
        rating: revRating,
        title: revTitle,
        comment: revComment,
        authorName: profile?.displayName || revAuthor || user?.displayName || 'Verified Buyer',
      });
      setRevTitle('');
      setRevComment('');
      setRevRating(5);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qaInput.trim().length < 5) {
      addToast('Question too short', 'Please enter at least 5 characters.', 'error');
      return;
    }
    setSubmittingQa(true);
    try {
      await addQuestion({
        productId: product.id,
        question: qaInput,
        authorName: profile?.displayName || user?.displayName || 'Customer',
      });
      setQaInput('');
    } finally {
      setSubmittingQa(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 min-w-0">
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="inline-flex items-center gap-1.5 hover:text-[#F97316] font-medium whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Catalog
        </button>
        <span className="shrink-0">/</span>
        <button
          type="button"
          onClick={() => navigate('shop', { categoryId: product.categoryId })}
          className="hover:text-[#F97316] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {product.category}
        </button>
        <span className="shrink-0">/</span>
        <span className="text-slate-800 dark:text-slate-200 truncate min-w-0">{product.title}</span>
      </div>

      {/* Main Split PDP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3">
          <div
            onClick={() => setLightboxOpen(true)}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 cursor-zoom-in group"
          >
            <SafeImage
              src={gallery[activeImageIdx] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              aria-label="Zoom image"
              className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-[#F97316] transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {discountPct > 0 && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#F97316] text-white text-xs font-bold">
                -{discountPct}% SALE
              </span>
            )}
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
            {gallery.map((imgUrl, idx) => (
              <button
                key={`${imgUrl}-${idx}`}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeImageIdx === idx
                    ? 'border-[#F97316]'
                    : 'border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <SafeImage src={imgUrl} alt={`${product.title} angle ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Purchase Module */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-[#F97316]">{product.brand} · {product.category}</span>
              <span className="font-mono-num">SKU: {activeSku}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
              {product.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 hover:text-[#F97316] cursor-pointer"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400 tabular-nums">({product.reviewCount + Math.max(0, allReviews.length - product.reviews.length)} reviews)</span>
              </button>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Users className="w-4 h-4" />
                {product.viewerCount} people viewing this right now
              </span>
            </div>
          </div>

          {/* Price & Urgency */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono-num text-slate-900 dark:text-white">
                {formatPrice(activePriceUsd, currency)}
              </span>
              {activeOriginalUsd && (
                <span className="text-base font-mono-num text-slate-400 line-through">
                  {formatPrice(activeOriginalUsd, currency)}
                </span>
              )}
            </div>

            <div className="text-xs font-semibold">
              {activeStock <= 5 ? (
                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  Only {activeStock} left in stock!
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">
                  In Stock ({activeStock} ready to ship)
                </span>
              )}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              Color Finish: <span className="text-slate-500 font-normal">{activeColor?.name}</span>
            </div>
            <div className="flex items-center gap-2.5">
              {product.colors.map((c, idx) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setColorIdx(idx);
                    const gIdx = gallery.indexOf(c.image);
                    if (gIdx >= 0) setActiveImageIdx(gIdx);
                  }}
                  aria-label={`Select color ${c.name}`}
                  className={`w-9 h-9 rounded-full border transition-transform cursor-pointer ${
                    colorIdx === idx
                      ? 'ring-2 ring-[#F97316] ring-offset-2 ring-offset-white dark:ring-offset-[#111827] scale-105'
                      : 'border-slate-300 dark:border-white/20'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Size / Storage Selector + Compatibility Guide */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Edition / Capacity
              </span>
              <button
                type="button"
                onClick={() => setCompatOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                Size & Compatibility Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s, idx) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSizeIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
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

          {/* Quantity + CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-3 text-slate-600 dark:text-slate-300 hover:text-[#F97316] cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold font-mono-num">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(activeStock || 10, q + 1))}
                  aria-label="Increase quantity"
                  className="p-3 text-slate-600 dark:text-slate-300 hover:text-[#F97316] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 min-w-[140px] min-h-[44px] py-3 px-5 sm:px-6 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
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
                <span>{addState === 'added' ? 'Added to Bag ✓' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Add to wishlist"
                className={`min-w-[44px] min-h-[44px] p-3 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                  isWishlisted
                    ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => toggleCompare(product.id)}
                aria-label="Compare"
                className={`min-w-[44px] min-h-[44px] p-3 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                  isCompared
                    ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                <GitCompare className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full min-h-[44px] py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Buy Now — Express Checkout
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Official Warranty Included
            </span>
            <span>7-Day Easy Replacement</span>
            <span>Free Standard Shipping Over $100</span>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle */}
      {bundleAccessories.length > 0 && (
        <section className="mt-10 sm:mt-12 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F97316] mb-1">
                <PackagePlus className="w-4 h-4" />
                Frequently Bought Together · Save 10%
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-4">
                Complete Your Setup
              </h2>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3">
                {[product, ...bundleAccessories].map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <span className="hidden sm:inline text-slate-400 font-bold">+</span>}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 w-full sm:w-auto sm:max-w-[240px]">
                      <SafeImage
                        src={item.images[0]}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-xs font-mono-num text-[#F97316] mt-0.5">
                          {formatPrice(idx === 0 ? activePriceUsd : item.priceUsd, currency)}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="lg:text-right shrink-0 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6">
              <div className="text-xs text-slate-500">
                Bundle Total (10% Off with SAVE10)
              </div>
              <div className="flex items-baseline lg:justify-end gap-2">
                <span className="text-2xl font-bold font-mono-num text-[#F97316]">
                  {formatPrice(bundleDiscountedUsd, currency)}
                </span>
                <span className="text-sm font-mono-num text-slate-400 line-through">
                  {formatPrice(bundleRawTotalUsd, currency)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleBundleAdd}
                className="w-full lg:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer"
              >
                Add All 3 to Bag
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Structured Tabs */}
      <section className="mt-12 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-white/10 px-4 sm:px-6">
          {[
            { id: 'desc', label: 'Description & Highlights' },
            { id: 'specs', label: 'Technical Specifications' },
            { id: 'reviews', label: `Customer Reviews (${allReviews.length})` },
            { id: 'qa', label: `Product Q&A (${allQuestions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#F97316] text-[#F97316]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'desc' && (
            <div className="max-w-3xl space-y-5">
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {product.description}
              </p>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
                  Key Engineering Highlights
                </h3>
                <ul className="space-y-2.5">
                  {product.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-3 pr-4 sm:pr-6 font-semibold text-slate-500 dark:text-slate-400 w-32 sm:w-44">
                        {k}
                      </td>
                      <td className="py-3 text-slate-900 dark:text-white font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Rating Breakdown & Write Review */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-bold font-mono-num text-slate-900 dark:text-white">
                      {product.rating.toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Based on {allReviews.length} detailed reviews
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ratingBreakdown.map((row) => (
                      <button
                        key={row.stars}
                        type="button"
                        onClick={() =>
                          setStarFilter((prev) => (prev === row.stars ? 0 : row.stars))
                        }
                        className={`w-full flex items-center gap-2.5 text-xs py-1 rounded-lg px-1.5 transition-colors cursor-pointer ${
                          starFilter === row.stars ? 'bg-[#F97316]/10' : 'hover:bg-slate-200/50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="w-10 text-left font-medium tabular-nums">{row.stars} ★</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-slate-500 tabular-nums">{row.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Write Review Form */}
                <form
                  onSubmit={handleReviewSubmit}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 space-y-3"
                >
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Write a Review
                  </h4>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRevRating(num)}
                        aria-label={`Rate ${num} stars`}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            num <= revRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {!user && (
                    <input
                      type="text"
                      value={revAuthor}
                      onChange={(e) => setRevAuthor(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                    />
                  )}
                  <input
                    type="text"
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    placeholder="Review headline"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                  />
                  <textarea
                    rows={3}
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="Share build quality, battery, or audio impressions..."
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
                  >
                    {submittingReview ? 'Publishing...' : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-7 space-y-4">
                {starFilter > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span>Filtering by {starFilter}-star reviews</span>
                    <button
                      type="button"
                      onClick={() => setStarFilter(0)}
                      className="text-[#F97316] font-semibold underline cursor-pointer"
                    >
                      Show All
                    </button>
                  </div>
                )}

                {filteredReviews.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No reviews matching this filter yet. Be the first to review!
                  </p>
                ) : (
                  filteredReviews.map((rev) => {
                    const voted = helpfulVotedIds.includes(rev.id);
                    const displayedHelpful = rev.helpfulCount + (voted && !rev.isFromFirestore ? 1 : 0);
                    return (
                      <div
                        key={rev.id}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#0B0F19]/60 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {rev.authorName}
                            </span>
                            {rev.verifiedPurchase && (
                              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                · Verified Buyer
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {rev.title}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {rev.comment}
                        </p>
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                          <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => upvoteReview(rev)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                              voted
                                ? 'border-[#F97316] text-[#F97316] bg-[#F97316]/10'
                                : 'border-slate-200 dark:border-white/10 hover:border-[#F97316]'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Helpful ({displayedHelpful})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="max-w-3xl space-y-6">
              <form onSubmit={handleQuestionSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask about compatibility, warranty, or accessories..."
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#F97316]"
                />
                <button
                  type="submit"
                  disabled={submittingQa}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
                >
                  {submittingQa ? 'Sending...' : 'Ask Question'}
                </button>
              </form>

              {allQuestions.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  <HelpCircle className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                  No questions yet. Ask our hardware team above!
                </div>
              ) : (
                <div className="space-y-4">
                  {allQuestions.map((qa) => (
                    <div
                      key={qa.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <MessageSquare className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {qa.question}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Asked by {qa.authorName} · {new Date(qa.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="pl-6 text-sm text-slate-600 dark:text-slate-300">
                        {qa.answer ? (
                          <span>
                            <strong className="text-emerald-600 dark:text-emerald-400">TECHHAVEN Specialist:</strong>{' '}
                            {qa.answer}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">
                            Awaiting product specialist reply (usually within 2 hours).
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Related Hardware
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {relatedProducts.map((rel, idx) => (
            <ProductCard key={rel.id} product={rel} index={idx} />
          ))}
        </div>
      </section>

      {/* Click-to-Zoom Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
              className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-[#F97316] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="max-w-4xl w-full max-h-[85dvh] aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950"
            >
              <SafeImage
                src={gallery[activeImageIdx] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compatibility / Size Guide Modal */}
      <AnimatePresence>
        {compatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCompatOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Size & Compatibility Guide
                </h3>
                <button
                  type="button"
                  onClick={() => setCompatOpen(false)}
                  aria-label="Close compatibility guide"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {product.compatibilityNote ||
                  'Universal plug-and-play support across iOS, Android, macOS, and Windows devices. Includes official regional power & warranty coverage.'}
              </p>
              <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 p-4 space-y-2 text-xs">
                {product.sizes.map((s) => (
                  <div key={s.label} className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {s.label}
                    </span>
                    <span className="text-slate-500 font-mono-num">
                      SKU: {product.sku}-{s.skuSuffix} · {s.stock} in stock
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

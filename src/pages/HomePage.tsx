import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Mail,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import {
  CATEGORIES,
  HERO_SLIDES,
  PRODUCTS,
  TESTIMONIALS,
} from '../data/mockData';
import { DEFAULT_FILTERS, useStore } from '../context/StoreContext';
import { formatPrice, getDiscountPercent } from '../utils/format';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';

const ENGINEERING_SPOTS = [
  {
    id: 'driver',
    title: '40mm Beryllium Drivers',
    metric: '10Hz – 40kHz Hi-Res',
    detail:
      'Ultra-stiff beryllium-coated diaphragms eliminate breakup distortion at high SPL for surgical transient accuracy.',
  },
  {
    id: 'anc',
    title: 'Hybrid -45dB ANC',
    metric: '6-Mic Feedforward Array',
    detail:
      'Samples ambient cabin and traffic noise 48,000 times per second to adaptively cancel low-end rumble without ear pressure.',
  },
  {
    id: 'chassis',
    title: 'Anodized Aluminum Yoke',
    metric: '258g Balanced Clamp',
    detail:
      'CNC-machined aerospace aluminum hinges paired with memory-foam lambskin cushions built for 8-hour studio sessions.',
  },
  {
    id: 'power',
    title: '48-Hour Endurance',
    metric: '10-Min Charge = 6 Hrs',
    detail:
      'High-density dual-cell battery with USB-C lossless DAC audio passthrough and rapid PD charging.',
  },
];

export const HomePage: React.FC = () => {
  const {
    currency,
    navigate,
    setShopFilters,
    addToCart,
    recentViewIds,
    addToast,
  } = useStore();

  const [slideIdx, setSlideIdx] = useState(0);
  const [featuredTab, setFeaturedTab] = useState<'all' | 'best' | 'new' | 'top'>('all');
  const [tabLoading, setTabLoading] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(ENGINEERING_SPOTS[0].id);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Live Flash Sale Countdown (2d 14h 36m 48s ticking down)
  const [secondsLeft, setSecondsLeft] = useState(2 * 86400 + 14 * 3600 + 36 * 60 + 48);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 2 * 86400 + 14 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const auto = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(auto);
  }, []);

  const countdown = useMemo(() => {
    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;
    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
    };
  }, [secondsLeft]);

  const flashProducts = useMemo(() => PRODUCTS.filter((p) => p.isFlashSale), []);
  const flagshipProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === 'th-studio-anc-pro') || PRODUCTS[0],
    []
  );
  const recentlyViewed = useMemo(
    () =>
      recentViewIds
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [recentViewIds]
  );

  const featuredProducts = useMemo(() => {
    if (featuredTab === 'best') return PRODUCTS.filter((p) => p.isBestSeller).slice(0, 8);
    if (featuredTab === 'new') return PRODUCTS.filter((p) => p.isNewArrival).slice(0, 8);
    if (featuredTab === 'top') return PRODUCTS.filter((p) => p.isTopRated).slice(0, 8);
    return PRODUCTS.slice(0, 8);
  }, [featuredTab]);

  const handleTabChange = (next: 'all' | 'best' | 'new' | 'top') => {
    setFeaturedTab(next);
    setTabLoading(true);
    setTimeout(() => setTabLoading(false), 220);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      addToast('Valid email required', 'Please enter a valid email address.', 'error');
      return;
    }
    addToast(
      'Subscribed to TECHHAVEN',
      `Early access & member drops will be sent to ${newsletterEmail.trim()}.`,
      'success'
    );
    setNewsletterEmail('');
  };

  const currentSlide = HERO_SLIDES[slideIdx];
  const currentSpot =
    ENGINEERING_SPOTS.find((s) => s.id === activeHotspot) || ENGINEERING_SPOTS[0];

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-24 lg:pb-16">
      {/* 1. HERO CAROUSEL */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 min-h-[460px] lg:min-h-[540px] flex items-stretch">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.35 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 w-full items-stretch"
            >
              {/* Left Copy */}
              <div className="lg:col-span-6 p-5 sm:p-10 lg:p-14 flex flex-col justify-center relative z-10 bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0B0F19]">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#F97316] mb-3">
                  {currentSlide.kicker}
                </span>
                <h1
                  className="font-display font-bold text-white leading-[1.08] tracking-tight mb-4"
                  style={{ fontSize: 'clamp(1.85rem, 3.6vw, 3.35rem)', textWrap: 'balance' }}
                >
                  {currentSlide.title}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mb-5">
                  {currentSlide.subtitle}
                </p>

                {/* Clean Unboxed Feature Highlights */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-300 mb-6 sm:mb-7">
                  {currentSlide.features.map((feat, idx) => (
                    <React.Fragment key={feat}>
                      {idx > 0 && <span aria-hidden="true" className="text-slate-500">·</span>}
                      <span>{feat}</span>
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('shop', { categoryId: currentSlide.targetCategory })}
                    className="min-h-[44px] px-6 py-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>{currentSlide.primaryCta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShopFilters({ ...DEFAULT_FILTERS, onSaleOnly: true });
                      navigate('shop');
                    }}
                    className="min-h-[44px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {currentSlide.secondaryCta}
                  </button>
                </div>
              </div>

              {/* Right Visual */}
              <div className="lg:col-span-6 relative min-h-[250px] sm:min-h-[300px] lg:min-h-full bg-slate-950">
                <SafeImage
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover lg:absolute lg:inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0B0F19] via-transparent to-transparent opacity-60 lg:opacity-80 pointer-events-none" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Controls */}
          <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1 sm:mr-2">
              {HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlideIdx(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    slideIdx === idx ? 'w-7 bg-[#F97316]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
              }
              aria-label="Previous slide"
              className="w-10 h-10 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:border-[#F97316] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
              aria-label="Next slide"
              className="w-10 h-10 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:border-[#F97316] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. TRUST & VALUE STRIP */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: ShieldCheck,
              title: '100% Authentic Products',
              desc: 'Official global warranty & sealed serial verification',
            },
            {
              icon: Truck,
              title: 'Global Express Shipping',
              desc: 'DHL, FedEx & Aramex · USA, UAE, UK & Canada',
            },
            {
              icon: RotateCcw,
              title: '7-Day Easy Returns',
              desc: 'Hassle-free replacement & refund guarantee',
            },
            {
              icon: Zap,
              title: 'Secure Payment',
              desc: 'Visa, Mastercard, Amex, PayPal, Apple/Google Pay & Payoneer',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY (8 VISUAL CARDS) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Shop by Category
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Curated collections across personal audio, computing, optics, and mobile gear.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShopFilters(DEFAULT_FILTERS);
              navigate('shop');
            }}
            className="text-sm font-semibold text-[#F97316] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            All Categories <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5">
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 'some' }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              onClick={() => navigate('shop', { categoryId: cat.id })}
              className="group rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-3 text-left hover:border-[#F97316]/60 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-3">
                <SafeImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#F97316] truncate">
                {cat.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {cat.tagline}
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 4. FLASH SALE & LIVE COUNTDOWN */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950 dark:bg-[#111827] border border-slate-800 dark:border-white/10 p-5 sm:p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 mb-7 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#F97316] mb-2">
                <Clock className="w-4 h-4" />
                Limited Time Flash Deals
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Save Up to 25% on Top Tech
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                {[
                  { label: 'Days', val: countdown.days },
                  { label: 'Hrs', val: countdown.hours },
                  { label: 'Mins', val: countdown.mins },
                  { label: 'Secs', val: countdown.secs },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="w-13 sm:w-14 py-2 rounded-xl bg-white/5 border border-white/10 text-center"
                  >
                    <div className="text-base sm:text-lg font-bold font-mono-num text-white leading-none">
                      {unit.val}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                      {unit.label}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShopFilters({ ...DEFAULT_FILTERS, onSaleOnly: true });
                  navigate('shop');
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                View All Deals <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Deal Products */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            {flashProducts.map((prod) => {
              const disc = getDiscountPercent(prod.priceUsd, prod.originalPriceUsd);
              const soldPct = prod.flashSoldPercent ?? 75;
              return (
                <div
                  key={prod.id}
                  onClick={() => navigate('product', { productId: prod.id })}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between hover:border-[#F97316]/60 transition-colors cursor-pointer group"
                >
                  <div>
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 mb-3">
                      <SafeImage
                        src={prod.images[0]}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {disc > 0 && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#F97316] text-white text-[11px] font-bold">
                          -{disc}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mb-1">{prod.category}</div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#F97316] line-clamp-1">
                      {prod.title}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-bold font-mono-num text-[#F97316]">
                        {formatPrice(prod.priceUsd, currency)}
                      </span>
                      {prod.originalPriceUsd && (
                        <span className="text-xs font-mono-num text-slate-500 line-through">
                          {formatPrice(prod.originalPriceUsd, currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5 tabular-nums">
                      <span>{soldPct}% Sold</span>
                      <span className="text-amber-400">{prod.stock} left</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-[#F97316]"
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod);
                      }}
                      className="w-full min-h-[40px] py-2 rounded-xl bg-white text-slate-950 hover:bg-[#F97316] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Grab Deal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FEATURED & TRENDING PRODUCTS GRID */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Featured & Trending Hardware
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Precision-engineered gear verified by our acoustics and systems lab.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 self-start max-w-full overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'best', label: 'Best Sellers' },
              { id: 'new', label: 'New Arrivals' },
              { id: 'top', label: 'Top Rated' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as typeof featuredTab)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  featuredTab === tab.id
                    ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {tabLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#111827] p-4 space-y-3"
              >
                <div className="aspect-[4/3] rounded-xl skeleton-shimmer" />
                <div className="h-4 w-2/3 rounded skeleton-shimmer" />
                <div className="h-5 w-full rounded skeleton-shimmer" />
                <div className="h-9 w-full rounded-xl skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setShopFilters(DEFAULT_FILTERS);
              navigate('shop');
            }}
            className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111827] hover:border-[#F97316] text-sm font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
          >
            Explore All {PRODUCTS.length} Products
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 6. ENGINEERING SHOWCASE SPLIT-BANNER */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[320px] bg-slate-900">
            <SafeImage
              src={flagshipProduct.images[0]}
              alt={flagshipProduct.title}
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#F97316] mb-1">
                <Headphones className="w-4 h-4" />
                Engineering Spotlight
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                {flagshipProduct.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Select a hardware subsystem to inspect acoustic & build tolerances.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between gap-6">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Built for Reference Listening
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {ENGINEERING_SPOTS.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => setActiveHotspot(spot.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeHotspot === spot.id
                        ? 'border-[#F97316] bg-[#F97316]/10'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/25'
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#F97316] font-mono-num">
                      {spot.metric}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {spot.title}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {currentSpot.title}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentSpot.detail}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
              <div>
                <div className="text-xs text-slate-500">Flagship Price</div>
                <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white">
                  {formatPrice(flagshipProduct.priceUsd, currency)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('product', { productId: flagshipProduct.id })}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm font-semibold text-slate-800 dark:text-white hover:border-[#F97316] cursor-pointer"
                >
                  Inspect Specs
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(flagshipProduct)}
                  className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Add to Bag
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VERIFIED CUSTOMER TESTIMONIALS */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Verified Buyer Reviews
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Trusted by over 18,000+ audio engineers, creators, and tech enthusiasts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F97316]/15 text-[#F97316] font-bold text-xs flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 text-right">
                  {t.productTag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. RECENTLY VIEWED CAROUSEL */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-5">
            Recently Viewed Products
          </h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            {recentlyViewed.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate('product', { productId: prod.id })}
                className="w-[220px] sm:w-[240px] snap-start rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-3 hover:border-[#F97316] transition-colors cursor-pointer shrink-0 group"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-2.5">
                  <SafeImage
                    src={prod.images[0]}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-[11px] text-slate-500 truncate">{prod.category}</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#F97316]">
                  {prod.title}
                </div>
                <div className="text-sm font-bold font-mono-num text-[#F97316] mt-1">
                  {formatPrice(prod.priceUsd, currency)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. NEWSLETTER SUBSCRIPTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 dark:bg-[#111827] border border-slate-800 dark:border-white/10 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#F97316] mb-2">
              <Mail className="w-4 h-4" />
              Insider Hardware Drops
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Get $15 Off Your Next Tech Upgrade
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              Subscribe for flash-sale alerts, firmware releases, and member-only bundle pricing.
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto lg:min-w-[400px]"
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 min-h-[44px] px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#F97316]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-6 py-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import {
  Check,
  ChevronDown,
  Clock,
  GitCompare,
  Globe,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  Store,
  Sun,
  User,
  X,
} from 'lucide-react';
import { CATEGORIES, CURRENCY_CONFIG, PRODUCTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_FILTERS, useStore } from '../context/StoreContext';
import { CurrencyCode } from '../types/store';
import { formatPrice } from '../utils/format';
import { BrandLogo } from './BrandLogo';
import { SafeImage } from './SafeImage';
import { UserAvatar } from './UserAvatar';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    page,
    navigate,
    cartCount,
    wishlistIds,
    compareIds,
    setCartOpen,
    setWishlistOpen,
    setCompareOpen,
    openAuthModal,
    setShopFilters,
    recentSearches,
    addRecentSearch,
    addToast,
  } = useStore();
  const { user, isAuthenticated, profile, signOut } = useAuth();

  const [promoDismissed, setPromoDismissed] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badgeBounce, setBadgeBounce] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    if (cartCount > 0) {
      setBadgeBounce(true);
      const t = setTimeout(() => setBadgeBounce(false), 360);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAvatarSrc = profile?.photoURL || undefined;

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    if (page === 'account' || page === 'checkout') {
      navigate('home');
    }
    addToast('Signed out', 'Your cart items remain saved locally.', 'info');
  };

  const searchMatches = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchInput]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    addRecentSearch(q);
    setSearchOpen(false);
    navigate('shop', { query: q });
  };

  return (
    <>
      <header className="sticky top-0 z-40 no-print">
        {/* Top Scroll Progress Bar */}
        <motion.div
          style={{ scaleX }}
          className="h-0.5 bg-[#F97316] origin-left w-full"
        />

        {/* Slim Dismissible Announcement Bar */}
        <AnimatePresence>
          {!promoDismissed && (
            <motion.div
              initial={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-950 dark:bg-black text-slate-200 border-b border-white/10 text-xs overflow-hidden"
            >
              <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 min-h-8 py-1 flex items-center justify-between gap-2 sm:gap-4">
                <p className="truncate text-[11px] sm:text-xs">
                  Free Express Shipping on Orders Over $100 | Ships to USA, UAE, UK &amp; Canada | 24/7 Global Support
                </p>
                <div className="flex items-center gap-3 shrink-0 text-slate-400">
                  <span className="hidden md:inline">
                    Use Code <strong className="text-[#F97316]">SAVE10</strong> for 10% Off
                  </span>
                  <button
                    type="button"
                    onClick={() => setPromoDismissed(true)}
                    aria-label="Dismiss announcement"
                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Navbar */}
        <div className="bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
            {/* Brand Zone */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                className="lg:hidden min-w-[44px] min-h-[44px] -ml-1.5 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('home')}
                aria-label="TechHaven Home"
                className="flex items-center text-left cursor-pointer shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-xl"
              >
                <BrandLogo variant="header" />
              </button>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => navigate('home')}
                className={`whitespace-nowrap shrink-0 hover:text-[#F97316] transition-colors cursor-pointer ${
                  page === 'home' ? 'text-[#F97316] font-semibold' : ''
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setShopFilters(DEFAULT_FILTERS);
                  navigate('shop');
                }}
                className={`whitespace-nowrap shrink-0 hover:text-[#F97316] transition-colors cursor-pointer ${
                  page === 'shop' ? 'text-[#F97316] font-semibold' : ''
                }`}
              >
                Shop
              </button>
              <div
                className="relative"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setMegaOpen((o) => !o)}
                  className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 hover:text-[#F97316] transition-colors cursor-pointer py-2"
                >
                  Categories
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {megaOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[620px] z-50"
                    >
                      <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-5 grid grid-cols-2 gap-3">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setMegaOpen(false);
                              navigate('shop', { categoryId: cat.id });
                            }}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors cursor-pointer group"
                          >
                            <SafeImage
                              src={cat.image}
                              alt={cat.name}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-800"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#F97316] truncate">
                                {cat.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {cat.tagline}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShopFilters({ ...DEFAULT_FILTERS, onSaleOnly: true });
                  navigate('shop');
                }}
                className="whitespace-nowrap shrink-0 hover:text-[#F97316] transition-colors cursor-pointer"
              >
                Deals
              </button>
              <button
                type="button"
                onClick={() => navigate('account', { accountTab: 'orders' })}
                className={`whitespace-nowrap shrink-0 hover:text-[#F97316] transition-colors cursor-pointer ${
                  page === 'account' ? 'text-[#F97316] font-semibold' : ''
                }`}
              >
                Track Order
              </button>
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Instant Search */}
              <div ref={searchRef} className="relative">
                <form
                  onSubmit={handleSearchSubmit}
                  className="hidden md:flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 w-40 lg:w-52 xl:w-64 focus-within:border-[#F97316] transition-colors"
                >
                  <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchInput}
                    onFocus={() => setSearchOpen(true)}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setSearchOpen(true);
                    }}
                    placeholder="Search gear, SKUs..."
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      aria-label="Clear search"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Mobile Search Trigger */}
                <button
                  type="button"
                  onClick={() => setSearchOpen((o) => !o)}
                  aria-label="Search products"
                  className="md:hidden min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="fixed inset-x-3 top-[68px] sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-h-[75dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-4 z-50"
                    >
                      <form onSubmit={handleSearchSubmit} className="md:hidden mb-3">
                        <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2">
                          <Search className="w-4 h-4 text-slate-400 mr-2" />
                          <input
                            type="text"
                            autoFocus
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search headphones, watches..."
                            className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </form>

                      {searchInput.trim() ? (
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span>Instant Results</span>
                            <button
                              type="button"
                              onClick={() => {
                                addRecentSearch(searchInput.trim());
                                setSearchOpen(false);
                                navigate('shop', { query: searchInput.trim() });
                              }}
                              className="text-[#F97316] font-semibold hover:underline cursor-pointer"
                            >
                              View All
                            </button>
                          </div>
                          {searchMatches.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 text-center">
                              No hardware matched &ldquo;{searchInput}&rdquo;.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {searchMatches.map((prod) => (
                                <button
                                  key={prod.id}
                                  type="button"
                                  onClick={() => {
                                    addRecentSearch(prod.title);
                                    setSearchOpen(false);
                                    navigate('product', { productId: prod.id });
                                  }}
                                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors cursor-pointer"
                                >
                                  <SafeImage
                                    src={prod.images[0]}
                                    alt={prod.title}
                                    className="w-11 h-11 rounded-lg object-cover shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                      {prod.title}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono-num">
                                      {formatPrice(prod.priceUsd, currency)} · {prod.category}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-2">
                            Recent Searches
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {recentSearches.map((term) => (
                              <button
                                key={term}
                                type="button"
                                onClick={() => {
                                  setSearchInput(term);
                                  setSearchOpen(false);
                                  navigate('shop', { query: term });
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-[#F97316]/15 hover:text-[#F97316] text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Clock className="w-3 h-3" />
                                {term}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Multi-Currency Switcher Dropdown */}
              <div ref={currencyRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setCurrencyOpen((o) => !o)}
                  title="Switch Currency & Region"
                  aria-label="Select currency"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold font-mono-num text-slate-700 dark:text-slate-200 hover:border-[#F97316] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{CURRENCY_CONFIG[currency].label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50"
                    >
                      {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((code) => {
                        const cfg = CURRENCY_CONFIG[code];
                        const active = currency === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => {
                              setCurrency(code);
                              setCurrencyOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#F97316]/10 text-[#F97316] font-semibold'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                          >
                            <div>
                              <div className="font-mono-num font-semibold">{cfg.label}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {cfg.country}
                              </div>
                            </div>
                            {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dark / Light Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Dark or Light Mode"
                className="min-w-[44px] min-h-[44px] sm:min-w-[38px] sm:min-h-[38px] rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#F97316] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Compare Trigger */}
              {compareIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCompareOpen(true)}
                  aria-label="Open product comparison"
                  className="relative min-w-[44px] min-h-[44px] sm:min-w-[38px] sm:min-h-[38px] rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#F97316] transition-colors cursor-pointer"
                >
                  <GitCompare className="w-4 h-4" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {compareIds.length}
                  </span>
                </button>
              )}

              {/* Wishlist Trigger (desktop/tablet; mobile uses bottom nav Saved tab) */}
              <button
                type="button"
                onClick={() => setWishlistOpen(true)}
                aria-label="Open wishlist"
                className="hidden sm:flex relative min-w-[38px] min-h-[38px] rounded-xl items-center justify-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#F97316] transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4" />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {wishlistIds.length}
                  </span>
                )}
              </button>

              {/* Cart Trigger */}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label="Open shopping bag"
                className="relative inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] sm:min-h-[38px] rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Bag</span>
                <motion.span
                  animate={badgeBounce ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-1.5 py-0.5 rounded-md bg-black/25 text-[11px] font-bold tabular-nums"
                >
                  {cartCount}
                </motion.span>
              </button>

              {/* User Account / Sign In & Dropdown */}
              <div ref={accountRef} className="relative hidden sm:block">
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAccountMenuOpen((o) => !o)}
                      aria-label="Account menu"
                      className="inline-flex items-center gap-2 px-2.5 min-h-[38px] rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <UserAvatar
                        src={activeAvatarSrc}
                        name={profile?.displayName || user?.displayName}
                        sizeClass="w-5 h-5"
                        textClass="text-[10px]"
                        roundedClass="rounded-full"
                      />
                      <span className="max-w-[90px] truncate">
                        {profile?.displayName?.split(' ')[0] || 'Account'}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {accountMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50"
                        >
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1.5 flex items-center gap-2.5">
                            <UserAvatar
                              src={activeAvatarSrc}
                              name={profile?.displayName || user?.displayName}
                              sizeClass="w-8 h-8"
                              textClass="text-xs"
                              roundedClass="rounded-xl"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {profile?.displayName || 'TechHaven Member'}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {profile?.email}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              navigate('account', { accountTab: 'manage' });
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5 text-[#F97316]" />
                            <span>Manage My Account</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              navigate('account', { accountTab: 'orders' });
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5 text-[#F97316]" />
                            <span>My Orders</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              navigate('account', { accountTab: 'wishlist' });
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                          >
                            <Heart className="w-3.5 h-3.5 text-[#F97316]" />
                            <span>My Wishlist &amp; Stores</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              navigate('account', { accountTab: 'reviews' });
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#F97316]" />
                            <span>My Reviews</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              navigate('account', { accountTab: 'returns' });
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#F97316]" />
                            <span>My Returns &amp; Cancellations</span>
                          </button>

                          <div className="my-1.5 border-t border-slate-100 dark:border-white/10" />

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal({ tab: 'login', context: 'general' })}
                    aria-label="Sign In or Sign Up"
                    className="inline-flex items-center gap-2 px-3 min-h-[38px] rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('home');
                    }}
                    aria-label="TechHaven Home"
                    className="flex items-center cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-xl"
                  >
                    <BrandLogo variant="drawer" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1 mb-6">
                  {[
                    { label: 'Home', action: () => navigate('home') },
                    {
                      label: 'All Products',
                      action: () => {
                        setShopFilters(DEFAULT_FILTERS);
                        navigate('shop');
                      },
                    },
                    {
                      label: 'Flash Deals',
                      action: () => {
                        setShopFilters({ ...DEFAULT_FILTERS, onSaleOnly: true });
                        navigate('shop');
                      },
                    },
                    {
                      label: 'Track Orders & Account',
                      action: () => navigate('account', { accountTab: 'orders' }),
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        item.action();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-semibold text-slate-400 mb-2 px-3">
                  Categories
                </div>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('shop', { categoryId: cat.id });
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs text-slate-400 tabular-nums">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500">Currency &amp; Region</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((code) => {
                      const cfg = CURRENCY_CONFIG[code];
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setCurrency(code)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono-num border cursor-pointer transition-colors ${
                            currency === code
                              ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('account', { accountTab: 'manage' });
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold cursor-pointer"
                    >
                      Account ({profile?.displayName?.split(' ')[0] || 'User'})
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal({ tab: 'signup', context: 'general' });
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold cursor-pointer"
                  >
                    Sign In / Create Account
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 pb-[env(safe-area-inset-bottom)] no-print"
      >
        <div className="grid grid-cols-5 h-16">
          <button
            type="button"
            onClick={() => navigate('home')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] cursor-pointer ${
              page === 'home' ? 'text-[#F97316] font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('shop')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] cursor-pointer ${
              page === 'shop' ? 'text-[#F97316] font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shop</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            className="relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            <span>Saved</span>
            {wishlistIds.length > 0 && (
              <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-[#F97316]" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              isAuthenticated
                ? navigate('account', { accountTab: 'manage' })
                : openAuthModal({ tab: 'login', context: 'general' })
            }
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] cursor-pointer ${
              page === 'account' ? 'text-[#F97316] font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isAuthenticated ? (profile?.displayName?.split(' ')[0] || 'Account') : 'Sign In'}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Filter,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/format';
import { ProductCard } from '../components/ProductCard';

export const ShopPage: React.FC = () => {
  const { shopFilters, setShopFilters, resetShopFilters, currency } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [shimmering, setShimmering] = useState(false);

  const allBrands = useMemo(
    () => Array.from(new Set(PRODUCTS.map((p) => p.brand))),
    []
  );
  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    PRODUCTS.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)));
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, []);

  const triggerShimmer = () => {
    setShimmering(true);
    setTimeout(() => setShimmering(false), 180);
  };

  const toggleCategory = (catId: string) => {
    triggerShimmer();
    setShopFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId],
    }));
  };

  const toggleBrand = (brand: string) => {
    triggerShimmer();
    setShopFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const toggleColor = (colorName: string) => {
    triggerShimmer();
    setShopFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter((c) => c !== colorName)
        : [...prev.colors, colorName],
    }));
  };

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];
    const q = shopFilters.query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    if (shopFilters.categories.length > 0) {
      list = list.filter((p) => shopFilters.categories.includes(p.categoryId));
    }
    if (shopFilters.brands.length > 0) {
      list = list.filter((p) => shopFilters.brands.includes(p.brand));
    }
    if (shopFilters.colors.length > 0) {
      list = list.filter((p) =>
        p.colors.some((c) => shopFilters.colors.includes(c.name))
      );
    }
    if (shopFilters.minRating > 0) {
      list = list.filter((p) => p.rating >= shopFilters.minRating);
    }
    if (shopFilters.inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }
    if (shopFilters.onSaleOnly) {
      list = list.filter((p) => Boolean(p.originalPriceUsd && p.originalPriceUsd > p.priceUsd));
    }
    list = list.filter(
      (p) =>
        p.priceUsd >= shopFilters.minPriceUsd &&
        p.priceUsd <= shopFilters.maxPriceUsd
    );

    if (shopFilters.sortBy === 'price_asc') {
      list.sort((a, b) => a.priceUsd - b.priceUsd);
    } else if (shopFilters.sortBy === 'price_desc') {
      list.sort((a, b) => b.priceUsd - a.priceUsd);
    } else if (shopFilters.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (shopFilters.sortBy === 'newest') {
      list.sort((a, b) => Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival)));
    }

    return list;
  }, [shopFilters]);

  const activeFilterCount =
    shopFilters.categories.length +
    shopFilters.brands.length +
    shopFilters.colors.length +
    (shopFilters.query ? 1 : 0) +
    (shopFilters.minRating > 0 ? 1 : 0) +
    (shopFilters.inStockOnly ? 1 : 0) +
    (shopFilters.onSaleOnly ? 1 : 0) +
    (shopFilters.maxPriceUsd < 3000 ? 1 : 0);

  const FilterPanelContent = () => (
    <div className="space-y-6">
      {/* Search within results */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Search Catalog
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={shopFilters.query}
            onChange={(e) =>
              setShopFilters((prev) => ({ ...prev, query: e.target.value }))
            }
            placeholder="Keyword or SKU..."
            className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#F97316]"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
          Categories
        </div>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const count = PRODUCTS.filter((p) => p.categoryId === cat.id).length;
            const checked = shopFilters.categories.includes(cat.id);
            return (
              <label
                key={cat.id}
                className="flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[#F97316]"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]"
                  />
                  <span>{cat.name}</span>
                </span>
                <span className="text-xs text-slate-400 tabular-nums">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Interactive Price Slider */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          <span>Max Price</span>
          <span className="font-mono-num text-[#F97316]">
            {formatPrice(shopFilters.maxPriceUsd, currency)}
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={3000}
          step={20}
          value={shopFilters.maxPriceUsd}
          onChange={(e) =>
            setShopFilters((prev) => ({
              ...prev,
              maxPriceUsd: Number(e.target.value),
            }))
          }
          className="w-full accent-[#F97316] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400 font-mono-num mt-1">
          <span>{formatPrice(20, currency)}</span>
          <span>{formatPrice(3000, currency)}</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
          Brand
        </div>
        <div className="space-y-2">
          {allBrands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[#F97316]"
            >
              <input
                type="checkbox"
                checked={shopFilters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]"
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Color Swatches */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
          Finish & Color
        </div>
        <div className="flex flex-wrap gap-2">
          {allColors.map((c) => {
            const active = shopFilters.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleColor(c.name)}
                title={c.name}
                aria-label={`Filter by ${c.name}`}
                className={`w-7 h-7 rounded-full border transition-transform cursor-pointer ${
                  active
                    ? 'ring-2 ring-[#F97316] ring-offset-2 ring-offset-white dark:ring-offset-[#111827] scale-110'
                    : 'border-slate-300 dark:border-white/20'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </div>

      {/* Minimum Star Rating */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
          Minimum Rating
        </div>
        <div className="flex flex-wrap gap-2">
          {[4, 3, 0].map((ratingVal) => (
            <button
              key={ratingVal}
              type="button"
              onClick={() => {
                triggerShimmer();
                setShopFilters((prev) => ({ ...prev, minRating: ratingVal }));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border inline-flex items-center gap-1 transition-colors cursor-pointer ${
                shopFilters.minRating === ratingVal
                  ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              {ratingVal > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{ratingVal}+ Stars</span>
                </>
              ) : (
                <span>Any Rating</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <span>In Stock Only</span>
          <input
            type="checkbox"
            checked={shopFilters.inStockOnly}
            onChange={(e) => {
              triggerShimmer();
              setShopFilters((prev) => ({ ...prev, inStockOnly: e.target.checked }));
            }}
            className="w-4 h-4 accent-[#F97316]"
          />
        </label>
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <span>On Sale Only</span>
          <input
            type="checkbox"
            checked={shopFilters.onSaleOnly}
            onChange={(e) => {
              triggerShimmer();
              setShopFilters((prev) => ({ ...prev, onSaleOnly: e.target.checked }));
            }}
            className="w-4 h-4 accent-[#F97316]"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Hardware Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Filter by category, finish, brand, price ceiling, or verified buyer rating.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-sm font-semibold self-start cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#F97316]" />
          Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-7">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200 dark:border-white/10">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Filter className="w-4 h-4 text-[#F97316]" />
                Filters
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetShopFilters}
                  className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
            <FilterPanelContent />
          </div>
        </aside>

        {/* Main Results Area */}
        <div className="flex-1 min-w-0">
          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {shopFilters.query && (
                <button
                  type="button"
                  onClick={() => setShopFilters((p) => ({ ...p, query: '' }))}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F97316]/10 text-[#F97316] text-xs font-semibold cursor-pointer"
                >
                  Search: &ldquo;{shopFilters.query}&rdquo; <X className="w-3 h-3" />
                </button>
              )}
              {shopFilters.categories.map((catId) => (
                <button
                  key={catId}
                  type="button"
                  onClick={() => toggleCategory(catId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {CATEGORIES.find((c) => c.id === catId)?.name || catId}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {shopFilters.brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {brand} <X className="w-3 h-3" />
                </button>
              ))}
              {shopFilters.onSaleOnly && (
                <button
                  type="button"
                  onClick={() => setShopFilters((p) => ({ ...p, onSaleOnly: false }))}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F97316]/10 text-[#F97316] text-xs font-semibold cursor-pointer"
                >
                  On Sale <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={resetShopFilters}
                className="text-xs font-semibold text-slate-500 hover:text-[#F97316] underline ml-1 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 tabular-nums">
              Showing <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> of {PRODUCTS.length} products
            </span>

            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <select
                value={shopFilters.sortBy}
                onChange={(e) =>
                  setShopFilters((p) => ({
                    ...p,
                    sortBy: e.target.value as typeof shopFilters.sortBy,
                  }))
                }
                aria-label="Sort products"
                className="min-h-[40px] flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="rating">Highest Rated</option>
              </select>

              <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10 p-0.5 bg-slate-50 dark:bg-[#0B0F19]">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#111827] text-[#F97316] shadow-sm'
                      : 'text-slate-400'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#111827] text-[#F97316] shadow-sm'
                      : 'text-slate-400'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid / List */}
          {shimmering ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-4 space-y-3"
                >
                  <div className="aspect-[4/3] rounded-xl skeleton-shimmer" />
                  <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                  <div className="h-5 w-full rounded skeleton-shimmer" />
                  <div className="h-9 w-full rounded-xl skeleton-shimmer" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No matching hardware found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Try widening your price ceiling or clearing active filters.
              </p>
              <button
                type="button"
                onClick={resetShopFilters}
                className="px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} layout="list" index={idx} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} layout="grid" index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-white/10 p-5 overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200 dark:border-white/10">
                <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Filter Products
                </span>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label="Close filters"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1">
                <FilterPanelContent />
              </div>
              <div className="sticky bottom-0 mt-6 pt-4 pb-2 bg-white dark:bg-[#0B0F19] border-t border-slate-200 dark:border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={resetShopFilters}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-[#F97316] text-white text-xs font-semibold cursor-pointer"
                >
                  Show {filteredProducts.length} Items
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

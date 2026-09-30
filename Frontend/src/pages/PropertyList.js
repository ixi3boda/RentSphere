import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../components/AnimatedPage";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";
import { propertyApi } from "../utils/api";
import { mapPropertyToFrontend } from "../utils/mappers";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_OPTIONS } from "../utils/propertyTypes";

const PAGE_SIZE = 9;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Lowest Price" },
  { value: "price_desc", label: "Highest Price" },
];

// The Hero search bar hands these to the listings page through the query string.
const URL_KEYS = { search: "q", type: "type", city: "city", maxPrice: "maxPrice", sortBy: "sort" };

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 soft-shadow animate-pulse">
      <div className="h-64 bg-slate-200" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div className="h-4 bg-slate-100 rounded-md w-1/4" />
          <div className="h-4 bg-slate-100 rounded-md w-1/6" />
        </div>
        <div className="h-6 bg-slate-100 rounded-lg w-4/5" />
        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
          <div className="h-8 bg-slate-100 rounded-md w-1/3" />
          <div className="h-10 w-10 bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-all"
    >
      {label}
      <span className="text-[14px] font-normal">×</span>
    </button>
  );
}

function PropertyList() {
  const { isAuthenticated, initializing } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [cities, setCities] = useState([]);

  const search = searchParams.get(URL_KEYS.search) || "";
  const typeFilter = searchParams.get(URL_KEYS.type) || "";
  const cityFilter = searchParams.get(URL_KEYS.city) || "";
  const maxPrice = searchParams.get(URL_KEYS.maxPrice) || "";
  const sortBy = searchParams.get(URL_KEYS.sortBy) || "newest";
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);

  // Kept local so typing does not push a history entry (and a server request) per keystroke.
  const [searchInput, setSearchInput] = useState(search);

  const updateParams = useCallback(
    (updates) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === "" || value == null) next.delete(key);
          else next.set(key, String(value));
        });
        // Any filter or sort change invalidates the current page.
        if (updates.page === undefined) next.delete("page");
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => { setSearchInput(search); }, [search]);

  useEffect(() => {
    if (!searchInput) return;
    const timer = setTimeout(() => {
      if (searchInput !== search) updateParams({ [URL_KEYS.search]: searchInput });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  useEffect(() => {
    let cancelled = false;
    propertyApi.getCities()
      .then((res) => { if (!cancelled && Array.isArray(res.data)) setCities(res.data); })
      .catch(() => { if (!cancelled) setCities([]); });
    return () => { cancelled = true; };
  }, []);

  const queryKey = JSON.stringify([search, typeFilter, cityFilter, maxPrice, sortBy, page]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await propertyApi.filter({
        search: search || undefined,
        city: cityFilter || undefined,
        propertyType: typeFilter || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy,
        page,
        size: PAGE_SIZE,
      });
      setItems(Array.isArray(res.data?.items) ? res.data.items.map(mapPropertyToFrontend) : []);
      setTotal(Number(res.data?.total) || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, cityFilter, maxPrice, sortBy, page]);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const res = await propertyApi.getFavorites();
      const list = Array.isArray(res.data) ? res.data : [];
      setFavoriteIds(new Set(list.map((item) => String(item?.propertyDetails?.property?.propertyId)).filter(Boolean)));
    } catch {
      setFavoriteIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!initializing) fetchProperties();
    // queryKey, not fetchProperties, is the trigger: fetchProperties is recreated whenever a
    // filter changes, which would otherwise double-fire the request.
  }, [fetchProperties, initializing, queryKey]);

  useEffect(() => {
    if (!initializing) fetchFavorites();
  }, [fetchFavorites, initializing]);

  const clearFilters = () => {
    setSearchInput("");
    updateParams({ [URL_KEYS.search]: "", [URL_KEYS.type]: "", [URL_KEYS.city]: "", [URL_KEYS.maxPrice]: "" });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const shownFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const shownTo = Math.min(total, (page + 1) * PAGE_SIZE);
  const hasFilters = Boolean(search || typeFilter || cityFilter || maxPrice);

  const cityOptions = useMemo(() => {
    if (cities.length > 0) return cities;
    // Keep a selected city visible even before the city list arrives.
    return cityFilter ? [cityFilter] : [];
  }, [cities, cityFilter]);

  return (
    <AnimatedPage>
      <div className="bg-slate-50 min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Explore <span className="gradient-text">Spaces.</span>
            </h1>
            <p className="text-slate-600 font-medium max-w-xl">
              From urban studios to suburban villas, find the property that fits your life perfectly.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 soft-shadow mb-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-4 group">
                <label htmlFor="pl-search" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 ml-1">Search</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    id="pl-search"
                    type="text"
                    placeholder="Where are you looking?"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="input-field pl-12 pr-4 h-14"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="pl-type" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 ml-1">Type</label>
                <select id="pl-type" value={typeFilter} onChange={(e) => updateParams({ [URL_KEYS.type]: e.target.value })} className="input-field h-14">
                  <option value="">All Types</option>
                  {PROPERTY_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="pl-city" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 ml-1">City</label>
                <select id="pl-city" value={cityFilter} onChange={(e) => updateParams({ [URL_KEYS.city]: e.target.value })} className="input-field h-14">
                  <option value="">All Cities</option>
                  {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="pl-maxprice" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 ml-1">Max Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold pointer-events-none">$</span>
                  <input
                    id="pl-maxprice"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={maxPrice}
                    onChange={(e) => updateParams({ [URL_KEYS.maxPrice]: e.target.value })}
                    className="input-field pl-8 h-14"
                  />
                </div>
              </div>
            </div>

            {/* Active Chips */}
            <AnimatePresence>
              {hasFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mr-2">Applied:</span>
                  {search && <FilterChip label={`"${search}"`} onRemove={() => { setSearchInput(""); updateParams({ [URL_KEYS.search]: "" }); }} />}
                  {typeFilter && <FilterChip label={PROPERTY_TYPE_LABELS[typeFilter] || typeFilter} onRemove={() => updateParams({ [URL_KEYS.type]: "" })} />}
                  {cityFilter && <FilterChip label={cityFilter} onRemove={() => updateParams({ [URL_KEYS.city]: "" })} />}
                  {maxPrice && <FilterChip label={`Max $${maxPrice}`} onRemove={() => updateParams({ [URL_KEYS.maxPrice]: "" })} />}
                  <button onClick={clearFilters} className="text-xs font-bold text-slate-600 hover:text-red-600 transition-colors ml-2">Clear all</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status & Grid */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8 px-2">
            {/* Doubles as the results-section heading, so card titles (h3) follow one level. */}
            <h2 className="text-lg font-bold text-slate-600">
              {loading ? "Loading properties…" : (
                <>
                  Found <span className="text-slate-900 font-bold">{total.toLocaleString("en-US")}</span>{" "}
                  {total === 1 ? "property" : "properties"}
                  {total > 0 && <span className="text-slate-500"> · showing {shownFrom}–{shownTo}</span>}
                </>
              )}
            </h2>
            <div className="flex items-center space-x-3">
              <label htmlFor="pl-sort" className="text-xs font-bold text-slate-600 uppercase tracking-widest">Sort by:</label>
              <select
                id="pl-sort"
                value={sortBy}
                onChange={(e) => updateParams({ [URL_KEYS.sortBy]: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 font-semibold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 text-center border border-slate-200 soft-shadow">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔎</div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">No Properties Found</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">We couldn't find anything matching your current filters. Try broadening your search.</p>
              <button onClick={clearFilters} className="btn-secondary">Reset Search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((prop, i) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  index={i}
                  initialFavorited={favoriteIds.has(String(prop.id))}
                  onFavoriteToggle={(next) => {
                    setFavoriteIds((prev) => {
                      const updated = new Set(prev);
                      if (next) updated.add(String(prop.id));
                      else updated.delete(String(prop.id));
                      return updated;
                    });
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <nav aria-label="Property pages" className="mt-20 flex flex-wrap justify-center items-center gap-2">
              <button
                onClick={() => updateParams({ page: page - 1 })}
                disabled={page === 0}
                aria-label="Previous page"
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-white transition-all disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-4 text-sm font-bold text-slate-700 tabular-nums">
                {`Page ${(page + 1).toLocaleString('en-US')} of ${totalPages.toLocaleString('en-US')}`}
              </span>
              <button
                onClick={() => updateParams({ page: page + 1 })}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-white transition-all disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </nav>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default PropertyList;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../components/AnimatedPage";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";
import { propertyApi } from "../utils/api";
import { mapPropertyToFrontend } from "../utils/mappers";

const PROPERTY_TYPES = [
  { value: '',          label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'studio',    label: 'Studio' },
  { value: 'villa',     label: 'Villa' },
  { value: 'duplex',    label: 'Duplex' },
  { value: 'office',    label: 'Office' },
  { value: 'shop',      label: 'Shop' },
  { value: 'warehouse', label: 'Warehouse' },
];

const PAGE_SIZE = 9;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 soft-shadow animate-pulse">
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
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zen-50 text-zen-600 text-xs font-bold border border-zen-100 hover:bg-zen-100 transition-all"
    >
      {label}
      <span className="text-[14px] font-normal">×</span>
    </button>
  );
}

function PropertyList() {
  const { isAuthenticated, initializing } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [minRooms, setMinRooms] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await propertyApi.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setProperties(list.map(mapPropertyToFrontend));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const res = await propertyApi.getFavorites();
      const list = Array.isArray(res.data) ? res.data : [];
      const nextIds = new Set(list.map((item) => String(item?.propertyDetails?.property?.propertyId)).filter(Boolean));
      setFavoriteIds(nextIds);
    } catch (err) {
      setFavoriteIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => { 
    if (!initializing) {
      fetchProperties(); 
    }
  }, [fetchProperties, initializing]);

  useEffect(() => { 
    if (!initializing) {
      fetchFavorites(); 
    }
  }, [fetchFavorites, initializing]);
  useEffect(() => { setPage(1); }, [search, typeFilter, cityFilter, maxPrice, minPrice, minRooms, availableOnly, sortBy]);

  const cityOptions = useMemo(() => Array.from(new Set(properties.map((p) => p.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [properties]);

  const filtered = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return properties
      .filter((p) => {
        const searchHaystack = [p.title, p.description, p.propertyType, p.city, p.district, p.address, p.location].filter(Boolean).join(" ").toLowerCase();
        const matchSearch = queryTokens.length === 0 || queryTokens.every((token) => searchHaystack.includes(token));
        const matchType = !typeFilter || p.propertyType === typeFilter;
        const matchCity = !cityFilter || p.city === cityFilter;
        const matchMin = !minPrice || Number(p.price) >= Number(minPrice);
        const matchMax = !maxPrice || Number(p.price) <= Number(maxPrice);
        const matchRooms = !minRooms || Number(p.numRooms || 0) >= Number(minRooms);
        const matchAvailable = !availableOnly || p.status === "available";
        return matchSearch && matchType && matchCity && matchMin && matchMax && matchRooms && matchAvailable;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "rooms_desc") return Number(b.numRooms || 0) - Number(a.numRooms || 0);
        if (sortBy === "rooms_asc") return Number(a.numRooms || 0) - Number(b.numRooms || 0);
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [properties, search, typeFilter, cityFilter, minPrice, maxPrice, minRooms, availableOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || typeFilter || cityFilter || maxPrice || minPrice || minRooms || availableOnly;

  return (
    <AnimatedPage>
      <div className="bg-slate-50/50 min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Explore <span className="gradient-text">Spaces.</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-xl">
              From urban studios to suburban villas, find the property that fits your life perfectly.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 border border-slate-100 soft-shadow mb-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-4 group">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Search</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-zen-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Where are you looking?"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-12 pr-4 h-14"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field h-14 bg-slate-50/50 border-transparent hover:bg-slate-50 transition-colors cursor-pointer">
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">City</label>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input-field h-14 bg-slate-50/50 border-transparent hover:bg-slate-50 transition-colors cursor-pointer">
                  <option value="">All Cities</option>
                  {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Max Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="input-field pl-8 h-14"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <button 
                  onClick={() => {}} 
                  className="btn-primary w-full h-14 shadow-zen-500/20 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Active Chips */}
            <AnimatePresence>
              {hasFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-6 border-t border-slate-50 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Applied:</span>
                  {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch("")} />}
                  {typeFilter && <FilterChip label={typeFilter} onRemove={() => setTypeFilter("")} />}
                  {cityFilter && <FilterChip label={cityFilter} onRemove={() => setCityFilter("")} />}
                  {maxPrice && <FilterChip label={`Max $${maxPrice}`} onRemove={() => setMaxPrice("")} />}
                  <button onClick={() => { setSearch(""); setTypeFilter(""); setCityFilter(""); setMaxPrice(""); }} className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors ml-2">Clear all</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status & Grid */}
          <div className="flex justify-between items-center mb-8 px-2">
            <p className="text-slate-400 font-medium">
              Found <span className="text-slate-900 font-bold">{filtered.length}</span> properties
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer">
                <option value="newest">Newest</option>
                <option value="price_asc">Lowest Price</option>
                <option value="price_desc">Highest Price</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 soft-shadow">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔎</div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">No Properties Found</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">We couldn't find anything matching your current filters. Try broadening your search.</p>
              <button onClick={() => { setSearch(""); setTypeFilter(""); setCityFilter(""); setMaxPrice(""); }} className="btn-secondary">Reset Search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginated.map((prop, i) => (
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
            <div className="mt-20 flex justify-center items-center space-x-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-12 h-12 rounded-2xl font-bold text-sm transition-all ${page === i + 1 ? 'bg-zen-500 text-white shadow-lg shadow-zen-500/30' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default PropertyList;

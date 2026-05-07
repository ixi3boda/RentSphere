// src/pages/PropertyList.js
//
// Public property browsing page.
// Route: /properties
//
// Rich local filtering/sorting over the fetched dataset:
// search across title/description/location/type, city/type filters,
// price/rooms constraints, availability toggle, and pagination.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../components/AnimatedPage";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";
import { propertyApi } from "../utils/api";
import { mapPropertyToFrontend } from "../utils/mappers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
// Property type filter values — must match backend CHECK constraint exactly:
// ('APARTMENT','STUDIO','VILLA','DUPLEX','OFFICE','SHOP','WAREHOUSE')
// mapPropertyToFrontend lowercases these for display, so we compare lowercase here.
const PROPERTY_TYPES = [
  { value: '',          label: 'All Types' },
  { value: 'apartment', label: '🏢 Apartment' },
  { value: 'studio',    label: '🏠 Studio' },
  { value: 'villa',     label: '🏰 Villa' },
  { value: 'duplex',    label: '🏘️ Duplex' },
  { value: 'office',    label: '🏬 Office' },
  { value: 'shop',      label: '🛍️ Shop' },
  { value: 'warehouse', label: '🏭 Warehouse' },
];

const PAGE_SIZE = 9;

// ---------------------------------------------------------------------------
// Skeleton card — mirrors PropertyCard dimensions for no-layout-shift loading
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="glass-effect rounded-2xl overflow-hidden shadow-lg animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rentsphere-teal/10 text-rentsphere-teal text-xs font-semibold border border-rentsphere-teal/20 hover:bg-rentsphere-teal/20 transition-colors"
    >
      {label}
      <span className="text-[10px]">✕</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// PropertyList Page
// ---------------------------------------------------------------------------
function PropertyList() {
  const { isAuthenticated } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Search / filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [minRooms, setMinRooms] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [page, setPage] = useState(1);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await propertyApi.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setProperties(list.map(mapPropertyToFrontend));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load properties. Please try again.",
      );
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
      const nextIds = new Set(
        list
          .map((item) => String(item?.propertyDetails?.property?.propertyId))
          .filter(Boolean),
      );
      setFavoriteIds(nextIds);
    } catch (err) {
      setFavoriteIds(new Set());
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Reset to page 1 whenever filters/search changes
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, cityFilter, maxPrice, minPrice, minRooms, availableOnly, sortBy]);

  // ---------------------------------------------------------------------------
  // Client-side filter + sort + paginate
  // ---------------------------------------------------------------------------
  const cityOptions = useMemo(
    () =>
      Array.from(new Set(properties.map((p) => p.city).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [properties],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return properties
      .filter((p) => {
        const searchHaystack = [
          p.title,
          p.description,
          p.propertyType,
          p.city,
          p.district,
          p.address,
          p.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchSearch =
          queryTokens.length === 0 ||
          queryTokens.every((token) => searchHaystack.includes(token));
        const matchType = !typeFilter || p.propertyType === typeFilter;
        const matchCity = !cityFilter || p.city === cityFilter;
        const matchMin = !minPrice || Number(p.price) >= Number(minPrice);
        const matchMax = !maxPrice || Number(p.price) <= Number(maxPrice);
        const matchRooms = !minRooms || Number(p.numRooms || 0) >= Number(minRooms);
        const matchAvailable = !availableOnly || p.status === "available";

        return (
          matchSearch &&
          matchType &&
          matchCity &&
          matchMin &&
          matchMax &&
          matchRooms &&
          matchAvailable
        );
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
  const hasFilters =
    search || typeFilter || cityFilter || maxPrice || minPrice || minRooms || availableOnly;
  const activeSearch = search.trim();
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === typeFilter)?.label;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setMaxPrice("");
    setMinPrice("");
    setCityFilter("");
    setMinRooms("");
    setAvailableOnly(false);
    setSortBy("newest");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* ---------------------------------------------------------------- */}
          {/* Header                                                            */}
          {/* ---------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Browse Properties
            </h1>
            <p className="text-gray-500">
              Discover your perfect rental — {properties.length} listings
              available
            </p>
          </motion.div>

          {/* ---------------------------------------------------------------- */}
          {/* Filter bar                                                        */}
          {/* ---------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-2xl p-5 mb-8 border border-white/40 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Search & Filters</h2>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-rentsphere-teal hover:text-rentsphere-orange transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  id="search-properties"
                  placeholder="Search title, location, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 pr-8"
                  autoComplete="off"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="md:col-span-3">
                <select
                  id="filter-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input-field bg-white w-full"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  id="filter-city"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="input-field bg-white w-full"
                >
                  <option value="">All Cities</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  id="filter-min-price"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min={0}
                  className="input-field pl-7"
                />
              </div>

              <div className="md:col-span-2 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  id="filter-max-price"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min={0}
                  className="input-field pl-7"
                />
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  id="filter-min-rooms"
                  placeholder="Min rooms"
                  value={minRooms}
                  onChange={(e) => setMinRooms(e.target.value)}
                  min={0}
                  className="input-field w-full"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  id="sort-properties"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field bg-white w-full"
                >
                  <option value="newest">Newest first</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="rooms_desc">Rooms: High → Low</option>
                  <option value="rooms_asc">Rooms: Low → High</option>
                </select>
              </div>

              <div className="md:col-span-3 flex items-center">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 w-full">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Available only
                </label>
              </div>
            </div>

            <AnimatePresence>
              {hasFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {search && <FilterChip label={`Search: "${search}"`} onRemove={() => setSearch("")} />}
                  {typeFilter && typeLabel && (
                    <FilterChip label={typeLabel} onRemove={() => setTypeFilter("")} />
                  )}
                  {cityFilter && (
                    <FilterChip label={`City: ${cityFilter}`} onRemove={() => setCityFilter("")} />
                  )}
                  {minPrice && (
                    <FilterChip label={`Min $${minPrice}`} onRemove={() => setMinPrice("")} />
                  )}
                  {maxPrice && (
                    <FilterChip label={`Max $${maxPrice}`} onRemove={() => setMaxPrice("")} />
                  )}
                  {minRooms && (
                    <FilterChip label={`${minRooms}+ rooms`} onRemove={() => setMinRooms("")} />
                  )}
                  {availableOnly && (
                    <FilterChip label="Available only" onRemove={() => setAvailableOnly(false)} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ---------------------------------------------------------------- */}
          {/* Error                                                             */}
          {/* ---------------------------------------------------------------- */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3"
            >
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={fetchProperties}
                className="ml-auto btn-secondary !py-1.5 !px-4 text-sm"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Loading skeletons                                                 */}
          {/* ---------------------------------------------------------------- */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Empty state                                                       */}
          {/* ---------------------------------------------------------------- */}
          {!loading && !error && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-16 text-center"
            >
              <div className="text-6xl mb-4">{hasFilters ? "🔎" : "🏘️"}</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                {hasFilters ? "No results found" : "No properties listed yet"}
              </h2>
              <p className="text-gray-500 mb-6">
                {hasFilters
                  ? "Try adjusting your filters or search term."
                  : "Check back soon — new listings are added regularly."}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-primary !py-2 !px-8"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Property grid                                                     */}
          {/* ---------------------------------------------------------------- */}
          {!loading && !error && paginated.length > 0 && (
            <>
              {/* Result count — shows search keyword when active */}
              <p className="text-sm text-gray-400 mb-4">
                {activeSearch ? (
                  <>
                    <span className="font-semibold text-gray-600">
                      {filtered.length}
                    </span>{" "}
                    result{filtered.length !== 1 ? "s" : ""} for{" "}
                    <span className="font-semibold text-rentsphere-teal">
                      "{activeSearch}"
                    </span>
                  </>
                ) : (
                  <>
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                    {filtered.length} properties
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center items-center gap-2 mt-10"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    id="pagination-prev"
                    className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pg = i + 1;
                      if (
                        totalPages > 7 &&
                        Math.abs(pg - page) > 2 &&
                        pg !== 1 &&
                        pg !== totalPages
                      ) {
                        if (pg === 2 || pg === totalPages - 1)
                          return (
                            <span key={pg} className="px-1 text-gray-400">
                              …
                            </span>
                          );
                        return null;
                      }
                      return (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all
                            ${
                              pg === page
                                ? "bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange text-white shadow"
                                : "btn-secondary !py-0 !px-0"
                            }`}
                        >
                          {pg}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    id="pagination-next"
                    className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default PropertyList;

// src/pages/PropertyList.js
//
// RS-10 — Tenant property browsing page.
// Route: /properties
//
// Shows all available properties in a responsive grid with search/filter,
// pagination, loading skeletons, empty state, and error handling.

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../components/AnimatedPage";
import PropertyCard from "../components/PropertyCard";
import { propertyApi } from "../utils/api";
import { mapPropertyToFrontend } from "../utils/mappers";
import useDebounce from "../hooks/useDebounce";

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

// ---------------------------------------------------------------------------
// PropertyList Page
// ---------------------------------------------------------------------------
function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  // Search / filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // RS-11: debounce the search term 300ms
  const debouncedSearch = useDebounce(search, 300);

  // Pagination
  const [page, setPage] = useState(1);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  const fetchProperties = useCallback(async (searchKeyword = "") => {
    if (!searchKeyword) {
      setLoading(true);
    } else {
      setSearching(true);
    }
    setError("");
    try {
      let list;
      if (searchKeyword) {
        // RS-11: debounced search — GET /api/properties/search?prefix=...
        const res = await propertyApi.search(searchKeyword);
        list = Array.isArray(res.data) ? res.data : [];
      } else {
        // Initial load — GET /api/properties/all
        const res = await propertyApi.getAll();
        list = Array.isArray(res.data) ? res.data : [];
      }
      setProperties(list.map(mapPropertyToFrontend));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load properties. Please try again.",
      );
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // RS-11: re-fetch on debounced search changes
  useEffect(() => {
    fetchProperties(debouncedSearch);
  }, [debouncedSearch, fetchProperties]);

  // Reset to page 1 whenever filters or debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, maxPrice, sortBy]);

  // ---------------------------------------------------------------------------
  // Client-side filter + sort + paginate
  // ---------------------------------------------------------------------------
  // API mode: properties[] is already server-filtered for search.
  // Apply client-side type/price/sort on top.
  const filtered = properties
    .filter((p) => {
      const matchType = !typeFilter || p.propertyType === typeFilter;
      const matchPrice = !maxPrice || Number(p.price) <= Number(maxPrice);
      return matchType && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return 0; // 'newest' — keep API order
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || typeFilter || maxPrice;
  const activeSearch = debouncedSearch;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setMaxPrice("");
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
            className="glass-effect rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-3 flex-wrap"
          >
            {/* Search — RS-11 */}
            <div className="flex-1 min-w-[180px] relative">
              {/* Spinner while searching, magnifier otherwise */}
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {searching ? (
                  <span className="inline-block w-4 h-4 border-2 border-rentsphere-teal border-t-transparent rounded-full animate-spin" />
                ) : (
                  "🔍"
                )}
              </span>
              <input
                type="text"
                id="search-properties"
                placeholder="Search by title or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 pr-8"
                autoComplete="off"
              />
              {/* Inline clear button */}
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm leading-none transition-colors"
                  >
                    ✕
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Type */}
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field bg-white min-w-[140px] flex-shrink-0"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Max price */}
            <div className="relative min-w-[140px] flex-shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                $
              </span>
              <input
                type="number"
                id="filter-max-price"
                placeholder="Max price/mo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min={0}
                className="input-field pl-7"
              />
            </div>

            {/* Sort */}
            <select
              id="sort-properties"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field bg-white min-w-[140px] flex-shrink-0"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>

            {/* Clear */}
            <AnimatePresence>
              {hasFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearFilters}
                  className="btn-secondary !py-2 !px-4 text-sm flex-shrink-0"
                >
                  ✕ Clear
                </motion.button>
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
                  <PropertyCard key={prop.id} property={prop} index={i} />
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

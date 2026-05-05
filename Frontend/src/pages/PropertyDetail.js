// src/pages/PropertyDetail.js
//
// RS-10 — Single property detail page.
// Route: /properties/:id
//
// Displays full property info with ImageCarousel, metadata grid,
// and loading / error / not-found states.

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedPage } from "../components/AnimatedPage";
import ImageCarousel from "../components/ImageCarousel";
import { propertyApi } from "../utils/api";
import { mapPropertyToFrontend } from "../utils/mappers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROPERTY_TYPE_LABELS = {
  apartment: "🏢 Apartment",
  house: "🏡 House",
  studio: "🏠 Studio",
  villa: "🏰 Villa",
  office: "🏬 Office",
  other: "📦 Other",
};

// ---------------------------------------------------------------------------
// Info tile — used in the detail metadata grid
// ---------------------------------------------------------------------------
function InfoTile({ icon, label, value }) {
  return (
    <div className="glass-effect rounded-xl p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <div className="text-gray-800 font-semibold">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropertyDetail
// ---------------------------------------------------------------------------
function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProperty = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await propertyApi.getById(id);
        if (!cancelled) setProperty(mapPropertyToFrontend(res.data));
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 404 || err.response?.status === 400) {
            setError("not_found");
          } else {
            setError(err.response?.data?.message || "Failed to load property.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div
              className="w-full rounded-2xl bg-gray-200"
              style={{ aspectRatio: "16/9" }}
            />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 bg-gray-200 rounded ${i === 4 ? "w-2/3" : "w-full"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------
  if (error === "not_found") {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-effect rounded-2xl p-12 text-center max-w-md w-full">
            <div className="text-6xl mb-4">🏚️</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Property Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              This listing may have been removed or the link is incorrect.
            </p>
            <Link
              to="/properties"
              className="btn-primary inline-block !py-2.5 !px-8"
            >
              Browse All Properties
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-effect rounded-2xl p-12 text-center max-w-md w-full">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary !py-2.5 !px-6"
              >
                Retry
              </button>
              <Link to="/properties" className="btn-secondary !py-2.5 !px-6">
                Go back
              </Link>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!property) return null;

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const isAvailable = property.status === "available";
  const statusColor =
    property.status === "available"
      ? "bg-green-100 text-green-700"
      : property.status === "rented"
        ? "bg-blue-100  text-blue-700"
        : property.status === "maintenance"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-gray-100  text-gray-600";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-rentsphere-teal transition-colors text-sm"
            >
              ← Back to listings
            </button>
          </motion.div>

          {/* Image Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <ImageCarousel
              images={property.images}
              autoPlay={property.images?.length > 1}
            />
          </motion.div>

          {/* Title row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-sm text-gray-400">
                  {PROPERTY_TYPE_LABELS[property.propertyType] ?? "📦 Other"}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}
                >
                  {property.status?.charAt(0).toUpperCase() +
                    property.status?.slice(1)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                {property.title}
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-1">
                <span>📍</span> {property.location}
              </p>
            </div>

            {/* Price + actions */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <div className="text-3xl font-bold gradient-text">
                  ${Number(property.price || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">per month</div>
              </div>

              {/* Favorite button */}
              <button
                onClick={async () => {
                  try {
                    await propertyApi.favorite(id);
                    setFavorited((f) => !f);
                  } catch (err) {
                    console.error("Favorite failed:", err);
                  }
                }}
                id="detail-favorite-btn"
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all
                  ${
                    favorited
                      ? "border-red-300 bg-red-50 text-red-500"
                      : "border-gray-200 bg-white/60 text-gray-500 hover:border-red-300 hover:text-red-400"
                  }`}
              >
                {favorited ? "❤️ Saved" : "🤍 Save"}
              </button>
            </div>
          </motion.div>

          {/* Metadata grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          >
            <InfoTile
              icon="💰"
              label="Monthly Rent"
              value={`$${Number(property.price || 0).toLocaleString()}`}
            />
            <InfoTile
              icon="📍"
              label="Location"
              value={property.location || "—"}
            />
            <InfoTile
              icon="🏠"
              label="Type"
              value={PROPERTY_TYPE_LABELS[property.propertyType] ?? "Other"}
            />
            <InfoTile
              icon="📅"
              label="Listed"
              value={
                property.createdAt
                  ? new Date(property.createdAt).toLocaleDateString()
                  : "—"
              }
            />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 mb-8"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              About this property
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {property.description || "No description provided."}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-effect rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Interested in this property?
              </h3>
              <p className="text-gray-500 text-sm">
                Contact the owner to schedule a viewing.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {isAvailable ? (
                <button
                  id="contact-owner-btn"
                  className="btn-primary !py-2.5 !px-6"
                  onClick={() => {
                    /* TODO: open contact modal / navigate to inquiry form */
                  }}
                >
                  Contact Owner
                </button>
              ) : (
                <span className="btn-secondary !py-2.5 !px-6 opacity-60 cursor-not-allowed">
                  Not Available
                </span>
              )}
              <Link to="/properties" className="btn-secondary !py-2.5 !px-6">
                All Listings
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}

export default PropertyDetail;

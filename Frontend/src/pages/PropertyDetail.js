import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "../components/AnimatedPage";
import ImageCarousel from "../components/ImageCarousel";
import FavoriteButton from "../components/FavoriteButton";
import RentRequestModal from "../components/RentRequestModal";
import { propertyApi } from "../utils/api";
import { mapPropertyToFrontend } from "../utils/mappers";
import { recordRecentlyViewed } from "../utils/recentlyViewed";
import { useAuth } from "../context/AuthContext";

const PROPERTY_TYPE_LABELS = {
  apartment: "Apartment",
  house: "House",
  studio: "Studio",
  villa: "Villa",
  office: "Office",
  other: "Other",
};

function InfoTile({ icon, label, value }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 soft-shadow flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:bg-zen-50 transition-colors">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-slate-900 font-bold">{value}</p>
    </div>
  );
}

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, initializing } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorited, setFavorited] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);

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
          if (err.response?.status === 404 || err.response?.status === 400) setError("not_found");
          else setError(err.response?.data?.message || "Failed to load property.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProperty();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (property) {
      // One-time cleanup: clear any old bloated recently-viewed data that
      // stored full base64 images (the new recordRecentlyViewed strips images)
      try {
        const raw = localStorage.getItem('rentsphere_recently_viewed');
        if (raw) {
          const parsed = JSON.parse(raw);
          const hasBlob = parsed.some(p => p.images?.some(img => img?.startsWith('data:')));
          if (hasBlob) localStorage.removeItem('rentsphere_recently_viewed');
        }
      } catch { /* ignore */ }

      recordRecentlyViewed(property);
    }
  }, [property]);

  useEffect(() => {
    let cancelled = false;
    const fetchFavoriteState = async () => {
      if (initializing) return;
      if (!property || !isAuthenticated) {
        if (!cancelled) setFavorited(false);
        return;
      }
      try {
        const res = await propertyApi.getFavorites();
        const list = Array.isArray(res.data) ? res.data : [];
        const isSaved = list.some((item) => String(item?.propertyDetails?.property?.propertyId) === String(id));
        if (!cancelled) setFavorited(isSaved);
      } catch (err) {
        if (!cancelled) setFavorited(false);
      }
    };
    fetchFavoriteState();
    return () => { cancelled = true; };
  }, [property, id, isAuthenticated, initializing]);

  if (loading) {
    return (
      <AnimatedPage>
        <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto space-y-8 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="w-full rounded-[3rem] bg-slate-200 aspect-[16/9]" />
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-200 rounded-md w-1/2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (error === "not_found") {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 soft-shadow max-w-md w-full">
            <div className="text-6xl mb-6">🏚️</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Property Not Found</h2>
            <p className="text-slate-500 mb-8">This listing may have been removed or the link is incorrect.</p>
            <Link to="/properties" className="btn-primary w-full py-4">Browse All Properties</Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!property) return null;

  const isAvailable = property.status === "available";
  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rented': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <AnimatedPage>
      <div className="bg-slate-50/30 min-h-screen pt-32 pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumbs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-slate-400 hover:text-zen-500 font-bold text-sm transition-colors uppercase tracking-wider">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              <span>Back to Listings</span>
            </button>
          </motion.div>

          {/* Gallery */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white relative">
            <ImageCarousel images={property.images} autoPlay={property.images?.length > 1} />
            <div className="absolute top-6 right-6">
               <FavoriteButton propertyId={id} initialFavorited={favorited} onToggle={setFavorited} showLabel className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl hover:bg-white transition-all" />
            </div>
          </motion.div>

          {/* Main Info */}
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusStyles(property.status)}`}>
                    {property.status}
                  </span>
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    {PROPERTY_TYPE_LABELS[property.propertyType] || 'Property'}
                  </span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{property.title}</h1>
                <div className="flex items-center text-slate-400 font-medium mb-12">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-lg">{property.location}</span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                  <InfoTile icon="💰" label="Rent" value={`$${Number(property.price || 0).toLocaleString()}`} />
                  <InfoTile icon="🛏️" label="Rooms" value={property.numRooms || "—"} />
                  <InfoTile icon="📐" label="Area" value={`${property.areaSqm || "—"} m²`} />
                  <InfoTile icon="🏢" label="Floor" value={property.floorNo || "G"} />
                </div>

                {/* Description */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 soft-shadow">
                  <h2 className="text-2xl font-black text-slate-900 mb-6">Property Overview</h2>
                  <p className="text-slate-500 leading-relaxed text-lg whitespace-pre-line">
                    {property.description || "This property offers a unique living experience with modern amenities and a prime location. Perfect for those seeking comfort and style."}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Sidebar / Action Box */}
            <div className="lg:col-span-1">
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="sticky top-32">
                 <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                   {/* Background decoration */}
                   <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-zen-500 rounded-full blur-[80px] opacity-30" />
                   
                   <div className="relative z-10">
                     <p className="text-zen-400 font-black uppercase tracking-widest text-xs mb-2">Pricing</p>
                     <div className="flex items-baseline space-x-2 mb-8">
                       <span className="text-5xl font-black">${Number(property.price || 0).toLocaleString()}</span>
                       <span className="text-slate-400 font-bold">/month</span>
                     </div>

                     <div className="space-y-4 mb-8">
                       <SpecRow label="Security Deposit" value="1 Month" />
                       <SpecRow label="Contract Type" value="Standard Lease" />
                       <SpecRow label="Service Fee" value="Included" />
                     </div>

                     {user?.role === 'admin' ? (
                       <Link to="/admin/dashboard" className="w-full btn-primary !bg-zen-500 hover:!bg-zen-600 h-16 flex items-center justify-center text-lg shadow-xl shadow-zen-500/20">
                         Manage Listing
                       </Link>
                     ) : isAvailable && isAuthenticated && (user?.role === 'tenant' || user?.role === 'visitor') ? (
                       <button onClick={() => setShowRentModal(true)} className="w-full btn-primary !bg-zen-500 hover:!bg-zen-600 h-16 flex items-center justify-center text-lg shadow-xl shadow-zen-500/20">
                         Reserve Now
                       </button>
                     ) : isAvailable && !isAuthenticated ? (
                       <Link to="/login" className="w-full btn-primary !bg-zen-500 hover:!bg-zen-600 h-16 flex items-center justify-center text-lg">
                         Sign in to Request
                       </Link>
                     ) : (
                       <div className="w-full h-16 bg-white/10 rounded-2xl flex items-center justify-center font-bold text-slate-400 border border-white/10">
                         {isAvailable ? "Available Now" : "Unavailable"}
                       </div>
                     )}
                     
                     <p className="text-center text-slate-500 text-xs mt-6 font-medium">Secure & Verified Rental Process</p>
                   </div>
                 </div>

                 {/* Helpful Info */}
                 <div className="mt-6 bg-white rounded-[2.5rem] p-8 border border-slate-100 soft-shadow">
                    <h4 className="text-slate-900 font-bold mb-4">Need Help?</h4>
                    <p className="text-slate-500 text-sm mb-4">Our support team is available 24/7 to help you with the rental process.</p>
                    <button className="text-zen-600 font-bold text-sm hover:underline flex items-center">
                      Contact Support 
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                 </div>
               </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRentModal && property && (
          <RentRequestModal property={property} onClose={() => setShowRentModal(false)} />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

function SpecRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}

export default PropertyDetail;

// src/pages/owner/PropertyForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProperty } from '../../context/PropertyContext';
import { AnimatedPage, AnimatedButton } from '../../components/AnimatedPage';
import ImageUpload from '../../components/ImageUpload';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROPERTY_TYPES = [
  { value: '', label: 'Select a type…' },
  { value: 'apartment', label: '🏢 Apartment' },
  { value: 'house', label: '🏡 House' },
  { value: 'studio', label: '🏠 Studio' },
  { value: 'villa', label: '🏰 Villa' },
  { value: 'office', label: '🏬 Office' },
  { value: 'other', label: '📦 Other' },
];

const MAX_IMAGES = 5;

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  location: '',
  propertyType: '',
};

// ---------------------------------------------------------------------------
// Inline field error
// ---------------------------------------------------------------------------
function FieldError({ message }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-500 text-sm mt-1"
    >
      {message}
    </motion.p>
  );
}

// ---------------------------------------------------------------------------
// PropertyForm — handles Create (/owner/properties/new)
//                     and Edit  (/owner/properties/edit/:id)
// ---------------------------------------------------------------------------
function PropertyForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPropertyById, createProperty, updateProperty, loading } = useProperty();

  const [formData, setFormData] = useState(EMPTY_FORM);
  // images now stores Cloudinary URL strings (provided by ImageUpload component)
  const [images, setImages] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(isEditMode);

  // Redirect non-owners
  useEffect(() => {
    if (user && user.role !== 'owner') navigate('/');
  }, [user, navigate]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    (async () => {
      setFetchLoading(true);
      const result = await getPropertyById(id);
      setFetchLoading(false);

      if (result.success) {
        const p = result.data;
        setFormData({
          title: p.title || '',
          description: p.description || '',
          price: p.price?.toString() || '',
          location: p.location || '',
          propertyType: p.propertyType || '',
        });
        // Existing images are Cloudinary URL strings — pass directly
        if (p.images?.length) {
          setImages(p.images);
        }
      } else {
        setSubmitError('Property not found.');
      }
    })();
  }, [id, isEditMode, getPropertyById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required.';
    if (!formData.description.trim()) errs.description = 'Description is required.';
    if (!formData.location.trim()) errs.location = 'Location is required.';
    if (!formData.propertyType) errs.propertyType = 'Please select a property type.';
    if (!formData.price) {
      errs.price = 'Price is required.';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errs.price = 'Price must be a positive number.';
    }
    if (images.length > MAX_IMAGES) {
      errs.images = `Maximum ${MAX_IMAGES} images allowed.`;
    }
    return errs;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    // images[] already contains Cloudinary URLs (or blob URLs in mock mode)
    const payload = {
      ...formData,
      price: Number(formData.price),
      images,
    };

    const result = isEditMode
      ? await updateProperty(id, payload)
      : await createProperty(payload);

    if (result.success) {
      navigate('/owner/dashboard');
    } else {
      setSubmitError(result.error || 'An error occurred. Please try again.');
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (fetchLoading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rentsphere-teal border-t-transparent" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/owner/dashboard"
              className="inline-flex items-center gap-1 text-gray-500 hover:text-rentsphere-teal transition-colors text-sm mb-4"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold gradient-text">
              {isEditMode ? '✏️ Edit Property' : '🏠 Add New Property'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode
                ? 'Update your property details below.'
                : 'Fill in the details to list your property.'}
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-2xl p-8 shadow-2xl"
          >

            {/* Global submit error */}
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
                >
                  {submitError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title <span className="text-red-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`input-field ${fieldErrors.title ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  placeholder="e.g. Cozy 2-Bedroom Apartment in Downtown"
                  maxLength={120}
                />
                <FieldError message={fieldErrors.title} />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`input-field resize-none ${fieldErrors.description ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  placeholder="Describe the property, amenities, nearby facilities…"
                />
                <FieldError message={fieldErrors.description} />
              </div>

              {/* Price + Property Type — side by side on md+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min={1}
                      className={`input-field pl-7 ${fieldErrors.price ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                      placeholder="1200"
                    />
                  </div>
                  <FieldError message={fieldErrors.price} />
                </div>

                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className={`input-field bg-white ${fieldErrors.propertyType ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value} disabled={t.value === ''}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.propertyType} />
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location / Address <span className="text-red-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`input-field ${fieldErrors.location ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  placeholder="e.g. 123 Main St, New York, NY"
                />
                <FieldError message={fieldErrors.location} />
              </div>

              {/* Images — RS-9 ImageUpload with Cloudinary integration */}
              <ImageUpload
                value={images}
                onChange={setImages}
                error={fieldErrors.images}
                disabled={loading}
              />

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/owner/dashboard')}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </motion.button>
                <div className="flex-1">
                  <AnimatedButton type="submit" loading={loading}>
                    {isEditMode ? 'Save Changes' : 'Create Property'}
                  </AnimatedButton>
                </div>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </AnimatedPage>
  );
}

export default PropertyForm;

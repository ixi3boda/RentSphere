import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProperty } from '../../context/PropertyContext';
import { AnimatedPage, AnimatedButton } from '../../components/AnimatedPage';
import ImageUpload from '../../components/ImageUpload';
import { mapFormToBackend } from '../../utils/mappers';

const PROPERTY_TYPES = [
  { value: '',          label: 'Select a type…' },
  { value: 'APARTMENT', label: '🏢 Apartment' },
  { value: 'STUDIO',    label: '🏠 Studio' },
  { value: 'VILLA',     label: '🏰 Villa' },
  { value: 'DUPLEX',    label: '🏘️ Duplex' },
  { value: 'OFFICE',    label: '🏬 Office' },
  { value: 'SHOP',      label: '🛍️ Shop' },
  { value: 'WAREHOUSE', label: '🏭 Warehouse' },
];

const MAX_IMAGES = 5;

const EMPTY_FORM = {
  title:               '',
  propertyDescription: '',
  pricePerMonth:       '',
  city:                '',
  district:            '',
  address:             '',
  propertyType:        '',
  numRooms:            '',
  areaSqm:             '',
};

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

function PropertyForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPropertyById, createProperty, updateProperty, loading } = useProperty();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(isEditMode);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!isEditMode) return;

    (async () => {
      setFetchLoading(true);
      const result = await getPropertyById(id);
      setFetchLoading(false);

      if (result.success) {
        const p = result.data;
        setFormData({
          title:               p.title || '',
          propertyDescription: p.propertyDescription || '',
          pricePerMonth:       p.pricePerMonth?.toString() || '',
          city:                p.city || '',
          district:            p.district || '',
          address:             p.address || '',
          propertyType:        (p.propertyType || '').toUpperCase(),
          numRooms:            p.numRooms?.toString() || '',
          areaSqm:             p.areaSqm?.toString() || '',
        });
        if (p.images?.length) setImages(p.images);
      } else {
        setSubmitError('Property not found.');
      }
    })();
  }, [id, isEditMode, getPropertyById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim())               errs.title = 'Title is required.';
    if (!formData.propertyDescription.trim()) errs.propertyDescription = 'Description is required.';
    if (!formData.city.trim())                errs.city = 'City is required.';
    if (!formData.address.trim())             errs.address = 'Address is required.';
    if (!formData.propertyType)               errs.propertyType = 'Please select a property type.';
    if (!formData.pricePerMonth) {
      errs.pricePerMonth = 'Monthly rent is required.';
    } else if (isNaN(Number(formData.pricePerMonth)) || Number(formData.pricePerMonth) <= 0) {
      errs.pricePerMonth = 'Rent must be a positive number.';
    }
    if (!formData.numRooms) {
      errs.numRooms = 'Number of rooms is required.';
    } else if (!Number.isInteger(Number(formData.numRooms)) || Number(formData.numRooms) <= 0) {
      errs.numRooms = 'Rooms must be a positive whole number.';
    }
    if (!formData.areaSqm) {
      errs.areaSqm = 'Area is required.';
    } else if (isNaN(Number(formData.areaSqm)) || Number(formData.areaSqm) <= 0) {
      errs.areaSqm = 'Area must be a positive number.';
    }
    if (images.length > MAX_IMAGES) {
      errs.images = `Maximum ${MAX_IMAGES} images allowed.`;
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    if (isEditMode) {
      const payload = {
        ...mapFormToBackend(formData),
        coverPic: images[0] || null,
      };
      const result = await updateProperty(id, payload);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setSubmitError(result.error || 'An error occurred. Please try again.');
      }
    } else {
      // PropertyContext.createProperty handles all images (cover + additional)
      const result = await createProperty({ ...formData, images });
      if (!result.success) {
        setSubmitError(result.error || 'An error occurred. Please try again.');
        return;
      }

      navigate('/admin/dashboard');
    }
  };

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

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/admin/dashboard"
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

          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-2xl p-8 shadow-2xl"
          >
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
                  maxLength={200}
                />
                <FieldError message={fieldErrors.title} />
              </div>

              <div>
                <label htmlFor="propertyDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="propertyDescription"
                  name="propertyDescription"
                  value={formData.propertyDescription}
                  onChange={handleChange}
                  rows={4}
                  className={`input-field resize-none ${fieldErrors.propertyDescription ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  placeholder="Describe the property, amenities, nearby facilities…"
                />
                <FieldError message={fieldErrors.propertyDescription} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="pricePerMonth" className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="number"
                      id="pricePerMonth"
                      name="pricePerMonth"
                      value={formData.pricePerMonth}
                      onChange={handleChange}
                      min={1}
                      className={`input-field pl-7 ${fieldErrors.pricePerMonth ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                      placeholder="1200"
                    />
                  </div>
                  <FieldError message={fieldErrors.pricePerMonth} />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="numRooms" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Rooms <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="number"
                    id="numRooms"
                    name="numRooms"
                    value={formData.numRooms}
                    onChange={handleChange}
                    min={1}
                    className={`input-field ${fieldErrors.numRooms ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                    placeholder="3"
                  />
                  <FieldError message={fieldErrors.numRooms} />
                </div>

                <div>
                  <label htmlFor="areaSqm" className="block text-sm font-medium text-gray-700 mb-2">
                    Area (m²) <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="number"
                    id="areaSqm"
                    name="areaSqm"
                    value={formData.areaSqm}
                    onChange={handleChange}
                    min={1}
                    step="0.01"
                    className={`input-field ${fieldErrors.areaSqm ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                    placeholder="85"
                  />
                  <FieldError message={fieldErrors.areaSqm} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`input-field ${fieldErrors.city ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                    placeholder="e.g. New York"
                  />
                  <FieldError message={fieldErrors.city} />
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                    District <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. Manhattan"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`input-field ${fieldErrors.address ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  placeholder="e.g. 123 Main Street, Apt 4B"
                />
                <FieldError message={fieldErrors.address} />
              </div>

              <ImageUpload
                value={images}
                onChange={setImages}
                error={fieldErrors.images}
                disabled={loading}
              />

              <div className="flex gap-4 pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/admin/dashboard')}
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
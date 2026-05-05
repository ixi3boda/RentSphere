// src/context/PropertyContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import { propertyApi } from '../utils/api';
import { mapPropertyToFrontend, mapFormToBackend } from '../utils/mappers';

const PropertyContext = createContext();

export function useProperty() {
  return useContext(PropertyContext);
}

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // -------------------------------------------------------------------------
  // Fetch all properties  GET /api/properties/all
  // -------------------------------------------------------------------------
  const fetchOwnerProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await propertyApi.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setProperties(list.map(mapPropertyToFrontend));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Get single property  GET /api/properties/:id
  // -------------------------------------------------------------------------
  const getPropertyById = useCallback(
    async (id) => {
      // Check local cache first
      const local = properties.find((p) => p.id === String(id));
      if (local) return { success: true, data: local };

      try {
        const res = await propertyApi.getById(id);
        return { success: true, data: mapPropertyToFrontend(res.data) };
      } catch (err) {
        return { success: false, error: err.response?.data?.message || err.message };
      }
    },
    [properties]
  );

  // -------------------------------------------------------------------------
  // Create property  POST /api/properties/add
  // -------------------------------------------------------------------------
  const createProperty = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const backendPayload = mapFormToBackend(formData);
      // First image in the list becomes the cover pic
      const coverPic = formData.images?.[0] || null;
      await propertyApi.create(backendPayload, coverPic);

      // Add images one by one if more than one
      // (The create endpoint doesn't accept images directly — use addImage)
      // NOTE: The new property id is not returned by POST /add; refetch the list.
      await fetchOwnerProperties();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Update property  PUT /api/properties/update/:id
  // Backend accepts all fields as optional query params.
  // -------------------------------------------------------------------------
  const updateProperty = async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        property_type:        formData.propertyType       || undefined,
        title:                formData.title              || undefined,
        property_description: formData.description        || undefined,
        price_per_month:      formData.price != null ? Number(formData.price) : undefined,
        city:                 formData.city               || undefined,
        district:             formData.district           || undefined,
        address:              formData.location || formData.address || undefined,
        latitude:             formData.latitude  != null ? Number(formData.latitude)  : undefined,
        longitude:            formData.longitude != null ? Number(formData.longitude) : undefined,
        num_rooms:            formData.numRooms  != null ? Number(formData.numRooms)  : undefined,
        area_sqm:             formData.areaSqm   != null ? Number(formData.areaSqm)   : undefined,
        is_available:         formData.isAvailable !== undefined ? formData.isAvailable : undefined,
      };

      // Strip undefined fields so they aren't sent as query params
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

      await propertyApi.update(id, params);

      // Update local state
      setProperties((prev) =>
        prev.map((p) =>
          p.id === String(id) ? { ...p, ...mapFormToBackend(formData), id: String(id) } : p
        )
      );
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete property  DELETE /api/properties/delete/:id
  // -------------------------------------------------------------------------
  const deleteProperty = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await propertyApi.delete(id);
      setProperties((prev) => prev.filter((p) => p.id !== String(id)));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    properties,
    loading,
    error,
    fetchOwnerProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
  };

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

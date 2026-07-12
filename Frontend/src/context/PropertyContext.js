import React, { createContext, useState, useContext, useCallback } from 'react';
import { propertyApi } from '../utils/api';
import { mapPropertyToFrontend, mapFormToBackend } from '../utils/mappers';

export const PropertyContext = createContext();

export function useProperty() {
  return useContext(PropertyContext);
}

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

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

  // Always fetch fresh from API — avoids returning stale blob-URL cache
  const getPropertyById = useCallback(async (id) => {
    try {
      const res = await propertyApi.getById(id);
      return { success: true, data: mapPropertyToFrontend(res.data) };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  }, []);

  // Send coverPic (first image) in main payload.
  // Additional images sent via addImage with JSON body (not query params).
  const createProperty = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const imageList = Array.isArray(formData.images) ? formData.images : [];
      const coverPic  = imageList[0] || null;

      const backendPayload = {
        ...mapFormToBackend(formData),
        coverPic,
      };

      const res = await propertyApi.create(backendPayload);

      const newId =
        res.data?.property?.propertyId ??
        res.data?.propertyId ??
        res.data?.id ??
        null;

      // Upload additional images (index 1+)
      if (newId && imageList.length > 1) {
        await Promise.all(
          imageList.slice(1).map((imgBase64) =>
            propertyApi.addImage(newId, imgBase64, false)
          )
        );
      }

      await fetchOwnerProperties();
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        propertyType:        formData.propertyType        || undefined,
        title:               formData.title               || undefined,
        propertyDescription: formData.propertyDescription || formData.description || undefined,
        pricePerMonth:
          formData.pricePerMonth != null ? Number(formData.pricePerMonth)
          : formData.price       != null ? Number(formData.price)
          : undefined,
        city:        formData.city                     || undefined,
        district:    formData.district                 || undefined,
        address:     formData.address || formData.location || undefined,
        latitude:    formData.latitude  != null ? Number(formData.latitude)  : undefined,
        longitude:   formData.longitude != null ? Number(formData.longitude) : undefined,
        numRooms:    formData.numRooms  != null ? Number(formData.numRooms)  : undefined,
        areaSqm:     formData.areaSqm   != null ? Number(formData.areaSqm)   : undefined,
        isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : undefined,
      };

      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

      await propertyApi.update(id, body);

      setProperties((prev) =>
        prev.map((p) =>
          p.id === String(id)
            ? { ...p, ...mapFormToBackend(formData), id: String(id) }
            : p
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

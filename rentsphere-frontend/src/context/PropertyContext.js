// src/context/PropertyContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
// propertyApi will be used once the backend is wired up (see TODO comments below)
// import { propertyApi } from '../utils/api';

const PropertyContext = createContext();

export function useProperty() {
  return useContext(PropertyContext);
}

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -------------------------------------------------------------------------
  // Fetch all properties for the logged-in owner
  // -------------------------------------------------------------------------
  const fetchOwnerProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: swap for real API once backend is ready
      // const res = await propertyApi.getAll({ ownerOnly: true });
      // setProperties(res.data);

      // Mock data for development
      await new Promise((r) => setTimeout(r, 600));
      setProperties((prev) => (prev.length ? prev : [])); // keep existing mock data
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
  // Get single property by id (from local state or API)
  // -------------------------------------------------------------------------
  const getPropertyById = useCallback(
    async (id) => {
      const local = properties.find((p) => p.id === id || p.id === String(id));
      if (local) return { success: true, data: local };

      // TODO: fetch from API when backend is ready
      // try {
      //   const res = await propertyApi.getById(id);
      //   return { success: true, data: res.data };
      // } catch (err) {
      //   return { success: false, error: err.response?.data?.message || err.message };
      // }

      return { success: false, error: 'Property not found' };
    },
    [properties]
  );

  // -------------------------------------------------------------------------
  // Create property
  // -------------------------------------------------------------------------
  const createProperty = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: real API
      // const res = await propertyApi.create(formData);
      // const newProp = res.data;

      // Mock: generate id locally
      await new Promise((r) => setTimeout(r, 800));
      const newProp = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'available',
      };

      setProperties((prev) => [newProp, ...prev]);
      return { success: true, data: newProp };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Update property
  // -------------------------------------------------------------------------
  const updateProperty = async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: real API
      // const res = await propertyApi.update(id, formData);
      // const updated = res.data;

      await new Promise((r) => setTimeout(r, 800));
      const updated = { ...formData, id, updatedAt: new Date().toISOString() };

      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete property
  // -------------------------------------------------------------------------
  const deleteProperty = async (id) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: real API
      // await propertyApi.remove(id);

      await new Promise((r) => setTimeout(r, 600));
      setProperties((prev) => prev.filter((p) => p.id !== id));
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

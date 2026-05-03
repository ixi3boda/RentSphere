// src/hooks/useDebounce.js
//
// RS-11 — Reusable debounce hook.
// Delays propagating a value until the user stops changing it.
//
// Usage:
//   const debouncedSearch = useDebounce(search, 300);
//
// @param {*}      value   – the value to debounce
// @param {number} delay   – debounce delay in ms (default 300)
// @returns {*}            – the debounced value

import { useState, useEffect } from 'react';

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;

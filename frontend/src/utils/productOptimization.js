/**
 * ✅ PRODUCT OPTIMIZATION UTILITIES
 * Handles caching, variant fetching, and performance enhancements
 */

const CACHE_KEYS = {
  PRODUCTS_LIST: "productsCache",
  PRODUCT_DETAILS: "productDetailsCache_",
  PRODUCT_VARIANTS: "productVariantsCache_",
};

const CACHE_DURATION = {
  LIST: 3600000, // 1 hour
  DETAILS: 1800000, // 30 minutes
  VARIANTS: 600000, // 10 minutes
};

/**
 * Get cached data if available and not expired
 */
export const getCachedData = (key, duration) => {
  const cached = localStorage.getItem(key);
  const timestamp = localStorage.getItem(`${key}_time`);

  if (cached && timestamp) {
    const now = Date.now();
    if (now - parseInt(timestamp) < duration) {
      console.log(`📦 Using cached data for: ${key}`);
      return JSON.parse(cached);
    }
  }
  return null;
};

/**
 * Set cache with timestamp
 */
export const setCacheData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(`${key}_time`, String(Date.now()));
  console.log(`💾 Cached data for: ${key}`);
};

/**
 * Clear cache for a specific key
 */
export const clearCache = (key) => {
  localStorage.removeItem(key);
  localStorage.removeItem(`${key}_time`);
};

/**
 * Fetch product variants on demand
 */
export const fetchProductVariants = async (productId) => {
  try {
    const cacheKey = `${CACHE_KEYS.PRODUCT_VARIANTS}${productId}`;
    
    // Check cache first
    const cached = getCachedData(cacheKey, CACHE_DURATION.VARIANTS);
    if (cached) return cached;

    // Fetch from API
    const response = await fetch(
      `http://localhost:5000/api/products/${productId}/variants`
    );
    if (!response.ok) throw new Error("Failed to fetch variants");

    const data = await response.json();
    setCacheData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching variants:", error);
    return { colorVariants: [] };
  }
};

/**
 * Fetch full product details
 */
export const fetchProductDetails = async (productId) => {
  try {
    const cacheKey = `${CACHE_KEYS.PRODUCT_DETAILS}${productId}`;
    
    // Check cache first
    const cached = getCachedData(cacheKey, CACHE_DURATION.DETAILS);
    if (cached) return cached;

    // Fetch from API
    const response = await fetch(`http://localhost:5000/api/products/${productId}`);
    if (!response.ok) throw new Error("Failed to fetch product details");

    const data = await response.json();
    setCacheData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("❌ Error fetching product details:", error);
    throw error;
  }
};

/**
 * Prefetch images for better performance
 */
export const prefetchImage = (url) => {
  if (!url) return;
  const img = new Image();
  img.src = url;
};

/**
 * Invalidate all caches
 */
export const invalidateAllCaches = () => {
  const keys = Object.keys(CACHE_KEYS);
  keys.forEach((key) => {
    const pattern = CACHE_KEYS[key];
    // Clear specific cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(pattern)) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_time`);
      }
    }
  });
  console.log("🗑️  All caches cleared");
};

export default {
  getCachedData,
  setCacheData,
  clearCache,
  fetchProductVariants,
  fetchProductDetails,
  prefetchImage,
  invalidateAllCaches,
};

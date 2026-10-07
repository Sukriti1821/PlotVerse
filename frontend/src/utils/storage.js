/**
 * Thikana Storage Utility
 * Provides safe localStorage operations with transparent one-time migration
 * from legacy keys (e.g. token, userInfo, plotverse_*) so active user sessions are preserved.
 */

export const STORAGE_KEYS = {
  TOKEN: "thikana_token",
  USER_INFO: "thikana_user_info",
  REF_CODE: "thikana_ref_code",
  SAVED_DESTINATIONS: "thikana_saved_destinations",
  PWA_DISMISSED: "thikana_pwa_dismissed",
};

/**
 * Reads an item from localStorage under key.
 * If not present, checks legacyKeys in order. If found in a legacy key,
 * writes it to the new key and removes the old key (migrating once).
 */
export const getStorageItem = (key, legacyKeys = []) => {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;

    for (const oldKey of legacyKeys) {
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal !== null) {
        localStorage.setItem(key, oldVal);
        localStorage.removeItem(oldKey);
        return oldVal;
      }
    }
    return null;
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key}:`, err);
    return null;
  }
};

/**
 * Writes value to localStorage under key.
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch (err) {
    console.warn(`[Storage] Failed to set ${key}:`, err);
  }
};

/**
 * Removes an item and all its legacy aliases.
 */
export const removeStorageItem = (key, legacyKeys = []) => {
  try {
    localStorage.removeItem(key);
    for (const oldKey of legacyKeys) {
      localStorage.removeItem(oldKey);
    }
  } catch (err) {
    console.warn(`[Storage] Failed to remove ${key}:`, err);
  }
};

// Auth Token Helpers
export const getAuthToken = () =>
  getStorageItem(STORAGE_KEYS.TOKEN, ["token", "plotverse_token"]);

export const setAuthToken = (token) =>
  setStorageItem(STORAGE_KEYS.TOKEN, token);

export const removeAuthToken = () =>
  removeStorageItem(STORAGE_KEYS.TOKEN, ["token", "plotverse_token"]);

// User Info Helpers
export const getUserInfo = () => {
  const raw = getStorageItem(STORAGE_KEYS.USER_INFO, ["userInfo", "plotverse_user_info"]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setUserInfo = (info) =>
  setStorageItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));

export const removeUserInfo = () =>
  removeStorageItem(STORAGE_KEYS.USER_INFO, ["userInfo", "plotverse_user_info"]);

// Referral Code Helpers
export const getReferralCode = () =>
  getStorageItem(STORAGE_KEYS.REF_CODE, ["plotverse_ref_code", "ref_code"]) || "";

export const setReferralCode = (code) =>
  setStorageItem(STORAGE_KEYS.REF_CODE, code);

export const removeReferralCode = () =>
  removeStorageItem(STORAGE_KEYS.REF_CODE, ["plotverse_ref_code", "ref_code"]);

// Saved Destinations
export const getSavedDestinations = () => {
  const raw = getStorageItem(STORAGE_KEYS.SAVED_DESTINATIONS, [
    "plotverse_saved_destinations",
    "plotverse_saved_spots",
  ]);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const setSavedDestinations = (items) =>
  setStorageItem(STORAGE_KEYS.SAVED_DESTINATIONS, JSON.stringify(items));

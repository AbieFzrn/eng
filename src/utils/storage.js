import { STORAGE_KEYS } from '../config/constants';

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`Gagal menyimpan ${key} ke localStorage`);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Abaikan
    }
  }
};

export const saveConfigDraft = (draft) => storage.set(STORAGE_KEYS.CONFIG_DRAFT, draft);
export const loadConfigDraft = () => storage.get(STORAGE_KEYS.CONFIG_DRAFT);
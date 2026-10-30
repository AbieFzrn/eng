import { create } from 'zustand';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../config/constants';

const defaultPrefs = {
  musicVolume: 0.5,
  sfxVolume: 0.8,
  isMuted: false
};

const loadPrefs = () => storage.get(STORAGE_KEYS.PREFERENCES, defaultPrefs);

export const usePreferences = create((set) => ({
  ...loadPrefs(),
  
  setVolume: (type, value) => set((state) => {
    const newPrefs = { ...state, [`${type}Volume`]: value };
    storage.set(STORAGE_KEYS.PREFERENCES, newPrefs);
    return newPrefs;
  }),
  
  toggleMute: () => set((state) => {
    const newPrefs = { ...state, isMuted: !state.isMuted };
    storage.set(STORAGE_KEYS.PREFERENCES, newPrefs);
    return newPrefs;
  })
}));
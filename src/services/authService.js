import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

// Pakai sesi anonim yang sudah ada (uid tetap sama setelah refresh),
// baru buat akun anonim kalau belum ada.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const off = onAuthStateChanged(auth, async (user) => {
      off();
      try {
        resolve(user ?? (await signInAnonymously(auth)).user);
      } catch (e) {
        reject(e);
      }
    });
  });
}
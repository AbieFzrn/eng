import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

let serverTimeOffset = 0;
let isListening = false;

export function syncServerTime() {
  if (isListening) return;
  isListening = true;
  
  const offsetRef = ref(db, '.info/serverTimeOffset');
  onValue(offsetRef, (snap) => {
    serverTimeOffset = snap.val() || 0;
  });
}

// Gunakan ini untuk menghitung sisa waktu secara akurat di UI dan Phaser
export function getServerTime() {
  return Date.now() + serverTimeOffset;
}
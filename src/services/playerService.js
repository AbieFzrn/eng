import { ref, get, set, update, onValue, onDisconnect, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';

const playerPath = (roomId, uid) => `rooms/${roomId}/players/${uid}`;

// Tandai connected=true saat online, otomatis false saat koneksi putus.
// Mengembalikan fungsi stop() -> panggil sebelum leaveRoom().
export function startPresence(roomId, uid) {
  const connectedRef = ref(db, `${playerPath(roomId, uid)}/connected`);
  const off = onValue(ref(db, '.info/connected'), async (snap) => {
    if (snap.val() !== true) return;
    try {
      await onDisconnect(connectedRef).set(false);
      await set(connectedRef, true);
    } catch {
      /* node pemain sudah dihapus -> abaikan */
    }
  });
  return () => {
    off();
    onDisconnect(connectedRef).cancel().catch(() => {});
  };
}

// Simpan indeks soal terakhir supaya bisa lanjut setelah refresh.
export function saveProgress(roomId, uid, round, index) {
  return set(ref(db, `${playerPath(roomId, uid)}/rounds/r${round}/progress`), index);
}

export async function getProgress(roomId, uid, round) {
  const snap = await get(ref(db, `${playerPath(roomId, uid)}/rounds/r${round}/progress`));
  return snap.val() ?? 0;
}

// Simpan skor ronde + hitung ulang total dari semua ronde.
export async function submitRoundScore(roomId, uid, round, score) {
  const roundsSnap = await get(ref(db, `${playerPath(roomId, uid)}/rounds`));
  const rounds = roundsSnap.val() ?? {};
  const others = Object.entries(rounds)
    .filter(([key]) => key !== `r${round}`)
    .reduce((sum, [, r]) => sum + (r?.score ?? 0), 0);

  return update(ref(db, playerPath(roomId, uid)), {
    [`rounds/r${round}/score`]: score,
    [`rounds/r${round}/finishedAt`]: serverTimestamp(),
    total: others + score,
  });
}
export async function getRoundScore(roomId, uid, round) {
  const snap = await get(ref(db, `${playerPath(roomId, uid)}/rounds/r${round}/score`));
  return snap.val() ?? 0;
}
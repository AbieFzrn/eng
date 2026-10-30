import { ref, get, set, update, remove, onValue, serverTimestamp } from 'firebase/database';
import { db, auth } from '../config/firebase';
import { MAX_PLAYERS } from '../config/constants'; // = 10 (harus sama dengan slot 0-9 di rules)
import { generateRoomCode, normalizeRoomCode } from '../utils/roomCode';
import { hashPassword } from '../utils/hashPassword';

export class RoomError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.code = code; // NOT_SIGNED_IN | ROOM_NOT_FOUND | ROOM_STARTED | JOIN_DENIED | CREATE_FAILED
  }
}

const requireUid = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new RoomError('NOT_SIGNED_IN', 'Panggil ensureSignedIn() dulu');
  return uid;
};

const isDenied = (e) =>
  e?.code === 'PERMISSION_DENIED' || /permission[_ ]denied/i.test(e?.message ?? '');

/* ---------- HOST ---------- */

// config wajib punya: totalRounds, perRound, maxScorePerRound, questions[]
export async function createRoom({ password, config }) {
  const uid = requireUid();
  if (!password) throw new RoomError('CREATE_FAILED', 'Password wajib diisi');

  let roomId = null;
  for (let i = 0; i < 5 && !roomId; i++) {
    const candidate = generateRoomCode();
    try {
      await set(ref(db, `rooms/${candidate}`), {
        hostUid: uid,
        createdAt: serverTimestamp(),
        status: 'lobby',
        round: 0,
        config,
      });
      roomId = candidate;
    } catch (e) {
      if (!isDenied(e)) throw e; // kode bentrok / config tidak valid -> coba lagi
    }
  }
  if (!roomId) {
    throw new RoomError('CREATE_FAILED', 'Gagal membuat room (cek isi config)');
  }

  try {
    const hash = await hashPassword(roomId, password);
    await set(ref(db, `roomSecrets/${roomId}/passwordHash`), hash);
  } catch (e) {
    await remove(ref(db, `rooms/${roomId}`)).catch(() => {});
    throw e;
  }
  return roomId;
}

export function startRound(roomId, round) {
  return update(ref(db, `rooms/${roomId}`), {
    status: 'playing',
    round,
    startAt: serverTimestamp(),
  });
}

// isLast=true -> 'finished', selain itu kembali ke 'lobby'
export function endRound(roomId, isLast = false) {
  return update(ref(db, `rooms/${roomId}`), {
    status: isLast ? 'finished' : 'lobby',
  });
}

export async function kickPlayer(roomId, targetUid) {
  const slotSnap = await get(ref(db, `rooms/${roomId}/players/${targetUid}/slot`));
  const updates = { [`rooms/${roomId}/players/${targetUid}`]: null };
  if (slotSnap.exists()) {
    updates[`roomSecrets/${roomId}/slots/${slotSnap.val()}`] = null;
  }
  return update(ref(db), updates);
}

export function closeRoom(roomId) {
  return update(ref(db), {
    [`rooms/${roomId}`]: null,
    [`roomSecrets/${roomId}`]: null,
  });
}

/* ---------- PEMAIN ---------- */

export async function joinRoom({ roomId, password, name }) {
  const uid = requireUid();
  roomId = normalizeRoomCode(roomId);

  // 1) Room ada? (status boleh dibaca semua user yang sudah login)
  const status = (await get(ref(db, `rooms/${roomId}/status`))).val();
  if (status === null) throw new RoomError('ROOM_NOT_FOUND', 'Room tidak ditemukan');

  // 2) Sudah pernah join (reconnect / refresh)? Tidak perlu password lagi.
  try {
    const me = await get(ref(db, `rooms/${roomId}/players/${uid}`));
    if (me.exists()) return { roomId, rejoined: true };
  } catch (e) {
    if (!isDenied(e)) throw e; // bukan member -> lanjut join baru
  }

  if (status !== 'lobby') {
    throw new RoomError('ROOM_STARTED', 'Game sudah dimulai');
  }

  // 3) Klaim slot 0..9 (rules mengecek password + slot kosong + status lobby)
  const joinKey = await hashPassword(roomId, password);
  let slot = null;
  for (let n = 0; n < MAX_PLAYERS; n++) {
    try {
      await set(ref(db, `roomSecrets/${roomId}/slots/${n}`), { uid, joinKey });
      slot = String(n);
      break;
    } catch (e) {
      if (!isDenied(e)) throw e; // slot terisi / password salah -> coba slot berikutnya
    }
  }
  if (slot === null) {
    throw new RoomError('JOIN_DENIED', 'Password salah atau room penuh');
  }

  // 4) Buat data pemain (rules memastikan slot memang milik uid ini)
  try {
    await set(ref(db, `rooms/${roomId}/players/${uid}`), {
      name: name.trim().slice(0, 20),
      slot,
      joinedAt: serverTimestamp(),
      connected: true,
      total: 0,
    });
  } catch (e) {
    await remove(ref(db, `roomSecrets/${roomId}/slots/${slot}`)).catch(() => {});
    throw e;
  }
  return { roomId, rejoined: false };
}

// Hentikan presence (startPresence) SEBELUM memanggil ini.
export async function leaveRoom(roomId) {
  const uid = requireUid();
  const slotSnap = await get(ref(db, `rooms/${roomId}/players/${uid}/slot`));
  const updates = { [`rooms/${roomId}/players/${uid}`]: null };
  if (slotSnap.exists()) {
    updates[`roomSecrets/${roomId}/slots/${slotSnap.val()}`] = null;
  }
  return update(ref(db), updates);
}

/* ---------- LISTENER ---------- */

// Mengembalikan fungsi unsubscribe. onData menerima null kalau room dihapus.
export function listenRoom(roomId, onData, onError) {
  return onValue(ref(db, `rooms/${roomId}`), (snap) => onData(snap.val()), onError);
}
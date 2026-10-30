import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

const FAR_FUTURE = Number.MAX_SAFE_INTEGER;

// round = null -> peringkat total; round = n -> peringkat ronde n.
// Seri diputuskan oleh siapa yang selesai lebih dulu.
export function buildRanking(players, round = null) {
  const rows = Object.entries(players ?? {}).map(([uid, p]) => {
    const rounds = p.rounds ?? {};
    const current = round ? rounds[`r${round}`] : null;

    const score = round ? current?.score ?? 0 : p.total ?? 0;
    const finishedAt = round
      ? current?.finishedAt ?? FAR_FUTURE
      : Math.max(0, ...Object.values(rounds).map((r) => r?.finishedAt ?? 0)) || FAR_FUTURE;

    return { uid, name: p.name, score, finishedAt, connected: !!p.connected };
  });

  rows.sort((a, b) => b.score - a.score || a.finishedAt - b.finishedAt);
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

// Maksimal 10 pemain -> cukup subscribe seluruh node, tanpa query/index.
// Mengembalikan fungsi unsubscribe.
export function listenLeaderboard(roomId, onChange, { round = null } = {}) {
  return onValue(ref(db, `rooms/${roomId}/players`), (snap) =>
    onChange(buildRanking(snap.val(), round))
  );
}
// 32 karakter (tanpa 0/O/1/I) -> 256 % 32 === 0, jadi tidak ada modulo bias
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const normalizeRoomCode = (input) => input.trim().toUpperCase();
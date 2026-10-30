// SHA-256 hex (64 karakter), di-salt dengan roomId.
// Catatan: crypto.subtle hanya ada di HTTPS atau localhost.
export async function hashPassword(roomId, password) {
  const data = new TextEncoder().encode(`${roomId}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');
}
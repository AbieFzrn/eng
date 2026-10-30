import { create } from 'zustand';

const KEY = 'esb:roomId';
const load = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const save = (id) => { try { id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY); } catch { /* abaikan */ } };

export const useRoomStore = create((set) => ({
  uid: null,
  roomId: load(),           // dipulihkan setelah refresh
  room: null,               // snapshot rooms/{roomId}
  setUid: (uid) => set({ uid }),
  enter: (roomId) => { save(roomId); set({ roomId, room: null }); },
  setRoom: (room) => set({ room }),
  leave: () => { save(null); set({ roomId: null, room: null }); },
}));
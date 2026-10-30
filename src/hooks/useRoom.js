import { useEffect } from 'react';
import { listenRoom, leaveRoom, closeRoom } from '../services/roomService';
import { startPresence } from '../services/playerService';
import { useRoomStore } from '../state/useRoomStore';

let stopPresence = null;

export function useRoom() {
  const uid = useRoomStore((s) => s.uid);
  const roomId = useRoomStore((s) => s.roomId);
  const isHost = useRoomStore((s) => s.room?.hostUid === s.uid);
  const joined = useRoomStore((s) => !!s.room?.players?.[s.uid]);

  useEffect(() => {
    if (!roomId || !uid) return;
    const { setRoom, leave } = useRoomStore.getState();
    return listenRoom(
      roomId,
      (data) => {
        if (!data) return leave();                                   // room ditutup host
        if (data.hostUid !== uid && !data.players?.[uid]) return leave(); // dikeluarkan
        setRoom(data);
      },
      () => leave(),                                                 // PERMISSION_DENIED (bukan member)
    );
  }, [roomId, uid]);

  useEffect(() => {
    if (!roomId || !uid || isHost || !joined) return;
    stopPresence = startPresence(roomId, uid);
    return () => { stopPresence?.(); stopPresence = null; };
  }, [roomId, uid, isHost, joined]);
}

// Pemain: keluar room. Host: menutup room.
export async function exitRoom() {
  const { roomId, room, uid, leave } = useRoomStore.getState();
  stopPresence?.(); stopPresence = null;   // wajib sebelum leaveRoom
  try {
    if (room?.hostUid === uid) await closeRoom(roomId);
    else await leaveRoom(roomId);
  } catch { /* abaikan */ }
  leave();
}
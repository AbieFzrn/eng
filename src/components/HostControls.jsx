import { useRoomStore } from '../state/useRoomStore';
import { startRound, endRound } from '../services/roomService';
import { exitRoom } from '../hooks/useRoom';

export default function HostControls() {
  // Mengambil state secara eksplisit dari Zustand (bukan menggunakan '...')
  const roomId = useRoomStore((s) => s.roomId);
  const room = useRoomStore((s) => s.room);

  // Mencegah render jika data room belum termuat
  if (!room || !roomId) return null;

  const total = room.config?.totalRounds || 0;
  const empty = !Object.keys(room.players ?? {}).length;

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-5 bg-[#0f0f0f] rounded-2xl border border-neutral-800 shadow-2xl w-max">
      
      {room.status === 'lobby' && room.round < total && (
        <button 
          disabled={empty} 
          onClick={() => startRound(roomId, room.round + 1)}
          className="px-6 py-2.5 bg-[#e0ff00] text-black font-bold rounded-xl hover:bg-[#b8d600] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Mulai Ronde {room.round + 1}
        </button>
      )}

      {room.status === 'playing' && (
        <button 
          onClick={() => endRound(roomId, room.round >= total)}
          className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors"
        >
          Akhiri Ronde
        </button>
      )}

      <button 
        onClick={exitRoom}
        className="px-6 py-2.5 bg-transparent text-[#ff4d4d] font-bold rounded-xl border border-[#ff4d4d] hover:bg-[#ff4d4d] hover:text-white transition-colors"
      >
        Tutup Room
      </button>

    </div>
  );
}
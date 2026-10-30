import { useRoomStore } from '../state/useRoomStore';
import HostControls from '../components/HostControls';
import PlayerList from '../components/PlayerList';
import { MAX_PLAYERS } from '../config/constants';

export default function LobbyPage() {
  const uid = useRoomStore((s) => s.uid);
  const roomId = useRoomStore((s) => s.roomId);
  const room = useRoomStore((s) => s.room);

  // Fallback pengaman jika data belum merender sempurna
  if (!room) return null;

  const isHost = room.hostUid === uid;
  const playersCount = Object.keys(room.players || {}).length;
  const isIntermission = room.round > 0; // Jeda antar ronde

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-white font-sans flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header Lobby */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 shadow-lg">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              {isIntermission ? `Selesai Ronde ${room.round}` : 'Ruang Tunggu'}
            </h1>
            <p className="text-neutral-400 text-sm">
              Kode Room: <span className="text-[#e0ff00] font-mono font-bold text-base px-2 py-1 bg-[#1a1a1a] rounded">{roomId}</span>
            </p>
          </div>
          
          {/* Kontrol Khusus Host */}
          {isHost ? (
            <HostControls />
          ) : (
            <div className="px-5 py-3 bg-[#1a1a1a] rounded-xl border border-neutral-800">
              <p className="text-neutral-300 text-sm font-medium animate-pulse">Menunggu Guru memulai game...</p>
            </div>
          )}
        </header>

        {/* Area Daftar Pemain */}
        <div className="flex-1 bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Pemain Bergabung</h2>
            <span className="text-sm font-bold px-3 py-1 bg-[#1a1a1a] rounded-lg text-neutral-400">
              {playersCount} / {MAX_PLAYERS} Slot
            </span>
          </div>
          
          <PlayerList players={room.players} currentUid={uid} />
        </div>

      </div>
    </div>
  );
}
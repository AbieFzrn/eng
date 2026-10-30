import { useEffect, useState } from 'react';
import { useRoomStore } from '../state/useRoomStore';
import { listenLeaderboard } from '../services/leaderboardService';
import { exitRoom } from '../hooks/useRoom';
import { Crown, LogOut } from 'lucide-react';

export default function ResultPage() {
  const roomId = useRoomStore((s) => s.roomId);
  const uid = useRoomStore((s) => s.uid);
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    if (!roomId) return;
    return listenLeaderboard(roomId, setRankings); // Total akumulasi skor
  }, [roomId]);

  const winner = rankings[0];

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-neutral-200 font-sans flex items-center justify-center">
      <div className="w-full max-w-xl space-y-8 text-center">
        
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e0ff00]/10 border border-[#e0ff00]/30 rounded-3xl text-[#e0ff00] mb-2 shadow-[0_0_50px_-10px_#e0ff00]">
            <Crown size={36} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Permainan Selesai!</h1>
          {winner && (
            <p className="text-lg text-neutral-300">
              Selamat kepada <span className="text-[#e0ff00] font-bold">{winner.name}</span> atas kemenangan!
            </p>
          )}
        </div>

        <div className="bg-[#0f0f0f] rounded-3xl border border-neutral-800 p-6 shadow-2xl space-y-3 text-left">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">
            Hasil Akhir Akumulasi Skor
          </h3>
          {rankings.map((r) => (
            <div
              key={r.uid}
              className={`flex items-center justify-between p-4 rounded-2xl border ${
                r.uid === uid
                  ? 'bg-[#e0ff00]/10 border-[#e0ff00]'
                  : 'bg-[#141414] border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-neutral-400 w-6">#{r.rank}</span>
                <span className="font-bold text-white">{r.name}</span>
              </div>
              <span className="font-mono text-lg font-black text-[#e0ff00]">{r.score} PTS</span>
            </div>
          ))}
        </div>

        <button
          onClick={exitRoom}
          className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-colors inline-flex items-center gap-2"
        >
          <LogOut size={20} /> Keluar ke Menu Utama
        </button>

      </div>
    </div>
  );
}
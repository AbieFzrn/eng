import { useEffect, useState } from 'react';
import { useRoomStore } from '../state/useRoomStore';
import { listenLeaderboard } from '../services/leaderboardService';
import HostControls from '../components/HostControls';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const roomId = useRoomStore((s) => s.roomId);
  const room = useRoomStore((s) => s.room);
  const uid = useRoomStore((s) => s.uid);
  const [rankings, setRankings] = useState([]);

  const isHost = room?.hostUid === uid;

  useEffect(() => {
    if (!roomId) return;
    return listenLeaderboard(roomId, setRankings, { round: room?.round });
  }, [roomId, room?.round]);

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-neutral-200 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e0ff00]/10 text-[#e0ff00] rounded-full text-xs font-bold border border-[#e0ff00]/20">
            <Trophy size={14} /> Real-time Leaderboard
          </div>
          <h1 className="text-3xl font-bold text-white">
            Klasemen Ronde {room?.round}
          </h1>
        </div>

        <div className="bg-[#0f0f0f] rounded-3xl border border-neutral-800 p-6 shadow-2xl space-y-3">
          {rankings.map((r) => {
            const isMe = r.uid === uid;
            return (
              <div
                key={r.uid}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-[#e0ff00]/10 border-[#e0ff00] text-white'
                    : 'bg-[#141414] border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                    r.rank === 1 ? 'bg-amber-400 text-black' :
                    r.rank === 2 ? 'bg-slate-300 text-black' :
                    r.rank === 3 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {r.rank}
                  </span>
                  <div>
                    <span className="font-bold text-white block">
                      {r.name} {isMe && '(Kamu)'}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {r.connected ? 'Sedang Bermain' : 'Selesai / Offline'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xl font-black text-[#e0ff00]">
                    {r.score}
                  </span>
                  <span className="text-xs text-neutral-500 ml-1">PTS</span>
                </div>
              </div>
            );
          })}
        </div>

        {isHost && (
          <div className="flex justify-center pt-2">
            <HostControls />
          </div>
        )}

      </div>
    </div>
  );
}
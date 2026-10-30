import { useAuth } from './hooks/useAuth';
import { useRoom } from './hooks/useRoom';
import { useRoomStore } from './state/useRoomStore';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  const ready = useAuth();
  useRoom();
  const uid = useRoomStore((s) => s.uid);
  const roomId = useRoomStore((s) => s.roomId);
  const room = useRoomStore((s) => s.room);

  if (!ready) return <p className="p-6">Memuat…</p>;
  if (!roomId) return <HomePage />;
  if (!room) return <p className="p-6">Menghubungkan…</p>;

  const isHost = room.hostUid === uid;
  switch (room.status) {
    case 'playing':  return isHost ? <LeaderboardPage /> : <GamePage />;
    case 'finished': return <ResultPage />;
    default:         return <LobbyPage />;   // round > 0 = jeda antar ronde
  }
}
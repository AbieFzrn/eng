import { useState, useEffect } from 'react';
import { listenLeaderboard } from '../services/leaderboardService';
import { useRoomStore } from '../state/useRoomStore';

export function useLeaderboard(round = null) {
  const roomId = useRoomStore((s) => s.roomId);
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    if (!roomId) return;
    
    // Subscribe ke leaderboard realtime (bisa spesifik per ronde atau total)
    const unsubscribe = listenLeaderboard(roomId, setRankings, { round });
    
    // Cleanup listener saat komponen di-unmount
    return () => unsubscribe();
  }, [roomId, round]);

  return rankings;
}
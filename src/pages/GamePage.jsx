import { useEffect, useMemo, useState } from 'react';
import PhaserGame from '../components/PhaserGame';
import { useRoomStore } from '../state/useRoomStore';
import { exitRoom } from '../hooks/useRoom';
import {
  getProgress, getRoundScore, saveProgress, submitRoundScore,
} from '../services/playerService';

export default function GamePage() {
  const uid = useRoomStore((s) => s.uid);
  const roomId = useRoomStore((s) => s.roomId);
  const round = useRoomStore((s) => s.room?.round);
  const config = useRoomStore((s) => s.room?.config);
  const [resume, setResume] = useState(null);

  useEffect(() => {
    let alive = true;
    setResume(null);
    Promise.all([getProgress(roomId, uid, round), getRoundScore(roomId, uid, round)])
      .then(([index, score]) => { if (alive) setResume({ index, score }); });
    return () => { alive = false; };
  }, [roomId, uid, round]);

  const settings = useMemo(() => {
    if (!resume || !config) return null;
    return {
      sentences: config.questions,
      rounds: config.perRound,
      timerSeconds: Number(config.timerSeconds ?? 60),
      wordSpeed: config.wordSpeed,
      scoring: config.scoring,
      audio: { music: null, success: null, fail: null, musicVolume: 0.5, sfxVolume: 0.8, ...config.audio },
      seed: `${roomId}:${uid}:${round}`,
      startIndex: resume.index,
      startScore: resume.score,
      replays: config.replays ?? 3,
    };
  }, [resume, config, roomId, uid, round]);

  if (!settings) return <p className="p-6 text-white">Memuat…</p>;

  if (resume.index >= config.perRound) {
    return <p className="p-6 text-white">Selesai! Menunggu host mengakhiri ronde…</p>;
  }

  return (
    <PhaserGame
      settings={settings}
      onProgress={({ index, score }) => {
        saveProgress(roomId, uid, round, index);
        submitRoundScore(roomId, uid, round, score);
      }}
      onQuit={() => {
        if (window.confirm('Keluar dari room? Kamu tidak bisa masuk lagi selama game berjalan.')) exitRoom();
      }}
    />
  );
}
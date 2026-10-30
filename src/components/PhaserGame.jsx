import { useEffect, useRef } from 'react';
import { startGame, stopGame } from '../game/phaserConfig';

export default function PhaserGame({ settings, onProgress, onFinish, onQuit }) {
  const ref = useRef(null);
  const cb = useRef({});
  cb.current = { onProgress, onFinish, onQuit };

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const settingsKey = JSON.stringify(settings);

  useEffect(() => {
    startGame(
      {
        ...settingsRef.current,
        onProgress: (d) => cb.current.onProgress?.(d),
        onFinish: (d) => cb.current.onFinish?.(d),
        onQuit: () => cb.current.onQuit?.(),
      },
      ref.current,
    );
    return stopGame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsKey]); // restart hanya kalau isi berubah

  return (
    <div
        ref={ref}
        className="w-full h-screen min-h-0 overflow-hidden"
        style={{ height: '100dvh' }}
    />
  );
}
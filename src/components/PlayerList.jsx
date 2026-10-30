export default function PlayerList({ players, currentUid }) {
  const playerArray = Object.entries(players || {}).map(([uid, data]) => ({
    uid,
    ...data
  }));

  if (playerArray.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-neutral-800 rounded-2xl">
        <p className="text-neutral-500 font-medium">Belum ada pemain yang bergabung.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {playerArray.map((player) => (
        <div 
          key={player.uid} 
          className={`relative p-4 rounded-2xl border ${player.uid === currentUid ? 'bg-[#e0ff00]/10 border-[#e0ff00]/50' : 'bg-[#121212] border-neutral-800'} flex flex-col items-center justify-center text-center gap-2 transition-all`}
        >
          {/* Indikator Online/Offline */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${player.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-neutral-600'}`}></span>
          </div>
          
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-xl mb-1">
            {player.name.charAt(0).toUpperCase()}
          </div>
          
          <div>
            <p className={`font-bold truncate w-24 ${player.uid === currentUid ? 'text-[#e0ff00]' : 'text-white'}`}>
              {player.name}
            </p>
            {player.uid === currentUid && <span className="text-[10px] text-neutral-400 font-bold uppercase">Kamu</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
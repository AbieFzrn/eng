import { useState } from 'react';
import { joinRoom, RoomError } from '../services/roomService';
import { useRoomStore } from '../state/useRoomStore';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function JoinPage({ onBack }) {
  const enter = useRoomStore((s) => s.enter);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await joinRoom({ roomId, password, name });
      enter(res.roomId);
    } catch (err) {
      setError(err instanceof RoomError ? err.message : 'Gagal bergabung ke room');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-neutral-200 font-sans">
      <div className="w-full max-w-md bg-[#0f0f0f] p-8 rounded-3xl border border-neutral-800 shadow-2xl space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-bold text-white">Gabung Permainan</h2>
          <p className="text-xs text-neutral-400 mt-1">Masukkan ID Room & Password dari gurumu</p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Kode Room
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="Contoh: A8K2X9"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full bg-[#1a1a1a] text-white font-mono text-center tracking-widest text-lg font-bold border border-neutral-800 rounded-xl px-4 py-3 focus:border-[#e0ff00] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Password Room
            </label>
            <input
              type="password"
              required
              placeholder="Password room"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-3 focus:border-[#e0ff00] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Nama Pemain
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="Nama panggilanmu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-3 focus:border-[#e0ff00] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 bg-[#e0ff00] text-black font-extrabold text-base rounded-xl flex items-center justify-center gap-2 hover:bg-[#b8d600] transition-colors disabled:opacity-50"
          >
            <LogIn size={20} />
            <span>{loading ? 'Menghubungkan...' : 'Masuk Room'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
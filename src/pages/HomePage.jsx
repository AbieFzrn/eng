import { useState } from 'react';
import { joinRoom, RoomError } from '../services/roomService';
import { useRoomStore } from '../state/useRoomStore';
import CreateRoomPage from './CreateRoomPage';

export default function HomePage() {
  const enter = useRoomStore((s) => s.enter);
  const [isCreating, setIsCreating] = useState(false);
  
  const [form, setForm] = useState({ roomId: '', password: '', name: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!form.roomId || !form.password || !form.name) {
      return setError('Semua kolom wajib diisi.');
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await joinRoom(form);
      enter(result.roomId); // Masuk ke room melalui Zustand
    } catch (err) {
      setError(err instanceof RoomError ? err.message : 'Gagal bergabung ke room.');
      setLoading(false);
    }
  };

  // Render halaman pembuatan room jika mode guru aktif
  if (isCreating) {
    return <CreateRoomPage onBack={() => setIsCreating(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Sentence <span className="text-[#e0ff00]">Builder</span>
          </h1>
          <p className="text-neutral-400 text-sm">Susun kata jadi kalimat bahasa Inggris!</p>
        </div>

        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-neutral-800 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Gabung ke Room</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Kode Room" 
                value={form.roomId}
                onChange={e => setForm({...form, roomId: e.target.value.toUpperCase()})}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-5 py-3.5 focus:border-[#e0ff00] outline-none uppercase font-mono tracking-widest"
              />
            </div>
            <div>
              <input 
                type="text" 
                placeholder="Password Room" 
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-5 py-3.5 focus:border-[#e0ff00] outline-none"
              />
            </div>
            <div>
              <input 
                type="text" 
                placeholder="Nama Kamu (Maks. 20 huruf)" 
                maxLength={20}
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-5 py-3.5 focus:border-[#e0ff00] outline-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 px-6 py-4 bg-[#e0ff00] text-black font-extrabold text-lg rounded-xl hover:bg-[#b8d600] transition-colors disabled:opacity-50"
            >
              {loading ? 'MENYAMBUNGKAN...' : 'MAIN SEKARANG'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsCreating(true)}
            className="text-neutral-500 text-sm font-medium hover:text-white transition-colors underline underline-offset-4"
          >
            Masuk sebagai Guru (Buat Room)
          </button>
        </div>
        
      </div>
    </div>
  );
}
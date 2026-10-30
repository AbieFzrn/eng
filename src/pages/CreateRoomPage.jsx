import { useState, useEffect } from 'react';
import { createRoom, RoomError } from '../services/roomService';
import { useRoomStore } from '../state/useRoomStore';
import { buildConfig } from '../utils/validateConfig';
import { loadConfigDraft, saveConfigDraft } from '../utils/storage';
import { DEFAULT_CONFIG, WORD_SPEED } from '../config/constants';
import SentenceEditor from '../components/SentenceEditor';

// Helper pemrosesan teks dari main.js
const stripEdges = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
const tokenize = (text) => text.split(/\s+/).map(stripEdges).filter(Boolean);

const parseDistractors = (text, sentenceWords) => {
  const taken = new Set(sentenceWords.map((w) => w.toLowerCase()));
  const result = [];
  text.split(',').forEach((raw) => {
    const word = stripEdges(raw.trim().replace(/\s+/g, ' '));
    const key = word.toLowerCase();
    if (!word || taken.has(key)) return;
    taken.add(key);
    result.push({ text: word, class: 'distractor' });
  });
  return result;
};

export default function CreateRoomPage({ onBack }) {
  const enter = useRoomStore((s) => s.enter);
  
  // State awal dengan fallback defaults dan penanganan replays serta password kosong
  const [form, setForm] = useState(() => {
    const defaults = {
      ...DEFAULT_CONFIG,
      replays: 3,
      sentences: [{ text: '', distractors: '' }],
      scoring: { correct: 100, wrong: 10, timeBonus: 50 },
      audio: { music: null, success: null, fail: null, musicVolume: 0.5, sfxVolume: 0.8 },
    };
    const draft = loadConfigDraft();
    return {
      ...defaults,
      ...draft,
      password: '' // Pastikan password selalu kosong saat load dari draft
    };
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-save draft
  useEffect(() => {
    const draft = { ...form };
    delete draft.password; // Jangan simpan password ke localStorage
    saveConfigDraft(draft);
  }, [form]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 4) {
      return setError('Password minimal 4 karakter');
    }

    const filledSentences = form.sentences.filter(s => s.text.trim());
    if (filledSentences.length === 0) {
      return setError('Tambahkan minimal satu kalimat valid');
    }

    const parsedQuestions = filledSentences.map(item => {
      const words = tokenize(item.text);
      if (words.length < 2) throw new Error(`Kalimat "${item.text}" terlalu pendek`);
      return {
        text: item.text.trim(),
        words: words.map(w => ({ text: w, class: 'word' })),
        distractors: parseDistractors(item.distractors, words)
      };
    });

    setLoading(true);
    try {
      const config = buildConfig({
        ...form,
        sentences: parsedQuestions,
        perRound: Math.min(form.perRound, parsedQuestions.length)
      });
      const roomId = await createRoom({ password: form.password, config });
      enter(roomId);
    } catch (err) {
      setError(err instanceof RoomError ? err.message : err.message || 'Terjadi kesalahan');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 text-neutral-200 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Konfigurasi Room</h1>
          <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors">
            Kembali
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel Pengaturan Dasar */}
            <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-5 border-b border-neutral-800 pb-3">Aturan Main</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Password Room</label>
                  <input 
                    type="text" 
                    required 
                    value={form.password || ''} 
                    onChange={e => updateForm('password', e.target.value)} 
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Total Ronde</label>
                    <input type="number" min="1" max="20" value={form.totalRounds} onChange={e => updateForm('totalRounds', Number(e.target.value))} className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Soal per Ronde</label>
                    <input type="number" min="1" max="50" value={form.perRound} onChange={e => updateForm('perRound', Number(e.target.value))} className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Waktu (Detik)</label>
                    <select 
                      value={form.timerSeconds} 
                      onChange={e => updateForm('timerSeconds', Number(e.target.value))} 
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none"
                    >
                      <option value={0}>Tanpa Waktu</option>
                      <option value={30}>30 Detik</option>
                      <option value={60}>60 Detik</option>
                      <option value={90}>90 Detik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Kecepatan Kata</label>
                    <select value={form.wordSpeed} onChange={e => updateForm('wordSpeed', e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none">
                      <option value={WORD_SPEED.STILL}>Diam</option>
                      <option value={WORD_SPEED.SLOW}>Lambat</option>
                      <option value={WORD_SPEED.NORMAL}>Normal</option>
                      <option value={WORD_SPEED.FAST}>Cepat</option>
                    </select>
                  </div>
                </div>

                {/* Opsi Putar Ulang Audio */}
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Putar Ulang Audio</label>
                  <select 
                    value={form.replays ?? 3} 
                    onChange={e => updateForm('replays', Number(e.target.value))} 
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none"
                  >
                    <option value={1}>1x</option>
                    <option value={3}>3x</option>
                    <option value={5}>5x</option>
                    <option value={0}>Tanpa batas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Panel Poin & Audio */}
            <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 shadow-xl flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-5 border-b border-neutral-800 pb-3">Sistem Poin</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Benar</label>
                    <input type="number" value={form.scoring.correct} onChange={e => updateForm('scoring', { ...form.scoring, correct: Number(e.target.value)})} className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-center focus:border-[#e0ff00] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Salah (Minus)</label>
                    <input type="number" value={form.scoring.wrong} onChange={e => updateForm('scoring', { ...form.scoring, wrong: Number(e.target.value)})} className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-center focus:border-[#e0ff00] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Max Bonus Waktu</label>
                    <input type="number" value={form.scoring.timeBonus} onChange={e => updateForm('scoring', { ...form.scoring, timeBonus: Number(e.target.value)})} className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-center focus:border-[#e0ff00] outline-none" />
                  </div>
                </div>
              </div>
              
              {/* Opsi Audio Disederhanakan */}
              <div>
                <h2 className="text-lg font-bold text-white mb-5 border-b border-neutral-800 pb-3">Audio Default</h2>
                <div className="space-y-3">
                  <select value={form.audio.music || ''} onChange={e => updateForm('audio', { ...form.audio, music: e.target.value || null })} className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none">
                    <option value="">Tanpa Musik</option>
                    <option value="/assets/audio/music/music-happy.mp3">Music Happy</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <SentenceEditor 
            sentences={form.sentences} 
            onChange={(newData) => updateForm('sentences', newData)} 
          />

          <div className="sticky bottom-6 mt-8 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-4 bg-[#e0ff00] text-black font-extrabold text-lg rounded-2xl shadow-[0_0_40px_-10px_#e0ff00] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'MEMBUAT ROOM...' : 'BUAT ROOM SEKARANG'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
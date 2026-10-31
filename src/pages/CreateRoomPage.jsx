import { useState, useEffect } from 'react';
import { createRoom, RoomError } from '../services/roomService';
import { useRoomStore } from '../state/useRoomStore';
import { buildConfig } from '../utils/validateConfig';
import { loadConfigDraft, saveConfigDraft } from '../utils/storage';
import { DEFAULT_CONFIG, WORD_SPEED } from '../config/constants';
import SentenceEditor, { emptySentence } from '../components/SentenceEditor';

// ==========================================
// HELPER PEMROSESAN TEKS
// ==========================================
const stripEdges = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
const tokenize = (text) => text.split(/\s+/).map(stripEdges).filter(Boolean);

const parseDistractors = (text, sentenceWords) => {
  const taken = new Set(sentenceWords.map((w) => w.toLowerCase()));
  const result = [];
  (text ?? '').split(',').forEach((raw) => {
    const word = stripEdges(raw.trim().replace(/\s+/g, ' '));
    const key = word.toLowerCase();
    if (!word || taken.has(key)) return;
    taken.add(key);
    result.push({ text: word, class: 'distractor' });
  });
  return result;
};

// ==========================================
// HELPER ANGKA (nilai form bisa berupa string)
// ==========================================
const clamp = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

const SPEED_MAP = { still: 0, slow: 0.5, normal: 1, fast: 1.5 };
const toSpeed = (v) => {
  const key = String(v).toLowerCase();
  if (key in SPEED_MAP) return SPEED_MAP[key];
  const n = Number(v);
  return Number.isFinite(n) ? n : 1;
};

// ==========================================
// PILIHAN AUDIO (sesuaikan dengan isi public/assets/audio/)
// ==========================================
const MUSIC_OPTIONS = [
  { label: 'Tanpa Musik', src: '' },
  { label: 'Music Happy', src: '/assets/audio/music/music-happy.mp3' },
];
const SUCCESS_OPTIONS = [
  { label: 'Tanpa Suara', src: '' },
  { label: 'Correct 1', src: '/assets/audio/sfx/correct.mp3' },
  { label: 'Correct 2', src: '/assets/audio/sfx/correct1.mp3' },
];
const FAIL_OPTIONS = [
  { label: 'Tanpa Suara', src: '' },
  { label: 'Wrong 1', src: '/assets/audio/sfx/wrong.mp3' },
  { label: 'Wrong 2', src: '/assets/audio/sfx/wrong1.mp3' },
];

// ==========================================
// KELAS TAILWIND
// ==========================================
const inputCls =
  'w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-4 py-2.5 focus:border-[#e0ff00] outline-none';
const smallInputCls =
  'w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-center focus:border-[#e0ff00] outline-none';
const labelCls = 'block text-sm text-neutral-400 mb-1';
const smallLabelCls = 'block text-xs text-neutral-500 mb-1';

// ==========================================
// STATE AWAL (gabung default + draft, aman dari draft lama / tidak lengkap)
// ==========================================
function initForm() {
  const defaults = {
    totalRounds: 1,
    perRound: 5,
    timerSeconds: 60,
    wordSpeed: WORD_SPEED.NORMAL,
    ...DEFAULT_CONFIG,
    replays: 3,
    speakLang: 'en-US',
    sentences: [emptySentence()],
    scoring: { correct: 100, wrong: 10, timeBonus: 50 },
    audio: { music: null, success: null, fail: null, musicVolume: 0.5, sfxVolume: 0.8 },
  };

  const draft = loadConfigDraft() ?? {};

  const sentences =
    Array.isArray(draft.sentences) && draft.sentences.length > 0
      ? draft.sentences.map((s) => ({ ...emptySentence(), ...s }))   // draft lama belum punya `question`
      : defaults.sentences;

  return {
    ...defaults,
    ...draft,
    scoring: { ...defaults.scoring, ...draft.scoring },
    audio: { ...defaults.audio, ...draft.audio },
    sentences,
    password: '',   // password tidak pernah dipulihkan dari draft
  };
}

export default function CreateRoomPage({ onBack }) {
  const enter = useRoomStore((s) => s.enter);
  const [form, setForm] = useState(initForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-save draft (tanpa password)
  useEffect(() => {
    const draft = { ...form };
    delete draft.password;
    saveConfigDraft(draft);
  }, [form]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const filledCount = form.sentences.filter((s) => s.text?.trim()).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form.password || form.password.length < 4) {
      return setError('Password minimal 4 karakter');
    }

    const filled = form.sentences.filter((s) => s.text?.trim());
    if (filled.length === 0) {
      return setError('Tambahkan minimal satu jawaban kalimat');
    }

    // Susun soal: question (dibacakan), answer (disusun pemain), words, distractors
    const questions = [];
    for (const item of filled) {
      const words = tokenize(item.text);
      if (words.length < 2) {
        return setError(`Jawaban "${item.text.trim()}" terlalu pendek (minimal 2 kata)`);
      }
      const question = (item.question ?? '').trim();
      questions.push({
        ...(question && { question }),   // hanya disimpan kalau diisi
        answer: item.text.trim(),
        words: words.map((w) => ({ text: w, class: 'word' })),
        distractors: parseDistractors(item.distractors, words),
      });
    }

    // Semua angka dipaksa ke rentang yang diizinkan database.rules.json
    const scoring = {
      correct: clamp(form.scoring.correct, 0, 1000, 100),
      wrong: clamp(form.scoring.wrong, 0, 1000, 10),
      timeBonus: clamp(form.scoring.timeBonus, 0, 1000, 50),
    };
    const totalRounds = clamp(form.totalRounds, 1, 20, 1);
    const perRound = clamp(form.perRound, 1, Math.min(50, questions.length), 1);

    setLoading(true);
    try {
      const config = {
        ...buildConfig({ ...form, totalRounds, perRound, scoring, sentences: questions }),
        // ditegaskan di sini supaya tidak bergantung pada versi buildConfig
        totalRounds,
        perRound,
        scoring,
        maxScorePerRound: perRound * (scoring.correct + scoring.timeBonus),
        wordSpeed: toSpeed(form.wordSpeed),
        replays: clamp(form.replays, 0, 99, 3),   // 0 = tanpa batas
        speakLang: form.speakLang || 'en-US',
      };

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
          <button
            type="button"
            onClick={onBack}
            className="text-neutral-400 hover:text-white transition-colors"
          >
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
                  <label className={labelCls}>Password Room</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={form.password ?? ''}
                    onChange={(e) => updateForm('password', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Total Ronde</label>
                    <input
                      type="number" min="1" max="20"
                      value={form.totalRounds ?? 1}
                      onChange={(e) => updateForm('totalRounds', Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Soal per Ronde</label>
                    <input
                      type="number" min="1" max="50"
                      value={form.perRound ?? 1}
                      onChange={(e) => updateForm('perRound', Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>
                <p className="-mt-2 text-xs text-neutral-500">
                  Soal terisi: {filledCount}. Soal per ronde otomatis dibatasi sebanyak itu.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Waktu per Soal</label>
                    <select
                      value={form.timerSeconds ?? 0}
                      onChange={(e) => updateForm('timerSeconds', Number(e.target.value))}
                      className={inputCls}
                    >
                      <option value={0}>Tanpa Waktu</option>
                      <option value={30}>30 Detik</option>
                      <option value={60}>60 Detik</option>
                      <option value={90}>90 Detik</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Kecepatan Kata</label>
                    <select
                      value={form.wordSpeed ?? WORD_SPEED.NORMAL}
                      onChange={(e) => updateForm('wordSpeed', e.target.value)}
                      className={inputCls}
                    >
                      <option value={WORD_SPEED.STILL}>Diam</option>
                      <option value={WORD_SPEED.SLOW}>Lambat</option>
                      <option value={WORD_SPEED.NORMAL}>Normal</option>
                      <option value={WORD_SPEED.FAST}>Cepat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Putar Ulang Audio</label>
                    <select
                      value={form.replays ?? 3}
                      onChange={(e) => updateForm('replays', Number(e.target.value))}
                      className={inputCls}
                    >
                      <option value={1}>1x</option>
                      <option value={3}>3x</option>
                      <option value={5}>5x</option>
                      <option value={0}>Tanpa batas</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Bahasa Suara Pertanyaan</label>
                    <select
                      value={form.speakLang ?? 'en-US'}
                      onChange={(e) => updateForm('speakLang', e.target.value)}
                      className={inputCls}
                    >
                      <option value="en-US">English</option>
                      <option value="id-ID">Indonesia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Poin & Audio */}
            <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-neutral-800 shadow-xl flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-5 border-b border-neutral-800 pb-3">Sistem Poin</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={smallLabelCls}>Benar</label>
                    <input
                      type="number" min="0"
                      value={form.scoring.correct}
                      onChange={(e) => updateForm('scoring', { ...form.scoring, correct: Number(e.target.value) })}
                      className={smallInputCls}
                    />
                  </div>
                  <div>
                    <label className={smallLabelCls}>Salah (Minus)</label>
                    <input
                      type="number" min="0"
                      value={form.scoring.wrong}
                      onChange={(e) => updateForm('scoring', { ...form.scoring, wrong: Number(e.target.value) })}
                      className={smallInputCls}
                    />
                  </div>
                  <div>
                    <label className={smallLabelCls}>Max Bonus Waktu</label>
                    <input
                      type="number" min="0"
                      value={form.scoring.timeBonus}
                      onChange={(e) => updateForm('scoring', { ...form.scoring, timeBonus: Number(e.target.value) })}
                      className={smallInputCls}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-5 border-b border-neutral-800 pb-3">Audio Default</h2>
                <div className="space-y-3">
                  <div>
                    <label className={smallLabelCls}>Musik latar</label>
                    <select
                      value={form.audio.music || ''}
                      onChange={(e) => updateForm('audio', { ...form.audio, music: e.target.value || null })}
                      className={inputCls}
                    >
                      {MUSIC_OPTIONS.map((o) => <option key={o.label} value={o.src}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={smallLabelCls}>Suara jawaban benar</label>
                    <select
                      value={form.audio.success || ''}
                      onChange={(e) => updateForm('audio', { ...form.audio, success: e.target.value || null })}
                      className={inputCls}
                    >
                      {SUCCESS_OPTIONS.map((o) => <option key={o.label} value={o.src}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={smallLabelCls}>Suara jawaban salah</label>
                    <select
                      value={form.audio.fail || ''}
                      onChange={(e) => updateForm('audio', { ...form.audio, fail: e.target.value || null })}
                      className={inputCls}
                    >
                      {FAIL_OPTIONS.map((o) => <option key={o.label} value={o.src}>{o.label}</option>)}
                    </select>
                  </div>
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
import { Plus, X } from 'lucide-react';

const inputCls =
  'w-full bg-[#0a0a0a] text-white border border-neutral-800 rounded-2xl px-5 py-4 focus:border-[#e0ff00] outline-none';
const labelCls = 'block text-sm text-neutral-400 mb-2';

export const emptySentence = () => ({ question: '', text: '', distractors: '' });

// sentences: [{ question, text (= jawaban), distractors }]
export default function SentenceEditor({ sentences, onChange }) {
  const update = (i, patch) =>
    onChange(sentences.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const add = () => onChange([...sentences, emptySentence()]);

  const remove = (i) =>
    onChange(sentences.length > 1 ? sentences.filter((_, idx) => idx !== i) : [emptySentence()]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Daftar Soal Kalimat</h2>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e0ff00] text-black font-bold rounded-xl hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Tambah
        </button>
      </div>

      <div className="space-y-4">
        {sentences.map((s, i) => (
          <div key={i} className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#e0ff00] font-extrabold tracking-wide">KALIMAT {i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Hapus kalimat ${i + 1}`}
                className="text-neutral-500 hover:text-[#ff4d4d] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className={labelCls}>Pertanyaan (dibacakan voice)</label>
              <input
                type="text"
                value={s.question ?? ''}
                onChange={(e) => update(i, { question: e.target.value })}
                placeholder="Contoh: What does she eat every day?"
                autoComplete="off"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Kosongkan untuk membacakan jawaban.
              </p>
            </div>

            <div>
              <label className={labelCls}>Jawaban (kalimat yang disusun)</label>
              <input
                type="text"
                value={s.text ?? ''}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="Contoh: She eats rice every day."
                autoComplete="off"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Pengecoh (pisahkan dengan koma)</label>
              <input
                type="text"
                value={s.distractors ?? ''}
                onChange={(e) => update(i, { distractors: e.target.value })}
                placeholder="Contoh: eat, rices, school"
                autoComplete="off"
                className={inputCls}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
import { X, Plus } from 'lucide-react'; // Pastikan install lucide-react untuk ikon

export default function SentenceEditor({ sentences, onChange }) {
  const updateItem = (index, field, value) => {
    const newData = [...sentences];
    newData[index][field] = value;
    onChange(newData);
  };

  const removeItem = (index) => {
    onChange(sentences.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...sentences, { text: '', distractors: '' }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-white">Daftar Soal Kalimat</h3>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-[#e0ff00] text-black font-bold rounded-xl hover:bg-[#b8d600] transition-colors"
        >
          <Plus size={18} /> Tambah
        </button>
      </div>

      {sentences.map((item, i) => (
        <div 
          key={i} 
          className="p-5 bg-[#121212] rounded-2xl border border-neutral-800 shadow-sm relative group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-[#e0ff00] uppercase tracking-wider">
              Kalimat {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={sentences.length <= 1}
              className="p-2 text-neutral-500 hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-lg transition-colors disabled:opacity-30"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                Teks Kalimat
              </label>
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItem(i, 'text', e.target.value)}
                placeholder="Contoh: She plays football every day."
                className="w-full bg-[#0a0a0a] text-white border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#e0ff00] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                Pengecoh (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={item.distractors}
                onChange={(e) => updateItem(i, 'distractors', e.target.value)}
                placeholder="Contoh: played, school, blue"
                className="w-full bg-[#0a0a0a] text-white border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#e0ff00] transition-colors"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
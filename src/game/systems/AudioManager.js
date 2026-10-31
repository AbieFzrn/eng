// Urutan prioritas voice. Yang pertama ketemu di perangkat akan dipakai.
const PREFERRED_VOICES = [
  'Samantha',
  'Google US English',
  'Google UK English Female',
  'Microsoft Aria',
  'Microsoft Jenny',
];

export class AudioManager {
  constructor(scene, { music = null, musicVolume = 0.5, sfxVolume = 0.8 } = {}) {
    this.scene = scene;
    this.music = music;
    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;

    // Daftar voice di Chrome dimuat async, jadi dengarkan eventnya
    if ('speechSynthesis' in window) {
      this._onVoices = () => {};
      window.speechSynthesis.addEventListener('voiceschanged', this._onVoices);
    }
  }

  playMusic() {
    const { sound, cache } = this.scene;
    if (this.music && cache.audio.exists('bgm')) {
      sound.add('bgm', { loop: true, volume: this.musicVolume }).play();
    }
  }

  playSfx(key) {
    const { sound, cache } = this.scene;
    if (cache.audio.exists(key)) sound.play(key, { volume: this.sfxVolume });
  }

  pickVoice(lang) {
    // Ambil daftar terbaru setiap kali, supaya tidak kosong di panggilan pertama
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.slice(0, 2).toLowerCase();
    const sameLang = voices.filter((v) =>
      v.lang.replace('_', '-').toLowerCase().startsWith(prefix),
    );

    for (const name of PREFERRED_VOICES) {
      const found = sameLang.find((v) => v.name.includes(name));
      if (found) return found;
    }
    return sameLang[0] || null;
  }

  speak(text, lang = 'en-US') {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.7;

    const voice = this.pickVoice(lang);
    if (voice) u.voice = voice;

    window.speechSynthesis.speak(u);
  }

  cancelSpeech() { window.speechSynthesis?.cancel(); }

  stop() {
    this.cancelSpeech();
    if (this._onVoices) {
      window.speechSynthesis.removeEventListener('voiceschanged', this._onVoices);
    }
    this.scene.sound.removeAll();
  }
}
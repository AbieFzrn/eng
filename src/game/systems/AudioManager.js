export class AudioManager {
  constructor(scene, { music = null, musicVolume = 0.5, sfxVolume = 0.8 } = {}) {
    this.scene = scene;
    this.music = music;
    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;
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

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  cancelSpeech() { window.speechSynthesis?.cancel(); }

  stop() {
    this.cancelSpeech();
    this.scene.sound.removeAll();
  }
}
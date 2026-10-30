export class TimerSystem {
  constructor(seconds) {
    this.totalMs = Math.max(0, Number(seconds) || 0) * 1000;
    this.endTime = 0;
  }

  get enabled() {
    return this.totalMs > 0;
  }

  // Menerima atau mengambil startTime dari localStorage agar tahan refresh
  start(startTimeMs) {
    if (!this.enabled) return;

    const storageKey = 'game_timer_end_time';
    let savedEndTime = localStorage.getItem(storageKey);

    if (startTimeMs) {
      // Jika ada parameter waktu dari luar (misal sinkronisasi database)
      this.endTime = startTimeMs + this.totalMs;
      localStorage.setItem(storageKey, this.endTime);
    } else if (savedEndTime) {
      // Jika sudah ada timer yang berjalan sebelum refresh, gunakan itu
      this.endTime = Number(savedEndTime);
    } else {
      // Jika baru pertama kali mulai
      this.endTime = Date.now() + this.totalMs;
      localStorage.setItem(storageKey, this.endTime);
    }
  }

  // Bersihkan localStorage saat ronde selesai/waktu habis
  clear() {
    localStorage.removeItem('game_timer_end_time');
  }

  remainingMs(nowMs) {
    if (!this.enabled) return Infinity;
    const now = nowMs || Date.now();
    return Math.max(0, this.endTime - now);
  }

  seconds(nowMs) {
    return Math.ceil(this.remainingMs(nowMs) / 1000);
  }

  ratio(nowMs) {
    if (!this.enabled) return 0;
    return this.remainingMs(nowMs) / this.totalMs;
  }

  expired(nowMs) {
    const now = nowMs || Date.now();
    return this.enabled && now >= this.endTime;
  }
}
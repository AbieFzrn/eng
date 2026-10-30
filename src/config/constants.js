// Nilai di LIMITS harus selaras dengan database.rules.json.
// Kalau salah satu diubah, ubah juga yang lain lalu deploy ulang rules.

export const MAX_PLAYERS = 10; // = jumlah slot 0-9 di rules

export const ROOM_STATUS = Object.freeze({
  LOBBY: 'lobby',
  PLAYING: 'playing',
  FINISHED: 'finished',
});

export const LIMITS = Object.freeze({
  ROOM_CODE_LENGTH: 6,
  NAME_MAX: 20,            // rules: name <= 20
  PASSWORD_MIN: 4,         // hanya dicek di UI
  ROUNDS_MIN: 1,
  ROUNDS_MAX: 20,          // rules: totalRounds 1..20
  PER_ROUND_MIN: 1,
  PER_ROUND_MAX: 50,       // rules: perRound 1..50
  MAX_SCORE_PER_ROUND: 100000, // rules: maxScorePerRound <= 100000
});

export const WORD_SPEED = Object.freeze({
  STILL: 'still',
  SLOW: 'slow',
  NORMAL: 'normal',
  FAST: 'fast',
});

// Nilai awal form "Buat Room" yang diselaraskan dengan CreateRoomPage dan GamePage.
export const DEFAULT_CONFIG = Object.freeze({
  totalRounds: 3,
  perRound: 5,
  timerSeconds: 60,        // Waktu per ronde (dalam detik, 0 = tanpa waktu)
  wordSpeed: WORD_SPEED.NORMAL,
  replays: 3,              // Batas putar ulang audio (0 = tanpa batas)
  scoring: { 
    correct: 100, 
    wrong: 10, 
    timeBonus: 50 
  },
  audio: { 
    music: null, 
    success: null, 
    fail: null, 
    musicVolume: 0.5, 
    sfxVolume: 0.8 
  },
});

export const COUNTDOWN_SECONDS = 3; // hitung mundur sebelum ronde dimulai

export const STORAGE_KEYS = Object.freeze({
  PREFERENCES: 'esb:preferences',
  CONFIG_DRAFT: 'esb:configDraft',
});
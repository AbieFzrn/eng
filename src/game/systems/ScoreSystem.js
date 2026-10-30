export class ScoreSystem {
  constructor({ correct, wrong, timeBonus }, startScore = 0) {
    this.rules = { correct, wrong, timeBonus };
    this.score = startScore;
  }

  // timeRatio: sisa waktu 0..1 (0 kalau timer mati)
  onCorrect(timeRatio = 0) {
    const bonus = Math.round(this.rules.timeBonus * timeRatio);
    const gain = this.rules.correct + bonus;
    this.score += gain;
    return gain;
  }

  // mengembalikan poin yang benar-benar terpotong (skor tidak pernah di bawah 0)
  onWrong() {
    const before = this.score;
    this.score = Math.max(0, this.score - this.rules.wrong);
    return before - this.score;
  }
}
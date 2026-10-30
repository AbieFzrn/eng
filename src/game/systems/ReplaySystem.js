export class ReplaySystem {
  constructor(max = 3) {
    const n = max === '' || max == null ? NaN : Math.floor(Number(max));
    if (Number.isNaN(n)) this.max = 3;           // kosong / tidak valid -> default
    else this.max = n <= 0 ? Infinity : n;       // 0 = tanpa batas
    this.left = this.max;
  }

  reset() { this.left = this.max; }

  get canUse() { return this.left > 0; }

  use() {
    if (!this.canUse) return false;
    if (Number.isFinite(this.left)) this.left--;
    return true;
  }

  get label() {
    return `Replays: ${Number.isFinite(this.left) ? this.left : '∞'}`;
  }
}
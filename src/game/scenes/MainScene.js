import Phaser from 'phaser';
import { seededShuffle } from '../../utils/seededShuffle.js';
import { isCorrect as isAnswerCorrect } from '../systems/SentenceValidator.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { TimerSystem } from '../systems/TimerSystem.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { AudioManager } from '../systems/AudioManager.js';

// Tinggi virtual game: dibuat pas dengan isi (panel berakhir di ~y=505, ~525 di layar sempit)
// supaya tidak ada ruang kosong di bawah dan tombol tetap terlihat tanpa scroll.
const H = 540;
const GAP = 12;
const FONT = 'Arial, sans-serif';
const TEXT_RES = 2;

const DEFAULT_AUDIO = {
    music: null,
    success: null,
    fail: null,
    musicVolume: 0.5,
    sfxVolume: 0.8,
};

const SPEED_PRESETS = {
    still: 0,
    slow: 0.5,
    normal: 1,
    fast: 1.5,
};

const num = (v, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

const textOf = (x) => (
    typeof x === 'string' ? x : (x?.text ?? '')
);

const CARD_COLORS = [
    0xef4444, 0xf97316, 0xeab308, 0x22c55e,
    0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xd946ef,
];

const COLORS = {
    bg: '#050505',
    panelBg: 0x0f0f0f,
    panelBorder: 0x262626,
    zoneBg: 0x121212,
    zoneLine: 0x404040,
    text: '#ffffff',
    hint: '#a3a3a3',
    good: '#e0ff00',
    bad: '#ff4d4d',
};

const LAYOUT = {
    maxPanelW: 600,
    panelMargin: 20,

    // Susunan vertikal dari atas ke bawah (koordinat virtual, tinggi H = 540).
    // Setiap blok dimulai SETELAH blok di atasnya selesai, jadi tidak saling menimpa.
    headerH: 40,

    infoY: 46,        // bar info (Soal & Waktu)
    infoH: 32,

    replayY: 84,      // kartu replay (tombol Dengar + sisa replay)
    replayH: 36,

    panelY: 128,      // panel utama dimulai di bawah kartu replay
    scoreOffset: 16,  // jarak skor dari tepi atas panel
    zoneOffset: 32,   // jarak zona drop dari tepi atas panel
    zoneH: 95,
    zoneHCompact: 115,

    floatGap: 10,     // jarak zona drop -> area kartu melayang
    floatH: 140,

    // Tombol langsung di bawah area kartu (tanpa ruang kosong di antaranya),
    // lalu teks feedback di bawah tombol.
    btnGap: 14,       // jarak area kartu -> sisi atas tombol
    btnHalfH: 12,     // setengah tinggi tombol (perkiraan)
    feedbackGap: 10,  // jarak sisi bawah tombol -> teks feedback
    feedbackH: 44,    // ruang feedback (2 baris; baris ke-3 masih muat di margin)
    panelPadBottom: 8,

    rowStep: 36,
    rowOffset: 22,
    maxRows: 2,

    cardFont: 16,
    padX: 16,
    padY: 8,

    btn: {
        fontSize: 13,
        padX: 14,
        padY: 7,
    },
};

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init(data = {}) {
        const sentences = data.sentences ?? [];

        const wordSpeed = data.wordSpeed in SPEED_PRESETS
            ? SPEED_PRESETS[data.wordSpeed]
            : num(data.wordSpeed, 1);

        this.settings = {
            ...data,
            rounds: num(data.rounds, sentences.length || 1),
            timerSeconds: num(data.timerSeconds, 0),
            wordSpeed,

            scoring: {
                correct: num(data.scoring?.correct, 100),
                wrong: num(data.scoring?.wrong, 10),
                timeBonus: num(data.scoring?.timeBonus, 50),
            },

            audio: {
                ...DEFAULT_AUDIO,
                ...data.audio,
                musicVolume: num(
                    data.audio?.musicVolume,
                    DEFAULT_AUDIO.musicVolume
                ),
                sfxVolume: num(
                    data.audio?.sfxVolume,
                    DEFAULT_AUDIO.sfxVolume
                ),
            },
        };

        const s = this.settings;

        this.queue = seededShuffle(
            sentences.map((q) => ({
                ...q,
                words: q.words ?? [],
                distractors: q.distractors ?? [],
            })),
            s.seed,
        ).slice(0, s.rounds);

        this.total = this.queue.length;
        this.round = num(data.startIndex, 0);
        this.roundActive = false;

        this.sentenceText = '';
        this.target = [];
        this.endObjs = [];

        this.endOverlay = null;
        this.endPanel = null;
        this.endModalSize = null;

        this.scorer = new ScoreSystem(
            s.scoring,
            num(data.startScore, 0)
        );

        this.timer = new TimerSystem(s.timerSeconds);

        this.replays = new ReplaySystem(data.replays ?? 3);

        this.player = {
            score: this.scorer.score,
            done: false,
            placed: [],
            history: [],
            floatRect: new Phaser.Geom.Rectangle(),
        };
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        this.applyViewport();
        this.makeConfettiTexture();
        this.buildStaticUI();

        this.cardGroup = this.physics.add.group();

        this.setupDragHandlers();

        this.audio = new AudioManager(
            this,
            this.settings.audio
        );

        this.audio.playMusic();

        this.scale.on('resize', this.onResize, this);

        const cleanup = () => {
            this.audio?.cancelSpeech();
            this.scale?.off('resize', this.onResize, this);
        };

        this.events.once('shutdown', () => {
            cleanup();
            this.audio?.stop();
        });

        this.events.once('destroy', cleanup);

        if (this.round >= this.total) {
            this.updateHud();
            this.showEnd();
        } else {
            this.startRound();
        }
    }

    // ==========================================
    // TATA LETAK & VIEWPORT RESPONSIF
    // ==========================================

    applyViewport() {
        const zoom = this.scale.height / H;

        this.W = this.scale.width / zoom;
        
        // Skala UI adaptif berdasarkan lebar layar agar tidak terlalu besar
        this.uiScale = Phaser.Math.Clamp(
            this.W / 750,
            0.65,
            1
        );

        const margin = this.W < 500 ? 10 : LAYOUT.panelMargin;

        const panelW = Math.min(
            this.W - margin * 2,
            LAYOUT.maxPanelW
        );

        const x = (this.W - panelW) / 2;
        const compact = this.W < 560;

        // Semua blok dihitung berurutan dari atas agar tidak pernah saling menimpa,
        // termasuk saat zona drop lebih tinggi di layar sempit (compact).
        const panelY = LAYOUT.panelY;
        const zoneY = panelY + LAYOUT.zoneOffset;
        const zoneH = compact ? LAYOUT.zoneHCompact : LAYOUT.zoneH;
        const floatY = zoneY + zoneH + LAYOUT.floatGap;
        const btnY = floatY + LAYOUT.floatH + LAYOUT.btnGap + LAYOUT.btnHalfH;
        const feedbackY = btnY + LAYOUT.btnHalfH + LAYOUT.feedbackGap;
        const panelH = feedbackY + LAYOUT.feedbackH + LAYOUT.panelPadBottom - panelY;

        this.player.panel = {
            x,
            y: panelY,
            w: panelW,
            h: panelH,
        };

        this.player.zone = {
            x: x + 10,
            y: zoneY,
            w: panelW - 20,
            h: zoneH,
        };

        this.player.floatBox = {
            x: x + 10,
            y: floatY,
            w: panelW - 20,
            h: LAYOUT.floatH,
        };

        this.player.feedbackY = feedbackY;
        this.player.btnY = btnY;

        this.player.floatRect.setTo(
            this.player.floatBox.x,
            this.player.floatBox.y,
            this.player.floatBox.w,
            this.player.floatBox.h
        );

        this.player.startX = this.player.zone.x + 10;
        this.player.endX = this.player.zone.x + this.player.zone.w - 10;

        this.compactLayout = compact;

        this.cameras.main
            .setZoom(zoom)
            .centerOn(this.W / 2, H / 2);

        this.physics.world.setBounds(
            0,
            floatY,
            this.W,
            LAYOUT.floatH
        );
    }

    onResize() {
        // Simpan area kartu sebelum resize (applyViewport membuat objek floatBox baru).
        const prev = this.player.floatBox;

        this.applyViewport();
        this.layoutUI();
        this.layoutPlaced();

        const f = this.player.floatBox;

        this.cardGroup.getChildren().forEach((card) => {
            if (card.inZone) return;

            // Petakan posisi kartu secara proporsional ke area yang baru. Sekadar di-clamp
            // akan menumpuk semua kartu di tepi kiri kalau panel bergeser saat resize.
            const u = prev.w > 0 ? (card.x - prev.x) / prev.w : 0.5;
            const v = prev.h > 0 ? (card.y - prev.y) / prev.h : 0.5;

            card.x = Phaser.Math.Clamp(
                f.x + u * f.w,
                f.x + card.cardW / 2,
                f.x + f.w - card.cardW / 2
            );

            card.y = Phaser.Math.Clamp(
                f.y + v * f.h,
                f.y + card.cardH / 2,
                f.y + f.h - card.cardH / 2
            );

            // Jangan pakai body.reset(): itu menolkan kecepatan sehingga kartu berhenti
            // bergerak sampai di-drag lagi.
            this.syncBody(card);
        });

        if (this.endOverlay) {
            this.endOverlay.clear();
            this.endOverlay.fillStyle(0x000000, 0.75);
            this.endOverlay.fillRect(0, 0, this.W, H);
        }

        if (this.endObjs.length && this.endModalSize) {
            this.endObjs[0].setPosition(this.W / 2, H / 2);
        }
    }

    // ==========================================
    // PEMBUATAN UI & KOMPONEN TEKS
    // ==========================================

    label(x, y, text, style) {
        return this.add.text(x, y, text, {
            resolution: TEXT_RES,
            ...style,
        });
    }

    makeButton(
        x,
        y,
        labelText,
        bgColor,
        textColor,
        onClick,
        opts = {}
    ) {
        const {
            width = null,
            fontSize = 15,
            padX = 28,
            padY = 14,
        } = opts;

        const txt = this.label(0, 0, labelText, {
            fontFamily: FONT,
            fontSize: `${fontSize}px`,
            fontStyle: 'bold',
            color: textColor,
        }).setOrigin(0.5);

        const w = width ?? txt.width + padX;
        const h = txt.height + padY;
        const r = Math.min(12, h / 2);

        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.4);
        shadow.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, r);

        const bg = this.add.graphics();
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);

        const container = this.add.container(x, y, [shadow, bg, txt]);
        container.setSize(w, h);
        container.setInteractive({ useHandCursor: true });

        // Skala dasar tombol; hover/out kembali ke nilai ini (bukan selalu 1)
        // supaya tombol yang sudah diperkecil oleh layout tidak "melompat" membesar.
        container.baseScale = 1;

        let pressed = false;

        const release = () => {
            if (!pressed) return;
            pressed = false;
            container.y -= 2;
            shadow.y += 2;
        };

        container.on('pointerdown', () => {
            pressed = true;
            container.y += 2;
            shadow.y -= 2;
            onClick();
        });

        container.on('pointerup', release);
        container.on('pointerout', () => {
            release();
            this.tweens.add({ targets: container, scale: container.baseScale, duration: 100 });
        });
        container.on('pointerover', () => {
            this.tweens.add({ targets: container, scale: container.baseScale * 1.03, duration: 100 });
        });

        return container;
    }

    setButtonScale(button, scale) {
        this.tweens.killTweensOf(button);
        button.baseScale = scale;
        button.setScale(scale);
    }

    buildStaticUI() {
        this.bg = this.add.graphics();

        const white = {
            fontFamily: FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff',
        };

        this.titleText = this.label(0, 0, 'Sentence Builder', {
            ...white,
            fontSize: '16px',
            color: '#e0ff00',
        }).setOrigin(0, 0.5);

        this.roundText = this.label(0, 0, '', white).setOrigin(0.5);
        this.timerText = this.label(0, 0, '', white).setOrigin(0.5);

        const small = {
            fontSize: 12,
            padX: 14,
            padY: 6,
        };

        this.btnQuit = this.makeButton(
            0, 0, 'Keluar', 0xff4d4d, '#ffffff',
            () => this.settings.onQuit?.(),
            small
        );

        // Tombol dengar kalimat di dalam card gabungan
        this.listenBtn = this.makeButton(
            0, 0, '🔊 Dengar', 0x3b82f6, '#ffffff',
            () => this.replayAudio(),
            { width: 130, fontSize: 13, padY: 8 }
        );

        this.replayText = this.label(0, 0, '', {
            fontFamily: FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            color: COLORS.hint,
        }).setOrigin(1, 0.5);

        this.buildPlayerUI();
        this.layoutUI();
    }

    layoutUI() {
        const W = this.W;
        const g = this.bg;

        g.clear();

        const p = this.player;
        const { panel, zone, floatBox: f } = p;
        const compact = this.compactLayout;

        // Header game atas (judul + tombol keluar)
        g.fillStyle(0x0f0f0f, 1);
        g.fillRect(0, 0, W, LAYOUT.headerH);

        // Bar info (Soal & Waktu) — selebar panel agar satu kolom rapi
        const barX = panel.x;
        const barW = panel.w;
        const barY = LAYOUT.infoY;
        const barH = LAYOUT.infoH;

        g.fillStyle(0x0f0f0f, 1);
        g.fillRoundedRect(barX, barY, barW, barH, barH / 2);
        g.lineStyle(1.5, 0x262626, 1);
        g.strokeRoundedRect(barX, barY, barW, barH, barH / 2);

        // Garis pemisah tipis antara "Soal" dan "Waktu"
        g.lineStyle(1, 0x262626, 1);
        g.lineBetween(W / 2, barY + 8, W / 2, barY + barH - 8);

        // Kartu replay (tombol Dengar + sisa replay) — juga selebar panel
        const replayBoxX = panel.x;
        const replayBoxW = panel.w;
        const replayBoxY = LAYOUT.replayY;
        const replayBoxH = LAYOUT.replayH;

        g.fillStyle(0x121212, 1);
        g.fillRoundedRect(replayBoxX, replayBoxY, replayBoxW, replayBoxH, 10);
        g.lineStyle(1.5, 0x262626, 1);
        g.strokeRoundedRect(replayBoxX, replayBoxY, replayBoxW, replayBoxH, 10);

        // Panel utama game
        g.fillStyle(COLORS.panelBg, 1);
        g.fillRoundedRect(panel.x, panel.y, panel.w, panel.h, 14);
        g.lineStyle(1.5, COLORS.panelBorder, 1);
        g.strokeRoundedRect(panel.x, panel.y, panel.w, panel.h, 14);

        // Zone area (Tempat drop kata)
        g.fillStyle(COLORS.zoneBg, 1);
        g.fillRect(zone.x, zone.y, zone.w, zone.h);
        this.dashedRect(zone, COLORS.zoneLine);

        // Float area (Kotak kata melayang)
        g.fillStyle(COLORS.zoneBg, 1);
        g.fillRoundedRect(f.x, f.y, f.w, f.h, 10);
        g.lineStyle(1.5, COLORS.zoneLine, 1);
        g.strokeRoundedRect(f.x, f.y, f.w, f.h, 10);

        // Skor di pojok kanan atas panel (di atas zona drop, tidak menyentuh border)
        p.scoreText.setPosition(panel.x + panel.w - 18, panel.y + LAYOUT.scoreOffset);

        p.zoneLabel.setPosition(zone.x + zone.w / 2, zone.y + zone.h / 2);
        p.feedback.setPosition(panel.x + panel.w / 2, p.feedbackY).setWordWrapWidth(panel.w - 24);

        // Tombol UNDO / CLEAR / CEK di bagian bawah panel
        const buttonScale = Phaser.Math.Clamp(panel.w / 450, 0.7, 1);
        const step = Math.min(130, panel.w / 3.2);

        p.buttons.forEach((b, i) => {
            this.setButtonScale(b, buttonScale);
            b.setPosition(panel.x + panel.w / 2 + (i - 1) * step, p.btnY);
        });

        // Header: judul kiri, tombol keluar kanan
        const headerMidY = LAYOUT.headerH / 2;

        this.titleText.setPosition(12, headerMidY).setScale(compact ? 0.8 : 0.9);

        this.setButtonScale(this.btnQuit, compact ? 0.7 : 0.8);
        this.btnQuit.setPosition(W - this.btnQuit.displayWidth / 2 - 10, headerMidY);

        // Bar info: "Soal" di separuh kiri, "Waktu" di separuh kanan
        const barMidY = barY + barH / 2;
        const infoScale = compact ? 0.9 : 1;

        this.roundText.setPosition(barX + barW * 0.25, barMidY).setScale(infoScale);
        this.timerText.setPosition(barX + barW * 0.75, barMidY).setScale(infoScale);

        // Kartu replay: tombol Dengar di kiri, sisa replay rata kanan
        const replayMidY = replayBoxY + replayBoxH / 2;
        const replayScale = compact ? 0.9 : 1;

        this.setButtonScale(this.listenBtn, replayScale);
        this.listenBtn.setPosition(replayBoxX + 12 + this.listenBtn.displayWidth / 2, replayMidY);

        this.replayText
            .setPosition(replayBoxX + replayBoxW - 16, replayMidY)
            .setScale(replayScale);

        this.endObjs.forEach((obj) => {
            obj.setX(W / 2);
        });
    }

    buildPlayerUI() {
        const p = this.player;

        p.scoreText = this.label(
            0,
            0,
            '',
            {
                fontFamily: FONT,
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#e0ff00',
            }
        ).setOrigin(1, 0.5);

        p.zoneLabel = this.label(
            0,
            0,
            'Tarik kata ke area ini...',
            {
                fontFamily: FONT,
                fontSize: '15px',
                fontStyle: 'italic',
                color: '#525252',
            }
        ).setOrigin(0.5);

        p.feedback = this.label(
            0,
            0,
            '',
            {
                fontFamily: FONT,
                fontSize: '14px',
                fontStyle: 'bold',
                color: COLORS.text,
                align: 'center',
                wordWrap: { width: 360 },
            }
        ).setOrigin(0.5, 0);

        p.buttons = [
            this.makeButton(0, 0, '↩ UNDO', 0x3b82f6, '#ffffff', () => this.undoLast(), LAYOUT.btn),
            this.makeButton(0, 0, '✖ CLEAR', 0xef4444, '#ffffff', () => this.clearAll(), LAYOUT.btn),
            this.makeButton(0, 0, '✔ CEK JAWABAN', 0xe0ff00, '#000000', () => this.checkAnswer(), LAYOUT.btn),
        ];
    }

    dashedRect(r, color) {
        const g = this.bg;
        g.lineStyle(1.5, color, 1);
        g.strokeRect(r.x, r.y, r.w, r.h);
    }

    

    updateHud() {
        this.roundText.setText(`Soal ${Math.min(this.round, this.total)}/${this.total}`);
        this.player.scoreText.setText(`${this.player.score} PTS`);

        if (!this.timer.enabled) {
            this.timerText.setText('Tanpa timer');
        }
    }

    setFeedback(message, color = COLORS.text) {
        this.player.feedback.setText(message).setColor(color);
    }

    // ==========================================
    // LOGIKA PERMAINAN UTAMA
    // ==========================================

    update(time, delta) {
        if (!this.roundActive || !this.timer.enabled) {
            return;
        }

        const secs = this.timer.seconds();

        if (secs !== this.lastSecs) {
            this.lastSecs = secs;

            this.timerText
                .setText(`Waktu: ${secs}s`)
                .setColor(secs <= 10 ? '#ff4d4d' : '#ffffff');
        }

        if (this.timer.expired()) {
            this.endRound('timeout');
        }
    }

    startRound() {
        this.round++;

        this.clearCards();
        this.setFeedback('');

        this.lastSecs = null;

        this.replays.reset();
        this.refreshReplayUI();

        const item = this.queue[this.round - 1];

        if (!item) {
            this.setFeedback('Soal tidak ditemukan.', COLORS.bad);
            return;
        }

        this.sentenceText = item.text;
        this.questionText = item.question?.trim() || item.text;
        this.target = item.words.map(textOf);

        const cardsData = Phaser.Utils.Array.Shuffle([
            ...item.words.map(textOf),
            ...item.distractors.map(textOf),
        ]);

        this.player.placed = [];
        this.player.history = [];
        this.player.done = false;

        cardsData.forEach((word) => {
            const card = this.createCard(word);
            const spot = this.randomFreeSpot(card);

            this.floatCard(card, spot.x, spot.y);
        });

        this.timer.start();
        this.roundActive = true;

        this.updateHud();

        this.time.delayedCall(400, () => this.speak());
    }

    checkAnswer() {
        if (!this.roundActive || this.player.done) {
            return;
        }

        if (this.player.placed.length === 0) {
            this.setFeedback('Susun kata dulu ke area target.', COLORS.hint);
            return;
        }

        const answer = this.player.placed.map((card) => card.word);

        if (isAnswerCorrect(this.target, answer)) {
            const gain = this.scorer.onCorrect(this.timer.ratio());

            this.player.score = this.scorer.score;
            this.player.done = true;

            this.playSfx('sfx-success');
            this.setFeedback(`Benar! +${gain} poin`, COLORS.good);

            this.confetti();
            this.updateHud();

            this.endRound('done');
        } else {
            const lost = this.scorer.onWrong();

            this.player.score = this.scorer.score;

            this.updateHud();
            this.playSfx('sfx-fail');

            this.setFeedback(
                lost > 0 ? `Belum tepat. -${lost} poin` : 'Belum tepat. Coba lagi!',
                COLORS.bad
            );

            this.cameras.main.shake(250, 0.006);
        }
    }

    endRound(reason) {
        this.roundActive = false;
        this.timer.clear();

        if (reason === 'timeout') {
            this.playSfx('sfx-fail');
            this.player.done = true;

            this.setFeedback(
                `Waktu habis.\nJawaban: ${this.sentenceText}`,
                COLORS.bad
            );
        }

        this.updateHud();

        this.settings.onProgress?.({
            index: this.round,
            score: this.player.score,
        });

        const delay = reason === 'done' ? 1800 : 3000;

        this.time.delayedCall(delay, () => {
            if (this.round >= this.total) {
                this.showEnd();
            } else {
                this.startRound();
            }
        });
    }

    showEnd() {
        this.clearCards();
        this.setFeedback('');

        this.listenBtn.setVisible(false);
        this.replayText.setVisible(false);

        this.player.buttons.forEach((button) => {
            button.setVisible(false);
        });

        const W = this.W;
        const compact = this.compactLayout;

        const pw = Math.min(W - 32, 420);
        const ph = compact ? 220 : 250;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, W, H);

        const panelGfx = this.add.graphics();
        panelGfx.fillStyle(0x0f0f0f, 1);
        panelGfx.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 20);

        panelGfx.lineStyle(2.5, 0xe0ff00, 1);
        panelGfx.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 20);

        const title = this.label(0, -ph / 2 + 38, 'Selesai!', {
            fontFamily: FONT,
            fontSize: compact ? '28px' : '36px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);

        const total = this.label(0, 0, `Skor Akhir Kamu:\n${this.player.score}`, {
            fontFamily: FONT,
            fontSize: compact ? '20px' : '24px',
            color: '#e0ff00',
            align: 'center',
            lineSpacing: 4,
        }).setOrigin(0.5);

        const wait = this.label(0, ph / 2 - 32, 'Menunggu host mengakhiri ronde...', {
            fontFamily: FONT,
            fontSize: compact ? '11px' : '14px',
            color: COLORS.hint,
            align: 'center',
        }).setOrigin(0.5);

        this.endOverlay = overlay;
        this.endPanel = panelGfx;

        const container = this.add.container(W / 2, H / 2, [
            panelGfx,
            title,
            total,
            wait,
        ]).setDepth(21);

        overlay.setDepth(20);

        this.endObjs = [container];
        this.endModalSize = { pw, ph };
    }

    // ==========================================
    // SISTEM KARTU & DRAG DROP
    // ==========================================

    createCard(word) {
        const txt = this.label(0, 0, word, {
            fontFamily: FONT,
            fontSize: `${Math.round(LAYOUT.cardFont * this.uiScale)}px`,
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);

        const w = txt.width + LAYOUT.padX * this.uiScale;
        const h = txt.height + LAYOUT.padY * this.uiScale;

        const randomBgColor = Phaser.Utils.Array.GetRandom(CARD_COLORS);
        const bg = this.add.graphics();

        const container = this.add.container(0, 0, [bg, txt]);
        container.setSize(w, h);

        container.word = word;
        container.inZone = false;
        container.bgGfx = bg;
        container.cardW = w;
        container.cardH = h;
        container.baseColor = randomBgColor;

        this.updateCardBg(container, false);

        container.setInteractive({ useHandCursor: true });
        this.input.setDraggable(container);
        this.cardGroup.add(container);

        container.body.setAllowGravity(false);
        container.body.setCollideWorldBounds(true);
        container.body.setBoundsRectangle(this.player.floatRect);
        container.body.setBounce(1, 1);
        container.body.enable = true;

        return container;
    }

    updateCardBg(card, isPlaced) {
        card.bgGfx.clear();
        card.bgGfx.fillStyle(card.baseColor, 1);
        card.bgGfx.fillRoundedRect(
            -card.cardW / 2,
            -card.cardH / 2,
            card.cardW,
            card.cardH,
            10
        );

        if (isPlaced) {
            card.bgGfx.lineStyle(3, 0xe0ff00, 1);
        } else {
            card.bgGfx.lineStyle(1.5, 0xffffff, 0.4);
        }

        card.bgGfx.strokeRoundedRect(
            -card.cardW / 2,
            -card.cardH / 2,
            card.cardW,
            card.cardH,
            10
        );
    }

    randomFreeSpot(card) {
        const f = this.player.floatBox;

        const others = this.cardGroup
            .getChildren()
            .filter((other) => other !== card && !other.inZone);

        const minX = f.x + card.cardW / 2 + 4;
        const maxX = Math.max(minX, f.x + f.w - card.cardW / 2 - 4);

        let spot = {
            x: minX,
            y: f.y + card.cardH / 2 + 4,
        };

        for (let i = 0; i < 25; i++) {
            spot = {
                x: Phaser.Math.Between(minX, maxX),
                y: Phaser.Math.Between(
                    f.y + card.cardH / 2 + 4,
                    f.y + f.h - card.cardH / 2 - 4
                ),
            };

            const rect = new Phaser.Geom.Rectangle(
                spot.x - card.cardW / 2,
                spot.y - card.cardH / 2,
                card.cardW,
                card.cardH
            );

            const overlaps = others.some((other) => {
                return Phaser.Geom.Intersects.RectangleToRectangle(
                    rect,
                    new Phaser.Geom.Rectangle(
                        other.x - other.cardW / 2,
                        other.y - other.cardH / 2,
                        other.cardW,
                        other.cardH
                    )
                );
            });

            if (!overlaps) break;
        }

        return spot;
    }

    // Selaraskan body fisika dengan posisi kartu saat ini TANPA mengubah kecepatannya.
    // body.reset() menolkan kecepatan, dan untuk Container ia menaruh body di (x, y) sebagai
    // sudut kiri-atas (bukan tengah), jadi kotak tabrakan bergeser setengah ukuran kartu.
    syncBody(card) {
        const body = card.body;
        if (!body) return;

        body.updateFromGameObject();
        body.prev.copy(body.position);
        body.prevFrame.copy(body.position);
    }

    floatCard(card, x, y, animate = false) {
        card.inZone = false;
        this.updateCardBg(card, false);

        const launch = () => {
            if (!card.active || !card.body) return;

            // Pastikan titik luncur masih di dalam area kartu saat ini
            // (layar bisa berubah ukuran selama animasi berjalan).
            const f = this.player.floatBox;

            x = Phaser.Math.Clamp(x, f.x + card.cardW / 2, f.x + f.w - card.cardW / 2);
            y = Phaser.Math.Clamp(y, f.y + card.cardH / 2, f.y + f.h - card.cardH / 2);

            card.setPosition(x, y);
            card.body.enable = true;
            card.body.stop();
            this.syncBody(card);
            card.body.setAllowGravity(false);

            const speed = 80 * this.settings.wordSpeed;
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

            card.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        };

        if (animate) {
            this.tweens.add({
                targets: card,
                x,
                y,
                duration: 220,
                ease: 'Power2',
                onComplete: launch,
            });
        } else {
            launch();
        }
    }

    setupDragHandlers() {
        this.input.on('dragstart', (pointer, card) => {
            if (!this.roundActive || this.player.done) return;

            this.tweens.killTweensOf(card);
            card.setDepth(10);
            card.body.enable = false;

            if (card.inZone) {
                this.removeFromZone(card);
                this.layoutPlaced();
            }
        });

        this.input.on('drag', (pointer, card, dragX, dragY) => {
            if (!this.roundActive || this.player.done) return;
            card.setPosition(dragX, dragY);
        });

        this.input.on('dragend', (pointer, card) => {
            if (!this.roundActive || this.player.done) return;

            card.setDepth(0);
            const z = this.player.zone;

            const inside =
                card.x >= z.x &&
                card.x <= z.x + z.w &&
                card.y >= z.y &&
                card.y <= z.y + z.h;

            if (inside) {
                this.placeInZone(card);
            } else {
                const f = this.player.floatBox;

                const x = Phaser.Math.Clamp(
                    card.x,
                    f.x + card.cardW / 2,
                    f.x + f.w - card.cardW / 2
                );

                const y = Phaser.Math.Clamp(
                    card.y,
                    f.y + card.cardH / 2,
                    f.y + f.h - card.cardH / 2
                );

                card.setPosition(x, y);
                this.floatCard(card, x, y);
            }
        });
    }

    placeInZone(card) {
        card.inZone = true;
        card.body.enable = false;
        this.updateCardBg(card, true);

        const dropRow = Phaser.Math.Clamp(
            Math.floor((card.y - this.player.zone.y - 4) / LAYOUT.rowStep),
            0,
            LAYOUT.maxRows - 1
        );

        let index = this.player.placed.length;

        for (let i = 0; i < this.player.placed.length; i++) {
            const other = this.player.placed[i];

            if (
                other.slotRow > dropRow ||
                (other.slotRow === dropRow &&
                    other.slotX + other.cardW / 2 > card.x)
            ) {
                index = i;
                break;
            }
        }

        this.player.placed.splice(index, 0, card);
        this.player.history.push(card);

        this.layoutPlaced();
    }

    removeFromZone(card) {
        this.player.placed = this.player.placed.filter((item) => item !== card);
        this.player.history = this.player.history.filter((item) => item !== card);
        card.inZone = false;
    }

    layoutPlaced() {
        let x = this.player.startX;
        let row = 0;

        this.player.placed.forEach((card) => {
            if (x > this.player.startX && x + card.cardW > this.player.endX) {
                row = Math.min(row + 1, LAYOUT.maxRows - 1);
                x = this.player.startX;
            }

            card.slotRow = row;
            card.slotX = x;

            this.tweens.killTweensOf(card);
            this.tweens.add({
                targets: card,
                x: x + card.cardW / 2,
                y: this.player.zone.y + LAYOUT.rowOffset + row * LAYOUT.rowStep,
                duration: 150,
                ease: 'Power2',
            });

            x += card.cardW + GAP;
        });
    }

    undoLast() {
        if (!this.roundActive || this.player.done) return;

        const card = this.player.history[this.player.history.length - 1];
        if (!card) return;

        this.removeFromZone(card);
        this.layoutPlaced();

        const spot = this.randomFreeSpot(card);
        this.floatCard(card, spot.x, spot.y, true);
    }

    clearAll() {
        if (!this.roundActive || this.player.done) return;

        [...this.player.placed].forEach((card) => {
            this.removeFromZone(card);
            const spot = this.randomFreeSpot(card);
            this.floatCard(card, spot.x, spot.y, true);
        });
    }

    clearCards() {
        if (!this.cardGroup) return;

        this.cardGroup.getChildren().forEach((card) => {
            this.tweens.killTweensOf(card);
        });

        this.cardGroup.clear(true, true);
    }

    // ==========================================
    // AUDIO, TTS & EFEK VISUAL
    // ==========================================

    playSfx(key) {
        this.audio?.playSfx(key);
    }

    speak() {
        if (!this.roundActive) return;
        this.audio?.speak(this.questionText, this.settings.speakLang);
    }

    replayAudio() {
        if (!this.roundActive) return;

        if (this.replays.use()) {
            this.speak();
            this.refreshReplayUI();
        }
    }

    refreshReplayUI() {
        this.replayText.setText(this.replays.label);
        this.listenBtn.setAlpha(this.replays.canUse ? 1 : 0.5);
    }

    makeConfettiTexture() {
        if (this.textures.exists('confetti')) return;

        const gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 1);
        gfx.fillRect(0, 0, 8, 8);
        gfx.generateTexture('confetti', 8, 8);
        gfx.destroy();
    }

    confetti() {
        const emitter = this.add.particles(
            this.player.panel.x + this.player.panel.w / 2,
            this.player.feedbackY,
            'confetti',
            {
                speed: { min: 150, max: 350 },
                angle: { min: 220, max: 320 },
                gravityY: 300,
                lifespan: 1800,
                scale: { start: 1, end: 0 },
                tint: [0xe0ff00, 0xffffff, 0x4ade80, 0x3b82f6],
                emitting: false,
            }
        );

        emitter.explode(40);
        this.time.delayedCall(2000, () => emitter.destroy());
    }
}
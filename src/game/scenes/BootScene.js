import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    init(data) {
        this.settings = data ?? {};   // preload() tidak menerima data, jadi simpan di sini
    }

    preload() {
        const { width, height } = this.cameras.main;
        const k = height / 600;       // 600 = DESIGN_H di phaserConfig.js

        this.add.text(width / 2, height / 2, 'MEMUAT ASET...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${Math.round(24 * k)}px`,
            fontStyle: 'bold',
            color: '#e0ff00',         // neon, cocok dengan latar #050505
        }).setOrigin(0.5);

        const { music, success, fail } = this.settings.audio ?? {};
        if (music) this.load.audio('bgm', music);
        if (success) this.load.audio('sfx-success', success);
        if (fail) this.load.audio('sfx-fail', fail);
    }

    create() {
        // Setelah preload selesai, oper settings ke MainScene
        this.scene.start('MainScene', this.settings);
    }
}
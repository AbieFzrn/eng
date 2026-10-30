import Phaser from 'phaser';

export default class AnswerArea extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height) {
        super(scene, x, y);
        
        this.areaWidth = width;
        this.areaHeight = height;
        this.setSize(width, height);

        // Grafik latar belakang area
        this.bgGfx = scene.add.graphics();
        this.drawZone(false);

        // Teks instruksi di tengah area
        this.label = scene.add.text(width / 2, height / 2, 'Tarik kata ke area ini...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'italic',
            color: '#525252'
        }).setOrigin(0.5);

        this.add([this.bgGfx, this.label]);
        scene.add.existing(this);
    }

    // Ubah warna garis batas jika kartu sedang di-drag di atasnya (hover effect)
    drawZone(isHovered) {
        this.bgGfx.clear();
        
        this.bgGfx.fillStyle(0x121212, 1);
        this.bgGfx.fillRect(0, 0, this.areaWidth, this.areaHeight);
        
        this.bgGfx.lineStyle(2, isHovered ? 0xe0ff00 : 0x404040, 1);
        this.bgGfx.strokeRect(0, 0, this.areaWidth, this.areaHeight);
    }

    // Utilitas untuk mengecek apakah kordinat x,y berada di dalam kotak ini
    contains(x, y) {
        return x >= this.x && x <= this.x + this.areaWidth &&
               y >= this.y && y <= this.y + this.areaHeight;
    }

    // Sembunyikan teks instruksi saat sudah ada kartu di dalamnya
    setHasCards(hasCards) {
        this.label.setVisible(!hasCards);
    }
}
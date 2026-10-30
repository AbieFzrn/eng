import Phaser from 'phaser';

const FONT = 'Arial, sans-serif';

export default class WordCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, wordText, baseColor, floatRect) {
    super(scene, x, y);

    this.word = wordText;
    this.baseColor = baseColor;
    this.inZone = false;

    // Teks Kartu
    const txt = scene.add.text(0, 0, this.word, {
      fontFamily: FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
      resolution: 2,
    }).setOrigin(0.5);

    // Padding (padX = 24, padY = 14) 
    this.cardW = txt.width + 24;
    this.cardH = txt.height + 14;

    // Latar Belakang Kartu
    this.bgGfx = scene.add.graphics();
    this.drawBg(false);

    this.add([this.bgGfx, txt]);
    this.setSize(this.cardW, this.cardH);

    // Aktifkan Fisika
    scene.physics.world.enable(this);
    this.body.setCollideWorldBounds(true);
    if (floatRect) this.body.setBoundsRectangle(floatRect);
    this.body.setBounce(1, 1);

    // Interaksi Pointer
    this.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(this);

    scene.add.existing(this);
  }

  drawBg(isPlaced) {
    this.bgGfx.clear();
    this.bgGfx.fillStyle(this.baseColor, 1);
    this.bgGfx.fillRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, 14);

    if (isPlaced) {
      this.bgGfx.lineStyle(4, 0xe0ff00, 1); // Neon green/yellow saat masuk zona
    } else {
      this.bgGfx.lineStyle(2, 0xffffff, 0.5);
    }
    this.bgGfx.strokeRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, 14);
  }

  launch(speed) {
    this.inZone = false;
    this.drawBg(false);
    this.body.enable = true;
    this.body.setVelocity(
      Phaser.Math.Between(-speed, speed),
      Phaser.Math.Between(-speed, speed)
    );
  }
}

import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

// Ruang desain dari prototipe asli
const DESIGN_H = 600;
const RENDER_SCALE = 2;
const MIN_ASPECT = 0.65;
const MAX_ASPECT = 2.4;

// Variabel global dalam scope modul
let gameInstance = null;
let resizeObserver = null;
let resizeTimer = null;

function computeGameSize(el) {
    const { width, height } = el.getBoundingClientRect();

    const aspect = width > 0 && height > 0
        ? width / height
        : 4 / 3;

    const clamped = Math.min(
        MAX_ASPECT,
        Math.max(MIN_ASPECT, aspect)
    );

    return {
        width: Math.round(DESIGN_H * clamped) * RENDER_SCALE,
        height: DESIGN_H * RENDER_SCALE,
    };
}

export function stopGame() {
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
        resizeTimer = null;
    }

    if (gameInstance) {
        gameInstance.destroy(true);
        gameInstance = null;
    }
}

// Parameter: startGame(settings, ref.current)
export function startGame(settings, parentElement) {
    // Hancurkan instance lama untuk mencegah duplikasi
    stopGame();

    if (!parentElement) return;

    const config = {
        type: Phaser.AUTO,
        ...computeGameSize(parentElement),
        parent: parentElement,
        backgroundColor: '#050505',

        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },

        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
            },
        },
    };

    gameInstance = new Phaser.Game(config);

    // Tambahkan MainScene dengan data settings
    gameInstance.scene.add('MainScene', MainScene, true, settings);

    // Pantau perubahan ukuran container React
    resizeObserver = new ResizeObserver(() => {
        if (resizeTimer !== null) {
            clearTimeout(resizeTimer);
        }

        resizeTimer = setTimeout(() => {
            resizeTimer = null;

            if (!gameInstance || !parentElement) return;

            const next = computeGameSize(parentElement);
            const current = gameInstance.scale.gameSize;

            if (
                next.width !== current.width ||
                next.height !== current.height
            ) {
                gameInstance.scale.resize(next.width, next.height);
            }
        }, 80);
    });

    resizeObserver.observe(parentElement);
}

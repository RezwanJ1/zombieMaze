import Phaser from "phaser";


export default class Zombies extends Phaser.Physics.Arcade.Sprite {
  health: any;
  damage: any;
  speed: any;
  pathfind: any;
  targetPath: any;
  moving: any;
  Ztype: any;

  constructor(scene: any, x: any, y: any, texture: any) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5)
    this.setScale(0.3);
  }

  init(easystar: any, Zombietype: any) {
    this.pathfind = easystar;
    this.targetPath = [];
    this.moving = false;
    this.Ztype = Zombietype

    if (this.Ztype == "Zbig") {
      this.setScale(0.4)
    }
  }

  chase(plr: any) {

    const clamp = (val: number, min: number, max: number) =>
      Math.max(min, Math.min(val, max))

    const tileSize = 16;
    const mapSize = 32;

    const startX = clamp(Math.floor(this.x / tileSize), 0, mapSize - 1);
    const startY = clamp(Math.floor(this.y / tileSize), 0, mapSize - 1);

    const endX = clamp(Math.floor(plr.x / tileSize), 0, mapSize - 1);
    const endY = clamp(Math.floor(plr.y / tileSize), 0, mapSize - 1);

    if (this.x < plr.x) {
      this.setFlipX(false)
    }else {
      this.setFlipX(true)
    }

    this.pathfind.findPath(startX, startY, endX, endY, (path: any) => {
      if (!path) {
        return
      }

      this.moveAlongPath(path)
    });
  }

  moveAlongPath(path: any) {
    if (!path || path.length === 0 || this.moving) {
      return;
    }

    this.moving = true;

    const next = path.shift();
    if (!next) {
      this.moving = false;
      return;
    }

    const tileSize = 16
    const nextX = next.x * tileSize + tileSize / 2;
    const nextY = next.y * tileSize + tileSize / 2;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, nextX, nextY);

    const dur = (dist / this.speed) * 1000

    if (!this.scene) {
      return;
    }

    this.scene.tweens.add({
      targets: this,
      x: nextX,
      y: nextY,
      duration: dur,
      onComplete: () => {
        this.moving = false;

        this.moveAlongPath(path);
      },
    });
  }

  die() {
    if (!this.scene) {
      return
    }
    this.scene.sound.play("zombie-groan", { volume: 0.3, seek: 3 });
    this.destroy();
  }

  update() {
    if (this.moving == true) {
      this.anims.play(this.Ztype+"-walk", true)
    }else {
      this.anims.play(this.Ztype + "-idle", true);
    }
  }
}

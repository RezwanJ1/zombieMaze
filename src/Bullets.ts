import Phaser from "phaser";


export default class Bullets extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: any, x: any, y: any, texture: any) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setVisible(false);
    this.setActive(false);
    this.setScale(0.25)
  }

  fire(targetX: number, targetY: number, originX: number, originY: number) {
    this.setPosition(originX, originY);
    this.setVisible(true);
    this.setActive(true);

 
    const dx = targetX - originX;
    const dy = targetY - originY;

    const angle = Math.atan2(dy, dx); 
    const speed = 100;

    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    this.setVelocity(vx, vy);
    this.setRotation(angle); 
  }

  die() {
    this.destroy()  
  }
}

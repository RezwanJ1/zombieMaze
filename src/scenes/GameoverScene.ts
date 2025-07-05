import Phaser from "phaser";

let finalLvl: any;
let retryBtn: any;

export default class CollectingScene extends Phaser.Scene {
  constructor() {
    super("game-over-scene");
  }

  init(data: any) {
    finalLvl = data[0]
    retryBtn = undefined
  }

  create() {
    this.add.text(256, 200, "Game over", {
        fontSize: "35px",
        fontFamily: '"Press Start 2P", monospace',
        color: "rgb(255, 0, 0)",
        strokeThickness: 5,
        stroke: "rgb(0, 0, 0)",
        
    }).setDepth(999).setOrigin(0.5)

    this.add.text(256, 250, "Final level: " + finalLvl, {
        fontSize: "20px",
        fontFamily: '"Press Start 2P", monospace',
        color: "rgb(255, 255, 255)",
        strokeThickness: 5,
        stroke: "rgb(0, 0, 0)",
    }).setDepth(999).setOrigin(0.5);

    retryBtn = this.add.text(256, 325, "Retry", {
        fontSize: "50px",
        fontFamily: '"Press Start 2P", monospace',
        color: "rgb(0, 0, 0)",
        strokeThickness: 15,
        stroke: "rgb(255, 255, 255)",
        backgroundColor: "rgb(255,255,255)"
    })

    retryBtn.setDepth(999)
    .setOrigin(0.5)
    .setInteractive()
    .once("pointerdown", () => {
        this.scene.start("maze-scene")
    })
  }
  

}

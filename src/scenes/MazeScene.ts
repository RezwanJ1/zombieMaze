import Phaser from "phaser";
import Bullets from "../Bullets";
import Zombies from "./Zombies";

import EasyStar from "easystarjs";


let halfH: any;


let plr: any;

let bullets: any;
let gunCoolDown: any;


let keys: any;

let walkspeed: any;

let lvl: any;
let health: any;
let ammo: any;

let lvlText: any;
let healthText: any;
let ammoText: any;

let map: any;
let mapCollision: any;
let ZmapCollision: any;
let layer: any;
let board: any;
let previousMaze: any;

let medkits: any;
let ammoBoxes: any;

let zombies: any;
let canHit: any;

let pathfind: any;

export default class CollectingScene extends Phaser.Scene {
  constructor() {
    super("maze-scene");
  }

  init() {
    halfH = this.scale.height / 2;

    keys = this.input.keyboard.addKeys("W,A,S,D,R");

    plr = undefined;
    walkspeed = 50

    bullets = undefined;
    gunCoolDown = false;

    lvl = 1;
    health = 100;
    ammo = 20;

    lvlText = undefined;
    healthText = undefined;
    ammoText = undefined;

    map = undefined;
    mapCollision = undefined;
    ZmapCollision = undefined;
    layer = undefined;
    board = [];
    previousMaze = "maze-1";

    medkits = undefined;
    ammoBoxes = undefined;

    zombies = undefined;
    canHit = true;

    pathfind = undefined;
  }

  preload() {
    this.load.audio("shoot", "./assets/audio/shoot.mp3");
    this.load.audio("pickup", "./assets/audio/ammoPickup.mp3");
    this.load.audio("empty", "./assets/audio/emptyAmmo.mp3");

    this.load.audio("heartBeat", "./assets/audio/heartBeat.mp3");
    this.load.audio("punch", "./assets/audio/punch.mp3");
    this.load.audio("death", "./assets/audio/die.mp3");

    this.load.audio("zombie-groan", "./assets/audio/zombie-groan.mp3");

    this.load.image("cursor", "./assets/images/cursor.png");

    this.load.image("ammoBox", "./assets/images/ammoBox.png");
    this.load.image("medkit", "./assets/images/medkit.png");

    this.load.image("tileset", "./assets/images/tileset.png");
    this.load.tilemapTiledJSON("maze-1", "./assets/maps/maze-1.json");
    this.load.tilemapTiledJSON("maze-2", "./assets/maps/maze-2.json");
    this.load.tilemapTiledJSON("maze-3", "./assets/maps/maze-3.json");

    this.load.image("bullet", "./assets/images/bullet.png");
    this.load.spritesheet("plr", "./assets/images/plr-sheet.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet(
      "zombie-normal",
      "./assets/images/zombie-normal.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    this.load.spritesheet(
      "zombie-small",
      "./assets/images/zombie-small.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    this.load.spritesheet("zombie-big", "./assets/images/zombie-big.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.input.setDefaultCursor("cursor");

    bullets = this.physics.add.group({
      classType: Bullets,
      maxSize: 5,
    });

    zombies = this.physics.add.group({
      classType: Zombies,
      maxSize: 20,
      runChildUpdate: true,
    });

    healthText = this.add
      .text(2, 2, "Health: 100", {
        fontSize: "20px",
        fontFamily: '"Press Start 2P", monospace',
        color: "rgb(82, 255, 2)",
        strokeThickness: 5,
        stroke: "rgb(0, 0, 0)",
      })
      .setDepth(999);

    ammoText = this.add
      .text(2, 25, "ammo: 20", {
        fontSize: "15px",
        fontFamily: '"Press Start 2P", monospace',
        color: "rgb(253, 255, 157)",
        strokeThickness: 5,
        stroke: "rgb(0, 0, 0)",
      })
      .setDepth(999);

    lvlText = this.add
      .text(420, 2, "level: 1", {
        fontSize: "15px",
        fontFamily: '"Press Start 2P", monospace',
        color: "rgb(255, 255, 255)",
        strokeThickness: 5,
        stroke: "rgb(0, 0, 0)",
      })
      .setDepth(999);

    plr = this.physics.add
      .sprite(10, halfH, "plr")
      .setOrigin(0.5)
      .setCollideWorldBounds(true)
      .setScale(0.25);

    medkits = this.physics.add.group();
    ammoBoxes = this.physics.add.group();

    this.input.on("pointerup", (pointer: any) => {
      if (gunCoolDown) return;

      if (ammo == 0) {
        this.sound.play("empty", { volume: 0.5 });
        return;
      }

      const bullet = bullets.get(plr.x, plr.y, "bullet");
      bullet.fire(pointer.x, pointer.y, plr.x, plr.y);
      this.sound.play("shoot", { volume: 0.2 });

      ammo -= 1;
      setTimeout(() => {
        bullet.die();
      }, 1500);

      gunCoolDown = true;
      setTimeout(() => {
        gunCoolDown = false;
      }, 500);
    });

    this.createAnims();

    this.physics.add.overlap(plr, ammoBoxes, this.pickUpAmmo, undefined, this);
    this.physics.add.overlap(plr, medkits, this.useMedkit, undefined, this);
    this.physics.add.overlap(
      bullets,
      zombies,
      this.killZombie,
      undefined,
      this
    );
    this.physics.add.overlap(plr, zombies, this.touchZombie, undefined, this);

    pathfind = new EasyStar.js();

    pathfind.setAcceptableTiles([0]);

    this.NextMaze();

    this.time.addEvent({
      delay: 10,
      loop: true,
      callback: () => pathfind.calculate(),
    });
  }

  update(): void {
    lvlText.setText("level: " + lvl);
    healthText.setText("health: " + health);
    ammoText.setText("ammo: " + ammo);

    zombies.getChildren().forEach((zombie: any) => {
      if (Phaser.Math.Distance.Between(zombie.x, zombie.y, plr.x, plr.y) < 200) {
        zombie.chase(plr);
      }
    });

    if (health < 20) {
      healthText.setStyle({ color: "rgb(211, 29, 29)" });
    } else if (health < 50) {
      healthText.setStyle({ color: "rgb(211, 162, 29)" });
    } else if (health < 100) {
      healthText.setStyle({ color: "rgb(184, 211, 29)" });
    } else if (health == 100) {
      healthText.setStyle({ color: "rgb(82, 255, 2)" });
    }

    if (plr.x > 500) {
      lvl += 1;
      plr.setX(10);
      this.NextMaze();
    }

    if (health <= 0) {
      this.sound.play("death", {volume: 0.2, rate: 0.9})
      this.scene.start("game-over-scene", [lvl])
    }

    this.movePlr();
  }

  createAnims() {
    this.anims.create({
      key: "plr-walk",
      frames: this.anims.generateFrameNumbers("plr", {
        start: 2,
        end: 5,
      }),
      frameRate: 12,
    });
    this.anims.create({
      key: "plr-idle",
      frames: this.anims.generateFrameNumbers("plr", {
        start: 0,
        end: 1,
      }),
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: "Znormal-walk",
      frames: this.anims.generateFrameNumbers("zombie-normal", {
        start: 2,
        end: 5,
      }),
      frameRate: 12,
    });
    this.anims.create({
      key: "Znormal-idle",
      frames: this.anims.generateFrameNumbers("zombie-normal", {
        start: 0,
        end: 1,
      }),
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: "Zsmall-walk",
      frames: this.anims.generateFrameNumbers("zombie-small", {
        start: 2,
        end: 5,
      }),
      frameRate: 12,
    });
    this.anims.create({
      key: "Zsmall-idle",
      frames: this.anims.generateFrameNumbers("zombie-small", {
        start: 0,
        end: 1,
      }),
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: "Zbig-walk",
      frames: this.anims.generateFrameNumbers("zombie-big", {
        start: 2,
        end: 5,
      }),
      frameRate: 12,
    });
    this.anims.create({
      key: "Zbig-idle",
      frames: this.anims.generateFrameNumbers("zombie-big", {
        start: 0,
        end: 1,
      }),
      frameRate: 1,
      repeat: -1,
    });
  }

  movePlr() {
    if (keys.W.isDown) {
      plr.setVelocityY(-walkspeed);
    } else if (keys.S.isDown) {
      plr.setVelocityY(walkspeed);
    } else {
      plr.setVelocityY(0);
    }

    if (keys.A.isDown) {
      plr.setFlipX(true);
      plr.setVelocityX(-walkspeed);
    } else if (keys.D.isDown) {
      plr.setFlipX(false);
      plr.setVelocityX(walkspeed);
    } else {
      plr.setVelocityX(0);
    }

    if (plr.body.velocity.x !== 0 || plr.body.velocity.y !== 0) {
      plr.anims.play("plr-walk", true);
    } else {
      plr.anims.play("plr-idle", true);
    }

    if (keys.R.isDown) {
      health = 0
    }
  }

  NextMaze() {
    if (map && mapCollision && layer && ZmapCollision) {
      ZmapCollision.destroy();
      mapCollision.destroy();
      layer.destroy();
      map.destroy();
    }

    ammoBoxes.children.each((ammoBox: any) => {
      ammoBox.destroy();
    });

    medkits.children.each((medkit: any) => {
      medkit.destroy();
    });

    zombies.children.each((zombie: any) => {
      zombie.destroy();
    });

    map = this.make.tilemap({ key: this.PickRandomMaze() });
    const tileset = map.addTilesetImage("ZombieMaze Tileset", "tileset");

    if (!tileset) {
      console.log("no tileset")
      this.NextMaze();
      return
    }

    layer = map.createLayer("Tile Layer 1", tileset);

    if (!layer) {
      console.log("no layer")
      this.NextMaze()
      return
    }

    layer.setCollisionByExclusion([-1], true);

    pathfind.setGrid(this.getGrid());

    mapCollision = this.physics.add.collider(plr, layer);
    ZmapCollision = this.physics.add.collider(zombies, layer);

    if (lvl % 3 === 0) {
      this.spawnItems(layer);
    }

    this.placeZombiesInRandomPos()
   
  }

  PickRandomMaze() {
    const num = Phaser.Math.Between(1, 3);
    const mazeChosen = "maze-" + num;
    if (mazeChosen == previousMaze) {
      this.PickRandomMaze();
      return
    }
    previousMaze = mazeChosen;
    return mazeChosen;
  }

  spawnItems(layer: any) {
    if (!layer) {
      console.error("Layer is undefined.");
      return;
    }

    const layerName = layer.layer.name;

    layer.forEachTile((tile: any) => {
      if (!board[tile.y]) {
        board[tile.y] = [];
      }

      board[tile.y][tile.x] = tile.index;

      const rTile = map.getTileAt(tile.x + 1, tile.y, true, layerName);
      const bttmTile = map.getTileAt(tile.x, tile.y + 1, true, layerName);
      const rbttmTile = map.getTileAt(tile.x + 1, tile.y + 1, true, layerName);

      if (
        tile.index === -1 &&
        rTile?.index === -1 &&
        bttmTile?.index === -1 &&
        rbttmTile?.index === -1
      ) {
        if (Phaser.Math.Between(1, 125) !== 1) return;

        const x = tile.x * map.tileWidth;
        const y = tile.y * map.tileHeight;

        if (Phaser.Math.Between(1, 5) < 4) {
          ammoBoxes
            .create(x + map.tileWidth, y + map.tileHeight, "ammoBox")
            .setScale(0.1);
        } else {
          medkits
            .create(x + map.tileWidth, y + map.tileHeight, "medkit")
            .setScale(0.15);
        }
      }
    });
  }

  placeZombiesInRandomPos() {

    const zombieList = this.pickZombiesForLvl()

    const tileSize = 16

    const grid = this.getGrid();

    function isWalkable(x: number, y: number) {
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      return grid[tileY] && grid[tileY][tileX] === 0
    }

    for (let i = 0; i < zombieList.length; i++) {
      let tries = 0;
      let spawnX, spawnY;
      do {
        spawnX = halfH + Phaser.Math.Between(-100, 250);
        spawnY = halfH + Phaser.Math.Between(-225, 225);
        tries++;
      } while (!isWalkable.call(this, spawnX, spawnY) && tries < 10);

      this.spawnZombie(spawnX, spawnY, zombieList[i]);
    }
  }

  pickUpAmmo(_: any, ammoBox: any) {
    this.sound.play("pickup", { volume: 0.5 });
    ammoBox.destroy();
    ammo += 16;
  }
  useMedkit(_: any, medkit: any) {
    if (health === 100) {
      return;
    }
    this.sound.play("heartBeat", { volume: 0.35 });
    medkit.destroy();

    if (health > 70) {
      health = 100;
    } else {
      health += 30;
    }
  }

  spawnZombie(x: number, y: number, type: string) {
    let zombie = zombies.get(x, y, "zombie-" + type);

    if (!zombie) {
      zombie = new Zombies(this, x, y, "zombie-" + type);
      zombies.add(zombie);
      this.physics.add.existing(zombie)
      
    } else {
      zombie.setActive(true);
      zombie.setVisible(true);
      zombie.setPosition(x, y);
      zombie.body.enable = true
    }

    const zombieStats: { [key: string]: [number, number, number] } = {
      normal: [100, 10, 50],
      small: [50, 5, 70],
      big: [300, 34, 20],
    };

    zombie.health = zombieStats[type][0];
    zombie.damage = zombieStats[type][1];
    zombie.speed = zombieStats[type][2];

    zombie.init(pathfind, "Z"+ type)
  }

  getGrid() {
    const grid = [];

    for (let y = 0; y < map.height; y++) {
      const row = [];

      for (let x = 0; x < map.width; x++) {
        const tile = map.getTileAt(x, y, true, "Tile Layer 1");

        if (tile && tile.index === -1) {
          row.push(0);
        } else {
          row.push(-1);
        }
      }

      grid.push(row);
    }
    return grid;
  }

  killZombie(bullet: any, zombie: any) {
    bullet.setActive(false)
    bullet.die()
    zombie.health -= 50;
    if (zombie.health <= 0) {
      zombie.die();
    }
  }

  touchZombie(_: any, zombie: any) {
    if (canHit == true) {
      health -= zombie.damage;
      canHit = false;
      this.sound.play("punch", {volume: 0.1})
      setTimeout(() => {
        canHit = true;
      }, 1000);
    }
  }

  pickZombiesForLvl() {
    let money = 10 * lvl
    
    let zombieList = []

    const zombieCosts: { [key: string]: number } = {
      normal: 10,
      small: 25,
      big: 50,
    }

    do {
      const zombieTypes = ["normal", "small", "big"]

      let randomType = zombieTypes[Phaser.Math.Between(0, zombieTypes.length - 1)];

      if (lvl > 20 && randomType == "normal") {
        randomType = "small"
      }

      const zombieCost = zombieCosts[randomType];

      if (money - zombieCost >= 0) {
        
        money -= zombieCost
        zombieList.push(randomType)
      }
    }while (money >= 10)
    
    return zombieList
  }
};

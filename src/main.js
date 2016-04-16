Constants = {
  TileSize: 16,

  MoveSpeed: 100,

  RoomWidthInTiles: 20,
  RoomHeightInTiles: 11,

  CameraScrollTime: 650,

  KnockBackSpeed: -150,
  FlickerTime: 700,

  JumpTime: 300, // duration of jump
  PunchTime: 300, // duration of punch
  ShootTime: 50, // duration of time to "stall the player" when shooting
  BulletVelocity: 120,
  TimeBetweenBullets: 400, // prevent 'spamming' the bullets

  Directions: {
    North: 3,
    South: 1,
    West: 2,
    East: 0,
  },

  BreakableTiles: [
    5
  ]
};

var Player = function(game, x, y, map, foreground) {
  Phaser.Sprite.call(this, game, x, y, 'blocks', 15);
  this.game.physics.arcade.enable(this);
  this.body.setSize(12, 10);
  this.anchor.set(0.5, 1);

  this.map = map;
  this.foreground = foreground;

  this.disableMovement = false;
  this.facing = Constants.Directions.South;

  this.invincible = false;
  this.knockBackDirection = null;

  this.jumping = false;
  this.punching = false;
  this.shooting = false;

  this.viewSprite = this.game.add.sprite(0, 0, 'blocks', 14);
  this.viewSprite.anchor.set(0.5, 1);
  this.addChild(this.viewSprite);

  this.punchBox = this.game.add.sprite(0, 0, 'blocks', 1);
  this.game.physics.arcade.enable(this.punchBox);
  this.punchBox.anchor.set(0.5);
  this.punchBox.body.setSize(14, 14);
  this.addChild(this.punchBox);
  this.punchBox.kill();

  this.canShoot = true;
  this.bullets = this.game.add.group();
  for (var i = 0; i < 3; i++) {
    var newBullet = this.game.add.sprite(i * 32 + 100, 100, 'blocks', 1);
    this.game.physics.arcade.enable(newBullet);
    newBullet.anchor.set(0.5);
    newBullet.width = 10;
    newBullet.height = 10;

    this.bullets.addChild(newBullet);
    this.bullets.addToHash(newBullet);

    newBullet.kill();
  }
};
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;
Player.prototype.update = function () {
  // directional keyboard movement
  if (this.disableMovement === false && this.knockBackDirection === null) {
    // don't move while punching
    if (this.punching === false && this.shooting === false) {
      if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        this.body.velocity.x = Constants.MoveSpeed;
        this.body.velocity.y = 0;

        this.facing = Constants.Directions.East;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        this.body.velocity.x = -Constants.MoveSpeed;
        this.body.velocity.y = 0;

        this.facing = Constants.Directions.West;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = Constants.MoveSpeed;

        this.facing = Constants.Directions.South;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = -Constants.MoveSpeed;

        this.facing = Constants.Directions.North;
      } else {
        this.body.velocity.set(0);
      }
    }

    if (this.jumping === false && this.game.input.keyboard.isDown(Phaser.Keyboard.Q)) {
      this.jumping = true;

      var jumpTween = this.game.add.tween(this.viewSprite);
      jumpTween.to({y: [-24, 0]}, Constants.JumpTime, Phaser.Easing.Linear.None);
      jumpTween.onComplete.add(function () {
        this.jumping = false;
      }, this);
      jumpTween.start();
    }

    if (this.punching === false && this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      this.punching = true;
      this.body.velocity.set(0);

      this.punchBox.revive();
      this.punchBox.x = this.facing === Constants.Directions.West ? -16 : (this.facing === Constants.Directions.East ? 16 : 0);
      this.punchBox.y = this.facing === Constants.Directions.South ? 8 : (this.facing === Constants.Directions.North ? -24 : -8);

      // if the player has punched a particular tile, perform necessary logic
      var hitTile = null;
      switch (this.facing) {
        case Constants.Directions.East:
          var hitTile = this.map.getTile(~~((this.right + 4) / Constants.TileSize), ~~((this.y - 6) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.West:
          var hitTile = this.map.getTile(~~((this.left - 4) / Constants.TileSize), ~~((this.y - 6) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.South:
          var hitTile = this.map.getTile(~~((this.x) / Constants.TileSize), ~~((this.bottom + 4) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.North:
          var hitTile = this.map.getTile(~~((this.x) / Constants.TileSize), ~~((this.top + 4) / Constants.TileSize), this.foreground);
          break;
      }
      if (hitTile !== null) {
        var tileIndex = hitTile.index - 1;

        // break breakable tiles
        if (Constants.BreakableTiles.indexOf(tileIndex) !== -1) {
          this.map.removeTile(hitTile.x, hitTile.y, this.foreground);
        }
      }

      this.game.time.events.add(Constants.PunchTime, function () {
        this.punching = false;

        this.punchBox.kill();
      }, this);
    }

    if (this.shooting === false && this.canShoot === true && this.game.input.keyboard.isDown(Phaser.Keyboard.E)) {
      var newBullet = this.bullets.getFirstDead();
      if (newBullet !== null) {
        this.shooting = true;
        this.body.velocity.set(0);

        newBullet.revive();

        newBullet.x = this.x + (this.facing === (Constants.Directions.West ? -16 : (this.facing === Constants.Directions.East ? 16 : 0)));
        newBullet.y = this.y + (this.facing === (Constants.Directions.South ? 8 : (this.facing === Constants.Directions.North ? -24 : -8)));
        newBullet.body.velocity.x = this.facing === Constants.Directions.West ? -Constants.BulletVelocity : (this.facing === Constants.Directions.East ? Constants.BulletVelocity : 0);
        newBullet.body.velocity.y = this.facing === Constants.Directions.South ? Constants.BulletVelocity : (this.facing === Constants.Directions.North ? -Constants.BulletVelocity : 0);

        this.game.time.events.add(Constants.ShootTime, function () {
          this.shooting = false;
        }, this);

        this.canShoot = false;
        this.game.time.events.add(Constants.TimeBetweenBullets, function () {
          this.canShoot = true;
        }, this);
      }
    }
  } else if (this.knockBackDirection !== null) {
    this.body.velocity.set(this.knockBackDirection.x, this.knockBackDirection.y);
  } else {
    this.body.velocity.set(0);
  }
};

var WalkEnemy = function(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'blocks', 6);

  this.game.physics.arcade.enable(this);
  this.body.setSize(12, 10);
  this.anchor.set(0.5);

  this.knockBackDirection = null;
};
WalkEnemy.prototype = Object.create(Phaser.Sprite.prototype);
WalkEnemy.prototype.constructor = WalkEnemy;


// State 
var Preload = function () {
  //
};
Preload.prototype.preload = function() {
  this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  this.game.scale.refresh();

  this.game.scale.pageAlignHorizontally = true;
  this.game.scale.pageAlignVertically = true;

  // enable crisp rendering
  this.game.stage.smoothed = false;
  this.game.renderer.renderSession.roundPixels = true;  
  Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
  PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST; //for WebGL

  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);

  this.game.input.gamepad.start();
};
Preload.prototype.create = function () {
  this.game.state.start('Load');
};

var Load = function () {
  //
};
Load.prototype.preload = function() {
  this.game.load.spritesheet('blocks', 'asset/img/blocks.png', 16, 16);

  this.game.load.tilemap('overworld', 'asset/map/overworld.json', undefined, Phaser.Tilemap.TILED_JSON);

  this.game.load.bitmapFont('font', 'asset/font/font.png', 'asset/font/font.json');
};
Load.prototype.create = function () {
  this.game.state.start('Gameplay');
};

var Gameplay = function () {
  this.player = null;
};
Gameplay.prototype.preload = function() {
  //
};
Gameplay.prototype.create = function() {
  this.map = this.game.add.tilemap('overworld');
  this.map.addTilesetImage('blocks', 'blocks', 16, 16);
  this.background = this.map.createLayer('background');
  this.foreground = this.map.createLayer('foreground');
  this.map.setCollisionByExclusion([8, 4].map(function (i) { return i+1; }), true, this.foreground, true);
  this.foreground.resizeWorld();

  this.cameraScrolling = false;
  this.cameraBounds = new Phaser.Rectangle(0, 0, this.game.camera.width, this.game.camera.height - (Constants.TileSize * 3));
  this.game.camera.bounds = null;

  this.testWalkEnemy = this.game.add.existing(new WalkEnemy(this.game, 128, 96));

  this.player = this.game.add.existing(new Player(this.game, 64, 96, this.map, this.foreground));

  this.setUpGUI();
};
Gameplay.prototype.update = function() {
  this.game.physics.arcade.collide(this.player, this.foreground);
  this.game.physics.arcade.overlap(this.player, this.testWalkEnemy, function () { }, function (player, enemy) {
    if (player.invincible === true || player.jumping === true) { return false; }

    player.knockBackDirection = new Phaser.Point(enemy.x - player.x, enemy.y - player.y);
    player.knockBackDirection.normalize();
    player.knockBackDirection.multiply(Constants.KnockBackSpeed, Constants.KnockBackSpeed);
    this.game.time.events.add(200, function () {
      player.knockBackDirection = null;
    }, this);

    player.invincible = true;
    var flickerPlayer = this.game.time.events.loop(100, function () {
      player.viewSprite.tint = (player.viewSprite.tint === 0xFFFFFF ? 0xFF0000 : 0xFFFFFF);
    }, this);
    this.game.time.events.add(Constants.FlickerTime, function () { player.viewSprite.tint = 0xFFFFFF; player.invincible = false; this.game.time.events.remove(flickerPlayer); }, this);

    return false;
  }, this);

  // camera scrolling
  this.cameraBounds.x = this.game.camera.x;
  this.cameraBounds.y = this.game.camera.y;
  if (this.cameraScrolling === false && Phaser.Rectangle.contains(this.cameraBounds, this.player.x, this.player.y) === false) {
    this.cameraScrolling = true;
    this.player.disableMovement = true;
    this.player.bullets.forEach(function (b) { b.kill(); }, this);

    var calculatedCameraX = ~~(this.player.x / (Constants.RoomWidthInTiles * Constants.TileSize)) * (Constants.RoomWidthInTiles * Constants.TileSize);
    var calculatedCameraY = ~~(this.player.y / (Constants.RoomHeightInTiles * Constants.TileSize)) * (Constants.RoomHeightInTiles * Constants.TileSize);
    var cameraTween = this.game.add.tween(this.game.camera);
    cameraTween.to({x: calculatedCameraX, y: calculatedCameraY}, Constants.CameraScrollTime);
    cameraTween.onComplete.add(function () {
      this.cameraScrolling = false;
      this.player.disableMovement = false;
    }, this);
    cameraTween.start();
  } else {
    this.player.bullets.forEach(function (b) {
      if (Phaser.Rectangle.contains(this.cameraBounds, b.x, b.y) === false) {
        b.kill();
      }
    }, this);
  }
};
// remove/delete this function in final version
Gameplay.prototype.render = function () {
  //this.game.debug.body(this.player);

  //this.player.bullets.forEach(function(b) { this.game.debug.body(b); }, this);
};
Gameplay.prototype.setUpGUI = function() {
  this.gui = this.game.add.group();
  this.gui.fixedToCamera = true;
  this.gui.cameraOffset.y = Constants.RoomHeightInTiles * Constants.TileSize;

  var guiBlack = this.game.add.sprite(0, 0, 'blocks', 15);
  guiBlack.width = this.game.width;
  guiBlack.height = Constants.TileSize * 3;
  this.gui.addChild(guiBlack);

  var guiTestText = this.game.add.bitmapText(16, 16, 'font', 'overworld i', 8);
  this.gui.addChild(guiTestText);
  this.areaText = guiTestText;

  this.game.world.bringToTop(this.gui);
};
Gameplay.prototype.toggleSwitchTiles = function (color) {
  if (color === 'red') {
    this.map.forEach(function (tile) {
      if (tile instanceof Phaser.Tile) {
        if (tile.index === 8 + (1)) {
          this.map.putTile(13 + (1), tile.x, tile.y, this.foreground);
        } else if (tile.index === 13 + (1)) {
          this.map.putTile(8 + (1), tile.x, tile.y, this.foreground);
        }
      }
    }, this, 0, 0, this.map.width, this.map.height, this.foreground);
  } else if (color === 'blue') {
    this.map.forEach(function (tile) {

      if (tile instanceof Phaser.Tile) {
        if (tile.index === 4 + (1)) {
          this.map.putTile(0 + (1), tile.x, tile.y, this.foreground);
        } else if (tile.index === 0 + (1)) {
          this.map.putTile(4 + (1), tile.x, tile.y, this.foreground);
        }
      }

    }, this, 0, 0, this.map.width, this.map.height, this.foreground);
  }
};

var main = function() {
  console.log('hello, jam ...again! ♡');

  var game = new Phaser.Game(320, 224);

  game.state.add('Preload', Preload, false);
  game.state.add('Load', Load, false);
  game.state.add('Gameplay', Gameplay, false);

  game.state.start('Preload');
};
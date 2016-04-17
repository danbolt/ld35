var Key = function(game, x, y, color) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', 10);
  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5);
  this.frame = Constants.LockColors[color];

  this.color = color;
};
Key.prototype = Object.create(Phaser.Sprite.prototype);
Key.prototype.constructor = Key;

var Lock = function(game, x, y, color) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', 10);
  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5);
  this.body.immovable = true;
  this.frame = Constants.LockColors[color];

  this.color = color;
};
Lock.prototype = Object.create(Phaser.Sprite.prototype);
Lock.prototype.constructor = Lock;

var ToggleSwitch = function(game, x, y, color, toggleCallback) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', color === 'red' ? 1 : 7);

  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5, 0.5)

  this.toggleCallback = toggleCallback;
  this.color = color;
};
ToggleSwitch.prototype = Object.create(Phaser.Sprite.prototype);
ToggleSwitch.prototype.constructor = ToggleSwitch;
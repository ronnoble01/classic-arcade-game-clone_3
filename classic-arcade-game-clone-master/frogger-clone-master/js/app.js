//----------------
// GAME_CONSTANTS
//----------------
var CHAR_WIDTH = 70,
    CHAR_HEIGHT = 70,
    TILE_WIDTH = 101,
    TILE_HEIGHT = 83,
    STAGE_RIGHT = 707,
    STAGE_LEFT = -100,
    COLUMNS = 7,
    ROWS = 4,
    FONT = 'Nosifer',
    FONT_SIZES = ['20px', '40px', '14px'],
    COLOURS = ['#c51e1e', '#fff'];

//---------------
// gameVariables
//---------------
var score = 0,
    lives = 3,
    enemies = 6,
    posY = [60, 143, 226, 309], // use for enemy and bug y placement
    posX = [0, 101, 202, 303, 404, 505, 606], // use for enemy and bug y placement
    displayGem = true,
    gotGem = false,
    wonGame = false,
    intro = true,
    introDisplayed = false,
    gameOver = false,
    gameOverDisplayed = false;

// Get random nums for x/y coordinates to be used for placing each enemy and gems
var randX = function () {
    return posX[Math.floor(Math.random() * posX.length)];
};
var randY = function () {
    return posY[Math.floor(Math.random() * posY.length)];
};
// function to call to get random speed for each individual enemy
var enemySpeed = function() {
    return Math.random() * (300 - 60) + 60;
};

//-------------
// ACTOR CLASS
//-------------
var Actor = function(x, y, sprite, CHAR_WIDTH, CHAR_HEIGHT) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.width = CHAR_WIDTH;
    this.height = CHAR_HEIGHT;
};
Actor.prototype.update = function(dt) {
};
// draw the actor on the screen
Actor.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

//---------
// ENEMIES
//---------
// The image/sprite for our enemies, this uses
// a helper we've provided to easily load images
var Enemy = function(x, y) {
    // Allow the subclass Enemy objects to have the properties defined
    // inside its superclass Actor by calling it using call method
    Actor.call(this, x, y, 'images/enemy-bug.png', CHAR_WIDTH, CHAR_HEIGHT);
    this.speed = enemySpeed();
};
// Allow failed lookups of Enemy.prototype to delegate to Actor.prototype
Enemy.prototype = Object.create(Actor.prototype);
Enemy.prototype.constructor = Enemy;
// Update the enemy's position using dt (time delta between) ticks
Enemy.prototype.update = function(dt) {
    //when the enemy exits stage right put it back on stage left
    if (this.x > STAGE_RIGHT) {
        this.x = STAGE_LEFT;
        //and randomise the row it comes back on (just to be extra sneaky)
        this.y = randY();
    }
    // multiply movement by the dt parameter which will
    // ensure the game runs at the same speed for all computers.
    var move = this.speed * dt;
    this.x += move;
    //run collision method to check collision with player
    this.collision(this, player);
};
// Collision detection method
//TODO - figure out how to reduce duplication of this code
Enemy.prototype.collision = function(enemy, player) {
    if (enemy.x < player.x + player.width &&
        enemy.x + enemy.width > player.x &&
        enemy.y < player.y + player.height &&
        enemy.height + enemy.y > player.y) {
    // collision detected, player loses life
    player.death();
    }
};

//----------
// PRINCESS
//----------
var Princess = function(x, y) {
    Actor.call(this, x, y, 'images/char-cat-girl.png', CHAR_WIDTH, CHAR_HEIGHT);
};
Princess.prototype = Object.create(Actor.prototype);
Princess.prototype.constructor = Princess;
Princess.prototype.update = function(dt) {
    this.collision(this, player);
};
Princess.prototype.collision = function(princess, player) {
    if (princess.x < player.x + player.width &&
        princess.x + princess.width > player.x &&
        princess.y < player.y + player.height &&
        princess.height + princess.y > player.y) {
        //check if a gem has been collected
        if (gotGem) {
            // player gets points
            player.bonus();
        } else {
            // player gets sent home
            player.reset();
        }
        // reset gem status.  player needs more gems
        gotGem = false;
        console.log(gotGem);
    }
};

//--------
// PLAYER
//--------
var Player = function(x, y) {
    Actor.call(this, x, y, 'images/char-boy.png', CHAR_WIDTH, CHAR_HEIGHT);
    // player moves in jumps of one tile per turn
    this.hspeed = TILE_WIDTH;
    this.vspeed = TILE_HEIGHT;
};
Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;
// keyboard input method to move player with logic
// to prevent player moving off the board
Player.prototype.handleInput = function(allowedKeys) {
    if (!gameOver) {
        switch (allowedKeys) {
            case 'left':
                if (this.x > 50) {
                    this.x -= this.hspeed;
                }
                break;
            case 'right':
                if (this.x < 550) {
                    this.x += this.hspeed;
                }
                break;
            case 'up':
                if (this.y > 50) {
                    this.y -= this.vspeed;
                } else {
                    this.reset();
                }
                break;
            case 'down':
                if (this.y < 450) {
                    this.y += this.vspeed;
                }
                break;
            }
        }
};
// Action to take on player's death
Player.prototype.death = function() {
    //TODO change sprite to a splat image e.g.
    //this.sprite = 'images/splat.png';

    // Take away a life
    lives--;
    // Return player to the start
    this.reset();
    // Set gem status back to default
    gem.itemReset();
    // If too many deaths then lose the game
    if (lives < 1) {
        wonGame = false;
        gameOver = true;
    }
};
// Action to take when player reaches the princess with a gem
Player.prototype.bonus = function() {
    //TODO - add a life
    //TODO - Add a (another) small gem image next to the princess

    // Reset gem status to default
    gem.itemReset();
    // Increase score by 10
    score += 10;
    // Return player to the start
    this.reset();
    // If you get 5 gems you have won
    if (score == 50) {
        wonGame = true;
        gameOver = true;
    }
};
// Set player back to start
Player.prototype.reset = function() {
    this.x = 303;
    this.y = 487;
    this.sprite = 'images/char-boy.png';
};

//------
// GEMS
//------
var Gem = function(sprite) {
    this.width = CHAR_WIDTH;
    this.height = CHAR_HEIGHT;
    this.sprite = sprite;
    this.itemReset(); // Sets the random position of a gem
};
Gem.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};
Gem.prototype.update = function() {
    this.collision(this, player);
};
Gem.prototype.collision = function(gem, player) {
    if (gem.x < player.x + player.width &&
        gem.x + gem.width > player.x &&
        gem.y < player.y + player.height &&
        gem.height + gem.y > player.y) {
    // collision detected!
    gotGem = true;
    displayGem = false;
    //player 'collects' gem
    player.sprite = 'images/gem-boy.png';
    }
};
Gem.prototype.itemReset = function() {
    // Resets the item on the map where player can grab it
    displayGem = true;
    this.x = randX();
    this.y = randY();
};

//---------------------
// instantiate objects
//---------------------

//Function to initiate enemies
function createEnemies() {
    for (var i = 0; i < enemies; i++) {
        var newEnemy = new Enemy(randX(),randY());
        allEnemies.push(newEnemy);
    }
}

var allEnemies = [];
createEnemies();

var princess = new Princess(303, -8);

var player = new Player(303, 487);

var gem = new Gem('images/Gem Orange.png');

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
    };
        player.handleInput(allowedKeys[e.keyCode]);
});
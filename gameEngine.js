class GameEngine {
    constructor() {
        this.gameObjects = [];
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop() {
    // This function will be called every frame. It will update the game state and render the game.
    while (this.isRunning) {
        this.update();
        this.render();
    }
    }

    update() {
        this.gameObjects.forEach(gameObject => {
            gameObject.update();
        });
    }

    render() {
        this.gameObjects.forEach(gameObject => {
            gameObject.render();
        });
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
    }

    explodeBomb(bomb) {
        //Calculate the explosion range
        let startX = Math.max(bomb.x - bomb.blastRadius, 0);
        let endX = Math.min(bomb.x + bomb.blastRadius, this.width -1);
        let startY = Math.max(bomb.y - bomb.blastRadius, 0);
        let endY = Math.min(bomb.y + bomb.blastRadius, this.height -1);

        for (let x = startX; x <= endX; x++) {
            for (let y= startY; y <= endY; y++){
                let cell = this.gameMap.getCell(x,y);
                if (cell.type === 'block'){
                    this.gameMap.setCellToEmpty(x,y)
                }
                //Check the other players in the affected cells
                this.gameObject.forEach(gameObject => {
                    if (gameObject.x === x && gameObject.y === y) {
                        if (gameObject instanceof Bomb){
                            gameObject.explode();
                        } 
                        if (gameObject instanceof player) {
                            gameObject.die();
                        }
                    }
                })
            }
        }
        //Remove bomb from the game
        this.removeGameObject(bomb);
    }

    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }
    }
}



class GameObject {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }

    update() {
        // Update the game object state here.
    }

    render() {
        // Render the game object here.
    }
}

class Player extends GameObject {
    constructor(x, y, speed, bombCapacity, lives) {
        super(x, y);
        this.speed = speed;
        this.bombCapacity = bombCapacity;
        this.lives = lives;
        this.element = null; // We'll store the player's DOM element here
        this.startX = x;
        this.startY = y;
        this.previousX = x;
        this.previousY = y;
    }

    placeBomb() {
        //Create a new bomb at the players current position
        let bomb = new Bomb(this.x, this.y, this.bombRange);
        // Add bomb to the list of active bombs
        this.bombs.push(bomb);
    }

    die() {
        this.lives--;
        if(this.lives <= 0) {
            GameEngine.removeGameObject(this);
        }
    }

    update(inputHandler) {
        // Check the key state from the input handler
        if (inputHandler.keyState['ArrowUp']) {
            this.y -= this.speed;
        } else if (inputHandler.keyState['ArrowDown']) {
            this.y += this.speed;
        } else if (inputHandler.keyState['ArrowLeft']) {
            this.x -= this.speed;
        } else if (inputHandler.keyState['ArrowRight']) {
            this.x += this.speed;
        }
        if (this.hasPlacedBomb()){
            this.placeBomb();
        }

        //Update the state of each bomb
        this.bombs.forEach(bomb => {
            bomb.update();
        })

        //Check for collision between the player and the explosion
        this.checkCollisionWithBombs();

        // Check if the player has moved into a wall, block, or off the edge of the map
        // If they have, move them back to their previous position
        if (this.hasCollidedWithWall() || this.hasCollidedWithBlock()) {
            this.x = this.previousX;
            this.y = this.previousY;
        } else {
            this.previousX = this.x;
            this.previousY = this.y;
        }
    }


    hasCollidedWithWall(gameMap) {
        // This method will check if the player has collided with a wall

        // Get the grid cell that the player is currently in
        const cell = gameMap.getCell(this.x, this.y);

        // Check if the cell is a wall
        return cell.type === 'wall';
    }

    hasCollidedWithBlock(gameMap) {
        // This method will check if the player has collided with a block

        // Get the grid cell that the player is currently in
        const cell = gameMap.getCell(this.x, this.y);

        // Check if the cell is a block
        return cell.type === 'block';
    }

    render() {
        // If the player's DOM element doesn't exist yet, create it
        if (!this.element) {
         this.element = document.createElement('div')
            this.element.style.backgroundColor = 'blue'; // Replace with the actual player color or image
            document.body.appendChild(this.element);
        }

        // Update the DOM element's position
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    checkCollisionWithPowerUps(powerUps){
        for (const powerUp of powerUps) {
            if (this.x === powerUp.x && this.y === powerUp.y) {
                // If the player's position overlaps with a powerUp, update the players properties
                switch (powerUp.type) {
                    case 'bombs':
                        this.bombCapacity++;
                        break;
                    case 'flames':
                        // Increase bomb explosion range
                        break;
                    case 'speed':
                        this.speed++;
                        break;
                }
                // Remove the powerUp from the game
                powerUps.splice(powerUps.indexOf(powerUp), 1);
            }
        }
    }

    checkCollisionWithBombs(bombs) {
        for (const bomb of bombs) {
            if (this.x === bomb.x && this.y === bomb.y && bomb.isExploding) {
                // If the player's position overlaps with a bomb, reset the player's position
                this.lives--;
                this.x = this.startX;
                this.y = this.startY;
            }
        }
    }
}


class InputHandler {
    constructor(){
    this.keyState = {}
    
    window.addEventListener('keydown', (event) => {
        this.keyState[event.key] = true;
    });
    window.addEventListener('keyup', (event) => {
        this.keyState[event.key] = false;
    })
    }
    isKeyDown(key) {
        return this.keyState[key] === true;
    }
}


class Bomb extends GameObject {
    constructor(x, y, blastRadius) {
        super(x, y);
        this.blastRadius = blastRadius;
        this.isExploding = false;
        this.countdown = 3; 
        this.element = null; // We'll store the bomb's DOM element here
    }

    update() {
        // Decrease the countdown timer
        this.countdown--;
        // If the countdown reaches 0, set isExploding to true
        if (this.countdown <= 0) {
            this.isExploding = true;
        }
    }

    render() {
        if (!this.element){
            // If a DOM element for the bomb doesn't exist yet, create it
            this.element = document.createElement('div');
            this.element.style.backgroundColor = 'red'
            document.body.appendChild(this.element)
        }

        // Position the DOM element based on the bomb's position
        this.element.style.left = this.x + 'px'
        this.style.top = this.y + 'px'
    }
}


class Bomb extends GameObject {
    constructor(x, y, blastRadius) {
        super(x, y);
        this.blastRadius = blastRadius;
        this.isExploding = false;
        this.timer = 3; // The bomb will explode after 3 seconds
        this.element = null; // We'll store the bomb's DOM element here
    }

    update() {
        // Decrease the countdown timer
        this.timer--;
        // If the countdown reaches 0, set isExploding to true
        if (this.timer <= 0) {
            this.isExploding = true;
            this.explode();
        }
    }

    explode() {
        // Create an explosion at the bomb's position
       GameEngine.explodeBomb(this);
    }

    render() {
        if (!this.element){
            // If a DOM element for the bomb doesn't exist yet, create it
            this.element = document.createElement('div');
            this.element.style.backgroundColor = 'red'
            document.body.appendChild(this.element)
        }

        // Position the DOM element based on the bomb's position
        this.element.style.left = this.x + 'px'
        this.style.top = this.y + 'px'
    }
}


class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Array(height).fill().map(() => new Array(width).fill());
        this.initializeCells();
    }

    getCell(x, y) {
        return this.cells[y][x];
    }

    setCell(x, y, type) {
        this.cells[y][x].type = type;
    }

    initializeCells() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (x % 2 === 0 && y % 2 === 0) {
                    this.setCell(x, y, 'wall');
                } else if (Math.random() < 0.5) {
                    this.setCell(x, y, 'block');
                } else {
                    this.setCell(x, y, 'empty');
                }
            }
        }
    }
}

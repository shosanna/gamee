import * as PIXI from "pixi.js";
let car,
    tileset,
    livesText,
    road;

let worldWidth = 512;
let worldHeight = 512;
let lives = 3;
let scoreText;
let score = 0;
let enemySpeed = 150;

let app = new PIXI.Application({
    width: worldWidth,
    height: worldHeight,
    transparent: true
});

let enemies = [];
let enemyTextures = [];

window.app = app;

document.body.appendChild(app.view);

PIXI.loader
  .add("images/tileset.json")
  .load(setup);

// On click or tap to the canvas -> run function moveCar
app.renderer.interactive = true;
app.renderer.plugins.interaction.on('pointerdown', function(click){ moveCar(click)});

const CAR_START_X = app.renderer.width / 2;
const LANE_WIDTH = 50;

function setup() {
    tileset = PIXI.loader.resources["images/tileset.json"].textures

    // Initialize the road texture
    for (let index = 0; index < 5; index++) {
        road = new PIXI.Sprite(tileset["road.png"]);
        road.y = index * 100;
        road.x = (worldWidth - road.width) / 2;
        app.stage.addChild(road);
    }

    // Initialize the green textures
    for (let index = 0; index < 5; index++) {
        let green_left = new PIXI.Sprite(tileset["green1.png"]);
        green_left.y = index * 100;
        green_left.x =  ((worldWidth - road.width) / 2) - green_left.width;
        app.stage.addChild(green_left);

        let green_right = new PIXI.Sprite(tileset["green3.png"]);
        green_right.y = index * 100;
        green_right.x =  ((worldWidth) / 2) + green_right.width;
        app.stage.addChild(green_right);
    }
        
    // Initialize and setup the player - car
    car = new PIXI.Sprite(tileset["red_car.png"]);
    car.anchor.set(0.5, 0.5);
    car.lane = 0;
    car.y = app.renderer.height - car.height / 2;

    // Initialize enemies
    for (let i = 0; i < 2; i++) {
        var truck = new PIXI.Sprite(tileset["blue_truck.png"]);
        truck.rotation = Math.PI;
        truck.anchor.set(0.5);
        truck.x = worldWidth / 2;
        truck.y = Math.floor(Math.random() * 3)
        truck.lane = i;

        enemies.push(truck);
    }
    enemyTextures.push(tileset["purple_car.png"]);
    enemyTextures.push(tileset["blue_truck.png"]);
    enemyTextures.push(tileset["orange_truck.png"]);
    enemyTextures.push(tileset["orange_car.png"]);
    

    // Initialize UI
    livesText = new PIXI.Text("3/3", {font: "bold 32px Roboto", fill: '#e74c3c'});
    livesText.x = 0;

    scoreText = new PIXI.Text("XX", {font: "bold 18px Roboto", fill: '#3f85e0'});
    scoreText.x = 0;
    scoreText.y = 50;

    // Add everything to the game
    app.stage.addChild(scoreText);
    app.stage.addChild(livesText);
    app.stage.addChild(car);

    enemies.map(enemy => app.stage.addChild(enemy));

    // Setup the game loop
    app.ticker.add(dt => gameLoop(dt));
}


function moveCar(click) {
    let isMoveLeft = click.data.global.x <= app.renderer.width / 2;

    if (isMoveLeft) {
        car.lane = Math.max(-1, car.lane - 1);
    } else {
        car.lane = Math.min(1, car.lane + 1);
    }
}

function gameLoop(deltaTime) {
    // Compute dt in seconds
    let dt = app.ticker.elapsedMS / 1000;

    // Tint car if it was hit and is immortal
    car.tint = car.immortal ? 0x000000 : 0xFFFFFF;

    // Update UI
    var text;
    if (lives > 0) {
        text = lives + "/3";
    } else {
        text = "GAME OVER!";
        car.texture = tileset["broken_car.png"];
        car.tint = 0xffffff;

        dt = 0;

        livesText.scale.x = 1.3;
        livesText.scale.y = 1.3;
        livesText.x = app.renderer.width / 2 - (livesText.width / 2);
        livesText.y = app.renderer.height / 2;

        scoreText.scale.x = 1.3;
        scoreText.scale.y = 1.3;
        scoreText.x = app.renderer.width / 2 - (scoreText.width / 2);
        scoreText.y = app.renderer.height / 2 + 50;
    }

    livesText.text = text;

    // Move car
    car.x = laneToX(car.lane);

    let previousLane = enemies[0].lane;
    let previousTexture = enemies[0].texture;
    enemies.map(enemy => {
        // Move enemy from the edge of the game back to beginning
        if (enemy.y > app.renderer.height) {
            enemy.y = 0;
            enemy.lane = Math.floor(Math.random() * 3) - 1;
            let index = Math.floor(Math.random() * 4);
            enemy.texture = enemyTextures[index];
        }

        // Collision
        if (enemy.lane == car.lane && car.y < (enemy.y + enemy.height) && !car.immortal) {
            lives--;
    
            if (lives > 0) {
                car.immortal = true; 
                setTimeout(() => car.immortal = false, 4000);
            }
        }
    
        // Solve the problem of enemies on the same lane
        if (previousLane == enemy.lane) {
            enemy.texture = previousTexture;
        }
        
        // Move enemy and make it faster
        enemy.x = laneToX(enemy.lane);
        previousLane = enemy.lane;
        
        enemy.y += enemySpeed * dt;        
    });

    score += 10 * dt;
    enemySpeed += 10 * dt;
    scoreText.text =  "Score: " + Math.round(score);
}

function laneToX(lane) {
    return CAR_START_X + LANE_WIDTH * lane;
}
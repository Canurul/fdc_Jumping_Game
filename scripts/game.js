const PLAYER = document.querySelector(".player");
const ORIGINAL_OBSTACLE = document.querySelector(".obstacle");
const SCORE_DISPLAY = document.getElementById('score');

const BODY_COMPUTED_STYLE = window.getComputedStyle(document.body);
const CANVAS_WIDTH = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--canvas-width'));
const PLAYER_WIDTH = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--player-width'));
const PLAYER_JUMP_DURATION = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-duration'));
const PLAYER_JUMP_HEIGHT = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-height'));
const OBSTACLE_MOVE_DURATION = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-move-duration'));
const OBSTACLE_HEIGHT = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-height'));
const OBSTACLE_WIDTH = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-width'));
const OBSTACLES_SPAWN_FREQUENCY = 2500;

const GAME_INSTRUCTION_ELEMENT = document.querySelector('.instruction-text');

const OBSTACLES = [];
const TIMEOUTS = [];
const VISUALS = ['obstacle1_visuals', 'obstacle2_visuals', 'obstacle3_visuals'];

const sounds = {
    background: document.getElementById('backgroundMusic'),
    jump: document.getElementById('jumpSound'),
    collision: document.getElementById('collisionSound')
};

document.body.onkeyup = function (e) {
    if (e.code == "Enter" || e.keyCode == 13) {
        reset();
    }

    if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
        jump();
        startGame();
    }
}

const startGame = function () {
    if (has_game_started)
        return;
    sounds.background.play()
    if (has_game_started) return;

    spawnPlayer();
    spawnObstacles();
    has_game_started = true;
    showInstruction('Press SPACE to JUMP');
}

const gameOver = function () {
    if (is_game_over) return;
    sounds.collision.play();
    sounds.background.pause();
    sounds.background.currentTime = 0

    TIMEOUTS.forEach((element) => clearTimeout(element));
    OBSTACLES.forEach((element) => { element.classList.add('pause'); });
    PLAYER.classList.add('pause');
    PLAYER.classList.add('dead');

    showInstruction('GAME OVER');
    setTimeout(() => showInstruction('Press ENTER to RESET'), 2000);

    console.log("gameOver");
    is_game_over = true;
}

const jump = function () {
    if (is_player_jumping || !has_game_started)
        return;
    sounds.jump.play();


    removeClass('animate_player', PLAYER);
    addClass('jump', PLAYER);
}

const land = function () {
    is_player_jumping = false;
    removeClass('jump', PLAYER);
    addClass('animate_player', PLAYER);
}

const reset = function () {
    if (!is_game_over) return;

    OBSTACLES.forEach((element) => {
        clearObstacleVisuals(element);
        element.classList.remove('move');
        element.classList.remove('pause');
    });

    PLAYER.classList.remove('jump');
    PLAYER.classList.remove('pause');
    PLAYER.classList.remove('animate_player');
    PLAYER.classList.remove('dead');

    is_player_in_hight_danger = true;
    is_player_in_side_danger = false;
    has_game_started = false;
    is_player_jumping = false;

    score = 0;
    updateScoreDisplay();
    showInstruction('Press SPACE to START');

    console.log("reset");
    is_game_over = false;
}

const showInstruction = (message) => {
    GAME_INSTRUCTION_ELEMENT.textContent = message;
};

const subscribeToEvents = function (element) {
    element.addEventListener("animationstart", function (e) {
        if (e.animationName == 'obstacle_move') {
            TIMEOUTS.push(setTimeout(() => {
                setPlayerInSideDanger(true);
            }, calculateTimeToSideImpact()));
        }

        if (e.animationName == 'player_jump') {
            is_player_jumping = true;

            let timeToSafety = calculateTimeToHightSafety();
            let timeBackDown = (PLAYER_JUMP_DURATION * 1000) - timeToSafety;

            TIMEOUTS.push(setTimeout(() => {
                setPlayerInHeightDanger(false);
            }, timeToSafety));

            TIMEOUTS.push(setTimeout(() => {
                setPlayerInHeightDanger(true);
            }, timeBackDown));
        }
    });

    element.addEventListener("animationend", function (e) {
        if (e.animationName == 'obstacle_move') {
            setPlayerInSideDanger(false);
            clearObstacleVisuals(e.target);
            removeClass('move', e.target);
            incrementScore();
        }

        if (e.animationName == 'player_jump') {
            land();
        }
    });
}

const setPlayerInHeightDanger = function (isInDanger) {
    is_player_in_hight_danger = isInDanger;
    if (is_player_in_side_danger && is_player_in_hight_danger) gameOver();
}

const setPlayerInSideDanger = function (isInDanger) {
    is_player_in_side_danger = isInDanger;
    if (is_player_in_side_danger && is_player_in_hight_danger) gameOver();
}

const initObstacle = function (obstacle) {

    VISUALS.forEach(visual => obstacle.classList.remove(visual));

    obstacle.classList.add(VISUALS[Math.floor(Math.random() * VISUALS.length)]);

    let startPosition = OBSTACLES.indexOf(obstacle) * OBSTACLE_WIDTH;
    let endPosition = (CANVAS_WIDTH - OBSTACLE_WIDTH - startPosition) * -1;
    obstacle.style.setProperty('--obstacle-start-position', `${startPosition}px`);
    obstacle.style.setProperty('--obstacle-move-distance', `${endPosition}px`);
    addClass('move', obstacle);
}

const getObstacle = function () {
    for (let i = 0; i < OBSTACLES.length; i++) {
        let existingObstacle = OBSTACLES[i];
        if (!existingObstacle.classList.contains('move'))
            return existingObstacle;
    }

    let newObstacle;
    if (OBSTACLES.length != 0) {
        newObstacle = ORIGINAL_OBSTACLE.cloneNode();
        ORIGINAL_OBSTACLE.parentNode.appendChild(newObstacle);
    } else {
        newObstacle = ORIGINAL_OBSTACLE;
    }

    subscribeToEvents(newObstacle);
    OBSTACLES.push(newObstacle);

    return newObstacle;
}

const spawnObstacles = function () {
    let newObstacle = getObstacle();
    initObstacle(newObstacle);

    TIMEOUTS.push(setTimeout(spawnObstacles, OBSTACLES_SPAWN_FREQUENCY));
}

const spawnPlayer = function () {
    subscribeToEvents(PLAYER);
    addClass('animate_player', PLAYER);
}

const clearObstacleVisuals = function (element) {
    for (let i = 0; i < VISUALS.length; i++)
        removeClass(VISUALS[i], element);
}

const incrementScore = function () {
    score++;
    updateScoreDisplay();
}

const updateScoreDisplay = function () {
    SCORE_DISPLAY.innerText = `Score: ${score}`;
}

const calculateTimeToSideImpact = function () {
    let result = ((CANVAS_WIDTH - PLAYER_WIDTH - OBSTACLE_WIDTH / 2) / CANVAS_WIDTH) * OBSTACLE_MOVE_DURATION;
    return result * 1000;
}

const calculateTimeToHightSafety = function () {
    let result = ((OBSTACLE_HEIGHT / PLAYER_JUMP_HEIGHT) * (PLAYER_JUMP_DURATION / 2));
    return result * 1000;
}

const addClass = function (item, element) {
    if (!element.classList.contains(item)) element.classList.add(item);
}

const removeClass = function (item, element) {
    if (element.classList.contains(item)) element.classList.remove(item);
}

let score = 0;
let has_game_started = false;
let is_game_over = false;
let is_player_in_hight_danger = true;
let is_player_in_side_danger = false;
let is_player_jumping = false;

showInstruction('Press SPACE to START');
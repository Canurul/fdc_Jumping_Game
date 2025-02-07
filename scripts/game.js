const PLAYER = document.querySelector(".player");
const ORIGINAL_OBSTACLE = document.querySelector(".obstacle");
const SCORE_DISPLAY = document.querySelector('.score');
const TOP_SCORE_DISPLAY = document.querySelector('.top-score');

const BODY_COMPUTED_STYLE = window.getComputedStyle(document.body);
const CANVAS_WIDTH = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--canvas-width'));
const PLAYER_WIDTH = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--player-width'));
const PLAYER_JUMP_DURATION = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-duration'));
const PLAYER_JUMP_HEIGHT = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-height'));
const OBSTACLE_MOVE_DURATION = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-move-duration'));
const OBSTACLE_NORMAL_HEIGHT = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-height'));
const OBSTACLE_TALL_HEIGHT = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-tall-height'));
const OBSTACLE_NORMAL_WIDTH = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-width'));
const OBSTACLE_WIDE_WIDTH = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-wide-width'));
const OBSTACLES_SPAWN_FREQUENCY = 2500;

const GAME_INSTRUCTION_ELEMENT = document.querySelector('.instruction-text');

const OBSTACLES = [];
const TIMEOUTS = [];
const VISUALS = ['obstacle1_visuals', 'obstacle2_visuals', 'obstacle3_visuals'];

const sounds = {
    background: document.querySelector('.backgroundMusic'),
    jump: document.querySelector('.jumpSound'),
    collision: document.querySelector('.collisionSound')
};

const INTRO_HYPE_MESSAGES = ['READY', 'SET', 'GO!', 'Press SPACE to JUMP'];
const TIME_BETWEEN_MESSAGES = 1000;

let introMessageCompleted = 0;
let obstacle_widths = [];
let obstacle_heights = [];

document.body.onkeyup = function (e) {
    if (e.code == "Enter" || e.keyCode == 13) {
        reset();
    }

    if (e.key == " " || e.code == "Space" || e.keyCode == 32) {

        if (has_game_started) {
            jump();
            return;
        }

        if (introMessageCompleted == 0) {
            for (let i = 0; i < INTRO_HYPE_MESSAGES.length; i++) {
                TIMEOUTS.push(setTimeout(() => {
                    GAME_INSTRUCTION_ELEMENT.classList.add("intro");

                    showInstruction(INTRO_HYPE_MESSAGES[introMessageCompleted]);

                    if (introMessageCompleted == INTRO_HYPE_MESSAGES.length - 1)
                        startGame();

                    introMessageCompleted++;
                }, TIME_BETWEEN_MESSAGES * i));

                TIMEOUTS.push(setTimeout(() => {
                    GAME_INSTRUCTION_ELEMENT.classList.remove("intro");
                }, i == 0 ? 300 : 1300 * i));
            }
        }
    }
}

const startGame = function () {
    if (has_game_started)
        return;
    sounds.background.play()
    if (has_game_started) return;

    GAME_INSTRUCTION_ELEMENT.classList.remove("intro");

    spawnPlayer();
    spawnObstacles();
    has_game_started = true;
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
    TIMEOUTS.push(setTimeout(() => showInstruction('Press ENTER to RESET'), 2000));

    if (score > top_score)
        top_score = score;

    updateScoreDisplay();

    is_game_over = true;
}

const jump = function () {
    if (is_player_jumping || !has_game_started)
        return;

    if (!is_game_over)
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

    GAME_INSTRUCTION_ELEMENT.classList.remove("intro");
    PLAYER.classList.remove('jump');
    PLAYER.classList.remove('pause');
    PLAYER.classList.remove('animate_player');
    PLAYER.classList.remove('dead');

    introMessageCompleted = 0;
    is_player_in_hight_danger = true;
    is_player_in_side_danger = false;
    has_game_started = false;
    is_player_jumping = false;

    score = 0;
    updateScoreDisplay();
    showInstruction('Press SPACE to START');

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

    let obstacleType = VISUALS[Math.floor(Math.random() * VISUALS.length)];
    obstacle.classList.add(obstacleType);
    obstacle.classList.remove('obstacle-normal', 'obstacle-tall', 'obstacle-wide');

    if (obstacle_widths.length >= OBSTACLES.length)
        obstacle_widths.splice(0, 1);

    if (obstacle_heights.length >= OBSTACLES.length)
        obstacle_heights.splice(0, 1);

    switch (obstacleType) {
        case VISUALS[0]:
            obstacle_widths.push(OBSTACLE_NORMAL_WIDTH);
            obstacle_heights.push(OBSTACLE_NORMAL_HEIGHT);
            addClass('obstacle-normal', obstacle);
            break;
        case VISUALS[1]:
            obstacle_widths.push(OBSTACLE_WIDE_WIDTH);
            obstacle_heights.push(OBSTACLE_NORMAL_HEIGHT);
            addClass('obstacle-wide', obstacle);
            break;
        case VISUALS[2]:
            obstacle_widths.push(OBSTACLE_NORMAL_WIDTH);
            obstacle_heights.push(OBSTACLE_TALL_HEIGHT);
            addClass('obstacle-tall', obstacle);
            break;
    }

    let startPosition = obstacle_widths.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    let endPosition = (CANVAS_WIDTH - obstacle_widths.slice(-1) - startPosition) * -1;
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
    TOP_SCORE_DISPLAY.innerText = `TOP Score: ${top_score}`;
}

const calculateTimeToSideImpact = function () {
    let width = obstacle_widths.slice(-1);
    let result = ((CANVAS_WIDTH - PLAYER_WIDTH) / CANVAS_WIDTH) * OBSTACLE_MOVE_DURATION;
    return result * 1000;
}

const calculateTimeToHightSafety = function () {
    let height = obstacle_heights.slice(-1);
    let result = ((height / PLAYER_JUMP_HEIGHT) * (PLAYER_JUMP_DURATION / 2));
    return result * 1000;
}

const addClass = function (item, element) {
    if (!element.classList.contains(item)) element.classList.add(item);
}

const removeClass = function (item, element) {
    if (element.classList.contains(item)) element.classList.remove(item);
}

let top_score = 0;
let score = 0;
let has_game_started = false;
let is_game_over = false;
let is_player_in_hight_danger = true;
let is_player_in_side_danger = false;
let is_player_jumping = false;

showInstruction('Press SPACE to START');
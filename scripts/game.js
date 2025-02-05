const PLAYER = document.querySelector(".player");
const OBSTACLE = document.querySelector(".obstacle");

const BODY_COMPUTED_STYLE = window.getComputedStyle(document.body);
const OBSTACLE_MOVE_DURATION = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-move-duration'));
const obstacleMoveDelay = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-move-delay'));
const playerWidth = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--player-width'));
const canvasWidth = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--canvas-width'));
const playerJumpDuration = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-duration'));
const obstacleHeight = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-height'));
const playerJumpHeight = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-height'));

const calculateTimeToSideImpact = function () {
    let result = ((canvasWidth - playerWidth) / canvasWidth) * OBSTACLE_MOVE_DURATION;
    return result * 1000;
}

const calculateTimeToHightSafety = function () {
    let result = ((obstacleHeight / playerJumpHeight) * (playerJumpDuration / 2));
    return result * 1000;
}

const gameOver = function () {
    if (is_game_over)
        return;

    OBSTACLE.classList.add('pause');
    PLAYER.classList.add('pause');
    PLAYER.classList.add('dead');

    clearTimeout(timeoutToHightDanger);
    clearTimeout(timeoutToHightEscape);
    clearTimeout(timeoutToSideDanger);

    console.log("gameOver");

    is_game_over = true;
}

const setPlayerInHeightDanger = function (isInDanger) {
    is_player_in_hight_danger = isInDanger;

    console.log("Is Player Safe? " + is_player_in_hight_danger)

    if (is_player_in_side_danger && is_player_in_hight_danger)
        gameOver();
}

const setPlayerInSideDanger = function (isInDanger) {
    is_player_in_side_danger = isInDanger;

    console.log("is_obstacle_in_player_range " + is_player_in_side_danger)

    if (is_player_in_side_danger && is_player_in_hight_danger)
        gameOver();
}

const reset = function () {
    if (!is_game_over)
        return;

    OBSTACLE.classList.remove('move');
    OBSTACLE.classList.remove('pause');
    PLAYER.classList.remove('jump');
    PLAYER.classList.remove('pause');
    PLAYER.classList.remove('animate_player');
    PLAYER.classList.remove('dead');

    is_player_in_hight_danger = true;
    is_player_in_side_danger = false;
    is_obstacle_moving = false;
    is_player_jumping = false;

    console.log("reset");

    is_game_over = false;
}

const jump = function () {
    if (is_player_jumping || !is_obstacle_moving)
        return;

    removeClass('animate_player', PLAYER);
    addClass('jump', PLAYER);
}

const land = function () {
    is_player_jumping = false;

    removeClass('jump', PLAYER);
    addClass('animate_player', PLAYER);
}

const start = function () {
    if (is_obstacle_moving)
        return;

    addClass('move', OBSTACLE);
    addClass('animate_player', PLAYER);

    is_obstacle_moving = true;
}

const addClass = function (item, element) {
    if (!element.classList.contains(item))
        element.classList.add(item);
}

const removeClass = function (item, element) {
    if (element.classList.contains(item))
        element.classList.remove(item)
}

document.body.onkeyup = function (e) {
    if (e.code == "Enter" || e.keyCode == 13) {
        reset();
    }

    if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
        jump();

        start();
    }
}

OBSTACLE.addEventListener("animationstart", function (e) {
    if (e.animationName == 'obstacle_move') {
        timeoutToSideDanger = setTimeout((setPlayerInSideDanger) => {
            setPlayerInSideDanger(true);
        }, calculateTimeToSideImpact(), setPlayerInSideDanger);
    }
});

OBSTACLE.addEventListener("animationiteration", function (e) {
    if (e.animationName == 'obstacle_move') {
        setPlayerInSideDanger(false);

        timeoutToSideDanger = setTimeout((setPlayerInSideDanger) => {
            setPlayerInSideDanger(true);
        }, calculateTimeToSideImpact(), setPlayerInSideDanger);
    }
});

PLAYER.addEventListener("animationstart", function (e) {
    if (e.animationName == 'player_jump') {
        is_player_jumping = true;

        let timeToSafety = calculateTimeToHightSafety();
        let timeBackDown = (playerJumpDuration * 1000) - timeToSafety;

        timeoutToHightEscape = setTimeout((setPlayerInHeightDanger) => {
            setPlayerInHeightDanger(false);
        }, timeToSafety, setPlayerInHeightDanger);

        timeoutToHightDanger = setTimeout((setPlayerInHeightDanger) => {
            setPlayerInHeightDanger(true);
        }, timeBackDown, setPlayerInHeightDanger);
    }
});

PLAYER.addEventListener("animationend", function (e) {
    if (e.animationName == 'player_jump') {
        land();
    }
});

let is_game_over = false;
let is_player_in_hight_danger = true;
let is_player_in_side_danger = false;
let is_player_jumping = false;
let is_obstacle_moving = false;
let timeoutToHightEscape = null;
let timeoutToHightDanger = null;
let timeoutToSideDanger = null;
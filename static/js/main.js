import {boardsManager} from "./controller/boardsManager.js";

function init() {
    boardsManager.loadBoards(userId);
}

init();

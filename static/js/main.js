import {boardsManager} from "./controller/boardsManager.js";

export const socket = io();
socket.connect('http://127.0.0.1:5000/');

function init() {
    boardsManager.loadBoards(userId);

    //manual sync
    const refreshButton = document.querySelector('#manual-sync');
    refreshButton.addEventListener('click', () => {
        boardsManager.reloadBoards(userId);
    });

    //live sync
    socket.on('message', function(msg) {
        console.log(msg);
        boardsManager.reloadBoards(userId);
    });
}

init();

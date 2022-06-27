import {boardsManager} from "./controller/boardsManager.js";

export const socket = new Server();
socket.connect('https://proman-code-cool.herokuapp.com/');

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

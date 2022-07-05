import { boardsManager } from "./controller/boardsManager.js";
import { columnsManager } from "./controller/columnsManager.js";

export const socket = io();
socket.connect(host);

async function init() {
  await boardsManager.loadBoards(userId);

  //manual sync
  const refreshButton = document.querySelector('#manual-sync');
  refreshButton.addEventListener('click', () => {
    boardsManager.reloadBoards(userId);
  });

  //live sync
  socket.on('message', function(content) {
    if(content === 'boards') {
      boardsManager.reloadBoards(userId);
    } else {
      columnsManager.reloadColumns(content)
    }
  });
}

init();

console.log(caches)
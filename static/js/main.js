import { boardsManager } from "./controller/boardsManager.js";
import { columnsManager } from "./controller/columnsManager.js";
import { showPopup, loginPopup } from "./popup.js";

export const socket = io();
socket.connect(socketHost);

async function init() {
  if(userId !== 0) {
    await boardsManager.loadBoards(userId);
  } else {
    showPopup(loginPopup);
  }

  //manual sync
  const refreshButton = document.querySelector('#manual-sync');
  refreshButton.addEventListener('click', () => {
    if(userId === 0) {
      showPopup(loginPopup);
    } else {
      boardsManager.reloadBoards(userId);
    }
  });

  //live sync
  socket.on('message', function(content) {
    if(userId !== 0) {
      if(content === 'boards') {
        boardsManager.reloadBoards(userId);
      } else {
        columnsManager.reloadColumns(content);
      }
    } else {
      showPopup(loginPopup);
    }
  });
}

init()
  .then(() => console.log('Initialized'))
  .catch(err => console.log(err));

console.log(caches)
console.log(indexedDB)

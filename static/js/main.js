import { boardsManager } from "./controller/boardsManager.js";
import { columnsManager } from "./controller/columnsManager.js";
import { showPopup, loginPopup } from "./popup.js";
import { Workbox } from 'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-window.prod.mjs';

(function() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', event => {
      if (!event.isUpdate) {
        // First-installed code goes here...
        console.log('Service worker has been installed!');
      }
    });

    wb.addEventListener('activated', event => {
      // `event.isUpdate` will be true if another version of the service
      // worker was controlling the page when this version was registered.
      if (!event.isUpdate) {
        console.log('Service worker activated for the first time!');

        // If your service worker is configured to precache assets, those
        // assets should all be available now.
      }
    });

    wb.addEventListener('waiting', event => {
      console.log(
        `A new service worker has installed, but it can't activate ` +
        `until all tabs running the current version have fully unloaded.`
      );
    });

    wb.addEventListener('message', event => {
      if (event.data.type === 'CACHE_UPDATED') {
        const { updatedURL } = event.data.payload;

        console.log(`A newer version of ${updatedURL} is available!`);
      }
    });

    // Register the service worker after event listeners have been added.
    wb.register();
  }
})();

export const socket = io();
socket.connect(socketHost);

async function init() {
  if (userId === 0) {
    showPopup(loginPopup);
  }

  await boardsManager.loadBoards(userId);

  //manual sync
  const refreshButton = document.querySelector('#manual-sync');
  refreshButton.addEventListener('click', () => {
    boardsManager.reloadBoards(userId);
  });

  //live sync
  socket.on('message', function(content) {
    if (userId !== 0) {
      if (content === 'boards') {
        boardsManager.reloadBoards(userId);
      } else {
        columnsManager.reloadColumns(content);
      }
    }
  });
}

init()
  .then(() => console.log('Initialized'))
  .catch(err => console.log(err));

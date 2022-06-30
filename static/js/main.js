import { boardsManager } from "./controller/boardsManager.js";

export const socket = io();
socket.connect('https://proman-code-cool.herokuapp.com/');

(function() {
  if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
               .then(function(registration) {
               console.log('Service Worker Registered');
               return registration;
      })
      .catch(function(err) {
        console.error('Unable to register service worker.', err);
      });
      navigator.serviceWorker.ready.then(function(registration) {
        console.log('Service Worker Ready');
      });
    });
  }
})();

let deferredPrompt;
const btnInstall = document.querySelector('#btnInstall');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired');
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.style.visibility = 'visible';
});

btnInstall.addEventListener('click', (e) => {
  btnInstall.style.visibility = 'hidden';
  deferredPrompt.prompt();
  deferredPrompt.userChoice
    .then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
});

window.addEventListener('appinstalled', (evt) => {
  app.logEvent('app', 'installed');
});

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

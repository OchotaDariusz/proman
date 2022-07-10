import { dataHandler } from "../data/dataHandler.js";
import { htmlFactory, htmlTemplates } from "../view/htmlFactory.js";
import { domManager } from "../view/domManager.js";
import { cardsManager, showCreateCardForm } from "./cardsManager.js";
import {
  showPopup,
  loginPopup,
  createCardPopup,
  createCardStatus,
  createColumnPopup,
  flashList,
  flashes
} from "../popup.js";
import { columnsManager } from "./columnsManager.js";
import { socket } from "../main.js";

export let boardsManager = {
  loadBoards: async function(userId) {
    const boards = await dataHandler.getBoards(userId);
    if (boards) {
      console.log('boards', boards);
      for (let board of boards) {
        const boardBuilder = htmlFactory(htmlTemplates.board);
        const content = boardBuilder(board);
        domManager.addChild(".board-container", content);
        domManager.addEventListener(
          `.board-toggle[data-board-id="${board.id}"]`,
          "click",
          showHideButtonHandler,
          //true
        );
        domManager.addEventListener(
          `.board-toggle-archived[data-board-id="${board.id}"]`,
          "click",
          showHideArchivedButtonHandler,
          //true
        );
        domManager.addEventListener(
          `.board-add[data-board-id="${board.id}"]`,
          "click",
          () => {
            addCardButtonHandler(board)
          }
        );
        domManager.addEventListener(
          `.board-add-column[data-board-id="${board.id}"]`,
          "click",
          () => {
            addColumnButtonHandler(board)
          }
        );
        if (board['user_id'] === userId) {
          domManager.addEventListener(
            `.board-title[data-board-id="${board.id}"]`,
            "click",
            event => {
              renameBoardTitle(event, `.board-title[data-board-id="${board.id}"]`, 'boards', [board]);
            }
          );
          domManager.addEventListener(`.board-remove[data-board-id="${board.id}"]`,
            "click",
            () => {
              removeBoard(board);
            }
          );
        }
      }
    }
  },
  loadBoard: function(boardId, userId) {
    loadBoardContent(boardId);
    domManager.toggleCSSClasses(`.fas[data-board-id="${boardId}"]`, 'fa-chevron-down', 'fa-chevron-up');
  },
  createBoard: function(boardTitle, public_private) {
    dataHandler.createNewBoard(boardTitle, public_private, userId)
      .then(response => {
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
        showPopup(flashes);
      })
      .catch(err => console.log(err));
    socket.send('boards');
  },
  closeBoard: async function(boardId) {
    const board = document.querySelector(`.board[data-board-id="${boardId}"]`);
    if (board) {
      board.remove();
    }
  },
  closeBoards: async function(boardId = null) {
    const boards = document.querySelectorAll('section.board');
    boards.forEach(board => {
      board.remove();
    });
    this.loadBoards(userId)
      .then(() => {
        if (boardId !== null) {
          this.loadBoard(boardId, userId);
        }
      })
      .then(() => {
        setTimeout(async () => {
          await this.verifyLoadedBoards(userId);
        }, 1500);
      })
      .catch(err => console.log(err));
  },
  reloadBoards: function(userId) {
    const boardsIdToLoad = checkForLoadedContent();

    const boards = document.querySelectorAll('section.board');
    boards.forEach(board => {
      board.remove();
    });
    this.loadBoards(userId)
      .then(() => {
        boardsIdToLoad.forEach(boardId => {
          loadBoardContent(boardId);
          domManager.toggleCSSClasses(`.fas[data-board-id="${boardId}"]`, 'fa-chevron-down', 'fa-chevron-up');
        });
      })
      .then(() => {
        setTimeout(async () => {
          await this.verifyLoadedBoards(userId);
        }, 1500);
      })
      .catch(err => console.log(err));
  },
  verifyLoadedBoards: async function(userId) {
    const boards = await dataHandler.getBoards(userId);
    const loadedBoards = document.querySelectorAll('section.board');

    if (boards.length !== loadedBoards.length) {
      this.reloadBoards(userId);
    }
  },
};

function addCardButtonHandler(board) {
  localStorage.setItem('boardId', board.id);
  if (userId === 0) {
    showPopup(loginPopup);
  } else {
    showCreateCardForm(board.id);
  }
}

function addColumnButtonHandler(board) {
  localStorage.setItem('boardId', board.id);
  if (userId === 0) {
    showPopup(loginPopup);
  } else {
    showPopup(createColumnPopup);
  }
}

function removeBoard(board) {
  if (confirm("Are you sure you want to delete this board?")) {
    dataHandler.deleteBoard(board.id, userId)
      .then(response => {
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
        showPopup(flashes);
      })
      .catch(err => console.log(err));
    const boardToRemove = document.querySelector(`.board[data-board-id="${board.id}"]`);
    boardToRemove.remove();
    socket.send('boards');
  }
}

function showHideButtonHandler(clickEvent) {
  showHideCardsHandler(clickEvent.target.dataset.boardId, loadBoardContent, false);
}

function showHideArchivedButtonHandler(clickEvent) {
  showHideCardsHandler(clickEvent.target.dataset.boardId, loadBoardContent, true);
}

function showHideCardsHandler(boardId, callback, archived) {
  if (domManager.hasChild(`.board-columns[data-board-id="${boardId}"]`)) {
    domManager.removeAllChildren(`.board-columns[data-board-id="${boardId}"]`);
    const cardsHeader = document.querySelector(`.board-card-header[data-board-id="${boardId}"]`);
    if (cardsHeader) {
      cardsHeader.remove();
    }
  } else {
    callback(boardId, archived);
  }
  domManager.toggleCSSClasses(`.fas[data-board-id="${boardId}"]`, 'fa-chevron-down', 'fa-chevron-up');
}

function checkForLoadedContent() {
  const openedBoardsId = [];
  const boardsContent = document.querySelectorAll('div.board-columns');
  if (boardsContent) {
    boardsContent.forEach(boardContent => {
      if (boardContent.hasChildNodes()) {
        openedBoardsId.push(boardContent.dataset.boardId);
        boardContent.innerHTML = '';
      }
    });
  }
  return openedBoardsId
}

export function loadBoardContent(boardId, archived = false) {
  columnsManager.loadColumns(boardId)
    .then(() => cardsManager.loadCards(boardId, archived))
    .then(() => cardsManager.initDragAndDrop(boardId))
    .catch(err => console.log(err));
}

function renameBoardTitle(event, selector, socketMsg, elements) {
  const addSaveTitleEvent = eventType => {
   const handleNewTitle = (submitEvent, save) => {
      domManager.saveNewTitle(
        submitEvent, event,
        newTitle, newTitleForm,
        dataHandler.renameBoard, renameBoardTitle,
        socketMsg, save,
        selector, elements
      );
    };
    newTitleForm.addEventListener(eventType, submitEvent => {
      if (title !== newTitle.value) {
        handleNewTitle(submitEvent, true);
        socket.send(socketMsg);
      }
      handleNewTitle(submitEvent, false);
    });
  };

  const title = event.target.innerText;
  event.target.outerHTML = `<form id="new-title-form" style="display: inline-block;" class="board-title">
                              <input type="text" id="new-title" value="${title}">
                              <button type="submit" style="margin-left: 15px;">save</button>
                            </form>`;
  const newTitleForm = document.querySelector('#new-title-form');
  const newTitle = document.querySelector('#new-title');
  newTitle.focus();

  addSaveTitleEvent('submit');
  addSaveTitleEvent('focusout');
}
import { dataHandler } from "../data/dataHandler.js";
import { htmlFactory, htmlTemplates } from "../view/htmlFactory.js";
import { domManager } from "../view/domManager.js";
import { boardsManager } from "./boardsManager.js";
import { showPopup, loginPopup, flashes, flashList, createColumnPopup } from "../popup.js";
import { socket } from "../main.js";
import { cardsManager } from "./cardsManager.js";

export let columnsManager = {
  loadColumns: async function(boardId) {
    const columns = await dataHandler.getStatuses(boardId);
    for(let column in columns) {
      column = columns[column];
      const columnBuilder = htmlFactory(htmlTemplates.column);
      const content = columnBuilder(column, boardId);
      domManager.addChild(`.board-columns[data-board-id="${boardId}"]`, content);
      domManager.addEventListener(
        `.board-column-remove[data-column-id="${column.id}"][data-board-id="${boardId}"]`,
        "click",
        removeColumnButtonHandler
      );
      domManager.addEventListener(
        `.board-column-title[data-column-id="${column.id}"][data-board-id="${boardId}"]`,
        "click",
        event => {
          renameColumnTitle(event, column.id, boardId)
        }
      );
    }
  },
  createColumn: function(columnTitle, boardId) {
    dataHandler.createColumn(boardId, columnTitle)
      .then(response => {
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
        showPopup(flashes);
      })
      .catch(err => console.log(err));
    boardsManager.reloadBoards(userId);
  },
  reloadColumns: async function(boardId) {
    if(domManager.hasChild(`.board-columns[data-board-id="${boardId}"]`)) {
      domManager.removeAllChildren(`.board-columns[data-board-id="${boardId}"]`);
      const cardsHeader = document.querySelector(`.board-card-header[data-board-id="${boardId}"]`);
      if(cardsHeader) {
        cardsHeader.remove();
      }
      this.loadColumns(boardId)
        .then(() => cardsManager.loadCards(boardId))
        .then(() => {
          setTimeout(async () => {
            await this.verifyLoadedColumns(boardId);
          }, 3000);
        })
        .catch(err => console.log(err));
    }
  },
  verifyLoadedColumns: async function(boardId) {
    const columns = await dataHandler.getStatuses(boardId);
    const loadedColumns = document.querySelectorAll(`.board-column[data-board-id="${boardId}"]`);

    if(columns.length !== loadedColumns.length) {
      try {
        await this.reloadColumns(boardId);
      } catch(err) {
        console.log(err);
      }
    }
  },
}

function removeColumnButtonHandler(clickEvent) {
  if(userId !== 0 && confirm('Are you sure want to delete that column?')) {
    const boardId = clickEvent.target.dataset.boardId;
    const columnId = clickEvent.target.dataset.columnId;
    dataHandler.removeColumn(boardId, columnId)
      .then(response => {
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
        showPopup(flashes);
      })
      .catch(err => console.log(err));
    boardsManager.reloadBoards(userId);
  } else {
    showPopup(loginPopup);
  }
}


const saveNewColumnTitle = (submitEvent, event, columnId, boardId, newTitle, newTitleForm) => {
  submitEvent.preventDefault();
  event.target.innerText = newTitle.value;
  newTitleForm.outerHTML = event.target.outerHTML;
  dataHandler.renameColumn(columnId, boardId, newTitle.value)
    .then(response => {
      flashList.innerHTML = '';
      flashList.innerHTML = `<li>${response.message}</li>`;
      showPopup(flashes);
    })
    .catch(err => console.log(err));
  newTitleForm.reset();
  domManager.addEventListener(
    `.board-column-title[data-column-id="${columnId}"][data-board-id="${boardId}"]`,
    "click",
    event => {
      renameColumnTitle(event, columnId, boardId);
    }
  );
};

function renameColumnTitle(event, columnId, boardId) {
  const title = event.target.innerText;
  event.target.outerHTML = `<form id="new-title-form" style="display: inline-block;" class="board-column-title"><input type="text" id="new-title" maxlength="25" value="${title}"></form>`;
  const newTitleForm = document.querySelector('#new-title-form');
  const newTitle = document.querySelector('#new-title');
  newTitle.focus();
  newTitleForm.addEventListener('submit', submitEvent => {
    saveNewColumnTitle(submitEvent, event, columnId, boardId, newTitle, newTitleForm);
    socket.send(boardId);
  });
  newTitleForm.addEventListener('focusout', submitEvent => {
    saveNewColumnTitle(submitEvent, event, columnId, boardId, newTitle, newTitleForm);
    socket.send(boardId);
  });
}
import { dataHandler } from "../data/dataHandler.js";
import { htmlFactory, htmlTemplates } from "../view/htmlFactory.js";
import { domManager } from "../view/domManager.js";
import { showPopup, loginPopup, flashes, flashList } from "../popup.js";
import { socket } from "../main.js";
import { cardsManager } from "./cardsManager.js";

export let columnsManager = {
  loadColumns: async function(boardId) {
    domManager.addChild(
      `.board-header[data-board-id="${boardId}"]`,
      `<div class="board-card-header" data-board-id="${boardId}"></div>`,
      'afterend'
    );
    const columns = await dataHandler.getStatuses(userId, boardId);
    if (columns) {
      console.log('columns', columns);
      for (let column in columns) {
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
            renameColumnTitle(
              event,
              `.board-column-title[data-column-id="${column.id}"][data-board-id="${boardId}"]`,
              boardId,
              [column.id, boardId]
            )
          }
        );
      }
    }
  },
  createColumn: function(columnTitle, boardId) {
    dataHandler.createColumn(userId, boardId, columnTitle)
      .then(response => {
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
        showPopup(flashes);
        socket.send(boardId);
      })
      .catch(err => console.log(err));
  },
  reloadColumns: async function(boardId) {
    const boardColumns = document.querySelector(`.board-columns[data-board-id="${boardId}"]`);
    if (boardColumns && domManager.hasChild(`.board-columns[data-board-id="${boardId}"]`)) {
      domManager.removeAllChildren(`.board-columns[data-board-id="${boardId}"]`);
      const cardsHeader = document.querySelector(`.board-card-header[data-board-id="${boardId}"]`);
      if (cardsHeader) {
        cardsHeader.remove();
      }
      this.loadColumns(boardId)
        .then(() => cardsManager.loadCards(boardId))
        .then(() => {
          cardsManager.initDragAndDrop(boardId);
          setTimeout(async () => {
            await this.verifyLoadedColumns(boardId);
          }, 3000);
        })
        .catch(err => console.log(err));
    }
  },
  verifyLoadedColumns: async function(boardId) {
    const columns = await dataHandler.getStatuses(userId, boardId);
    const loadedColumns = document.querySelectorAll(`.board-column[data-board-id="${boardId}"]`);

    if (columns.length !== loadedColumns.length) {
      try {
        await this.reloadColumns(boardId);
      } catch (err) {
        console.log(err);
      }
    }
  },
}

function removeColumnButtonHandler(clickEvent) {
  if (userId !== 0 && confirm('Are you sure want to delete that column?')) {
    const boardId = clickEvent.target.dataset.boardId;
    const columnId = clickEvent.target.dataset.columnId;
    dataHandler.removeColumn(userId, boardId, columnId)
      .then(response => {
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
        showPopup(flashes);
        socket.send(boardId);
      })
      .catch(err => console.log(err));
  } else if (userId === 0) {
    showPopup(loginPopup);
  }
}

function renameColumnTitle(event, selector, socketMsg, elements) {
  const addSaveTitleEvent = eventType => {
    const handleNewTitle = (submitEvent, save) => {
      domManager.saveNewTitle(
        submitEvent, event,
        newTitle, newTitleForm,
        dataHandler.renameColumn, renameColumnTitle,
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
  event.target.outerHTML = `<form id="new-title-form" style="display: inline-block;" class="board-column-title">
                              <input type="text" id="new-title" maxlength="25" value="${title}">
                            </form>`;
  const newTitleForm = document.querySelector('#new-title-form');
  const newTitle = document.querySelector('#new-title');
  newTitle.focus();

  addSaveTitleEvent('submit');
  addSaveTitleEvent('focusout');
}
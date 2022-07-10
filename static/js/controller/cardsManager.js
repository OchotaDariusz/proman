import { dataHandler } from "../data/dataHandler.js";
import { htmlFactory, htmlTemplates } from "../view/htmlFactory.js";
import { domManager } from "../view/domManager.js";
import { socket } from "../main.js";
import { flashes, flashList, loginPopup, showPopup, closePopup, createCardPopup, createCardStatus } from "../popup.js";
import { boardsManager, loadBoardContent } from "./boardsManager.js";

export let cardsManager = {
  loadCards: async function(boardId, archived = false) {
    getCards(userId, boardId, archived)
      .then(cards => {
        if(cards) {
          console.log('cards', cards);
          for(let card of cards) {
            const cardBuilder = htmlFactory(htmlTemplates.card);
            const content = cardBuilder(card);
            domManager.addChild(
              `.board-column-content[data-column-id="${card.status_id}"][data-board-id="${boardId}"]`,
              content
            );
            if(card['user_id'] === userId) {
              domManager.addEventListener(
                `.card-remove[data-card-id="${card.id}"]`,
                "click",
                deleteButtonHandler
              );
              domManager.addEventListener(
                `.card-archive[data-card-id="${card.id}"]`,
                "click",
                archiveButtonHandler
              );
              domManager.addEventListener(
                `.card-title[data-card-board-id="${card.board_id}"][data-card-id="${card.id}"]`,
                "click",
                event => {
                  renameCardTitle(
                    event,
                    `.card-title[data-card-board-id="${card.board_id}"][data-card-id="${card.id}"]`,
                    card.board_id,
                    [card]);
                }
              );
            }
          }
        }
      })
      .catch(err => console.log(err));
  },
  initDragAndDrop: function(boardId) {
    let current = null;
    let cards = document.querySelectorAll(`.card[data-card-board-id="${boardId}"]`);
    for(let card of cards) {
      card.ondragstart = () => {
        current = card;
        card.classList.add("dragged");
      };
      card.ondragend = () => {
        card.classList.remove("dragged");
        current = null;
      };
      card.ondragover = (e) => {
        e.preventDefault();
      };
      card.ondrop = (e) => {
        handleDropOnCardEvent(current, card, cards, boardId);
      }
    }
    let columns = document.querySelectorAll(`.board-column-content[data-board-id="${boardId}"]`);
    for(let column of columns) {
      if(column.childNodes.length === 0) {
        column.ondragover = (e) => {
          e.preventDefault();
        };
        column.ondrop = async function() {
          column.appendChild(current);
          updateCardsData(current, column.dataset.columnId, 1, cards, boardId)
            .then(() => socket.send(boardId))
            .catch(err => console.log(err));
        }
      }
    }
  },
  createCard: async function(cardTitle, boardId, statusId, userId) {
    closePopup(createCardPopup);
    showPopup(flashes);
    dataHandler.createNewCard(cardTitle, boardId, statusId, userId)
      .then(response => {
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
        socket.send(boardId);
      })
      .catch(err => console.log(err));
  },
};

async function getCards(userId, boardId, archived) {
  if(archived === true) {
    return await setup_cards(dataHandler.getArchivedCardsByBoardId, userId, boardId, 'Archived cards', 'archived_cards');
  } else {
    return await setup_cards(dataHandler.getCardsByBoardId, userId, boardId, 'Cards', 'cards');
  }
}

export function showCreateCardForm(boardId) {
  dataHandler.getStatuses(userId, boardId)
    .then(statuses => {
      createCardStatus.innerHTML = '';
      statuses.forEach(status => {
        createCardStatus.innerHTML += `<option value="${status.id}">${status.title}</option>`
      });
    })
    .catch(err => console.log(err));
  localStorage.setItem('boardId', boardId)
  showPopup(createCardPopup)
}

async function setup_cards(callback, userId, boardId, cards_header, localStorageKey) {
  let cards = await callback(userId, boardId);
  const cardsHeader = document.querySelector(`.board-card-header[data-board-id="${boardId}"]`)
  if(cardsHeader) {
    cardsHeader.innerText = cards_header;
  }
  if(cards && cards.hasOwnProperty('message')) {
    flashList.innerHTML = '';
    flashList.innerHTML = `<li>${cards.message}</li>`;
    showPopup(flashes);
  } else if(cards) {
    if(cards && localStorage.getItem(localStorageKey) === null) {
      localStorage.setItem(localStorageKey, JSON.stringify(cards));
    } else if(!cards && localStorage.getItem(localStorageKey) !== null) {
      return Array.from(JSON.parse(localStorage.getItem(localStorageKey)));
    }
    return cards;
  }
  if(cards.hasOwnProperty('message')) {
    if(userId === 0) {
      if(!cards.message.startsWith('Cards')) {
        localStorage.setItem('boardId', boardId);
        boardsManager.closeBoards()
          .then(() => showPopup(loginPopup))
          .then()
          .catch(err => console.log(err));
      }
    }
  }
}

function archiveButtonHandler(clickEvent) {
  buttonHandler(
    dataHandler.archiveCard,
    clickEvent,
    'Are you sure want to archive/unarchive that card?'
  );
}

function deleteButtonHandler(clickEvent) {
  buttonHandler(
    dataHandler.deleteCard,
    clickEvent,
    'Are you sure want to delete that card?'
  );
}

function buttonHandler(callback, clickEvent, confirmationMessage) {
  const boardId = clickEvent.target.dataset.cardBoardId;
  const cardId = clickEvent.target.dataset.cardId;
  if(confirm(confirmationMessage)) {
    callback(boardId, cardId, userId)
      .then(response => {
        console.log('kurwa', response)
        closePopup(createCardPopup);
        showPopup(flashes);
        flashList.innerHTML = '';
        flashList.innerHTML = `<li>${response.message}</li>`;
      })
      .catch(err => console.log(err));
    socket.send(boardId);
  }
}

function renameCardTitle(event, selector, socketMsg, elements) {
  const addSaveTitleEvent = eventType => {
    const handleNewTitle = (submitEvent, save) => {
      domManager.saveNewTitle(
        submitEvent, event,
        newTitle, newTitleForm,
        dataHandler.renameCard, renameCardTitle,
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
  event.target.outerHTML = `<form id="new-card-title-form" style="display: inline-block;" class="card-title">
                              <input type="text" id="new-card-title" value="${title}">
                              <button type="submit">save</button>
                            </form>`;
  const newTitleForm = document.querySelector('#new-card-title-form');
  const newTitle = document.querySelector('#new-card-title');
  newTitle.focus();

  addSaveTitleEvent('submit');
  addSaveTitleEvent('focusout');
}

function handleDropOnCardEvent(draggedCard, dropZoneCard, cards, boardId) {
  if(dropZoneCard !== draggedCard) {
    if(draggedCard.dataset.statusId === dropZoneCard.dataset.statusId &&
      draggedCard.dataset.order < dropZoneCard.dataset.order) {
      dropZoneCard.parentElement.insertBefore(draggedCard, dropZoneCard.nextSibling);
    } else {
      dropZoneCard.parentElement.insertBefore(draggedCard, dropZoneCard);
    }
    updateCardsData(draggedCard, dropZoneCard.dataset.statusId, dropZoneCard.dataset.order,
      cards, boardId).then(() => socket.send('a')).catch(err => console.log(err));
  }
}

async function updateCardsData(dragged, dropStatusId, dropOrder, cards, boardId) {
  let newCardData;
  let dragStatusId = dragged.dataset.statusId;
  let dragOrder = dragged.dataset.order;
  dragged.dataset.order = dropOrder;
  dragged.dataset.statusId = dropStatusId;
  newCardData = [{ 'id': dragged.dataset.cardId, 'status_id': dropStatusId, 'card_order': dropOrder }]
  cards.forEach(c => {
    if((dragStatusId === dropStatusId && dragOrder < dropOrder && c.dataset.order <= dropOrder ||
        dragStatusId !== dropStatusId) && c.dataset.statusId === dragStatusId &&
      c.dataset.order > dragOrder && c !== dragged) {
      c.dataset.order = String(Number(c.dataset.order) - 1);
      newCardData.push({
        'id': c.dataset.cardId,
        'status_id': c.dataset.statusId,
        'card_order': c.dataset.order
      })
    } else if((dragStatusId === dropStatusId && c.dataset.statusId === dragStatusId && c.dataset.order < dragOrder ||
        dragStatusId !== dropStatusId && c.dataset.statusId === dropStatusId) &&
      c.dataset.order >= dropOrder && c !== dragged) {
      c.dataset.order = String(Number(c.dataset.order) + 1);
      newCardData.push({
        'id': c.dataset.cardId,
        'status_id': c.dataset.statusId,
        'card_order': c.dataset.order
      })
    }
  })
  await dataHandler.updateCards(boardId, userId, newCardData);
}

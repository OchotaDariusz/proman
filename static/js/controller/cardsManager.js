import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";
import {socket} from "../main.js";
import {flashes, flashList, showPopup} from "../popup.js";

export let cardsManager = {
    loadCards: async function (boardId, archived = false) {
        let cards;
        if (archived === true) {
            cards = await dataHandler.getArchivedCardsByBoardId(userId, boardId);
        } else {
            cards = await dataHandler.getCardsByBoardId(userId, boardId);
        }
        for (let card of cards) {
            const cardBuilder = htmlFactory(htmlTemplates.card);
            const content = cardBuilder(card);
            domManager.addChild(`.board-column-content[data-column-id="${card.status_id}"][data-board-id="${boardId}"]`, content)
            if (card['user_id'] === userId) {
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
                        renameCardTitle(event, card);
                    }
                );
            }
        }
    },
    initDragAndDrop: function (boardId) {
        let current = null;
        let cards = document.querySelectorAll(`.card[data-card-board-id="${boardId}"]`);
        for (let card of cards) {
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
        for (let column of columns) {
            if (column.childNodes.length === 0) {
                column.ondragover = (e) => {
                    e.preventDefault();
                };
                column.ondrop = async function () {
                    column.appendChild(current);
                    updateCardsData(current, column.dataset.columnId, 1, cards, boardId)
                        .then(() => socket.send('a'))
                        .catch(err => console.log(err));
                }
            }
        }
    },
    createCard: function (cardTitle, boardId, statusId) {
        dataHandler.createNewCard(cardTitle, boardId, statusId, userId)
            .then(response => {
                flashList.innerHTML = '';
                flashList.innerHTML = `<li>${response.message}</li>`;
                showPopup(flashes);
            })
            .catch(err => console.log(err));
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => card.remove());
        this.loadCards(boardId)
            .then(() => {
                socket.send('a');
            })
            .catch(err => console.log(err));
    }
};

function archiveButtonHandler(clickEvent) {
    const boardId = clickEvent.target.dataset.cardBoardId;
    const cardId = clickEvent.target.dataset.cardId;
    if (confirm('Are you sure want to archive/unarchive that card?')) {
        dataHandler.archiveCard(boardId, cardId, userId)
            .then(response => {
                flashList.innerHTML = '';
                flashList.innerHTML = `<li>${response.message}</li>`;
                showPopup(flashes);
            })
            .catch(err => console.log(err));
        socket.send('a');
    }
}

function deleteButtonHandler(clickEvent) {
    const boardId = clickEvent.target.dataset.cardBoardId;
    const cardId = clickEvent.target.dataset.cardId;
    if (confirm('Are you sure want to delete that card?')) {
        dataHandler.deleteCard(boardId, cardId, userId)
            .then(response => {
                flashList.innerHTML = '';
                flashList.innerHTML = `<li>${response.message}</li>`;
                showPopup(flashes);
            })
            .catch(err => console.log(err));
        socket.send('a');
    }
}

const saveNewCardTitle = (submitEvent, event, card, newTitle, newTitleForm) => {
    submitEvent.preventDefault();
    event.target.innerText = newTitle.value;
    newTitleForm.outerHTML = event.target.outerHTML;
    dataHandler.renameCard(card.board_id, card.id, newTitle.value, userId)
        .then(response => {
            flashList.innerHTML = '';
            flashList.innerHTML = `<li>${response.message}</li>`;
            showPopup(flashes);
        })
        .catch(err => console.log(err));
    newTitleForm.reset();
    domManager.addEventListener(
        `.card-title[data-card-board-id="${card.board_id}"][data-card-id="${card.id}"]`,
        "click",
        event => {
            renameCardTitle(event, card);
        }
    );
};

function renameCardTitle(event, card) {
    const title = event.target.innerText;
    event.target.outerHTML = `<form id="new-card-title-form" style="display: inline-block;" class="card-title"><input type="text" id="new-card-title" value="${title}"><button type="submit">save</button></form>`;
    const newTitleForm = document.querySelector('#new-card-title-form');
    const newTitle = document.querySelector('#new-card-title');
    newTitle.focus();
    newTitleForm.addEventListener('submit', submitEvent => {
        saveNewCardTitle(submitEvent, event, card, newTitle, newTitleForm);
        socket.send('a');
    });
    newTitleForm.addEventListener('focusout', submitEvent => {
        saveNewCardTitle(submitEvent, event, card, newTitle, newTitleForm);
        socket.send('a');
    });
}


function handleDropOnCardEvent(draggedCard, dropZoneCard, cards, boardId) {
    if (dropZoneCard !== draggedCard) {
        if (draggedCard.dataset.statusId === dropZoneCard.dataset.statusId &&
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
    newCardData = [{'id': dragged.dataset.cardId, 'status_id': dropStatusId, 'card_order': dropOrder}]
    cards.forEach(c => {
        if ((dragStatusId === dropStatusId && dragOrder < dropOrder && c.dataset.order <= dropOrder ||
                dragStatusId !== dropStatusId) && c.dataset.statusId === dragStatusId &&
            c.dataset.order > dragOrder && c !== dragged) {
            c.dataset.order = String(Number(c.dataset.order) - 1);
            newCardData.push({
                'id': c.dataset.cardId,
                'status_id': c.dataset.statusId,
                'card_order': c.dataset.order
            })
        } else if ((dragStatusId === dropStatusId && c.dataset.statusId === dragStatusId && c.dataset.order < dragOrder ||
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

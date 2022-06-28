import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";
import {socket} from "../main.js";

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
            if (card.user_id === userId) {
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
            initDragAndDrop(boardId, cards);
        }
    },
    createCard: async function (cardTitle, boardId, statusId) {
        await dataHandler.createNewCard(cardTitle, boardId, statusId, userId);
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => card.remove());
        await this.loadCards(boardId);
        socket.send('a');
    },
};

async function archiveButtonHandler(clickEvent) {
    const boardId = clickEvent.target.parentElement.dataset.cardBoardId;
    const cardId = clickEvent.target.parentElement.dataset.cardId;
    if (confirm('Are you sure want to archive/unarchive that card?')) {
        await dataHandler.archiveCard(boardId, cardId, userId);
        socket.send('a');
    }
}

async function deleteButtonHandler(clickEvent) {
    const boardId = clickEvent.target.parentElement.dataset.cardBoardId;
    const cardId = clickEvent.target.parentElement.dataset.cardId;
    if (confirm('Are you sure want to delete that card?')) {
        await dataHandler.deleteCard(boardId, cardId, userId);
        clickEvent.target.parentElement.parentElement.remove();
        socket.send('a');
    }
}

const saveNewCardTitle = async (submitEvent, event, card, newTitle, newTitleForm) => {
    submitEvent.preventDefault();
    event.target.innerText = newTitle.value;
    newTitleForm.outerHTML = event.target.outerHTML;
    await dataHandler.renameCard(card.board_id, card.id, newTitle.value, userId)
    newTitleForm.reset();
    domManager.addEventListener(
        `.card-title[data-card-board-id="${card.board_id}"][data-card-id="${card.id}"]`,
        "click",
        event => {
            renameCardTitle(event, card);
        }
    );
};

async function renameCardTitle(event, card) {
    const title = event.target.innerText;
    event.target.outerHTML = `<form id="new-card-title-form" style="display: inline-block;" class="card-title"><input type="text" id="new-card-title" value="${title}"><button type="submit">save</button></form>`;
    const newTitleForm = document.querySelector('#new-card-title-form');
    const newTitle = document.querySelector('#new-card-title');
    newTitle.focus();
    newTitleForm.addEventListener('submit', async submitEvent => {
        await saveNewCardTitle(submitEvent, event, card, newTitle, newTitleForm);
        socket.send('a');
    });
    newTitleForm.addEventListener('focusout', async submitEvent => {
        await saveNewCardTitle(submitEvent, event, card, newTitle, newTitleForm);
        socket.send('a');
    });
}

function initDragAndDrop(boardId, cardsFromDB) {
    let current = null;
    let cards = document.querySelectorAll(`.card[data-card-board-id="${boardId}"]`);
    for (let card of cards) {
        card.ondragstart = (e) => {
            current = card;
            console.log(current);
            card.classList.add("dragged");
        };
        card.ondragend = () => {
            card.classList.remove("dragged");
            current = null;
        };
        card.ondragenter = () => {
            if (card !== current) {
                card.classList.add("drop-zone");
            }
        };
        card.ondragover = (e) => {
            e.preventDefault();
        }
        card.ondragleave = () => {
            if (card !== current) {
                card.classList.remove("drop-zone");
            }
        };
        card.ondrop = (e) => {
            e.preventDefault();
            if (card !== current) {
                let [currentStatus, currentOrder] = get_card_status_and_order(current.dataset.cardId, cardsFromDB);
                let [dropStatus, dropOrder] = get_card_status_and_order(card.dataset.cardId, cardsFromDB);
                if (currentStatus === dropStatus && currentOrder < dropOrder) {
                    card.parentElement.insertBefore(current, card.nextSibling);
                    update_cards(cardsFromDB,)

                } else {
                    card.parentElement.insertBefore(current, card);
                }
            }
        };
    }
}

function get_card_status_and_order(card_id, cards) {
    for (let card of cards) {
        if (card.id == card_id) {
            return [card.status_id, card.card_order];
        }
    }
}
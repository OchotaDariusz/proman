import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";

export let cardsManager = {
    loadCards: async function (boardId) {
        const cards = await dataHandler.getCardsByBoardId(userId, boardId);
        for (let card of cards) {
            const cardBuilder = htmlFactory(htmlTemplates.card);
            const content = cardBuilder(card);
            domManager.addChild(`.board-column-content[data-column-id="${card.status_id}"][data-board-id="${boardId}"]`, content)
            domManager.addEventListener(
                `.card-remove[data-card-id="${card.id}"]`,
                "click",
                deleteButtonHandler
            );
            if (card.user_id === userId) {
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
    createCard: async function (cardTitle, boardId, statusId) {
        await dataHandler.createNewCard(cardTitle, boardId, statusId, userId);
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => card.remove());
        await this.loadCards(boardId);
    },
};

async function deleteButtonHandler(clickEvent) {
    const boardId = clickEvent.target.parentElement.dataset.cardBoardId;
    const cardId = clickEvent.target.parentElement.dataset.cardId;
    if (confirm('Are you sure want to delete that card?')) {
        await dataHandler.deleteCard(boardId, cardId, userId);
        clickEvent.target.parentElement.parentElement.remove();
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
    });
    newTitleForm.addEventListener('focusout', async submitEvent => {
        await saveNewCardTitle(submitEvent, event, card, newTitle, newTitleForm);
    });
}
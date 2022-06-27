import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";
import {cardsManager} from "./cardsManager.js";
import {showPopup} from "../popup.js";
import {columnsManager} from "./columnsManager.js";

export let boardsManager = {
    loadBoards: async function (userId) {
        const boards = await dataHandler.getBoards(userId);
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
            await domManager.addEventListener(
                `.board-add[data-board-id="${board.id}"]`,
                "click",
                async () => {
                    const createCardPopup = document.querySelector('#create-card');
                    localStorage.setItem('boardId', board.id);
                    if (userId === 0) {
                        const loginPopup = document.querySelector('#login-popup');
                        showPopup(loginPopup);
                    } else {
                        showPopup(createCardPopup);
                    }
                }
            );
            if (board.user_id === userId) {
                domManager.addEventListener(
                    `.board-title[data-board-id="${board.id}"]`,
                    "click",
                    event => {
                        renameBoardTitle(event, board);
                    }
                );
            }
            domManager.addEventListener(`.fas.fa-trash-alt.board[data-board-id="${board.id}"]`,
                "click",
                async () => {
                    if (confirm("Are you sure you want to delete this board?")) {
                        await dataHandler.deleteBoard(board.id, userId)
                        const boardToRemove = document.querySelector(`.board[data-board-id="${board.id}"]`);
                        boardToRemove.remove();
                    }
                });
        }
    },
    createBoard: async function(boardTitle, public_private) {
        await dataHandler.createNewBoard(boardTitle, public_private, userId);
        const sectionsBoard = document.querySelectorAll('section.board');
        sectionsBoard.forEach(section => section.remove());
        await this.loadBoards(userId);
    },
};

function showHideButtonHandler(clickEvent) {
    const boardId = clickEvent.target.dataset.boardId;
    if (domManager.hasChild(`.board-columns[data-board-id="${boardId}"]`)) {
        domManager.removeAllChildren(`.board-columns[data-board-id="${boardId}"]`);
    } else {
        loadBoardContent(boardId);
    }
    domManager.toggleCSSClasses(`.fas[data-board-id="${boardId}"]`, 'fa-chevron-down', 'fa-chevron-up');
}

async function loadBoardContent(boardId) {
    await columnsManager.loadColumns(boardId);
    cardsManager.loadCards(boardId);
}

const saveNewBoardTitle = async (submitEvent, event, board, newTitle, newTitleForm) => {
    submitEvent.preventDefault();
    event.target.innerText = newTitle.value;
    newTitleForm.outerHTML = event.target.outerHTML;
    await dataHandler.renameBoard(board.id, newTitle.value, userId);
    newTitleForm.reset();
    domManager.addEventListener(
        `.board-title[data-board-id="${board.id}"]`,
        "click",
        event => {
            renameBoardTitle(event, board);
        }
    );
};

async function renameBoardTitle(event, board) {
    const title = event.target.innerText;
    event.target.outerHTML = `<form id="new-title-form" style="display: inline-block;" class="board-title"><input type="text" id="new-title" value="${title}"><button type="submit" style="margin-left: 15px;">save</button></form>`;
    const newTitleForm = document.querySelector('#new-title-form');
    const newTitle = document.querySelector('#new-title');
    newTitle.focus();
    newTitleForm.addEventListener('submit', async submitEvent => {
        await saveNewBoardTitle(submitEvent, event, board, newTitle, newTitleForm);
    });
    newTitleForm.addEventListener('focusout', async submitEvent => {
        await saveNewBoardTitle(submitEvent, event, board, newTitle, newTitleForm);
    });
}
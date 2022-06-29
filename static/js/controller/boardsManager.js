import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";
import {cardsManager} from "./cardsManager.js";
import {
    showPopup,
    loginPopup,
    createCardPopup,
    createCardStatus,
    createColumnPopup,
    flashList,
    flashes
} from "../popup.js";
import {columnsManager} from "./columnsManager.js";
import {socket} from "../main.js";

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
            domManager.addEventListener(
                `.board-toggle-archived[data-board-id="${board.id}"]`,
                "click",
                showHideArchivedButtonHandler,
                //true
            );
            await domManager.addEventListener(
                `.board-add[data-board-id="${board.id}"]`,
                "click",
                () => {
                    addCardButtonHandler(board)
                });
            await domManager.addEventListener(
                `.board-add-column[data-board-id="${board.id}"]`,
                "click",
                () => {
                    addColumnButtonHandler(board)
                });
            if (board.user_id === userId) {
                domManager.addEventListener(
                    `.board-title[data-board-id="${board.id}"]`,
                    "click",
                    event => {
                        renameBoardTitle(event, board);
                    }
                );
                domManager.addEventListener(`.fas.fa-trash-alt.board[data-board-id="${board.id}"]`,
                    "click",
                    () => {
                        removeBoard(board);
                        socket.send('a');
                    });
            }
        }
    },
    createBoard: function (boardTitle, public_private) {
        dataHandler.createNewBoard(boardTitle, public_private, userId)
            .then(response => {
                flashList.innerHTML = '';
                flashList.innerHTML = `<li>${response.message}</li>`;
                showPopup(flashes);
            })
            .catch(err => console.log(err));
        socket.send('a');
    },
    reloadBoards: async function (userId) {
        const boardsIdToLoad = checkForLoadedContent();

        const boards = document.querySelectorAll('section.board');
        boards.forEach(board => {
            board.remove();
        });
        await this.loadBoards(userId);

        boardsIdToLoad.forEach(boardId => {
            loadBoardContent(boardId);
            domManager.toggleCSSClasses(`.fas[data-board-id="${boardId}"]`, 'fa-chevron-down', 'fa-chevron-up');
        });
    },
};

function addCardButtonHandler(board) {
    localStorage.setItem('boardId', board.id);
    if (userId === 0) {
        showPopup(loginPopup);
    } else {
        dataHandler.getStatuses(board.id)
            .then(statuses => {
                createCardStatus.innerHTML = '';
                statuses.forEach(status => {
                    createCardStatus.innerHTML += `<option value="${status.id}">${status.title}</option>`
                });
            })
            .catch(err => console.log(err));
        showPopup(createCardPopup);
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
    }
}

function checkForLoadedContent() {
    const openedBoardsId = [];
    const boardsContent = document.querySelectorAll('div.board-columns');
    boardsContent.forEach(boardContent => {
        if (boardContent.hasChildNodes()) {
            openedBoardsId.push(boardContent.dataset.boardId);
            boardContent.innerHTML = '';
        }
    });
    return openedBoardsId
}

function showHideButtonHandler(clickEvent) {
    const boardId = clickEvent.target.dataset.boardId;
    if (domManager.hasChild(`.board-columns[data-board-id="${boardId}"]`)) {
        domManager.removeAllChildren(`.board-columns[data-board-id="${boardId}"]`);
    } else {
        loadBoardContent(boardId);
    }
    domManager.toggleCSSClasses(`.fas[data-board-id="${boardId}"]`, 'fa-chevron-down', 'fa-chevron-up');
}

function showHideArchivedButtonHandler(clickEvent) {
    const boardId = clickEvent.target.dataset.boardId;
    if (domManager.hasChild(`.board-columns[data-board-id="${boardId}"]`)) {
        domManager.removeAllChildren(`.board-columns[data-board-id="${boardId}"]`);
    } else {
        loadBoardContentArchived(boardId);
    }
    domManager.toggleCSSClasses(`.fas[data-board-id="${boardId}"]`, 'fa-chevron-down', 'fa-chevron-up');
}

async function loadBoardContent(boardId) {
    await columnsManager.loadColumns(boardId);
    await cardsManager.loadCards(boardId);
}

async function loadBoardContentArchived(boardId) {
    await columnsManager.loadColumns(boardId);
    await cardsManager.loadCards(boardId, true);
}

const saveNewBoardTitle = (submitEvent, event, board, newTitle, newTitleForm) => {
    submitEvent.preventDefault();
    event.target.innerText = newTitle.value;
    newTitleForm.outerHTML = event.target.outerHTML;
    dataHandler.renameBoard(board.id, newTitle.value, userId)
        .then(response => {
            flashList.innerHTML = '';
            flashList.innerHTML = `<li>${response.message}</li>`;
            showPopup(flashes);
        })
        .catch(err => console.log(err));
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
        socket.send('a');
    });
    newTitleForm.addEventListener('focusout', async submitEvent => {
        await saveNewBoardTitle(submitEvent, event, board, newTitle, newTitleForm);
        socket.send('a');
    });
}
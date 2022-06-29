import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";
import {boardsManager} from "./boardsManager.js";
import {showPopup, loginPopup, flashes, flashList} from "../popup.js";

export let columnsManager = {
    loadColumns: async function (boardId) {
        const columns = await dataHandler.getStatuses(boardId);
        for (let column in columns) {
            column = columns[column];
            const columnBuilder = htmlFactory(htmlTemplates.column);
            const content = columnBuilder(column, boardId);
            domManager.addChild(`.board-columns[data-board-id="${boardId}"]`, content);
            domManager.addEventListener(
                `.board-columns[data-board-id="${boardId}"]`,
                "dragenter",
                dragEnterHandler
            );
            domManager.addEventListener(
                `.board-columns[data-board-id="${boardId}"]`,
                "dragover",
                dragOverHandler
            );
            domManager.addEventListener(
                `.board-columns[data-board-id="${boardId}"]`,
                "dragover",
                dragLeaveHandler
            );
            domManager.addEventListener(
                `.board-columns[data-board-id="${boardId}"]`,
                "drop",
                dropHandler
            );
            domManager.addEventListener(
                `.board-column-remove[data-column-id="${column.id}"][data-board-id="${boardId}"]`,
                "click",
                removeColumnButtonHandler
            );
        }
    },
    createColumn: async function (columnTitle, boardId) {
        await dataHandler.createColumn(boardId, columnTitle);
        await boardsManager.reloadBoards(userId);
    },
}

function dragEnterHandler(dragEnterEvent) {
    dragEnterEvent.target.classList.add("drop-zone")
}

function dragOverHandler(dragOverEvent) {
}

function dragLeaveHandler(dragLeaveEvent) {
    dragLeaveEvent.target.classList.remove("drop-zone")
}

function dropHandler(dragLeaveEvent) {
}

function removeColumnButtonHandler(clickEvent) {
    if (userId !== 0 && confirm('Are you sure want to delete that column?')) {
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

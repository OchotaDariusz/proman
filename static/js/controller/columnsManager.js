import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";

export let columnsManager = {
    loadColumns: async function (boardId) {
        const columns = await dataHandler.getStatuses();
        for (let column in columns) {
            column = columns[column];
            const columnBuilder = htmlFactory(htmlTemplates.column);
            const content = columnBuilder(column, boardId);
            domManager.addChild(`.board-columns[data-board-id="${boardId}"]`, content);
        }
    }
}
export const htmlTemplates = {
    board: 1,
    card: 2,
    column: 3
}

export const builderFunctions = {
    [htmlTemplates.board]: boardBuilder,
    [htmlTemplates.card]: cardBuilder,
    [htmlTemplates.column]: columnBuilder
};

export function htmlFactory(template) {
    if (builderFunctions.hasOwnProperty(template)) {
        return builderFunctions[template];
    }

    console.error("Undefined template: " + template);

    return () => {
        return "";
    };
}

function boardBuilder(board) {
    let boardComponent = `<section class="board" data-board-id="${board.id}">
                <div class="board-header" data-board-id="${board.id}">
                    <span class="board-title" data-board-id="${board.id}">${board.title}</span>
                    <button class="board-add" data-board-id="${board.id}">Add Card</button>
                    <button class="board-toggle" data-board-id="${board.id}">
                        <i class="fas fa-chevron-down" data-board-id="${board.id}"></i>
                   </button>`;
    boardComponent += (board.user_id === userId) ? `<button class="fas fa-trash-alt board" data-board-id="${board.id}"></button>` : ``;
    boardComponent += `</div>
                <div class="board-columns" data-board-id="${board.id}"></div> 
            </section>`;
    return boardComponent;
}

function cardBuilder(card) {
    let cardComponent = `<div class="card" data-card-id="${card.id}" data-card-board-id="${card.board_id}">`;
    cardComponent += (card.user_id === userId) ? `<div class="card-remove" data-card-id="${card.id}" data-card-board-id="${card.board_id}"><i class="fas fa-trash-alt" data-card-board-id="${card.board_id}"></i></div>` : ``;
    cardComponent += `<div class="card-title" data-card-board-id="${card.board_id}" data-card-id="${card.id}">${card.title}</div>`;
    return cardComponent;
}

function columnBuilder(column, boardId) {
    return `<div class="board-column" data-column-id="${column.id}">
                <div class="board-column-title">${column.title}</div>
                <div class="board-column-content" data-column-id="${column.id}" data-board-id="${boardId}"> </div>
            </div>`
}
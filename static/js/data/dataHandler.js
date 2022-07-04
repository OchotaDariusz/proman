export let dataHandler = {
    getBoards: async function (userId) {
        let boards = await apiGet(`/api/users/${userId}/boardss`);
        if (boards !== null) {
            return boards;
        } else {
            boards = Array.from(JSON.parse(localStorage.getItem('boards')));
            boards.filter(board => {
                return board['user_id'] === userId && board['public'] === false || board['public'];
            });
            return boards;
        }
    },
    getStatuses: async function (boardId) {
        return await apiGet(`/api/statuses/${boardId}`);
    },
    getCardsByBoardId: async function (userId, boardId) {
        return await apiGet(`/api/users/${userId}/boards/${boardId}/cards/`);
    },
    getArchivedCardsByBoardId: async function (userId, boardId) {
        return await apiGet(`/api/users/${userId}/boards/${boardId}/cards/archived`);
    },
    createNewBoard: async function (boardTitle, public_private, userId) {
        // creates new board, saves it and calls the callback function with its data
        let response = await apiPost(`/api/users/${userId}/boardss`, {
            "boardTitle": boardTitle,
            "public_private": public_private
        });
        if (!response) {
            const boards = Array.from(JSON.parse(localStorage.getItem('boards')));
            const newBoard = {
                id: boards[boards.length - 1].id + 1,
                public: (public_private === 'public'),
                title: boardTitle,
                user_id: userId
            };
            boards.push(newBoard);
            localStorage.setItem('boards', JSON.stringify(boards));
            return JSON.parse(JSON.stringify({'message': 'Successfully created.'}));
        } else {
            return response;
        }
    },
    createNewCard: async function (cardTitle, boardId, statusId, userId) {
        // creates new card, saves it and calls the callback function with its data
        return await apiPost(`/api/users/${userId}/boards/${boardId}/cards`, {
            "cardTitle": cardTitle,
            "statusId": statusId
        });
    },
    updateCards: async function (boardId, userId, cards) {
        // updates status and/or order after a card was dragged and dropped for all neighbor cards
        return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards`, {"cards": cards});
    },
    renameBoard: async function (boardId, boardTitle, userId) {
        return await apiPatch(`/api/users/${userId}/boards/${boardId}`, {"boardTitle": boardTitle});
    },
    deleteCard: async function (boardId, cardId, userId) {
        return await apiDelete(`/api/users/${userId}/boards/${boardId}/cards/${cardId}`);
    },
    archiveCard: async function (boardId, cardId, userId) {
        return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards/${cardId}/archive`);
    },
    deleteBoard: async function (boardId, userId) {
        // creates new board, saves it and calls the callback function with its data
        return await apiDelete(`/api/users/${userId}/boards/${boardId}`);
    },
    renameCard: async function (boardId, cardId, cardTitle, userId) {
        return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards/${cardId}`, {"cardTitle": cardTitle});
    },
    createColumn: async function (boardId, columnTitle) {
        return await apiPost(`/api/statuses/${boardId}`, {"columnTitle": columnTitle});
    },
    removeColumn: async function (boardId, columnId) {
        return await apiDelete(`/api/statuses/${boardId}`, {'columnId': columnId})
    },
    renameColumn: async function (columnId, boardId, columnTitle) {
        return await apiPatch(`/api/statuses/${boardId}`, {
            "columnTitle": columnTitle,
            "columnId": columnId
        });
    },
};

async function apiGet(url) {
    let response = await fetch(url, {
        method: "GET",
    });
    if (response.ok) {
        return await response.json();
    } else {
        return null;
    }
}

async function apiPost(url, payload) {
    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        return await response.json();
    } else {
        return null;
    }
}

async function apiDelete(url, payload = {"message": "empty"}) {
    let response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        return await response.json();
    }
}

async function apiPatch(url, payload = {"message": "empty"}) {
    let response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        return await response.json();
    }
}

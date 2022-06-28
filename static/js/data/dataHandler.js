export let dataHandler = {
    getBoards: async function (userId) {
        return await apiGet(`/api/users/${userId}/boards`);
    },
    getBoard: async function (userId, boardId) {
        // the board is retrieved and then the callback function is called with the board
        return await apiGet(`/api/users/${userId}/boards/${boardId}`);
    },
    getStatuses: async function () {
        return await apiGet(`/api/statuses`);
    },
    getStatus: async function (statusId) {
        return await apiGet(`/api/statuses/${statusId}`);
    },
    getCardsByBoardId: async function (userId, boardId) {
        return await apiGet(`/api/users/${userId}/boards/${boardId}/cards/`);
    },
    getArchivedCardsByBoardId: async function (userId, boardId) {
        return await apiGet(`/api/users/${userId}/boards/${boardId}/cards/archived`);
    },
    getCard: async function (cardId) {
        // the card is retrieved and then the callback function is called with the card
    },
    createNewBoard: async function (boardTitle, public_private, userId) {
        // creates new board, saves it and calls the callback function with its data
        return await apiPost(`/api/users/${userId}/boards`, {"boardTitle": boardTitle, "public_private": public_private});
    },
    createNewCard: async function (cardTitle, boardId, statusId, userId) {
        // creates new card, saves it and calls the callback function with its data
        return await apiPost(`/api/users/${userId}/boards/${boardId}/cards`, {"cardTitle": cardTitle, "statusId": statusId});
    },
    updateCards: async function (boardId, userId, cards) {
        // updates status and/or order after a card was dragged and dropped for all neighbor cards
        return await apiPost(`/api/users/${userId}/boards/${boardId}/cards`, {"cards": cards});
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
        await apiPatch(`/api/users/${userId}/boards/${boardId}/cards/${cardId}`, {"cardTitle": cardTitle});
    },
};

async function apiGet(url) {
    let response = await fetch(url, {
        method: "GET",
    });
    if (response.ok) {
        return await response.json();
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
    }
}

async function apiDelete(url) {
    let response = await fetch(url, {
        method: "DELETE",
    });
    if (response.ok) {
        return await response.json();
    }
}

async function apiPut(url) {
}

async function apiPatch(url, payload={"message": "empty"}) {
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

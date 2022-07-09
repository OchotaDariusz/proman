export let dataHandler = {
  getBoards: async function(userId) {
    return await apiGet(`/api/users/${userId}/boards`);
  },
  createNewBoard: async function(boardTitle, public_private, userId) {
    // creates new board, saves it and calls the callback function with its data
    return await apiPost(`/api/users/${userId}/boards`, {
      "boardTitle": boardTitle,
      "public_private": public_private
    });
  },
  renameBoard: async function(boardTitle, userId, board) {
    return await apiPatch(`/api/users/${userId}/boards/${board.id}`, { "boardTitle": boardTitle });
  },
  deleteBoard: async function(boardId, userId) {
    // creates new board, saves it and calls the callback function with its data
    return await apiDelete(`/api/users/${userId}/boards/${boardId}`);
  },
  getCardsByBoardId: function(userId, boardId) {
    return apiGet(`/api/users/${userId}/boards/${boardId}/cards/`);
  },
  getArchivedCardsByBoardId: function(userId, boardId) {
    return apiGet(`/api/users/${userId}/boards/${boardId}/cards/archived`);
  },
  createNewCard: async function(cardTitle, boardId, statusId, userId) {
    // creates new card, saves it and calls the callback function with its data
    return await apiPost(`/api/users/${userId}/boards/${boardId}/cards`, {
      "cardTitle": cardTitle,
      "statusId": statusId
    });
  },
  updateCards: async function(boardId, userId, cards) {
    // updates status and/or order after a card was dragged and dropped for all neighbor cards
    return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards`, { "cards": cards });
  },
  archiveCard: async function(boardId, cardId, userId) {
    return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards/${cardId}/archive`);
  },
  renameCard: async function(cardTitle, userId, boardId, cardId) {
    return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards/${cardId}`, { "cardTitle": cardTitle });
  },
  deleteCard: async function(boardId, cardId, userId) {
    return await apiDelete(`/api/users/${userId}/boards/${boardId}/cards/${cardId}`);
  },
  getStatuses: async function(userId, boardId) {
    return await apiGet(`/api/users/${userId}/statuses/${boardId}`);
  },
  createColumn: async function(userId, boardId, columnTitle) {
    return await apiPost(`/api/users/${userId}/statuses/${boardId}`, { "columnTitle": columnTitle });
  },
  removeColumn: async function(userId, boardId, columnId) {
    return await apiDelete(`/api/users/${userId}/statuses/${boardId}`, { 'columnId': columnId })
  },
  renameColumn: async function(columnTitle, userId, columnId, boardId) {
    return await apiPatch(`/api/users/${userId}/statuses/${boardId}`, {
      "columnTitle": columnTitle,
      "columnId": columnId
    });
  },
};

async function apiGet(url) {
  let response = await fetch(url, {
    method: "GET",
  });
  console.log(response)
  if(response.ok) {
    return await response.json();
  } else {
    const data = await response.json();
    if(data.hasOwnProperty('message')) {
      return data;
    }
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
  if(response.ok) {
    return await response.json();
  } else {
    const data = await response.json();
    if(data.hasOwnProperty('message')) {
      return data;
    }
    return null;
  }
}

async function apiDelete(url, payload = { "message": "empty" }) {
  let response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });
  if(response.ok) {
    return await response.json();
  } else {
    const data = await response.json();
    if(data.hasOwnProperty('message')) {
      return data;
    }
    return null;
  }
}

async function apiPatch(url, payload = { "message": "empty" }) {
  let response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });
  if(response.ok) {
    return await response.json();
  } else {
    const data = await response.json();
    if(data.hasOwnProperty('message')) {
      return data;
    }
    return null;
  }
}

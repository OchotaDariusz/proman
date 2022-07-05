export let dataHandler = {
  getBoards: async function(userId) {
    let boards = await apiGet(`/api/users/${userId}/boards`);
    if(boards && localStorage.getItem('boards') === null) {
      localStorage.setItem('boards', JSON.stringify(boards));
      return boards;
    } else if(boards && localStorage.getItem('boards') !== null) {
      const localBoards = Array.from(JSON.parse(localStorage.getItem('boards')));
      let verifyBoards;
      let numberOfBoardsToSync = 0;
      const boardsToSync = [];
      let localBoardId;
      for(let board of boards) {
        verifyBoards = false;
        for(let localBoard of localBoards) {
          if(board.title === localBoard.title && board.public === localBoard.public && board.user_id === localBoard.user_id) {
            verifyBoards = true;
            break;
          }
          localBoardId = localBoard.id;
        }
        if(verifyBoards) {
          continue;
        }
        boardsToSync.push(localBoardId);
        numberOfBoardsToSync++;
      }
      console.log((numberOfBoardsToSync) ? `Need to sync ${numberOfBoardsToSync} boards.` : 'No need to sync boards.');
      console.log('boards to sync from local storage:', boardsToSync);

      return boards;
    } else if(boards === null && localStorage.getItem('boards') !== null) {
      boards = Array.from(JSON.parse(localStorage.getItem('boards')));
      boards.filter(board => {
        return board['user_id'] === userId && board['public'] === false || board['public'];
      });
      return boards;
    } else {
      return [];
    }
  },
  getCardsByBoardId: function(userId, boardId) {
    return apiGet(`/api/users/${userId}/boards/${boardId}/cards/`);
  },
  getArchivedCardsByBoardId: function(userId, boardId) {
    return apiGet(`/api/users/${userId}/boards/${boardId}/cards/archived`);
  },
  createNewBoard: async function(boardTitle, public_private, userId) {
    // creates new board, saves it and calls the callback function with its data
    let response = await apiPost(`/api/users/${userId}/boards`, {
      "boardTitle": boardTitle,
      "public_private": public_private
    });
    if(!response) {
      const boards = Array.from(JSON.parse(localStorage.getItem('boards')));
      const newBoard = {
        id: boards[boards.length - 1].id + 1,
        public: (public_private === 'public'),
        title: boardTitle,
        user_id: userId
      };
      boards.push(newBoard);
      localStorage.setItem('boards', JSON.stringify(boards));
      return JSON.parse(JSON.stringify({ 'message': 'Successfully created.' }));
    } else {
      return response;
    }
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
  renameBoard: async function(boardTitle, userId, board) {
    return await apiPatch(`/api/users/${userId}/boards/${board.id}`, { "boardTitle": boardTitle });
  },
  deleteCard: async function(boardId, cardId, userId) {
    return await apiDelete(`/api/users/${userId}/boards/${boardId}/cards/${cardId}`);
  },
  archiveCard: async function(boardId, cardId, userId) {
    return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards/${cardId}/archive`);
  },
  deleteBoard: async function(boardId, userId) {
    // creates new board, saves it and calls the callback function with its data
    return await apiDelete(`/api/users/${userId}/boards/${boardId}`);
  },
  renameCard: async function(cardTitle, userId, boardId, cardId) {
    return await apiPatch(`/api/users/${userId}/boards/${boardId}/cards/${cardId}`, { "cardTitle": cardTitle });
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
    const data = await response.json();
    console.log(data, 'data')
    return data;
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
    const data = await response.json();
    console.log(data, 'data')
    return data;
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
    const data = await response.json();
    console.log(data, 'data')
    return data;
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
    const data = await response.json();
    console.log(data, 'data')
    return data;
  } else {
    const data = await response.json();
    if(data.hasOwnProperty('message')) {
      return data;
    }
    return null;
  }
}

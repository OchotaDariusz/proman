import {cardsManager} from "./controller/cardsManager.js";
import {boardsManager} from "./controller/boardsManager.js";
import {columnsManager} from "./controller/columnsManager.js";

export const loginPopup = document.querySelector('#login-popup');
const loginButton = document.querySelector('#login-button');
const loginForm = document.querySelector('#login');
const usernameLogin = document.querySelector('#username-login');
const passwordLogin = document.querySelector('#password-login');

const registerPopup = document.querySelector('#register-popup');
const registerButton = document.querySelector('#register-button');
const registerForm = document.querySelector('#register');
const usernameRegister = document.querySelector('#username-register');
const passwordRegister = document.querySelector('#password-register');
const passwordRegister2 = document.querySelector('#password2-register');

export const createCardPopup = document.querySelector('#create-card');
const createCardForm = document.querySelector('#create-card-form');
const createCardTitle = document.querySelector('#card-title');
export const createCardStatus = document.querySelector('#card-status');

export const createColumnPopup = document.querySelector('#create-column')
const createColumnForm = document.querySelector('#create-column-form')
const createColumnTitle = document.querySelector('#column-title')

const addBoardPopup = document.querySelector('#add-board-popup');
let addBoardButton = document.querySelector('#add-board-button');
let addBoardButtonLogin = document.querySelector('#add-board-button-login');
const addBoardTitle = document.querySelector('#board-title');
const addBoardForm = document.querySelector('#add-board');

const addPrivateBoardPopup = document.querySelector('#add-private-board-popup');
const addPrivateBoardButton = document.querySelector('#add-private-board-button');
const addPrivateBoardTitle = document.querySelector('#private-board-title');
const addPrivateBoardForm = document.querySelector('#add-private-board');

const popUps = document.querySelectorAll('.popup');
const form = document.querySelectorAll('.form');

let sectionsBoard;

const logoutButton = document.querySelector('.logout');

export const flashes = document.querySelector('.flashes');
export const flashList = document.querySelector('.flash');

export const showPopup = element => {
    element.classList.add('fade-in');
    element.classList.remove('fade-out');
    element.style.display = 'flex';
}

const closePopup = element => {
    element.classList.remove('fade-in');
    element.style.display = 'none';
}

if (loginButton) {
    loginButton.addEventListener('click', () => {
        showPopup(loginPopup);
    });
}

function addBoardButtonLoginAddEvent() {
    addBoardButtonLogin = document.querySelector('#add-board-button-login');
    addBoardButtonLogin = removeAllEventListeners(addBoardButtonLogin);
    addBoardButtonLogin.addEventListener('click', () => {
        showPopup(loginPopup);
    });
}

if (addBoardButtonLogin) {
    addBoardButtonLoginAddEvent();
}

if (registerButton) {
    registerButton.addEventListener('click', () => {
        showPopup(registerPopup);
    });
}

popUps.forEach(popUp => {
    popUp.addEventListener('click', () => {
        popUp.classList.remove('fade-in')
        popUp.classList.add('fade-out')
        setTimeout(() => {
            closePopup(popUp);
        }, 400);
    });
})

form.forEach(item => {
    item.addEventListener('click', event => {
        event.stopPropagation();
    });
});

loginForm.addEventListener('submit', event => {
    event.preventDefault();

    const urlTarget = `${window.location.href}login`;

    const userData = {
        username: usernameLogin.value,
        password: passwordLogin.value
    };

    sendRequest(urlTarget, userData)
        .then(() => {
            showPopup(flashes);
        })
        .catch(err => console.log(err));

    loginForm.reset();
    closePopup(loginPopup);
});

registerForm.addEventListener('submit', event => {
    event.preventDefault();

    const urlTarget = `${window.location.href}register`;

    const userData = {
        username: usernameRegister.value,
        password: passwordRegister.value,
        password2: passwordRegister2.value
    };
    sendRequest(urlTarget, userData)
        .then(() => {
            showPopup(flashes);
        })
        .catch(err => console.log(err));

    registerForm.reset();
    closePopup(registerPopup);
});

if (createCardForm) {
    createCardForm.addEventListener('submit', async event => {
        event.preventDefault();

        const cardTitle = createCardTitle.value;
        const cardStatus = createCardStatus.value;
        const boardId = localStorage.getItem('boardId');
        localStorage.removeItem('boardId');

        await cardsManager.createCard(cardTitle, boardId, cardStatus);

        createCardForm.reset();
        closePopup(createCardPopup);
    });
}

if (createColumnForm) {
    createColumnForm.addEventListener('submit', async event => {
        event.preventDefault();

        const columnTitle = createColumnTitle.value;
        const boardId = localStorage.getItem('boardId');
        localStorage.removeItem('boardId');

        await columnsManager.createColumn(columnTitle, boardId);

        createColumnForm.reset();
        closePopup(createColumnPopup);
    });
}

function addBoardButtonAddEvent() {
    addBoardButton = document.querySelector('#add-board-button');
    addBoardButton = removeAllEventListeners(addBoardButton);
    addBoardButton.addEventListener('click', () => {
        showPopup(addBoardPopup);
    });
}

if (addBoardButton) {
    addBoardButtonAddEvent();
}

addBoardForm.addEventListener('submit', async event => {
    event.preventDefault();

    const boardTitle = addBoardTitle.value;
    await boardsManager.createBoard(boardTitle, 'public', userId)
    closePopup(addBoardPopup);
});

if (addPrivateBoardButton) {
    addPrivateBoardButton.addEventListener('click', () => {
        showPopup(addPrivateBoardPopup);
    });
}

addPrivateBoardForm.addEventListener('submit', async event => {
    event.preventDefault();

    const boardTitle = addPrivateBoardTitle.value;
    await boardsManager.createBoard(boardTitle, 'private');
    closePopup(addPrivateBoardPopup);
});

async function reRenderDomForLoggedUser() {
    addPrivateBoardButton.style.display = 'inline-block';
    addBoardButtonLogin.id = 'add-board-button';
    addBoardButtonAddEvent();

    sectionsBoard = document.querySelectorAll('section.board');
    sectionsBoard.forEach(section => section.remove());
    await boardsManager.loadBoards(userId);

    loginButton.style.display = 'none';
    registerButton.style.display = 'none';
    logoutButton.style.display = 'inline-block';
    logoutButton.addEventListener('click', logout);
}

async function login(response) {
    userId = response['user_id'];
    await reRenderDomForLoggedUser();
}

async function reRenderDomForLoggedOutUser() {
    addPrivateBoardButton.style.display = 'none';
    addBoardButton.id = 'add-board-button-login';
    addBoardButtonLoginAddEvent();

    sectionsBoard = document.querySelectorAll('section.board');
    sectionsBoard.forEach(section => section.remove());
    await boardsManager.loadBoards(userId);

    loginButton.style.display = 'inline-block';
    registerButton.style.display = 'inline-block';
    logoutButton.style.display = 'none';
}

async function logout() {
    userId = 0;

    const urlTarget = `${window.location.href}logout`;

    sendRequest(urlTarget)
        .then(() => {
            showPopup(flashes);
        })
        .catch(err => console.log(err));

    await reRenderDomForLoggedOutUser();
}

async function sendRequest(urlTarget, userData = null) {
    fetch(urlTarget, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData),
    })
        .then(response => {
            flashList.innerHTML = '';
            return response.json()
        })
        .then(async response => {
            if (response.hasOwnProperty('user_id')) {
                await login(response);
                flashList.innerHTML = `<li>${response['message']}</li>`;
            } else {
                console.log(response['message']);
                flashList.innerHTML = `<li>${response['message']}</li>`;
            }
        })
        .catch(error => console.error(error));
}

function removeAllEventListeners(element) {
    let newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
}

logoutButton.addEventListener('click', logout);

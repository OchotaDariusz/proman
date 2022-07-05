import { flashes, flashList, showPopup } from "../popup.js";

export let domManager = {
  addChild(parentIdentifier, childContent, where = 'beforeend') {
    const parent = document.querySelector(parentIdentifier);
    if(parent) {
      parent.insertAdjacentHTML(where, childContent);
    } else {
      console.error("could not find such html element: " + parentIdentifier);
    }
  },
  addEventListener(elementIdentifier, eventType, eventHandler, once = false) {
    const parent = document.querySelector(elementIdentifier);
    if(parent) {
      parent.addEventListener(eventType, eventHandler, { once: once });
    } else {
      console.error("could not find such html element: " + elementIdentifier);
    }
  },
  removeAllChildren(parentIdentifier) {
    const parent = document.querySelector(parentIdentifier);
    parent.innerHTML = '';
  },
  hasChild(parentIdentifier) {
    const parent = document.querySelector(parentIdentifier);
    return parent.hasChildNodes();
  },
  toggleCSSClasses(elementIdentifier, ...cls) {
    const element = document.querySelector(elementIdentifier);
    cls.map(cl => element.classList.toggle(cl));
  },
  reloadRenameEventListener(selector, callback, socketMsg, elements) {
    console.log('elements', elements)
    domManager.addEventListener(
      selector,
      "click",
      event => {
        callback(event, selector, socketMsg, elements);
      }
    );
  },
  saveNewTitle(submitEvent, event, newTitle, newTitleForm, callback, renameCallback, socketMsg, save, selector, elements) {
    submitEvent.preventDefault();
    event.target.innerText = newTitle.value;
    newTitleForm.outerHTML = event.target.outerHTML;
    let callbackArg;
    if(elements.length === 1 && elements[0].hasOwnProperty('board_id')) {
      callbackArg = [elements[0].board_id, elements[0].id];
    } else if(elements.length === 2) {
      callbackArg = [...elements];
    } else {
      callbackArg = [elements[0]];
      console.log('callbackArg', callbackArg)
    }
    if(save) {
      console.log('to callback', newTitle.value, userId, ...callbackArg)
      callback(newTitle.value, userId, ...callbackArg)
        .then(response => {
          flashList.innerHTML = '';
          flashList.innerHTML = `<li>${response.message}</li>`;
          showPopup(flashes);
        })
        .catch(err => console.log(err));
    }
    newTitleForm.reset();
    this.reloadRenameEventListener(
      selector,
      renameCallback,
      socketMsg,
      callbackArg
    );
  }
};

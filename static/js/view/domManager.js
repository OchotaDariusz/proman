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
  }

};

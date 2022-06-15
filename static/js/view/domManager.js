export let domManager = {
    addChild(parentIdentifier, childContent) {
        const parent = document.querySelector(parentIdentifier);
        if (parent) {
            parent.insertAdjacentHTML("beforeend", childContent);
        } else {
            console.error("could not find such html element: " + parentIdentifier);
        }
    },
    addEventListener(parentIdentifier, eventType, eventHandler, once=false) {
        const parent = document.querySelector(parentIdentifier);
        if (parent) {
            parent.addEventListener(eventType, eventHandler, {once: once});
        } else {
            console.error("could not find such html element: " + parentIdentifier);
        }
    },
    removeAllChildren(parentIdentifier) {
        const parent = document.querySelector(parentIdentifier);
        parent.innerHTML = '';
    },
    hasChild(parentIdentifier) {
        const parent = document.querySelector(parentIdentifier);
        return parent.hasChildNodes();
    }
};

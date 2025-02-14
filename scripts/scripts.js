import { send_to_server } from "./signals.js";

class DragableCard {
  constructor(cardElement) {
    try {
      this.card = cardElement;
      this.isDragging = false;
      this.offsetX = 0;
      this.offsetY = 0;

      this.initEvents();
      console.log("DragableCard inited for:", this.card);
    } catch (error) {
      console.error("Error in initing:", error);
    }
  }

  initEvents() {
    if (!this.card) {
      console.error("Card element is not found");
      return;
    }
    this.card.addEventListener("mousedown", (e) => this.startDragging(e));
    document.addEventListener("mousemove", (e) => this.drag(e));
    document.addEventListener("mouseup", () => this.stopDragging());
    this.card.addEventListener("touchstart", (e) => this.startDragging(e));
    document.addEventListener("touchmove", (e) => this.drag(e));
    document.addEventListener("touchend", () => this.stopDragging());
    console.log("Events added to:", this.card);
  }

  startDragging(e) {
    try {
      this.isDragging = true;
      this.card.style.zIndex = 1000;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = this.card.getBoundingClientRect();
      this.offsetX = clientX - rect.left;
      this.offsetY = clientY - rect.top;
      console.log("Drag started:", { clientX, clientY, rect });
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error("Error in startDragging:", error);
    }
  }

  drag(e) {
    if (!this.isDragging) return;
    try {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - this.offsetX;
      const y = clientY - this.offsetY;
      this.card.style.left = x + "px";
      this.card.style.top = y + "px";
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error("Error in drag:", error);
    }
  }

  stopDragging() {
    try {
      this.isDragging = false;
      this.card.style.zIndex = 1;
      console.log("Drag stopped");
    } catch (error) {
      console.error("Error in stopDragging:", error);
    }
  }
}

class DragableNode {
  constructor(nodeElement) {
    try {
      this.node = nodeElement;
      this.isDragging = false;
      this.offsetX = 0;
      this.offsetY = 0;

      this.initEvents();
      console.log("DragableNode inited for:", this.node);
    } catch (error) {
      console.error("Error in initing:", error);
    }
  }

  initEvents() {
    if (!this.node) {
      console.error("Node element is not found");
      return;
    }
    this.node.addEventListener("mousedown", (e) => this.startDragging(e));
    document.addEventListener("mousemove", (e) => this.drag(e));
    document.addEventListener("mouseup", () => this.stopDragging());
    this.node.addEventListener("touchstart", (e) => this.startDragging(e));
    document.addEventListener("touchmove", (e) => this.drag(e));
    document.addEventListener("touchend", () => this.stopDragging());
    console.log("Events added to:", this.node);
  }

  startDragging(e) {
    try {
      this.isDragging = true;
      this.node.style.zIndex = 1000;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = this.node.getBoundingClientRect();
      this.offsetX = clientX - rect.left;
      this.offsetY = clientY - rect.top;
      console.log("Drag started:", { clientX, clientY, rect });
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error("Error in startDragging:", error);
    }
  }

  drag(e) {
    if (!this.isDragging) return;
    try {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - this.offsetX;
      const y = clientY - this.offsetY;
      this.node.style.left = x + "px";
      this.node.style.top = y + "px";
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error("Error in drag:", error);
    }
  }

  stopDragging() {
    try {
      this.isDragging = false;
      this.node.style.zIndex = 2;
      console.log("Drag stopped");
    } catch (error) {
      console.error("Error in stopDragging:", error);
    }
  }
}

export function makeCards() {
  console.log("Ininiting dragable cards.");
  try {
    const cards = document.querySelectorAll(".card");
    console.log("Found cards:", cards.length);
    cards.forEach((card, index) => {
      new DragableCard(card);
      console.log("Init card:", index + 1, card);
    });
  } catch (error) {
    console.error("Error in initDraggableCards:", error);
  }
}

export function makeNodes() {
  console.log("Ininiting dragable nodes.");
  try {
    const nodes = document.querySelectorAll(".node");
    console.log("Found nodes:", nodes.length);
    nodes.forEach((node, index) => {
      new DragableNode(node);
      console.log("Init node:", index + 1, node);
    });
  } catch (error) {
    console.error("Error in initDraggableNodes:", error);
  }
}

makeCards();
makeNodes();

const menuButton = document.getElementById("menu-button");
menuButton.addEventListener("click", function () {
  const menu = document.querySelector(".menu");
  const menubutton = document.getElementById("menu-button");
  if (menu.style.width === "60%") {
    menu.style.width = "15%";
    menubutton.textContent = "◀";
  } else {
    menu.style.width = "60%";
    menubutton.textContent = "▶";
  }
});

document.addEventListener("click", function (e) {
  const original = e.target.closest(".duplicateable-pc");
  if (original) {
    const clone = original.cloneNode(true);
    clone.classList.remove("duplicateable-pc");
    clone.classList.add("card");
    clone.style.zIndex = "500";
    clone.style.left = `${e.clientX - 150}px`;
    clone.style.top = `${e.clientY - 75}px`;
    document.querySelector(".container").appendChild(clone);
    makeCards();
  }
});

document.addEventListener("click", function (e) {
  const original = e.target.closest(".duplicateable-app");
  if (original) {
    const clone = original.cloneNode(true);
    clone.classList.remove("duplicateable-app");
    clone.classList.add("node");
    clone.style.zIndex = "500";
    clone.style.left = `${e.clientX - 150}px`;
    clone.style.top = `${e.clientY - 75}px`;
    document.querySelector(".container").appendChild(clone);
    makeNodes();
  }
});

const deleteBox = document.getElementById("delete-box");
let deleteTimers = new Map();

function isCenteredOver(element1, element2) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  const centerX = rect2.left + rect2.width / 2;
  const centerY = rect2.top + rect2.height / 2;

  return (
    centerX > rect1.left &&
    centerX < rect1.right &&
    centerY > rect1.top &&
    centerY < rect1.bottom
  );
}

function startDeleteTimer(element) {
  if (!deleteTimers.has(element) && !element.isDragging) {
    element.style.outline = "2px solid red";
    const timer = setTimeout(() => {
      element.remove();
      deleteTimers.delete(element);
    }, 1500);
    deleteTimers.set(element, timer);
  }
}

function stopDeleteTimer(element) {
  if (deleteTimers.has(element)) {
    clearTimeout(deleteTimers.get(element));
    deleteTimers.delete(element);
    element.style.outline = "";
  }
}

function checkAndDelete() {
  const cards = document.querySelectorAll(".card");
  const nodes = document.querySelectorAll(".node");
  cards.forEach((card) => {
    if (isCenteredOver(deleteBox, card)) {
      startDeleteTimer(card);
    } else {
      stopDeleteTimer(card);
    }
  });
  nodes.forEach((node) => {
    if (isCenteredOver(deleteBox, node)) {
      startDeleteTimer(node);
    } else {
      stopDeleteTimer(node);
    }
  });
}

function makeNode2() {
  document.querySelectorAll(".node2").forEach((e) => {
    const handleEv = (ev) => {
      e.classList.remove("node2");
      e.classList.remove("inside");
      document.querySelectorAll(".container")[0].appendChild(e);
      e.classList.add("node");
      const clientX = ev.touchevs ? ev.touches[0].clientX : ev.clientX;
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const x = clientX;
      const y = clientY;
      e.style.left = x + "px";
      e.style.top = y + "px";
      makeNodes();
      e.removeEventListener("click", handleEv);
    };
    e.addEventListener("click", handleEv);
  });
}

const overlapStartTimes = new Map();

function isOverlapping(rect1, rect2) {
  const result = !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
  return result;
}

function addToPC(card, app) {
  console.log("addToPC called with card:", card, "and app:", app);
  const clone = app.cloneNode(true);
  clone.classList.remove("node");
  clone.classList.add("node2", "inside");
  clone.style.outline = "";
  app.remove();
  const processHolder = card.querySelector("#process-holder");
  if (processHolder) {
    clone.id = "copy-process";
    processHolder.appendChild(clone);
    send_to_server("/api/add_to_compiuter", { card, clone }, () => {});
    makeNode2();
  } else {
    console.error("No element with ID 'process-holder' found inside the card.");
  }
}

function addToFloating(node) {
  send_to_server("/api/add_to_floating", { node }, () => {});
  console.log("Node added to floating area:", node);
}

function checkAndAdd() {
  const cards = document.querySelectorAll(".card");
  const nodes = document.querySelectorAll(".node");
  const overlapDuration = 1500;

  nodes.forEach((node) => {
    const nodeRect = node.getBoundingClientRect();
    let overlapsWithAnyCard = false;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      if (isOverlapping(cardRect, nodeRect)) {
        console.log("Node overlaps with card:", node, card);
        overlapsWithAnyCard = true;

        if (!overlapStartTimes.has(node)) {
          overlapStartTimes.set(node, Date.now());
          node.style.outline = "2px solid yellow";
        }

        const startTime = overlapStartTimes.get(node);
        if (Date.now() - startTime >= overlapDuration) {
          addToPC(card, node);
          overlapStartTimes.delete(node);
          return;
        }
      }
    });

    if (!overlapsWithAnyCard && overlapStartTimes.has(node)) {
      node.style.outline = "";
      overlapStartTimes.delete(node);
      addToFloating(node);
    }
  });
}

setInterval(checkAndAdd, 500);

document.addEventListener("mousemove", checkAndDelete);

const memorySlider = document.getElementById("memory-slider");
const memoryValue = document.getElementById("memory-value");

const coresSlider = document.getElementById("cores-slider");
const coresValue = document.getElementById("cores-value");

function updateMemory() {
  memoryValue.textContent = memorySlider.value + "MB";
}

function updateCores() {
  coresValue.textContent = coresSlider.value + "db";
}

memorySlider.addEventListener("input", updateMemory);
coresSlider.addEventListener("input", updateCores);

updateMemory();
updateCores();

const pcButton = document.getElementById("button-pc");

pcButton.addEventListener("click", function () {
  const pcUI = document.getElementById("pc-create-ui");

  if (pcUI.style.visibility === "hidden" || pcUI.style.visibility === "") {
    pcUI.style.visibility = "visible";
  } else {
    pcUI.style.visibility = "hidden";
  }
});

const addWorkspaceButton = document.getElementById("add-workspace");

function makeWorkspaces(newWorkspace, newButton, name) {
  const workspaces = document.querySelectorAll(".container");
  const workspacesAmount = workspaces.length;
  newWorkspace.classList.add("container");
  newWorkspace.classList.add(workspacesAmount + 1);
  newButton.classList.add("workspace");
  newButton.id = name;
  newButton.textContent = name;
}

const form = document.getElementById("workspace-form");
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = form.querySelector("#workspace-name").value;
  console.log(name);
  const newWorkspace = document.createElement("div");
  const newButton = document.createElement("button");
  const workspaces = document.getElementById("workspaces");
  makeWorkspaces(newWorkspace, newButton, name);
  document.body.appendChild(newWorkspace);
  workspaces.appendChild(newButton);

  const UI = document.getElementById("workspace-create-ui");
  UI.style.visibility = "hidden";
  form.reset();
});

addWorkspaceButton.addEventListener("click", function () {
  const UI = document.getElementById("workspace-create-ui");
  if (UI.style.visibility === "hidden" || UI.style.visibility === "") {
    UI.style.visibility = "visible";
  } else {
    UI.style.visibility = "hidden";
  }
});

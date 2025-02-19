import { send_to_server } from "./signals.js";

class DragableCard {
  constructor(cardElement) {
    this.card = cardElement;
    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.initEvents();
  }

  initEvents() {
    if (!this.card) return;
    this.card.addEventListener("mousedown", (e) => this.startDragging(e));
    document.addEventListener("mousemove", (e) => this.drag(e));
    document.addEventListener("mouseup", () => this.stopDragging());
    this.card.addEventListener("touchstart", (e) => this.startDragging(e));
    document.addEventListener("touchmove", (e) => this.drag(e));
    document.addEventListener("touchend", () => this.stopDragging());
  }

  startDragging(e) {
    if (e.target.closest(".power")) return;
    this.isDragging = true;
    this.card.style.zIndex = 1000;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = this.card.getBoundingClientRect();
    this.offsetX = clientX - rect.left;
    this.offsetY = clientY - rect.top;
    if (e.touches) e.preventDefault();
  }

  drag(e) {
    if (!this.isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    this.card.style.left = `${clientX - this.offsetX}px`;
    this.card.style.top = `${clientY - this.offsetY}px`;
    if (e.touches) e.preventDefault();
  }

  stopDragging() {
    this.isDragging = false;
    this.card.style.zIndex = 1;
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
      // console.log("DragableNode inited for:", this.node);
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
    // console.log("Events added to:", this.node);
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
      // console.log("Drag started:", { clientX, clientY, rect });
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
      // console.log("Drag stopped");
    } catch (error) {
      console.error("Error in stopDragging:", error);
    }
  }
}

export function makeCards() {
  // console.log("Ininiting dragable cards.");
  try {
    const cards = document.querySelectorAll(".card");
    // console.log("Found cards:", cards.length);
    cards.forEach((card, index) => {
      new DragableCard(card);
      // console.log("Init card:", index + 1, card);
    });
  } catch (error) {
    console.error("Error in initDraggableCards:", error);
  }
}

export function makeNodes() {
  // console.log("Ininiting dragable nodes.");
  try {
    const nodes = document.querySelectorAll(".node");
    // console.log("Found nodes:", nodes.length);
    nodes.forEach((node, index) => {
      new DragableNode(node);
      // console.log("Init node:", index + 1, node);
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

const addWorkspaceButton = document.getElementById("add-workspace");
const workspacesContainer = document.getElementById("workspaces");
const body = document.body;

var activeWorkspaceId = null;

function makeWorkspaces(newWorkspace, newButton, name) {
  newWorkspace.classList.add("container");
  newWorkspace.classList.add("workspace-content");
  newWorkspace.id = name + "-workspace";
  newButton.classList.add("workspace");
  newButton.id = name;
  newButton.textContent = name;

  newWorkspace.style.display = "none";
}

function setActiveWorkspace(workspaceButton) {
  const workspaceId = workspaceButton.id;
  const workspaceContent = document.getElementById(workspaceId + "-workspace");

  if (!workspaceContent) {
    console.error(`Workspace content not found for button ID: ${workspaceId}`);
    return;
  }

  document.querySelectorAll(".workspace-content").forEach((ws) => {
    ws.style.display = "none";
  });

  workspaceContent.style.display = "block";
  activeWorkspaceId = workspaceId;
  // console.log(`Active workspace set to: ${workspaceId}`);
}

workspacesContainer.addEventListener("click", function (event) {
  if (event.target.classList.contains("workspace")) {
    setActiveWorkspace(event.target);
  }
});

const form = document.getElementById("workspace-form");
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = form.querySelector("#workspace-name").value.trim();
  if (name === "") {
    alert("Workspace name cannot be empty.");
    return;
  } else {
    const newWorkspace = document.createElement("div");
    const newButton = document.createElement("button");
    makeWorkspaces(newWorkspace, newButton, name);
    body.appendChild(newWorkspace);
    workspacesContainer.appendChild(newButton);
    etActiveWorkspace(newButton);
    const UI = document.getElementById("workspace-create-ui");
    UI.style.visibility = "hidden";
    form.reset();
  }
});

addWorkspaceButton.addEventListener("click", function () {
  const UI = document.getElementById("workspace-create-ui");
  UI.style.visibility = "hidden";
  if (UI.style.visibility === "hidden" || UI.style.visibility === "") {
    UI.style.visibility = "visible";
  } else {
    UI.style.visibility = "hidden";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const initialWorkspaceButton = document.querySelector(
    "#workspaces button.workspace"
  );

  if (initialWorkspaceButton) {
    setActiveWorkspace(initialWorkspaceButton);
  } else {
    // console.log("No initial workspaces found.");
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
    clone.id = "copy";
    const activeWorkspaceContentId = activeWorkspaceId + "-workspace";
    const activeWorkspaceContent = document.getElementById(
      activeWorkspaceContentId
    );
    if (activeWorkspaceContent) {
      activeWorkspaceContent.appendChild(clone);
      makeCards();
    }
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
    const activeWorkspaceContentId = activeWorkspaceId + "-workspace";
    const activeWorkspaceContent = document.getElementById(
      activeWorkspaceContentId
    );
    if (activeWorkspaceContent) {
      activeWorkspaceContent.appendChild(clone);
      makeNodes();
    }
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
      const elementElement = element.querySelector('[name="name"]');
      const elementName = elementElement
        ? elementElement.textContent
        : "Element name not found!";
      send_to_server("/api/remove", { elementName }, () => {});
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

export function turnInsiderNode(e) {
  const handleEv = (ev) => {
    e.classList.remove("node2");
    e.classList.remove("inside");
    const activeWorkspaceContentId = activeWorkspaceId + "-workspace";
    const activeWorkspaceContent = document.getElementById(
      activeWorkspaceContentId
    );
    if (activeWorkspaceContent) {
      activeWorkspaceContent.appendChild(e);
    }
    e.classList.add("node");
    const clientX = ev.touchevs ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    const x = clientX;
    const y = clientY;
    e.style.left = x + "px";
    e.style.top = y + "px";
    makeNodes();

    send_to_server("/api/end_process", {pcName: e.getAttribute("parent"), procName: e.getAttribute("proc")}, (data) => {
      if (data.result) {
        e.classList.remove("node2", "inside");
        e.classList.add("node");
        e.style.left = `${ev.clientX}px`;
        e.style.top = `${ev.clientY}px`;

        const parent = document.querySelector(`[name="${e.getAttribute('parent')}"`);
        parent.querySelector('[name="proc"]').innerHTML = `Processor: <prc>${data.uproc}</prc>/${data.proc} (${parseInt(data.proc) - parseInt(data.uproc)} used)`;
        parent.querySelector('[name="mem"]').innerHTML = `Memory: <prc>${data.umem}</prc>/${data.mem} (${parseInt(data.mem) - parseInt(data.umem)} used)`;

        makeNodes();
        e.removeEventListener("click", handleEv);
      }
    });

    e.getAttribute("proc");
    e.removeEventListener("click", handleEv);
  };

  e.querySelector('[class="power"]').onclick = handleEvPower;
  e.addEventListener("click", handleEv, { once: true });
}


export function makeNode2() {
  document.querySelectorAll(".node2").forEach((e) => {
    turnInsiderNode(e)
  });
}

const overlapStartTimes = new Map();

function isOverlapping(rect1, rect2) {
  const centerX = rect2.left + rect2.width / 2;
  const centerY = rect2.top + rect2.height / 2;

  return (
    centerX > rect1.left &&
    centerX < rect1.right &&
    centerY > rect1.top &&
    centerY < rect1.bottom
  );
}

// function addToPC(card, app) {
//   console.log("addToPC called with card:", card, "and app:", app);
//   const clone = app.cloneNode(true);
//   clone.classList.remove("node");
//   clone.classList.add("node2", "inside");
//   clone.style.outline = "";

//   app.remove();
//   const processHolder = card.querySelector("#process-holder");
//   if (processHolder) {
//     clone.id = "copy-process";
//     processHolder.appendChild(clone);
//     const cardNameElement = card.querySelector('[name="name"]');
//     const cardName = cardNameElement
//       ? cardNameElement.textContent
//       : "Card Name Not Found";
//     console.log(cardName);
//     const appNameElement = clone.querySelector('[name="name"]');
//     const appName = appNameElement
//       ? appNameElement.textContent
//       : "App Name Not Found";
//     if (clone.hasAttribute("proc")) {
//       send_to_server(
//         "/api/add_process",
//         {
//           pcName: cardName,
//           appType: appName,
//           appId: clone.getAttribute("proc"),
//           status: clone.classList.contains("inactive") ? "i" : "a",
//         },
//         (data) => {
//           clone.setAttribute("parent", cardName);
//         }
//       );
//     } else {
//       send_to_server(
//         "/api/add_to_computer",
//         { pcName: cardName, appType: appName },
//         (data) => {
//           clone.setAttribute("proc", data.processId);
//           clone.setAttribute("parent", cardName);
//           clone.querySelector(
//             '[name="proc-id"]'
//           ).textContent = `Process ID: ${data.processId}`;
//         }
//       );
//     }

//     processHolder.querySelector('[class="power"]').onclick = handleEv;
//     makeNode2();
//   } else {
//     console.error("No element with ID 'process-holder' found inside the card.");
//   }
// }

function addToPC(card, app) {
  // console.log("addToPC called with card:", card, "and app:", app);
  const clone = app.cloneNode(true);
  clone.classList.remove("node");
  clone.classList.add("node2", "inside");
  clone.style.outline = "";

  app.remove();
  const processHolder = card.querySelector("#process-holder");
  if (processHolder) {
    clone.id = "copy-process";
    const cardNameElement = card.querySelector('[name="name"]');
    const cardName = cardNameElement
      ? cardNameElement.textContent
      : "Card Name Not Found";
    // console.log(cardName);
    const appNameElement = clone.querySelector('[name="name"]');
    const appName = appNameElement
      ? appNameElement.textContent
      : "App Name Not Found";

    const onSuccess = (data) => {
      if (data.result) {
        processHolder.appendChild(clone);
        clone.setAttribute("parent", cardName);
        const parent = clone.parentNode.parentNode
        parent.querySelector('[name="proc"').innerHTML = `Processor: <prc>${data.uproc}</prc>/${data.proc} (${parseInt(data.proc) - parseInt(data.uproc)} used)`;
        parent.querySelector('[name="mem"]').innerHTML = `Memory: <prc>${data.umem}</prc>/${data.mem} (${parseInt(data.mem) - parseInt(data.umem)} used)`;
        if (data.processId) {
          clone.setAttribute("proc", data.processId);
          clone.querySelector(
            '[name="proc-id"]'
          ).textContent = `Process ID: ${data.processId}`;
        }
        turnInsiderNode(clone)
      } else {
        console.warn("Server response did not confirm success:", data);
      }
    };

    if (clone.hasAttribute("proc")) {
      send_to_server(
        "/api/add_process",
        {
          pcName: cardName,
          appType: appName,
          appId: clone.getAttribute("proc"),
          status: clone.classList.contains("inactive") ? "i" : "a",
        },
        onSuccess
      );
    } else {
      send_to_server(
        "/api/add_to_computer",
        { pcName: cardName, appType: appName },
        onSuccess
      );
    }
  } else {
    console.error("No element with ID 'process-holder' found inside the card.");
  }
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
        // console.log("Node overlaps with card:", node, card);
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
    }
  });
}

setInterval(checkAndAdd, 750);

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

export function createCardDiv(data) {
  const cardDiv = document.createElement("div");

  cardDiv.setAttribute("name", data.name);

  const h2Element = document.createElement("h2");
  h2Element.setAttribute("name", "name");
  h2Element.textContent = data.name;

  const procParagraph = document.createElement("p");
  procParagraph.setAttribute("name", "proc");
  procParagraph.innerHTML = `Processor: <prc>${data.uproc}</prc>/${data.proc} (${parseInt(data.proc) - parseInt(data.uproc)} used)`

  const memParagraph = document.createElement("p");
  memParagraph.setAttribute("name", "mem");
  memParagraph.innerHTML = `Memory: <prc>${data.umem}</prc>/${data.mem} (${parseInt(data.mem) - parseInt(data.umem)} used)`

  const processHolderDiv = document.createElement("div");
  processHolderDiv.id = "process-holder";

  cardDiv.appendChild(h2Element);
  cardDiv.appendChild(procParagraph);
  cardDiv.appendChild(memParagraph);
  cardDiv.appendChild(processHolderDiv);

  return cardDiv;
}

export const handleEvPower = (e) => {
  e.stopPropagation();
  const powerButton = e.target;
  send_to_server(
    "/api/swap_process",
    {
      procId: powerButton.parentNode.getAttribute("proc"),
      pcName: powerButton.parentNode.getAttribute("parent"),
    },
    () => {}
  );
  if (!powerButton.parentNode.classList.contains("inactive")) {
    powerButton.parentNode.classList.add("inactive");
  } else {
    powerButton.parentNode.classList.remove("inactive");
  }

  e.preventDefault();
  e.stopImmediatePropagation();
};

export function createNodeDiv(data) {
  const processDiv = document.createElement("div");
  processDiv.id = "copy-process";

  const imgElement = document.createElement("img");
  imgElement.src =
    // data.imageSrc || "{{ get_serverside_file('content', {data.img}) }}";
    data.imageSrc || "/content/process.png";
  imgElement.alt = data.imageAlt || "Process Icon";

  const h2Element = document.createElement("h2");
  h2Element.setAttribute("name", "name");
  h2Element.textContent = data.name;

  const procParagraph = document.createElement("p");
  procParagraph.setAttribute("name", "proc-id");
  procParagraph.classList.add("proc-id");

  const memoryParagraph = document.createElement("p");
  memoryParagraph.classList.add("memory");
  memoryParagraph.setAttribute("name", "mem");
  memoryParagraph.textContent = "Memory used: " + data.mem;

  const cpuParagraph = document.createElement("p");
  cpuParagraph.classList.add("cpu");
  cpuParagraph.setAttribute("name", "proc");
  cpuParagraph.textContent = "CPU used: " + data.proc;

  const powerButton = document.createElement("button");
  powerButton.classList.add("power");
  powerButton.textContent = "❌";
  powerButton.onclick = handleEvPower;

  processDiv.appendChild(imgElement);
  processDiv.appendChild(h2Element);
  processDiv.appendChild(procParagraph);
  processDiv.appendChild(memoryParagraph);
  processDiv.appendChild(cpuParagraph);
  processDiv.appendChild(powerButton);

  return processDiv;
}

function makePC(name, mem, proc) {
  const space = document.querySelector(".container");
  send_to_server(
    "/api/make_computer",
    { name: name, mem: mem, proc: proc * 100 },
    () => {
      const data = { name: name, mem: mem, proc: proc * 100, umem: mem, uproc: proc * 100 };
      var pc = createCardDiv(data);
      pc.classList.add("card");
      pc.id = "copy";
      
      space.appendChild(pc);
      makeCards()
    }
  );
}

const form2 = document.getElementById("pc-form");
form2.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = form2.querySelector("#pc-name").value.trim();
  const memory = form2.querySelector("#memory-slider").value;
  const cores = form2.querySelector("#cores-slider").value;
  if (name === "") {
    alert("PC name cannot be empty.");
    return;
  } else {
    makePC(name, memory, cores);
    const UI = document.getElementById("pc-create-ui");
    UI.style.visibility = "hidden";
    form2.reset();
  }
});

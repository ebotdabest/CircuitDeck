class DragableCard {
  constructor(cardElement) {
    try {
      this.card = cardElement;
      this.isDragging = false;
      this.offsetX = 0;
      this.offsetY = 0;
      this.debugElement = null;

      this.createDebugElement();
      this.initEvents();
      console.log('DragableCard inited for:', this.card);
    } catch (error) {
      console.error('Error in initing:', error);
    }
  }

  createDebugElement() {
    this.debugElement = document.createElement('div');
    this.debugElement.className = 'debug-overlay';
    document.body.appendChild(this.debugElement);
  }

  updateDebugInfo() {
    if (!this.debugElement) return;
    this.debugElement.textContent = [
      'Dragging:', this.isDragging,
      'Position:', this.card.style.left, this.card.style.top,
      'Offset:', this.offsetX.toFixed(1), this.offsetY.toFixed(1),
    ].join('\n');
  }

  initEvents() {
    if (!this.card) {
      console.error('Card element is not found');
      return;
    }
    this.card.addEventListener('mousedown', (e) => this.startDragging(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDragging());
    this.card.addEventListener('touchstart', (e) => this.startDragging(e));
    document.addEventListener('touchmove', (e) => this.drag(e));
    document.addEventListener('touchend', () => this.stopDragging());
    console.log('Events added to:', this.card);
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
      console.log('Drag started:', {clientX, clientY, rect});
      this.updateDebugInfo();
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error('Error in startDragging:', error);
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
      this.updateDebugInfo();
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error('Error in drag:', error);
    }
  }

  stopDragging() {
    try {
      this.isDragging = false;
      this.card.style.zIndex = 1;
      console.log('Drag stopped');
      this.updateDebugInfo();
    } catch (error) {
      console.error('Error in stopDragging:', error);
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
      this.debugElement = null;

      this.createDebugElement();
      this.initEvents();
      console.log('DragableNode inited for:', this.node);
    } catch (error) {
      console.error('Error in initing:', error);
    }
  }

  createDebugElement() {
    this.debugElement = document.createElement('div');
    this.debugElement.className = 'debug-overlay';
    document.body.appendChild(this.debugElement);
  }

  updateDebugInfo() {
    if (!this.debugElement) return;
    this.debugElement.textContent = [
      'Dragging:', this.isDragging,
      'Position:', this.node.style.left, this.node.style.top,
      'Offset:', this.offsetX.toFixed(1), this.offsetY.toFixed(1),
    ].join('\n');
  }

  initEvents() {
    if (!this.node) {
      console.error('Node element is not found');
      return;
    }
    this.node.addEventListener('mousedown', (e) => this.startDragging(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDragging());
    this.node.addEventListener('touchstart', (e) => this.startDragging(e));
    document.addEventListener('touchmove', (e) => this.drag(e));
    document.addEventListener('touchend', () => this.stopDragging());
    console.log('Events added to:', this.node);
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
      console.log('Drag started:', {clientX, clientY, rect});
      this.updateDebugInfo();
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error('Error in startDragging:', error);
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
      this.updateDebugInfo();
      if (e.touches) e.preventDefault();
    } catch (error) {
      console.error('Error in drag:', error);
    }
  }

  stopDragging() {
    try {
      this.isDragging = false;
      this.node.style.zIndex = 2;
      console.log('Drag stopped');
      this.updateDebugInfo();
    } catch (error) {
      console.error('Error in stopDragging:', error);
    }
  }
}

function makeCards() {
  console.log('Ininiting dragable cards.');
  try {
    const cards = document.querySelectorAll('.card');
    console.log('Found cards:', cards.length);
    cards.forEach((card, index) => {
      new DragableCard(card);
      console.log('Init card:', (index + 1), card);
    });
  } catch (error) {
    console.error('Error in initDraggableCards:', error);
  }
}

function makeNodes() {
  console.log('Ininiting dragable nodes.');
  try {
    const nodes = document.querySelectorAll('.node');
    console.log('Found nodes:', nodes.length);
    nodes.forEach((node, index) => {
      new DragableNode(node);
      console.log('Init node:', (index + 1), node);
    });
  } catch (error) {
    console.error('Error in initDraggableNodes:', error);
  }
}

makeCards();
makeNodes();

const menuButton = document.getElementById('menu-button');
menuButton.addEventListener('click', function() {
  const menu = document.querySelector('.menu');
  const menubutton = document.getElementById('menu-button');
  if (menu.style.width === '60%') {
    menu.style.width = '15%';
    menubutton.textContent = '◀';
  } else {
    menu.style.width = '60%';
    menubutton.textContent = '▶';
  }
});

document.addEventListener('click', function(e) {
  const original = e.target.closest('.duplicateable-pc');
  if (original) {
    const clone = original.cloneNode(true);
    clone.classList.remove('duplicateable-pc');
    clone.classList.add('card');
    clone.style.zIndex = '500';
    clone.style.left = `${e.clientX - 150}px`
    clone.style.top = `${e.clientY - 75}px`;
    document.querySelector('.container').appendChild(clone);
    makeCards();
  }
});

document.addEventListener('click', function(e) {
  const original = e.target.closest('.duplicateable-app');
  if (original) {
    const clone = original.cloneNode(true);
    clone.classList.remove('duplicateable-app');
    clone.classList.add('node');
    clone.style.zIndex = '500';
    clone.style.left = `${e.clientX - 150}px`
    clone.style.top = `${e.clientY - 75}px`;
    document.querySelector('.container').appendChild(clone);
    makeNodes();
  }
});

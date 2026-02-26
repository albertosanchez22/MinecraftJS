// ============================================================
//  Hotbar — barra de items (DOM-based, se actualiza por eventos)
// ============================================================
import { getBlockIconURL } from '../rendering/BlockIcon.js';

export class Hotbar {
  /**
   * @param {import('../player/Inventory.js').Inventory} inventory
   */
  constructor(inventory) {
    this._inv  = inventory;
    this._root = document.getElementById('hotbar');
    this._cells = [];
    this._buildDOM();
    inventory.onChange(() => this.render());
    this.render();
  }

  _buildDOM() {
    this._root.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'hb-cell';

      const preview = document.createElement('img');
      preview.className = 'hb-preview';

      const count = document.createElement('span');
      count.className = 'hb-count';

      cell.append(preview, count);
      this._root.appendChild(cell);
      this._cells.push({ cell, preview, count });
    }
  }

  render() {
    const slots    = this._inv.hotbar;
    const selected = this._inv.selected;

    for (let i = 0; i < 9; i++) {
      const { cell, preview, count } = this._cells[i];
      const slot = slots[i];

      cell.classList.toggle('hb-active', i === selected);

      if (slot) {
        preview.src = getBlockIconURL(slot.id);
        preview.style.display = '';
        count.textContent = slot.count > 1 ? slot.count : '';
      } else {
        preview.src = '';
        preview.style.display = 'none';
        count.textContent = '';
      }
    }
  }
}

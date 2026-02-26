// ============================================================
//  CraftingTableScreen — UI 3×3 para la mesa de crafteo
//  Se abre con clic derecho sobre una mesa de crafteo.
// ============================================================
import { evaluateRecipe3x3 } from '../crafting/Recipes.js';
import { getBlockIconURL }   from '../rendering/BlockIcon.js';

export class CraftingTableScreen {
  constructor(inventory) {
    this._inv     = inventory;
    this._held    = null;   // { id, count } | null
    this.isOpen   = false;
    /** Drag-distribute con botón derecho mantenido */
    this._dragging  = false;
    this._dragSlots = new Set();

    this._escListener = (e) => {
      if (e.key === 'Escape') this.close();
    };

    this._build();
    this._bindMouse();
  }

  // ── Construcción del DOM ──────────────────────────────────

  _build() {
    const screen = document.createElement('div');
    screen.id = 'craft-table-screen';
    screen.style.cssText = `
      display:none; position:fixed; inset:0;
      background:rgba(0,0,0,0.72);
      align-items:center; justify-content:center;
      z-index:110; cursor:default;
    `;

    screen.innerHTML = `
      <div class="inv-panel">
        <div class="inv-title">Mesa de Crafteo</div>

        <div class="inv-top">
          <div class="inv-craft-area">
            <div class="inv-label">Crafteo 3×3</div>
            <div id="ct-grid" style="
              display:grid;
              grid-template-columns:repeat(3,40px);
              grid-template-rows:repeat(3,40px);
              gap:3px;
            "></div>
          </div>
          <div class="inv-arrow">▶</div>
          <div>
            <div class="inv-label">Resultado</div>
            <div id="ct-output" class="inv-cell inv-cell-out"></div>
          </div>
        </div>

        <div class="inv-label">Inventario</div>
        <div id="ct-main" class="inv-main-grid"></div>
        <div id="ct-hotbar" class="inv-hotbar-row"></div>
      </div>
    `;

    document.body.appendChild(screen);
    this._screen = screen;
  }

  _bindMouse() {
    document.addEventListener('mousemove', (e) => {
      if (!this.isOpen) return;
      const cur = document.getElementById('inv-cursor');
      if (cur) {
        cur.style.left = `${e.clientX - 20}px`;
        cur.style.top  = `${e.clientY - 20}px`;
      }
    });
    // Soltar botón derecho detiene el drag
    document.addEventListener('mouseup', (e) => {
      if (e.button === 2 && this._dragging) {
        this._dragging = false;
        this._dragSlots.clear();
      }
    });
  }

  // ── Abrir / Cerrar ────────────────────────────────────────

  open() {
    this.isOpen = true;
    this._screen.style.display = 'flex';
    document.addEventListener('keydown', this._escListener);
    document.exitPointerLock?.();
    this.refresh();
  }

  close() {
    // Devolver item en cursor al inventario
    if (this._held) {
      for (let n = 0; n < this._held.count; n++) this._inv.addBlock(this._held.id);
      this._held = null;
    }
    this.isOpen = false;
    this._screen.style.display = 'none';
    document.removeEventListener('keydown', this._escListener);

    // Devolver items del grid al inventario
    for (let i = 0; i < 9; i++) {
      const slot = this._inv.craft9[i];
      if (slot) { this._inv.addBlock(slot.id); this._inv.craft9[i] = null; }
    }
    this._inv.craftOutput9 = null;

    document.querySelector('#canvas-container canvas')?.requestPointerLock();
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  // ── Renderizado ───────────────────────────────────────────

  refresh() {
    this._renderGrid();
    this._renderOutput();
    this._renderMain();
    this._renderHotbar();
    this._renderCursor();
  }

  _renderGrid() {
    const el = document.getElementById('ct-grid');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = this._makeCell(this._inv.craft9[i]);
      this._attachCellEvents(cell, 'craft9', i);
      el.appendChild(cell);
    }
  }

  _renderOutput() {
    const el = document.getElementById('ct-output');
    if (!el) return;
    el.innerHTML = '';
    const slot = this._inv.craftOutput9;
    if (slot) {
      const preview = this._makePreview(slot.id);
      el.appendChild(preview);
      if (slot.count > 1) {
        const cnt = document.createElement('span');
        cnt.className = 'inv-count';
        cnt.textContent = slot.count;
        el.appendChild(cnt);
      }
    }
    el.onclick = (e) => this._onOutputClick(e.shiftKey);
    el.oncontextmenu = (e) => e.preventDefault();
  }

  _renderMain() {
    const el = document.getElementById('ct-main');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 27; i++) {
      const cell = this._makeCell(this._inv.main[i]);
      this._attachCellEvents(cell, 'main', i);
      el.appendChild(cell);
    }
  }

  _renderHotbar() {
    const el = document.getElementById('ct-hotbar');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = this._makeCell(this._inv.hotbar[i]);
      if (i === this._inv.selected) cell.classList.add('inv-cell-active');
      this._attachCellEvents(cell, 'hotbar', i);
      el.appendChild(cell);
    }
  }

  /** Añade los listeners de ratón a cada celda */
  _attachCellEvents(el, arrName, idx) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this._dragging) {
        if (e.shiftKey) this._onShiftClick(arrName, idx);
        else            this._onLeftClick(arrName, idx);
      }
    });
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return;
      e.preventDefault();
      if (this._held) {
        this._dragging  = true;
        this._dragSlots = new Set();
        this._dragDeposit(arrName, idx);
      } else {
        this._onRightClick(arrName, idx);
      }
    });
    el.addEventListener('mouseenter', () => {
      if (this._dragging) this._dragDeposit(arrName, idx);
    });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _renderCursor() {
    const cur = document.getElementById('inv-cursor');
    if (!cur) return;
    if (!this._held || !this.isOpen) {
      cur.style.display = 'none';
      return;
    }
    cur.style.display = 'flex';
    cur.innerHTML = '';
    const prev = this._makePreview(this._held.id);
    cur.appendChild(prev);
    const cnt = document.createElement('span');
    cnt.className = 'inv-cur-count';
    cnt.textContent = this._held.count > 1 ? this._held.count : '';
    cur.appendChild(cnt);
  }

  /** Deposita 1 ítem en el slot al pasar el ratón durante el drag */
  _dragDeposit(arrName, idx) {
    if (!this._held || this._held.count === 0) { this._dragging = false; return; }
    const key = arrName + ':' + idx;
    if (this._dragSlots.has(key)) return;
    const arr  = this._inv[arrName];
    const slot = arr[idx];
    if (!slot) {
      arr[idx] = { id: this._held.id, count: 1 };
    } else if (slot.id === this._held.id && slot.count < 64) {
      slot.count++;
    } else {
      return; // slot ocupado por otro item
    }
    this._dragSlots.add(key);
    this._held.count--;
    if (this._held.count === 0) { this._held = null; this._dragging = false; }
    this._finish();
  }

  // ── Interacción de slots ───────────────────────────

  _onLeftClick(arrName, idx) {
    const arr  = this._inv[arrName];
    const slot = arr[idx];
    if (!this._held) {
      if (!slot) return;
      this._held = { id: slot.id, count: slot.count };
      arr[idx] = null;
    } else {
      if (!slot) {
        arr[idx] = { id: this._held.id, count: this._held.count };
        this._held = null;
      } else if (slot.id === this._held.id) {
        const space = 64 - slot.count;
        const add   = Math.min(space, this._held.count);
        slot.count += add;
        this._held.count -= add;
        if (this._held.count === 0) this._held = null;
      } else {
        const tmp = { id: slot.id, count: slot.count };
        arr[idx]  = { id: this._held.id, count: this._held.count };
        this._held = tmp;
      }
    }
    this._finish();
  }

  _onRightClick(arrName, idx) {
    const arr  = this._inv[arrName];
    const slot = arr[idx];
    if (!this._held) {
      if (!slot) return;
      const take = Math.ceil(slot.count / 2);
      this._held  = { id: slot.id, count: take };
      slot.count -= take;
      if (slot.count === 0) arr[idx] = null;
    } else {
      if (!slot) {
        arr[idx] = { id: this._held.id, count: 1 };
        this._held.count--;
        if (this._held.count === 0) this._held = null;
      } else if (slot.id === this._held.id && slot.count < 64) {
        slot.count++;
        this._held.count--;
        if (this._held.count === 0) this._held = null;
      }
    }
    this._finish();
  }

  _onShiftClick(arrName, idx) {
    if (this._held) return; // con cursor: usar drag
    const arr  = this._inv[arrName];
    const slot = arr[idx];
    if (!slot) return;
    const dest = (arrName === 'hotbar') ? this._inv.main : this._inv.hotbar;
    for (let i = 0; i < dest.length && slot.count > 0; i++) {
      if (dest[i]?.id === slot.id && dest[i].count < 64) {
        const m = Math.min(64 - dest[i].count, slot.count);
        dest[i].count += m; slot.count -= m;
      }
    }
    for (let i = 0; i < dest.length && slot.count > 0; i++) {
      if (!dest[i]) { dest[i] = { id: slot.id, count: slot.count }; slot.count = 0; }
    }
    if (slot.count === 0) arr[idx] = null;
    this._finish();
  }

  _onOutputClick(shift = false) {
    if (this._held || !this._inv.craftOutput9) return;
    if (shift) {
      let n = 0;
      while (this._inv.craftOutput9 && n++ < 64) {
        this._inv.takeCraftResult9();
        this._inv.craftOutput9 = evaluateRecipe3x3(this._inv.craft9);
      }
    } else {
      this._inv.takeCraftResult9();
    }
    this._finish();
  }

  _finish() {
    this._inv.craftOutput9 = evaluateRecipe3x3(this._inv.craft9);
    this._inv._notify?.();
    this.refresh();
  }

  // ── Helpers DOM ───────────────────────────────────────────

  _makeCell(slot) {
    const div = document.createElement('div');
    div.className = 'inv-cell';
    if (slot) {
      div.appendChild(this._makePreview(slot.id));
      if (slot.count > 1) {
        const cnt = document.createElement('span');
        cnt.className = 'inv-count';
        cnt.textContent = slot.count;
        div.appendChild(cnt);
      }
    }
    return div;
  }

  _makePreview(blockId) {
    const img = document.createElement('img');
    img.src = getBlockIconURL(blockId);
    img.className = 'inv-preview';
    img.style.cssText = 'width:28px;height:28px;image-rendering:pixelated;display:block;';
    return img;
  }
}

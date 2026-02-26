// ============================================================
//  InventoryScreen — UI completa de inventario + crafteo 2×2
//
//  Click izq.  (vacía  → lleno)   coger todo
//  Click izq.  (llena  → vacío)   soltar todo
//  Click izq.  (llena  → mismo)   apilar todo
//  Click izq.  (llena  → otro)    intercambiar
//  Click der.  (vacía  → lleno)   coger mitad (⌈n/2⌉)
//  Click der.  (llena  → vacío)   soltar 1
//  Click der.  (llena  → mismo)   añadir 1
//  Shift+clic  (llena)            repartir 1 en cada hueco libre
//  Shift+clic  (vacía)            mover stack entero a la otra sección
// ============================================================
import { BlockDef } from '../world/BlockTypes.js';
import { evaluateRecipe } from '../crafting/Recipes.js';
import { getBlockIconURL } from '../rendering/BlockIcon.js';

const MAX_STACK = 64;

function itemName(id) {
  return BlockDef[id]?.name ?? '?';
}

export class InventoryScreen {
  /**
   * @param {import('../player/Inventory.js').Inventory} inventory
   */
  constructor(inventory) {
    this._inv     = inventory;
    this._visible = false;
    /** Cursor stack: { id, count } | null  — items físicamente en la mano */
    this._held    = null;
    /** Drag-distribute con botón derecho mantenido */
    this._dragging   = false;
    this._dragSlots  = new Set(); // claves 'arrName:idx' ya visitadas

    this._root   = document.getElementById('inv-screen');
    this._cursor = document.getElementById('inv-cursor');
    this._escListener = null;

    this._buildDOM();
    this._bindMouse();
    inventory.onChange(() => { if (this._visible) this._refresh(); });
  }

  // ── Visibilidad ──────────────────────────────────────────

  open() {
    this._visible = true;
    this._root.style.display = 'flex';
    this._refresh();
    if (document.pointerLockElement) document.exitPointerLock();
    // Escape cierra el inventario
    this._escListener = (e) => { if (e.code === 'Escape') this.close(); };
    document.addEventListener('keydown', this._escListener);
  }

  close() {
    // Devolver item en cursor al inventario
    if (this._held) {
      for (let n = 0; n < this._held.count; n++) this._inv.addBlock(this._held.id);
      this._held = null;
    }
    this._visible = false;
    this._root.style.display = 'none';
    this._cursor.style.display = 'none';
    if (this._escListener) {
      document.removeEventListener('keydown', this._escListener);
      this._escListener = null;
    }
    // Devolver crafteo al inventario
    for (let i = 0; i < 4; i++) {
      if (this._inv.craft[i]) {
        this._inv.addBlock(this._inv.craft[i].id);
        this._inv.craft[i] = null;
      }
    }
    this._inv._notify();
    document.querySelector('#canvas-container canvas')?.requestPointerLock();
  }

  toggle() { this._visible ? this.close() : this.open(); }
  get isOpen() { return this._visible; }

  // ── Construcción DOM ─────────────────────────────────────

  _buildDOM() {
    this._root.innerHTML = `
      <div class="inv-panel">
        <div class="inv-title">Inventario</div>
        <div class="inv-top">
          <div class="inv-craft-area">
            <div class="inv-label">Crafteo</div>
            <div class="inv-craft-grid" id="craft-grid"></div>
          </div>
          <div class="inv-arrow">▶</div>
          <div class="inv-craft-out" id="craft-out"></div>
        </div>
        <div class="inv-label" style="margin-top:12px">Inventario</div>
        <div class="inv-main-grid" id="main-grid"></div>
        <div class="inv-label" style="margin-top:8px">Hotbar</div>
        <div class="inv-hotbar-row" id="inv-hotbar-row"></div>
      </div>`;

    this._craftCells     = this._buildCells('#craft-grid',     4,  'craft');
    this._outCell        = this._buildOutputCell();
    this._mainCells      = this._buildCells('#main-grid',      27, 'main');
    this._invHotbarCells = this._buildCells('#inv-hotbar-row', 9,  'hotbar');
  }

  _buildCells(selector, count, arrName) {
    const container = this._root.querySelector(selector);
    const cells = [];
    for (let i = 0; i < count; i++) {
      const cell = this._makeCell(arrName, i);
      container.appendChild(cell.el);
      cells.push(cell);
    }
    return cells;
  }

  _buildOutputCell() {
    const el = document.createElement('div');
    el.className = 'inv-cell inv-cell-out';
    const preview = document.createElement('div'); preview.className = 'inv-preview';
    const count   = document.createElement('span'); count.className = 'inv-count';
    el.append(preview, count);
    el.addEventListener('click', (e) => { e.preventDefault(); this._onOutputClick(e.shiftKey); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    this._root.querySelector('#craft-out').appendChild(el);
    return { el, preview, count };
  }

  _makeCell(arrName, idx) {
    const el = document.createElement('div');
    el.className = 'inv-cell';
    const preview = document.createElement('div'); preview.className = 'inv-preview';
    const count   = document.createElement('span'); count.className = 'inv-count';
    el.append(preview, count);

    // Clic izquierdo: coger/soltar/apilar/intercambiar
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this._dragging) this._onLeftClick(arrName, idx);
    });

    // Botón derecho pulsado: iniciar drag-distribute
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return;
      e.preventDefault();
      if (this._held) {
        this._dragging  = true;
        this._dragSlots = new Set();
        this._dragDeposit(arrName, idx); // primer slot al hacer clic
      } else {
        this._onRightClick(arrName, idx); // sin cursor: coger mitad
      }
    });

    // Arrastrar sobre el slot mientras drag activo
    el.addEventListener('mouseenter', () => {
      if (this._dragging) this._dragDeposit(arrName, idx);
    });

    el.addEventListener('contextmenu', (e) => e.preventDefault());
    return { el, preview, count };
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
    } else if (slot.id === this._held.id && slot.count < MAX_STACK) {
      slot.count++;
    } else {
      return; // slot ocupado por otro item — no marcar como visitado
    }
    this._dragSlots.add(key);
    this._held.count--;
    if (this._held.count === 0) { this._held = null; this._dragging = false; }
    this._finish();
  }

  // ── Lógica de clicks ──────────────────────────────────────

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
        const space = MAX_STACK - slot.count;
        const add   = Math.min(space, this._held.count);
        slot.count       += add;
        this._held.count -= add;
        if (this._held.count === 0) this._held = null;
      } else {
        const tmp  = { id: slot.id, count: slot.count };
        arr[idx]   = { id: this._held.id, count: this._held.count };
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
      } else if (slot.id === this._held.id && slot.count < MAX_STACK) {
        slot.count++;
        this._held.count--;
        if (this._held.count === 0) this._held = null;
      }
    }
    this._finish();
  }

  /** Shift+clic izquierdo sin cursor: mueve stack entero a la otra sección */
  _onShiftClick(arrName, idx) {
    const arr  = this._inv[arrName];
    const slot = arr[idx];
    if (!slot) return;
    const dest = (arrName === 'hotbar') ? 'main' : 'hotbar';
    this._quickMove(slot, arr, idx, this._inv[dest]);
    this._finish();
  }

  _onOutputClick(shift) {
    if (!this._held && this._inv.craftOutput) {
      if (shift) {
        let n = 0;
        while (this._inv.craftOutput && n++ < MAX_STACK) {
          this._inv.takeCraftResult();
          this._inv.craftOutput = evaluateRecipe(this._inv.craft);
        }
      } else {
        this._inv.takeCraftResult();
      }
      this._updateCraftOutput();
    }
    this._finish();
  }

  /** Mueve un slot entero al destino (apilando o en hueco vacío) */
  _quickMove(slot, srcArr, srcIdx, destArr) {
    for (let i = 0; i < destArr.length && slot.count > 0; i++) {
      if (destArr[i]?.id === slot.id && destArr[i].count < MAX_STACK) {
        const move = Math.min(MAX_STACK - destArr[i].count, slot.count);
        destArr[i].count += move;
        slot.count       -= move;
      }
    }
    for (let i = 0; i < destArr.length && slot.count > 0; i++) {
      if (!destArr[i]) {
        destArr[i] = { id: slot.id, count: slot.count };
        slot.count = 0;
      }
    }
    if (slot.count === 0) srcArr[srcIdx] = null;
  }

  _finish() {
    this._inv._notify();
    this._updateCraftOutput();
    this._refresh();
  }

  _updateCraftOutput() {
    this._inv.craftOutput = evaluateRecipe(this._inv.craft);
  }

  _bindMouse() {
    document.addEventListener('mousemove', (e) => {
      if (!this._visible) return;
      this._cursor.style.left = (e.clientX - 20) + 'px';
      this._cursor.style.top  = (e.clientY - 20) + 'px';
    });
    this._root.addEventListener('contextmenu', (e) => e.preventDefault());
    // Soltar botón derecho detiene el drag
    document.addEventListener('mouseup', (e) => {
      if (e.button === 2 && this._dragging) {
        this._dragging = false;
        this._dragSlots.clear();
      }
    });
  }

  // ── Refresco visual ──────────────────────────────────────

  _refreshOutCell() {
    const out = this._inv.craftOutput;
    const { preview, count } = this._outCell;
    if (out) {
      preview.style.cssText = `background-image:url('${getBlockIconURL(out.id)}');background-size:contain;background-repeat:no-repeat;background-position:center;display:block;`;
      count.textContent = out.count > 1 ? out.count : '';
      this._outCell.el.title = itemName(out.id);
    } else {
      preview.style.display = 'none';
      count.textContent = '';
    }
  }

  _refresh() {
    this._renderCells(this._craftCells,     this._inv.craft);
    this._renderCells(this._mainCells,      this._inv.main);
    this._renderCells(this._invHotbarCells, this._inv.hotbar);
    this._refreshOutCell();
    // Cursor
    if (!this._held || !this._visible) {
      this._cursor.style.display = 'none';
    } else {
      this._cursor.style.display = 'flex';
      this._cursor.style.backgroundImage    = `url('${getBlockIconURL(this._held.id)}')`;
      this._cursor.style.backgroundSize     = '80%';
      this._cursor.style.backgroundRepeat   = 'no-repeat';
      this._cursor.style.backgroundPosition = 'center';
      this._cursor.style.backgroundColor    = 'rgba(0,0,0,0.35)';
      this._cursor.querySelector('.inv-cur-count').textContent =
        this._held.count > 1 ? this._held.count : '';
    }
    this._invHotbarCells.forEach((c, i) => {
      c.el.classList.toggle('inv-cell-active', i === this._inv.selected);
    });
  }

  _renderCells(cells, arr) {
    for (let i = 0; i < cells.length; i++) {
      const { el, preview, count } = cells[i];
      const slot = arr[i];
      if (slot) {
        preview.style.cssText = `background-image:url('${getBlockIconURL(slot.id)}');background-size:contain;background-repeat:no-repeat;background-position:center;display:block;`;
        count.textContent = slot.count > 1 ? slot.count : '';
        el.title = itemName(slot.id);
      } else {
        preview.style.display = 'none';
        count.textContent = '';
        el.title = '';
      }
    }
  }
}

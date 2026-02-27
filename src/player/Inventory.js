// ============================================================
//  Inventory — hotbar (9) + inventario principal (27) + crafteo (4)
// ============================================================
import { BlockID } from '../world/BlockTypes.js';

/**
 * Slot: { id: BlockID, count: number } | null
 */
export class Inventory {
  constructor() {
    /** Hotbar: 9 slots */
    this.hotbar  = new Array(9).fill(null);
    /** Inventario principal: 27 slots */
    this.main    = new Array(27).fill(null);
    /** Grid de crafteo 2×2: índices [0,1,2,3] → posiciones [[0,1],[2,3]] */
    this.craft   = new Array(4).fill(null);
    /** Grid de crafteo 3×3 (mesa de crafteo): 9 slots */
    this.craft9  = new Array(9).fill(null);
    /** Slot de salida del crafteo (solo lectura, se calcula) */
    this.craftOutput  = null;
    this.craftOutput9 = null;

    this.selected = 0;
    this._listeners = [];
  }

  // ── Compat con código antiguo ──────────────────────────
  get slots() { return this.hotbar; }

  // ── Añadir bloques ─────────────────────────────────────

  addBlock(id) {
    if (id === BlockID.AIR || id == null) return;
    if (this._stackInto(this.hotbar, id)) return;
    if (this._stackInto(this.main,   id)) return;
    // inventario lleno
  }

  _stackInto(arr, id) {
    // primero apilar
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]?.id === id && arr[i].count < 64) {
        arr[i].count++;
        this._notify();
        return true;
      }
    }
    // luego slot vacío
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]) {
        arr[i] = { id, count: 1 };
        this._notify();
        return true;
      }
    }
    return false;
  }

  // ── Hotbar ─────────────────────────────────────────────

  consumeSelected() {
    const slot = this.hotbar[this.selected];
    if (!slot) return null;
    slot.count--;
    if (slot.count <= 0) this.hotbar[this.selected] = null;
    this._notify();
    return slot.id;
  }

  selectedBlock() {
    return this.hotbar[this.selected]?.id ?? null;
  }

  selectSlot(n) {
    this.selected = Math.max(0, Math.min(8, n));
    this._notify();
  }

  // ── Intercambio de slots (drag-and-drop simple) ────────

  /**
   * Intercambia (o fusiona) dos slots en la misma o distinta sección.
   * @param {'hotbar'|'main'|'craft'|'craftOutput'} srcArr
   * @param {number} srcIdx
   * @param {'hotbar'|'main'|'craft'} dstArr
   * @param {number} dstIdx
   */
  swapSlots(srcArr, srcIdx, dstArr, dstIdx) {
    const src = this[srcArr];
    const dst = this[dstArr];
    const tmp  = dst[dstIdx];
    dst[dstIdx] = src[srcIdx];
    src[srcIdx] = tmp;
    this._notify();
  }

  /** Mueve un slot de craftOutput al inventario */
  takeCraftResult() {
    if (!this.craftOutput) return;
    const { id, count } = this.craftOutput;
    for (let n = 0; n < count; n++) this.addBlock(id);
    for (let i = 0; i < 4; i++) {
      if (this.craft[i]) {
        this.craft[i].count--;
        if (this.craft[i].count <= 0) this.craft[i] = null;
      }
    }
    this._notify();
  }

  /** Variante para el grid 3×3 (mesa de crafteo) */
  takeCraftResult9() {
    if (!this.craftOutput9) return false;
    const { id, count } = this.craftOutput9;
    for (let n = 0; n < count; n++) this.addBlock(id);
    for (let i = 0; i < 9; i++) {
      if (this.craft9[i]) {
        this.craft9[i].count--;
        if (this.craft9[i].count <= 0) this.craft9[i] = null;
      }
    }
    this._notify();
    return true;
  }

  // ── Eventos ────────────────────────────────────────────

  onChange(fn) { this._listeners.push(fn); }
  _notify()    { this._listeners.forEach(fn => fn(this)); }
}

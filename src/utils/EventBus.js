// ============================================================
//  EventBus — pub/sub desacoplado (singleton)
//
//  Permite que cualquier sistema emita o escuche eventos sin
//  necesidad de referencias directas entre objetos.
//
//  Uso:
//    import { EventBus } from '../utils/EventBus.js';
//    EventBus.on('block:broken', ({ pos, blockId }) => { ... });
//    EventBus.emit('block:broken', { pos, blockId });
//    EventBus.off('block:broken', handler);     // desuscribir
//    EventBus.once('player:death', handler);    // solo una vez
//
//  Eventos del juego definidos como constantes en GameEvents.
// ============================================================

class EventBusClass {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Suscribe un handler a un evento.
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return this; // encadenamiento
  }

  /**
   * Suscribe un handler que se ejecuta SOLO la primera vez.
   * @param {string} event
   * @param {Function} handler
   */
  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Desuscribe un handler de un evento.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
    return this;
  }

  /**
   * Emite un evento con datos opcionales.
   * @param {string} event
   * @param {*} [data]
   */
  emit(event, data) {
    const handlers = this._listeners.get(event);
    if (!handlers) return;
    for (const h of handlers) {
      try { h(data); } catch (e) { console.error(`[EventBus] Error en handler de "${event}":`, e); }
    }
  }

  /**
   * Elimina todos los handlers de un evento o de todos.
   * @param {string} [event]
   */
  clear(event) {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }
}

/** Instancia global del EventBus */
export const EventBus = new EventBusClass();

// ── Catálogo de eventos del juego ─────────────────────────────
// Usar estos identificadores en lugar de strings mágicos.
export const GameEvents = Object.freeze({
  // Bloques
  BLOCK_BROKEN:  'block:broken',   // { pos: {x,y,z}, blockId: number }
  BLOCK_PLACED:  'block:placed',   // { pos: {x,y,z}, blockId: number }

  // Jugador
  PLAYER_HURT:   'player:hurt',    // { damage: number, health: number }
  PLAYER_DEATH:  'player:death',   // {}
  PLAYER_SPAWN:  'player:spawn',   // { pos: {x,y,z} }
  PLAYER_LAND:   'player:land',    // { velocity: number }

  // Items
  ITEM_DROPPED:  'item:dropped',   // { blockId: number, pos: {x,y,z} }
  ITEM_PICKED:   'item:picked',    // { blockId: number }

  // UI
  UI_INVENTORY_OPEN:  'ui:inventory:open',
  UI_INVENTORY_CLOSE: 'ui:inventory:close',
  UI_CRAFT_OPEN:      'ui:craft:open',
  UI_CRAFT_CLOSE:     'ui:craft:close',

  // Sistema
  CHUNK_LOADED:  'chunk:loaded',   // { cx: number, cz: number }
});

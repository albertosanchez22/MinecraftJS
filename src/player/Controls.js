// ============================================================
//  Controls — teclado + ratón (Pointer Lock API)
//  Desacoplado: solo almacena estado, no mueve al jugador.
// ============================================================

export class Controls {
  constructor(domElement) {
    this.keys = {
      forward:  false, // W
      backward: false, // S
      left:     false, // A
      right:    false, // D
      jump:     false, // Space
      sprint:   false, // Shift O doble tap W (solo velocidad horizontal)
      shiftHeld: false, // Shift físicamente presionado (para descender en vuelo)
    };

    this.mouseDelta    = { x: 0, y: 0 };
    this.mouseButtons  = { left: false, right: false };
    this.mouseJustDown = { right: false };
    this.scrollDelta   = 0;
    this.locked        = false;

    this._lastWPress   = 0;
    this.inventoryJustPressed = false;
    this.chatJustPressed      = false;  // T

    this._domElement = domElement;
    this._bindEvents();
  }

  _bindEvents() {
    // ── Pointer Lock ────────────────────────────────────
    this._domElement.addEventListener('click', () => {
      if (!this.locked) this._domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this._domElement;
      const hint        = document.getElementById('hint');
      const invScreen   = document.getElementById('inv-screen');
      const craftScreen = document.getElementById('craft-table-screen');
      const chatBox     = document.getElementById('chat-box');
      const anyOpen = invScreen?.style.display  === 'flex'
                   || craftScreen?.style.display === 'flex'
                   || chatBox?.style.display     === 'flex';
      if (hint) hint.style.display = (this.locked || anyOpen) ? 'none' : 'flex';
    });

    // ── Ratón (movimiento) ───────────────────────────────
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDelta.x += e.movementX;
      this.mouseDelta.y += e.movementY;
    });

    // ── Botones del ratón ─────────────────────────────────
    document.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      if (e.button === 0) this.mouseButtons.left  = true;
      if (e.button === 2) { this.mouseButtons.right = true; this.mouseJustDown.right = true; }
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseButtons.left  = false;
      if (e.button === 2) this.mouseButtons.right = false;
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // ── Rueda ─────────────────────────────────────────────
    document.addEventListener('wheel', (e) => {
      this.scrollDelta += e.deltaY;
    }, { passive: true });

    // ── Teclado ──────────────────────────────────────────
    const map = {
      'KeyW': 'forward',  'KeyS': 'backward',
      'KeyA': 'left',     'KeyD': 'right',
      'Space': 'jump',
    };

    document.addEventListener('keydown', (e) => {
      if (map[e.code] !== undefined) {
        this.keys[map[e.code]] = true;
        if (e.code === 'Space') e.preventDefault();
      }

      // Sprint: Shift izq/der O doble tap W (≤ 300 ms)
      // shiftHeld: SOLO cuando Shift está físicamente pulsado
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.keys.sprint    = true;
        this.keys.shiftHeld = true;
      }
      if (e.code === 'KeyW' && !e.repeat) {
        const now = performance.now();
        if (now - this._lastWPress < 300) this.keys.sprint = true; // sprint horizontal, NO shiftHeld
        this._lastWPress = now;
      }

      // Abrir/cerrar inventario con E
      if (e.code === 'KeyE') {
        this.inventoryJustPressed = true;
      }

      // Abrir chat con T
      if (e.code === 'KeyT' && this.locked) {
        this.chatJustPressed = true;
      }

      // Slots 1-9 por teclado
      const digit = parseInt(e.key);
      if (digit >= 1 && digit <= 9) this._onSlotKey?.(digit - 1);
    });
    document.addEventListener('keyup', (e) => {
      if (map[e.code] !== undefined) this.keys[map[e.code]] = false;
      // Soltar Shift cancela sprint y shiftHeld; soltar W cancela solo sprint
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.keys.sprint    = false;
        this.keys.shiftHeld = false;
      }
      if (e.code === 'KeyW') this.keys.sprint = false;
    });
  }

  /** Consume el delta del ratón (llamar una vez por frame) */
  consumeMouseDelta() {
    const d = { x: this.mouseDelta.x, y: this.mouseDelta.y };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return d;
  }

  /** Consume el flag de inventario */
  consumeInventoryKey() {
    const v = this.inventoryJustPressed;
    this.inventoryJustPressed = false;
    return v;
  }

  /** Consume el flag de clic derecho (true solo una vez por click) */
  consumeRightClick() {
    const v = this.mouseJustDown.right;
    this.mouseJustDown.right = false;
    return v;
  }

  /** Consume el delta de la rueda y devuelve el número de pasos (+/-) */
  consumeScrollSteps() {
    const steps = Math.round(this.scrollDelta / 100);
    this.scrollDelta = 0;
    return steps;
  }

  /** Consume el flag de abrir chat (T) */
  consumeChatKey() {
    const v = this.chatJustPressed;
    this.chatJustPressed = false;
    return v;
  }
}

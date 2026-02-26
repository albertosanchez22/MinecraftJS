// ============================================================
//  Chat — barra de comandos (T abre, ESC / Enter cierra)
//  El nodo #chat-box debe existir en el HTML.
// ============================================================

export class Chat {
  constructor() {
    this._el    = document.getElementById('chat-box');
    this._input = document.getElementById('chat-input');
    this.isOpen = false;
    this._onCommand = null;

    this._input?.addEventListener('keydown', (e) => {
      // stopPropagation para que Controls.js no reciba las teclas mientras se escribe
      e.stopPropagation();
      if (e.code === 'Escape') { e.preventDefault(); this.close(); }
      if (e.code === 'Enter')  { e.preventDefault(); this._submit(); }
    });

    this._el?.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Registra el callback que se invoca con el comando (sin parsear). */
  onCommand(fn) { this._onCommand = fn; }

  open() {
    this.isOpen = true;
    this._el.style.display = 'flex';
    this._input.value = '';
    // Liberamos el pointer lock para poder escribir
    document.exitPointerLock?.();
    // Pequeño delay para que el foco no interfiera con pointerlockchange
    setTimeout(() => this._input?.focus(), 30);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._el.style.display = 'none';
    this._input?.blur();
    // Re-lock pointer
    document.querySelector('#canvas-container canvas')?.requestPointerLock();
  }

  _submit() {
    const cmd = this._input.value.trim();
    if (cmd) this._onCommand?.(cmd);
    this.close();
  }
}

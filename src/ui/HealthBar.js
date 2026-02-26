// ============================================================
//  HealthBar — muestra 10 corazones (20 HP)
// ============================================================

const MAX_HEALTH = 20;

export class HealthBar {
  constructor() {
    this._el = document.getElementById('health-bar');
    this.update(MAX_HEALTH);
  }

  /**
   * Actualiza la barra de vida.
   * @param {number} hp  0–20
   */
  update(hp) {
    if (!this._el) return;
    hp = Math.max(0, Math.min(MAX_HEALTH, hp));

    let html = '';
    for (let i = 0; i < 10; i++) {
      const val = hp - i * 2;
      if      (val >= 2) html += '<span class="heart full">❤</span>';
      else if (val >= 1) html += '<span class="heart half">❤</span>';
      else               html += '<span class="heart empty">❤</span>';
    }
    this._el.innerHTML = html;
  }
}

// ============================================================
//  Constants — valores globales del juego
//  Edita aquí para ajustar gameplay sin tocar lógica
// ============================================================

export const CHUNK_SIZE   = 16;   // bloques en X y Z por chunk
export const CHUNK_HEIGHT = 64;   // bloques en Y por chunk
export const RENDER_DISTANCE = 4; // chunks en cada dirección

// Física
export const GRAVITY         = -28;   // m/s²
export const JUMP_FORCE      =   8;   // velocidad inicial al saltar
export const PLAYER_SPEED    =   5;   // m/s en suelo
export const PLAYER_SPRINT   =   9;   // m/s al correr (futuro)
export const PLAYER_HEIGHT   = 1.8;   // alto del jugador
export const PLAYER_WIDTH    = 0.6;   // ancho (AABB)
export const FLY_SPEED       =   8;   // m/s vertical en modo vuelo
export const FALL_DAMAGE_VEL = 13;    // m/s hacia abajo para empezar a recibir daño

// Terreno
export const SEA_LEVEL        = 32;
export const TERRAIN_AMPLITUDE = 10;
export const TERRAIN_SCALE     = 0.05;

// Generación
export const WORLD_SEED = 12345;

// ============================================================
//  Constants — valores globales del juego agrupados por sistema
//
//  Regla: ningún archivo del juego debe tener "números mágicos".
//  Añade aquí cualquier valor ajustable y expórtalo con nombre
//  descriptivo en MAYÚSCULAS_CON_GUIONES.
// ============================================================

// ── Mundo / Chunks ──────────────────────────────────────────
/** Bloques en X y Z por chunk */
export const CHUNK_SIZE      = 16;
/** Bloques en Y por chunk */
export const CHUNK_HEIGHT    = 64;
/** Chunks visibles en cada dirección desde el jugador */
export const RENDER_DISTANCE = 4;

// ── Física ──────────────────────────────────────────────────
/** Aceleración gravitatoria (m/s²) */
export const GRAVITY         = -28;
/** Impulso vertical al saltar (m/s) */
export const JUMP_FORCE      =   8;
/** Velocidad horizontal andando (m/s) */
export const PLAYER_SPEED    =   5;
/** Velocidad horizontal corriendo (m/s) */
export const PLAYER_SPRINT   =   9;
/** Altura del jugador en bloques */
export const PLAYER_HEIGHT   = 1.8;
/** Anchura del AABB del jugador en bloques */
export const PLAYER_WIDTH    = 0.6;
/** Velocidad vertical en modo vuelo (m/s) */
export const FLY_SPEED       =   15;
/** Velocidad de impacto mínima para recibir daño de caída (m/s) */
export const FALL_DAMAGE_VEL = 13;

// ── Terreno / Generación ────────────────────────────────────
/** Nivel del mar en bloques */
export const SEA_LEVEL           =  32;
/** Amplitud máxima de las colinas */
export const TERRAIN_AMPLITUDE   =  10;
/** Escala del ruido Perlin para el terreno */
export const TERRAIN_SCALE       = 0.05;
/** Semilla determinista del mundo */
export const WORLD_SEED          = 12345;

// ── Items en el suelo ────────────────────────────────────────
/** Distancia a la que el item se recoge automáticamente (bloques) */
export const ITEM_PICKUP_DIST  = 1.5;
/** Distancia a la que el item empieza a magnetizarse (bloques) */
export const ITEM_MAGNET_DIST  = 3.5;
/** Velocidad de atracción magnética */
export const ITEM_MAGNET_SPEED = 7;
/** Tiempo en segundos hasta que el item desaparece */
export const ITEM_DESPAWN_TIME = 300;

// ── Jugador ─────────────────────────────────────────────────
/** Distancia máxima de alcance del jugador (bloques) */
export const PLAYER_REACH = 5;

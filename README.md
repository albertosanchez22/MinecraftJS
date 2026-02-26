# MinecraftJS

> ⚠️ **Este proyecto es una prueba de concepto.** No es un juego oficial ni tiene afiliación con Mojang o Microsoft.

## ¿Qué es esto?

MinecraftJS es un clon simplificado de Minecraft que corre completamente en el navegador, sin necesidad de instalar nada. Está desarrollado como experimento técnico para demostrar hasta dónde se puede llegar reproduciendo las mecánicas del juego original usando únicamente tecnologías web estándar.

## ¿Cómo está hecho?

- **Three.js** (v0.168.0 vía CDN) — motor de renderizado 3D con WebGL
- **ES Modules** nativos del navegador — sin bundler (Vite, Webpack, etc.), sin Node.js
- **Web Audio API** — sonidos generados proceduralmente en tiempo real, sin archivos de audio
- **Canvas 2D API** — texturas pixel art de 16×16 generadas en tiempo de ejecución, sin imágenes externas
- **Python 3 HTTP server** — para servir los archivos en local durante el desarrollo

## Características implementadas

- Mundo generado proceduralmente con chunks (terreno, biomas simples, agua, nieve)
- Sistema de físicas: gravedad, colisiones, caída libre
- Destrucción y colocación de bloques con animación de rotura
- **Inventario completo**: hotbar, inventario 4×9, crafteo 2×2 y mesa de crafteo 3×3
- Drag & drop de items, shift-click, click derecho para dividir stacks
- **Recetas de crafteo** (planchas, mesa de crafteo...)
- **Iconos isométricos 3D** para los items en el inventario y la hotbar
- Animales (vacas, cerdos) con IA básica de deambulación
- Items drops al romper bloques y al matar animales
- Barra de vida con 10 corazones y daño por caída
- Modo vuelo (`/fly` vía chat con la tecla T)
- Renderizado de la mano del jugador en primera persona

## Cómo ejecutarlo

```bash
cd MinecraftJS
python3 -m http.server 8080
```

Luego abre [http://localhost:8080](http://localhost:8080) en el navegador.

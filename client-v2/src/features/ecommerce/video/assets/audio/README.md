# Audio — Video Creando Moda

Pistas de audio para el render Remotion del video TikTok de Textiles Creando Moda.

## Archivos requeridos

Coloca estos archivos en `client-v2/public/` (Remotion usa `staticFile()`):

| Archivo | Uso | Duración sugerida |
|---------|-----|-------------------|
| `fashion-bed.mp3` | Pista principal fashion/upbeat | ~25 s (loopable) |
| `sfx-whoosh.mp3` | Transiciones en frames 90, 180, 330, 450, 570 | ~0.3–0.5 s |

## Fuentes sugeridas (royalty-free)

- [Pixabay Music](https://pixabay.com/music/) — buscar "fashion upbeat"
- [Uppbeat](https://uppbeat.io/) — categoría Fashion / Lifestyle
- [Mixkit](https://mixkit.co/free-stock-music/) — "modern fashion"

## Comportamiento sin audio

Si `fashion-bed.mp3` no existe en `public/`, la composición **renderiza sin audio** (graceful skip).
Los SFX también se omiten automáticamente.

Para activar audio después de agregar los archivos, cambia `ENABLE_AUDIO = true` en
`CreandoModaTiktok.tsx`.

## Envelope de volumen

La pista principal sube progresivamente:

- 0–1.5 s: fade in → 0.4
- 1.5–21 s: 0.4 → 0.85
- 21–23 s: fade out → 0.2

## Render

```bash
npm run export:creando-moda-video          # desde raíz del repo
cd client-v2
npm run remotion:render:creando-moda
```

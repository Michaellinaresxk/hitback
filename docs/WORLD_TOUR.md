# HITBACK — World Tour

> Estado actualizado el 2026-11-07. La rama combo que omite el landing se documenta en [`../../documentation/HITBACK_SYSTEM_DOCS.md`](../../documentation/HITBACK_SYSTEM_DOCS.md).

## Concepto

World Tour tiene una ruta aleatoria independiente de 22 posiciones por jugador: start (0), 20 ciudades (1–20) y finish (21). El GM elige quién acertó; el backend avanza a ese jugador una posición al liquidar el reveal. Ruta, posición, score/fans y estado de partida se persisten en PostgreSQL para recuperarse tras reiniciar Expo o el proceso servidor.

## Fuentes de implementación

| Archivo                                 | Responsabilidad                                                 |
| --------------------------------------- | --------------------------------------------------------------- |
| `constants/worldTour.ts`                | Orden de actos, mecánicas de tile, tamaño de ruta y rangos      |
| `constants/worldTourCities.json`        | Pools, IDs, emoji y tipos de tile por acto                     |
| `i18n/locales/tour-cities.*.json`       | Contenido localizado de las 58 ciudades en es/en/pl             |
| `types/worldTour.types.ts`              | `TileType`, `MechanicTrigger`, `ActId`, `CityData`, `BoardTile` |
| `utils/worldtourUtils.ts`               | Generación aleatoria y helpers de posición/progreso             |
| `store/slices/gameSlice.ts`             | Genera las rutas antes de crear la sesión; restaura estado       |
| `store/slices/playerSlice.ts`           | Presenta posición sincronizada del jugador correcto             |
| `server/services/GameSessionService.js` | Posee rutas, posiciones, score y resolución de ganador           |
| `server/services/GameSessionPersistence.js` | Guarda/restaura snapshots y hash de capability en PostgreSQL |
| `hooks/usePointsActions.ts`             | Revela la ronda y presenta el tile canónico de llegada            |
| `app/(tabs)/game.tsx`                   | Maneja el aterrizaje y dispara mecánicas existentes             |
| `components/modal/TourLandingModal.tsx` | Presenta ciudad, historia y tipo de casilla                     |

## Tablero y generación

| Posición | Acto               | Pool de ciudades | Selección por ruta |
| -------- | ------------------ | ---------------: | -----------------: |
| 0        | Start              |                — |           1 salida |
| 1–5      | `act1_underground` |               15 |                  5 |
| 6–10     | `act2_theBuzz`     |               14 |                  5 |
| 11–15    | `act3_goingGlobal` |               14 |                  5 |
| 16–20    | `act4_headliner`   |               15 |                  5 |
| 21       | Finish             |                — |          1 llegada |

`generateRoute()` baraja cada pool y toma cinco ciudades; su orden también cambia. Con los pools actuales hay exactamente **7,494,864,659,627,304,960,000 secuencias ordenadas posibles por jugador**. El número depende del contenido de `worldTourCities.json`; no mantener cifras manuales antiguas como 44.100 o “más de 50.000”. Dos jugadores generan rutas independientemente y pueden repetir ciudades.

La forma de la ciudad usada por la ruta es `id`, `emoji`, `tileType`, `country` y `yearFact`. Los pools también conservan campos editoriales históricos, pero la interfaz no los usa. El landing resuelve `city`, `country`, `venue`, `story` y `realFact` desde `i18n/locales/tour-cities.{es,en,pl}.json`, según el idioma activo. Los 58 IDs de los pools deben existir en los tres recursos; la prueba `npm run test:tour-locales` verifica cobertura y paridad de claves.

Para agregar una ciudad, añádela al array del acto en `constants/worldTourCities.json` y usa uno de los `tileType` declarados en `types/worldTour.types.ts`. Mantén IDs únicos.

## Avance y ronda

1. `setup-game.tsx` genera rutas independientes y las envía con `player_1`…`player_N` al crear la sesión.
2. El backend valida y conserva las rutas; Expo mantiene una copia para presentar los tiles.
3. La ronda se obtiene del backend mediante `useGameFlow()` y `GameSessionService`.
4. `usePointsActions.handleAwardPoints()` revela al ganador. El backend liquida score/modificadores y avanza una casilla en una sola mutación persistida.
5. Expo sincroniza `score` y `boardPosition` devueltos; salvo combo o fin de partida, presenta el tile correspondiente.
6. Al continuar, `game.tsx` ejecuta la mecánica implementada o avanza a la ronda siguiente.
7. Si nadie acierta, nadie avanza; el backend conserva la ronda resuelta y prepara otra.

La posición no se acepta desde el cliente como una escritura autoritativa. Solo el ganador del reveal avanza. Las rutas/posiciones se recuperan desde el backend al reanudar; la copia Expo es de presentación.

## Final del tour y recuperación

- El tour termina cuando cualquier jugador llega a la posición 21, sin depender de un umbral de fans.
- El ganador se determina por más fans (`score`); si empatan, gana quien tenga mayor `boardPosition`.
- El botón **Continuar Tour** del inicio recupera sesión ID/capability desde SecureStore, consulta el estado autenticado y reconstruye jugadores, rutas, posiciones y fans.
- PostgreSQL almacena snapshots JSONB en `game_session_snapshots`; se conserva el hash de la capability, no el token en claro.
- Antes de iniciar el backend con esta versión, ejecutar una vez `cd server && npm run migrate:sessions`.
- La API de juego devuelve `503` si PostgreSQL no está disponible para inicializar o guardar una mutación; no confirma una sesión no persistida.
- Las mutaciones se serializan dentro de un único proceso backend; usar una sola instancia hasta añadir bloqueo/transacciones en PostgreSQL para despliegues con réplicas.
- Si Expo se reinicia con una pregunta aún abierta, el backend vuelve a entregar esa misma ronda en lugar de consumir otra.
- Los snapshots mantienen sesiones sin expiración definida por ahora; acordar política de retención antes de lanzar a escala.

## Mecánicas: estado real

| Tile          | Trigger         | Comportamiento al continuar                                                      | Estado                                                   |
| ------------- | --------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `concert`     | ninguno         | Avanza a la próxima ronda                                                        | Implementado                                             |
| `festival`    | `reaction_card` | Avanza; el GM gestiona Reaction Cards mediante el flujo existente del scoreboard | Parcial: no abre automáticamente el selector de carta    |
| `record_deal` | `split_dice`    | Avanza a la próxima ronda                                                        | Pendiente: no hay dados, modal ni división de puntos     |
| `rival_band`  | `duel`          | Abre el modal de duelo para el jugador que aterrizó                              | Implementado; verifica selección de oponente en el modal |
| `sold_out`    | `double_points` | Activa Double Platinum para la siguiente respuesta y avanza                      | Implementado                                             |

La existencia de `MechanicTrigger` o de `TILE_MECHANICS` por sí sola no significa que haya una mecánica completa. En particular, no describir `split_dice` como activa.

## Modal de aterrizaje

`TourLandingModal` recibe `visible`, `event` y `onContinue`. Muestra posición, emoji, ciudad, país, venue, tipo, jugador, historia y dato real en el idioma activo. El evento incluye el tile, jugador, transición de acto y nuevo acto opcional. El modal deriva el trigger a partir de `TILE_MECHANICS` y lo entrega al callback. La llegada usa una entrada breve con Reanimated; el botón de continuar permanece disponible de inmediato y `useReducedMotion` desactiva las transiciones cuando el sistema solicita reducir movimiento.

## Límites y trabajo pendiente

- No hay vista de tablero de ruta por jugador en el flujo descrito aquí.
- No se muestra aún el resumen de paradas o países únicos; debe derivarse de las rutas individuales, sin enumerar un camino fijo.
- `split_dice` está declarado pero no implementado.
- El trigger `reaction_card` no abre automáticamente un selector; la gestión actual continúa en el scoreboard.
- No hay historial durable de ciudades visitadas.

Al cambiar cualquiera de estos comportamientos, actualiza primero esta guía y el documento canónico [`../../documentation/HITBACK_SYSTEM_DOCS.md`](../../documentation/HITBACK_SYSTEM_DOCS.md).

# HITBACK — World Tour

> Reconciliado con el código Expo el 2026-10-20. Esta guía describe comportamiento local de World Tour; la rama combo que omite el landing se documenta en [`../../documentation/HITBACK_SYSTEM_DOCS.md`](../../documentation/HITBACK_SYSTEM_DOCS.md).

## Concepto

World Tour es un recorrido local de 22 posiciones por jugador: start (0), 20 ciudades (1–20) y finish (21). En una ronda normal, el GM elige quién acertó y solo ese jugador avanza una posición. Las rutas se generan al iniciar la partida y no se envían al backend.

## Fuentes de implementación

| Archivo                                 | Responsabilidad                                                 |
| --------------------------------------- | --------------------------------------------------------------- |
| `constants/worldTour.ts`                | Orden de actos, mecánicas de tile, tamaño de ruta y rangos      |
| `constants/worldTourCities.json`        | Pools de ciudades por acto y contenido narrativo                |
| `types/worldTour.types.ts`              | `TileType`, `MechanicTrigger`, `ActId`, `CityData`, `BoardTile` |
| `utils/worldtourUtils.ts`               | Generación aleatoria y helpers de posición/progreso             |
| `store/slices/gameSlice.ts`             | Genera una ruta por jugador al ejecutar `startGame()`           |
| `store/slices/playerSlice.ts`           | Avanza la posición del jugador correcto                         |
| `hooks/usePointsActions.ts`             | Avanza al ganador y prepara el evento de aterrizaje             |
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

La forma de la ciudad usada por la ruta es `id`, `emoji`, `tileType`, `country` y `yearFact`. El JSON también incluye campos de UI como `name`, `location`, `venue`, `story` y `realFact`. El modal resuelve estos últimos desde el JSON; i18n sirve de fallback para etiquetas o ciudades sin entrada.

Para agregar una ciudad, añádela al array del acto en `constants/worldTourCities.json` y usa uno de los `tileType` declarados en `types/worldTour.types.ts`. Mantén IDs únicos.

## Avance y ronda

1. `startGame()` en `gameSlice.ts` inicializa jugadores, crea una ruta para cada ID local y guarda el mapa en `worldTourRoutes`.
2. La ronda se obtiene del backend mediante `useGameFlow()` y `GameSessionService`.
3. `usePointsActions.handleAwardPoints()` envía al ganador al backend y llama `advancePlayerBoard(playerId)`.
4. El slice cambia únicamente el `boardPosition` del ganador, limitado a 21, y devuelve el tile.
5. Salvo combo o fin de partida, la UI abre `TourLandingModal` para ese tile.
6. Al continuar, `game.tsx` ejecuta la mecánica implementada o avanza a la ronda siguiente.
7. Si nadie acierta, nadie avanza; se revela la respuesta y se prepara otra ronda.

El tablero no es una segunda fuente de puntuación, ni se persiste, sincroniza o reconstruye después de reiniciar la app.

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

`TourLandingModal` recibe `visible`, `event` y `onContinue`. Muestra posición, emoji, nombre del venue, tipo, jugador, historia y dato real. El evento incluye el tile, jugador, transición de acto y nuevo acto opcional. El modal deriva el trigger a partir de `TILE_MECHANICS` y lo entrega al callback.

## Límites y trabajo pendiente

- El tablero y las rutas solo viven en Zustand local; no hay recuperación backend.
- No hay vista de tablero de ruta por jugador en el flujo descrito aquí.
- `split_dice` está declarado pero no implementado.
- El trigger `reaction_card` no abre automáticamente un selector; la gestión actual continúa en el scoreboard.
- No hay historial durable de ciudades visitadas.

Al cambiar cualquiera de estos comportamientos, actualiza primero esta guía y el documento canónico [`../../documentation/HITBACK_SYSTEM_DOCS.md`](../../documentation/HITBACK_SYSTEM_DOCS.md).

# AGENTS.md — HITBACK Expo App

> Fuente de instrucciones para agentes. Reconciliado con el código Expo el 2026-10-20; los contratos del servidor quedan pendientes de una auditoría separada. Para arquitectura funcional, consulta [`../documentation/HITBACK_SYSTEM_DOCS.md`](../documentation/HITBACK_SYSTEM_DOCS.md) y [`docs/WORLD_TOUR.md`](docs/WORLD_TOUR.md).

## Proyecto y stack

- App móvil de Game Master para iOS y Android; el juego se controla desde un solo dispositivo para 2–8 jugadores.
- Expo SDK 54, React Native 0.81, React 19 y TypeScript. `newArchEnabled` está activo en `app.json`.
- Rutas con Expo Router bajo `app/`; estado global con Zustand y slices.
- Traducciones con i18next/react-i18next; idiomas disponibles en `i18n/locales/`.
- Backend Node/Express separado en `../server`. Las rondas y puntuación canónicas se procesan allí.
- El proyecto Expo no declara scripts de pruebas automáticas; lint está configurado.

## Comandos verificados

Desde `hitback/`:

```bash
npm install
npm start
npm run ios
npm run android
npm run web
npm run lint
npx tsc --noEmit
```

`npm start` ejecuta `expo start`. Usa un development build cuando una dependencia nativa o el dispositivo lo requieran; Expo Go no debe describirse como universalmente incompatible por tener New Architecture habilitada.

Desde `server/`:

```bash
npm install
npm run dev
npm start
npm test
npm run validate
```

El script `validate` todavía contiene comprobaciones heredadas de QR de canciones y puede fallar aunque la API usada por la app funcione. No lo tomes como verificación completa de la integración.

## Límites arquitectónicos importantes

- `app/(tabs)/game.tsx` compone la pantalla de Game Master; el flujo de ronda y sus fases están en `hooks/useGameFlow.ts`.
- `services/GameSessionService.ts` habla con `/api/v2/game/*`; las Power Cards usan `/api/cards/*`.
- `store/slices/gameSlice.ts` y `playerSlice.ts` guardan estado local de UI/jugadores y las rutas World Tour. El backend maneja puntuación de ronda, apuestas y combos.
- IDs locales de jugador y backend son distintos. Usa `buildPlayerIdMap()` / `getBackendPlayerId()` de `utils/game/gameHelpers.ts` para las llamadas del backend.
- Los puntajes locales de Reaction Cards deben sincronizarse con `applyScoreDelta()` en `GameSessionService`; de lo contrario, la siguiente respuesta del backend puede sobrescribirlos.
- El backend se configura en `services/GameSessionService.ts` (`getBaseUrl`): primero lee `EXPO_PUBLIC_HITBACK_API_URL`; en desarrollo intenta usar el host de `Constants.expoConfig.hostUri` y recurre a `192.168.1.10` si no lo detecta; fuera de desarrollo devuelve `https://api.hitback.com`. La conectividad y disponibilidad del host de producción no se han verificado aquí. No describas ninguna URL como servicio disponible sin probarla.
- El flujo normal obtiene una ronda desde el backend, no escanea un QR de canción. El escaneo QR está destinado a Power Cards (`HITBACK_PC_...`).

## Rutas y estado de partida

- Rutas Expo: `app/`, con pantallas principales en `app/(tabs)/` y setup en `app/setup-game.tsx`.
- Store combinado: `store/gameStore.ts`; definiciones en `store/slices/` y `store/types/`.
- Hooks de dominio: `useGameFlow`, `usePointsActions`, `useGameTurnActions`, `useComboFlow`, `useBettingActions` y `useFeaturingDuelActions`.
- Tipos de juego: `types/game.types.ts`, `types/worldTour.types.ts` y `store/types/gameStoreTypes.ts`.
- World Tour usa `constants/worldTour.ts`, `constants/worldTourCities.json`, `utils/worldtourUtils.ts` y `components/modal/TourLandingModal.tsx`.

## Convenciones de código

- TypeScript estricto: modela datos con `interface` y uniones con `type`; evita `any` salvo en una frontera heredada documentada.
- Componentes en PascalCase, hooks `useX`, funciones/archivos utilitarios en camelCase; usa alias `@/` para imports del proyecto.
- Agrupa imports de React/Expo, terceros, módulos internos y tipos. Sigue el orden y formato del archivo vecino cuando difiera.
- En componentes, declara tipos de props, llama hooks al inicio y separa estado derivado de handlers/render. No añadas `useMemo`/`useCallback` por defecto; úsalos cuando el patrón local o la identidad de callback lo necesite.
- Sigue el patrón `StateCreator<GameStore, [], []>` de los slices existentes. Usa selectores Zustand específicos o `useGameScreenStore()` en la pantalla de juego.
- Maneja fallos asíncronos con feedback visible y logs; conserva guards contra dobles taps cuando una acción hace varias llamadas de red.
- En cambios de ronda, mantén la composición hook-based de `app/(tabs)/game.tsx`; no vuelvas a concentrar lógica de backend, combo y puntuación en la pantalla.

## Flujo de trabajo con specs y agentes

- Antes de implementar una feature nueva, crea o localiza `specs/<feature>/SPEC.md` desde `specs/templates/FEATURE_SPEC.template.md`. Mantén `Draft` hasta que estén aprobadas las decisiones de producto, puntuación, persistencia y límites de sesión.
- Sigue [`../.github/skills/spec-driven-feature/SKILL.md`](../.github/skills/spec-driven-feature/SKILL.md) y las instrucciones de workspace en [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md). El agente implementador solo debe recibir una spec aprobada.
- La spec debe incluir comportamiento actual verificado, propietario de datos, contratos HTTP si aplican, criterios observables, pruebas automáticas y verificaciones manuales/dispositivo. Para cambios HTTP, inspecciona también el propietario correspondiente en `server/`; no infieras el contrato desde el cliente solamente.
- Al terminar, registra en la spec los comandos realmente ejecutados, resultados, fallos preexistentes y verificaciones bloqueadas. No conviertas una revisión de código en una afirmación de prueba funcional o de producción.
- Usa [`../documentation/README.md`](../documentation/README.md) para elegir documentación vigente. Los informes históricos no son contratos ni prueba de estado actual.

## Reglas para cambios

- Sigue TypeScript, los alias `@/` y los patrones locales de Zustand/hook ya presentes.
- Mantén separadas las mutaciones locales de UI y las mutaciones que deben persistir en el backend.
- Al modificar contratos HTTP, verifica ambos extremos: `hitback/services/` y `server/routes/` más el servicio correspondiente.
- No afirmes que una mecánica está implementada solo porque exista en un tipo o constante. Verifica el manejador y el efecto observable. Actualmente `split_dice` está declarado, pero el landing solo avanza la ronda.
- Evita actualizar esta guía con líneas de código, IPs de red o reportes temporales que cambian con frecuencia. Mantén los detalles de implementación en documentación versionada y enlazada.

## Mecánicas y estado conocido

- Partida normal: todos pueden responder; el GM decide el ganador. Solo el ganador avanza una casilla de su ruta.
- World Tour es estado local de Expo y no se sincroniza ni recupera desde el backend.
- El aterrizaje `festival` permite gestionar una Reaction Card en el flujo existente; `rival_band` abre el duelo; `sold_out` activa Double Platinum para la próxima respuesta. `record_deal` / `split_dice` no tiene flujo implementado.
- ARTIST HOLD dura `ARTIST_HOLD_ROUND = 1`; `nextTurn()` reduce el contador de congelación una vez por ronda.
- La condición de victoria Expo está definida por `SCORE_TO_WIN = 22` y `setup-game.tsx` envía ese valor al crear la sesión. El backend conserva el `targetScore` recibido y usa 22 como default para otros clientes; mantener ambos lados y sus tests alineados al cambiar la regla.

## Documentación

- Arquitectura Expo/backend, flujo y contratos: [`../documentation/HITBACK_SYSTEM_DOCS.md`](../documentation/HITBACK_SYSTEM_DOCS.md).
- Proceso de specs: [`../specs/README.md`](../specs/README.md) y [`../.github/skills/spec-driven-feature/SKILL.md`](../.github/skills/spec-driven-feature/SKILL.md).
- World Tour: [`docs/WORLD_TOUR.md`](docs/WORLD_TOUR.md).
- Índice y estado documental: [`../documentation/README.md`](../documentation/README.md).
- Los documentos de implementación y verificación fechados en `documentation/` son históricos salvo que el índice los marque como vigentes.

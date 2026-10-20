# Combo Notification: Expo Flow

> Reconciliado con el código Expo el 2026-10-20. Esta guía documenta el cliente. La detección de combos, el contrato de `comboStatus`, QR, inventario y persistencia del servidor no fueron revalidados en esta pasada. No representa una prueba funcional ni certificación de producción.

## Flujo actual

1. `usePointsActions.handleAwardPoints()` recibe el resultado de `revealAnswer()` y, si contiene `comboStatus`, llama `activateCombo()` y retorna.
2. `useComboFlow` activa el estado y `game.tsx` muestra `ComboNotification`.
3. La notificación no se cierra automáticamente. El GM la cierra manualmente; ese handler abre el modal de escaneo.
4. En el modal, el GM puede abrir la cámara o elegir “Ahora No”. El cierre/omisión y el fin del manejo del scan avanzan la ronda.
5. El hook restablece un combo que siga activo tras 30 segundos y avanza la ronda.

## Responsabilidades

| Archivo                                       | Responsabilidad confirmada en Expo                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `hooks/usePointsActions.ts`                   | Lee `comboStatus`, activa el flujo y retorna antes de la lógica normal de aterrizaje/fin de juego |
| `hooks/useComboFlow.ts`                       | Estado de combo, cambio de notificación a scanner, manejo del scan/skip y avance                  |
| `app/(tabs)/game.tsx`                         | Conecta hooks, efectos de UI y renderizado de modales                                             |
| `components/rewards/ComboNotification.tsx`    | Modal de notificación manual con animación de pulso                                               |
| `components/powercard/PowerCardScanModal.tsx` | Instrucción, apertura de scanner y opción para omitir                                             |
| `services/GameSessionService.ts`              | Cliente `scanPowerCard()` para `POST /api/cards/scan-qr`                                          |

## Integración de cliente

`game.tsx` conecta `useComboFlow` con `players`, el mapeo de IDs, `addPowerCard`, feedback, `advanceToNextTurn` y `applyImmediateCardEffect`. Para efectos inmediatos el wiring actual llama `applyBadReview()` y persiste el delta con `applyScoreDelta()` usando el ID backend.

El cliente comprueba `result.success`. Un resultado con `effectOnDraw` aplica el cambio inmediato y muestra feedback; de lo contrario añade la carta recibida al inventario local. Las respuestas y validaciones reales son responsabilidad del servidor y requieren una revisión backend separada.

## Límite conocido

`usePointsActions` avanza la posición World Tour antes de comprobar `comboStatus`. Al encontrar combo retorna antes de preparar `landingEvent` y antes del chequeo local de `gameOver`. Por tanto, la rama actual no muestra el landing del tile ni ejecuta ese chequeo local de fin de partida. Hace falta decidir el comportamiento esperado y cubrirlo en una spec antes de cambiarlo.

## Validación

La revisión del 2026-10-20 fue una inspección de código, no una ejecución. Usa [`TESTING_CHECKLIST.md`](TESTING_CHECKLIST.md) para registrar pruebas manuales futuras. Antes de probar escaneo o scoring, contrasta `server/routes/`, controllers y servicios con el cliente. No uses snapshots de `documentation/` como evidencia de resultados actuales.

# Combo Notification: Expo Flow

> Reconciliado con el código Expo el 2026-10-20. Esta guía documenta el cliente. La detección de combos, el contrato de `comboStatus`, QR, inventario y persistencia del servidor no fueron revalidados en esta pasada. No representa una prueba funcional ni certificación de producción.

## Flujo actual

1. `usePointsActions.handleAwardPoints()` recibe el resultado de `revealAnswer()` y, si contiene `comboStatus`, llama `activateCombo()` y retorna. El reveal sincroniza el puntaje canónico después de aplicar los modificadores de ronda.
2. `useComboFlow` activa el estado y `game.tsx` muestra `ComboNotification`.
3. La notificación no se cierra automáticamente. El GM la cierra manualmente; ese handler abre el modal de escaneo.
4. En el modal, el GM puede abrir la cámara o elegir “Ahora No”. El cierre/omisión y el fin del manejo del scan avanzan la ronda.
5. No hay un timeout automático. El Game Master debe completar el escaneo o elegir explícitamente omitirlo; entonces avanza la ronda.

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

`game.tsx` conecta `useComboFlow` con `players`, el mapeo de IDs, `addPowerCard`, feedback, `advanceToNextTurn` y `applyImmediateCardEffect`. Los efectos inmediatos se liquidan en el servidor mediante el endpoint de ajustes de puntaje y luego se sincronizan los jugadores canónicos.

El cliente comprueba `result.success`. Un resultado con `effectOnDraw` aplica el cambio inmediato y muestra feedback; de lo contrario añade la carta recibida al inventario local. Las respuestas y validaciones reales son responsabilidad del servidor y requieren una revisión backend separada.

## Límite conocido

`usePointsActions` avanza la posición World Tour antes de comprobar `comboStatus`. Al encontrar combo, el flujo de escaneo toma el control; la siguiente solicitud de ronda presenta el fin de partida si el reveal ya alcanzó el objetivo. La verificación del dispositivo para esta secuencia sigue pendiente.

## Validación

La revisión del 2026-11-06 incluyó pruebas de backend y typecheck Expo. La cámara, el dispositivo y el escaneo físico no se probaron. Usa [`TESTING_CHECKLIST.md`](TESTING_CHECKLIST.md) para registrar verificaciones manuales futuras.

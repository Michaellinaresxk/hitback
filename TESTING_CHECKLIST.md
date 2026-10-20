# Combo and Power Card Test Plan

> Preparado el 2026-10-20 a partir de una inspección del cliente Expo. Todos los casos están pendientes; ninguno se ejecutó en esta revisión. La validación de backend, QR, cámara y dispositivos requiere la próxima pasada de integración.

## Prerequisitos

- [ ] Confirmar en `server/` la regla de combo, el contrato del reveal y el scope de sesión.
- [ ] Confirmar el formato QR y los tipos de tarjeta disponibles en el catálogo del backend.
- [ ] Iniciar backend y Expo con una URL alcanzable desde el dispositivo.
- [ ] Registrar dispositivo/runtime, versión/build, backend usado y fecha del test.

## Combo: flujo del cliente

- [ ] Una respuesta que trae `comboStatus` muestra `ComboNotification` con el nombre del ganador.
- [ ] La notificación permanece visible hasta que el GM la cierra; no se espera auto-dismiss.
- [ ] Cerrar la notificación abre el modal de Power Card.
- [ ] “Ahora No” cierra el modal y avanza la ronda una sola vez.
- [ ] Dejar el flujo activo 30 segundos produce un reset y un solo avance de ronda.
- [ ] Repetir combos en una misma sesión no duplica callbacks ni bloquea el siguiente turno.
- [ ] Un error al revelar no activa un combo ni deja el turno bloqueado.

## Power Card: cliente y contrato

- [ ] En dispositivo con permiso de cámara, abrir el scanner y leer un QR válido confirmado por el backend.
- [ ] Un QR inválido o un rechazo backend muestra error, no agrega carta y permite continuar.
- [ ] Una respuesta con `effectOnDraw` aplica el cambio esperado localmente y sincroniza el delta al backend.
- [ ] Una respuesta normal agrega la carta al inventario del jugador correcto.
- [ ] Verificar IDs frontend/backend y scope `sessionId`; no asumir que ambos IDs son iguales.
- [ ] Cerrar el scanner sin escanear devuelve al modal de instrucciones; omitir avanza una sola vez.
- [ ] Probar doble lectura, doble tap, cierre de modal y pérdida de conexión sin duplicar la mutación.

## Casos de integración pendientes

- [ ] Acordar y probar qué debe pasar con el landing World Tour cuando un ganador de combo aterriza en un tile con mecánica.
- [ ] Acordar y probar si un combo que coincide con fin de partida debe mostrar primero el modal de fin de juego.
- [ ] Confirmar que la ronda siguiente no comienza antes de terminar la presentación del combo y el flujo de carta.
- [ ] Confirmar en backend los resets de streak para respuesta incorrecta, ganador diferente, ronda sin ganador y nueva sesión.
- [ ] Verificar puntuación, inventario y sesión con los tests API del backend.

## Resultado

| Fecha   | Device/build | Backend/config | Ejecutados | Fallidos | Bloqueados/notas                           |
| ------- | ------------ | -------------- | ---------- | -------- | ------------------------------------------ |
| Not run | —            | —              | —          | —        | Esta revisión fue lectura estática de Expo |

No marcar un caso como aprobado sin anotar el resultado observado. Una respuesta de health solo demuestra conectividad básica y no sustituye los casos de gameplay.

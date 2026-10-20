# HITBACK

HITBACK es un juego musical presencial para 2–8 jugadores controlado desde el dispositivo del Game Master. El backend proporciona rondas, canciones, preguntas y puntuación; el tablero World Tour se mantiene localmente en Expo.

## Stack

- Expo SDK 54, React Native 0.81, React 19, TypeScript y Expo Router.
- Zustand para estado de juego y UI.
- i18next/react-i18next para localización.
- Express en `../server` para sesiones y recursos de juego.

## Inicio local

Terminal 1:

```bash
cd server
npm install
npm run dev
```

Terminal 2:

```bash
cd hitback
npm install
npm start
```

Para ejecutar los comandos móviles:

```bash
npm run ios
npm run android
npm run web
```

`npm start` ejecuta Expo CLI. Usa un development build si el runtime necesita módulos nativos no disponibles en Expo Go. El cliente lee primero `EXPO_PUBLIC_HITBACK_API_URL`; en desarrollo intenta detectar el host de Expo y usa `192.168.1.10` como fallback. Confirma que el backend sea alcanzable desde el dispositivo antes de probar flujos HTTP. No se verificó aquí la disponibilidad del host de producción configurado en el cliente.

## Ciclo de ronda

```text
Crear jugadores → iniciar sesión → obtener ronda → apostar (ronda 2+)
→ escuchar preview → responder en voz alta → GM revela resultado
→ ganador avanza en su World Tour local → siguiente ronda
```

No hay rotación obligatoria de turno entre participantes: todos pueden responder cada pregunta. El GM elige al ganador. Si nadie acierta, nadie avanza.

## Sistemas de juego

- **Apuestas:** se habilitan desde ronda 2. El backend valida tokens y calcula el resultado; cada token disponible se consume en esa apuesta.
- **Combos:** el backend detecta tres aciertos consecutivos del mismo ganador; Expo muestra una notificación que el GM cierra, luego permite escanear una Power Card o saltar el escaneo.
- **Power Cards:** los QR usan el prefijo `HITBACK_PC_`. El scanner usa `expo-camera`; hay cartas que se agregan al inventario y efectos inmediatos como LABEL FEE. Hay un desfase entre la llamada Expo para usar una carta y los contratos backend; consulta [`../documentation/HITBACK_SYSTEM_DOCS.md`](../documentation/HITBACK_SYSTEM_DOCS.md) antes de asumir que la activación está sincronizada.
- **Reaction Cards:** MUTE, STOP-BLAST, DUEL, FEATURING, ALLIANCE, ROYALTIES, COPYRIGHTS, ARTIST HOLD, SOLD OUT, BAD REVIEW, MANAGEMENT FEE y CHARITY SHOW. El Game Master las aplica desde el flujo de jugador; varios cambios de score se envían mediante un delta al backend.
- **B-SIDE:** después de cuatro rondas sin puntuar, el jugador puede recibir +1 en una respuesta correcta posterior.
- **World Tour:** 22 posiciones por jugador, ruta aleatoria y local. `split_dice` está pendiente; `rival_band` abre duelo y `sold_out` activa Double Platinum. Consulta [`docs/WORLD_TOUR.md`](docs/WORLD_TOUR.md) para los estados exactos de cada tile.

**Límite conocido del flujo de combo:** en `usePointsActions`, al detectarse `comboStatus`, Expo retorna después de avanzar la posición local. El flujo de combo no presenta el aterrizaje World Tour ni alcanza el chequeo local de fin de juego de esa rama. Esta interacción requiere una decisión/ajuste antes de considerarla cubierta.

## Comandos de calidad

```bash
npm run lint
npx tsc --noEmit
```

No hay test runner declarado en el package Expo. Para el backend, ejecuta `cd ../server && npm test`.

## Documentación

- Instrucciones para agentes: [`AGENTS.md`](AGENTS.md).
- Crear y aprobar features: [`../specs/README.md`](../specs/README.md) y [`../.github/skills/spec-driven-feature/SKILL.md`](../.github/skills/spec-driven-feature/SKILL.md).
- Sistema completo y contratos: [`../documentation/HITBACK_SYSTEM_DOCS.md`](../documentation/HITBACK_SYSTEM_DOCS.md).
- World Tour: [`docs/WORLD_TOUR.md`](docs/WORLD_TOUR.md).
- API backend: [`../server/README.md`](../server/README.md). Mantén este archivo alineado con la implementación.

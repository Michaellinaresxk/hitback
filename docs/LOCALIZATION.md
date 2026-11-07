# Localización de HITBACK

La app Expo usa i18next con recursos empaquetados en `i18n/locales/` y admite
español (`es`), inglés (`en`) y polaco (`pl`). La configuración de i18n vive en
`i18n/index.js`.

## Preferencia de idioma

En la primera ejecución se usa el idioma del dispositivo si está soportado; en
caso contrario, inglés. `LanguagePicker` cambia el idioma en caliente y guarda
la selección en AsyncStorage con la clave `hitback.language`. La preferencia se
lee antes de montar la navegación.

## Textos y World Tour

- Los textos generales de interfaz están en `i18n/locales/{es,en,pl}.json`.
- Los datos estructurales del tablero —IDs, emoji, tipo de casilla y actos— no
  dependen del idioma.
- El contenido editorial de las ciudades está en
  `i18n/locales/tour-cities.{es,en,pl}.json`, indexado por el `cityId` estable
  de `constants/worldTourCities.json`.
- No se debe mostrar `name`, `location`, `venue`, `story` o `realFact` desde el
  JSON estructural: los recursos localizados son la fuente de presentación.
- Al añadir una ciudad a un pool, añade también los campos `city`, `country`,
  `venue`, `story` y `realFact` en los tres recursos.

La migración de toda la interfaz a i18next está en curso. Los textos de inicio,
configuración, ayuda, ronda, resultados y los modales de apuesta, alianza,
duelo, B-SIDE y llegada al venue ya usan recursos; todavía quedan pantallas
auxiliares, diagnósticos y otros componentes con texto literal.

Verifica cobertura de pools y paridad de claves con:

```sh
npm run test:tour-locales
```

La selección de idioma y todo el contenido de World Tour pertenecen a la capa
local de presentación. No cambian contratos HTTP, estado de sesión ni mecánicas
del backend.

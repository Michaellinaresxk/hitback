const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const i18next = require('i18next');

const root = path.join(__dirname, '..');
const locales = ['es', 'en', 'pl'];
const requiredCityFields = ['city', 'country', 'venue', 'story', 'realFact'];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function loadLocale(language) {
  const base = readJson(`i18n/locales/${language}.json`);
  const cities = readJson(`i18n/locales/tour-cities.${language}.json`);

  return {
    ...base,
    tour: {
      ...base.tour,
      cities: {
        ...base.tour.cities,
        ...cities,
      },
    },
  };
}

function keyPaths(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    return [current, ...keyPaths(child, current)];
  });
}

const localeResources = Object.fromEntries(
  locales.map((language) => [language, loadLocale(language)]),
);
const routePools = Object.values(readJson('constants/worldTourCities.json')).flat();
const poolIds = routePools.map((city) => city.id);

test('all route city IDs have a complete translation in every supported locale', () => {
  assert.equal(new Set(poolIds).size, poolIds.length, 'route city IDs must be unique');

  for (const language of locales) {
    const cities = localeResources[language].tour.cities;
    const translatedIds = Object.keys(cities).filter(
      (cityId) => cityId !== 'start' && cityId !== 'finish',
    );

    assert.deepEqual(
      translatedIds.sort(),
      [...poolIds].sort(),
      `${language} city IDs must match the route pools`,
    );

    for (const cityId of poolIds) {
      for (const field of requiredCityFields) {
        assert.equal(
          typeof cities[cityId][field],
          'string',
          `${language}.${cityId}.${field} must be a string`,
        );
        assert.ok(
          cities[cityId][field].trim().length > 0,
          `${language}.${cityId}.${field} must not be empty`,
        );
      }
    }
  }
});

test('all supported locales expose the same translation key paths', () => {
  const expected = keyPaths(localeResources.es).sort();

  for (const language of locales.slice(1)) {
    assert.deepEqual(
      keyPaths(localeResources[language]).sort(),
      expected,
      `${language} must have the same keys as Spanish`,
    );
  }
});

test('English is used by i18next when an active-locale city field is missing', async () => {
  const resources = Object.fromEntries(
    locales.map((language) => [
      language,
      { translation: structuredClone(localeResources[language]) },
    ]),
  );
  const key = 'tour.cities.cbgb.story';
  delete resources.pl.translation.tour.cities.cbgb.story;

  const instance = i18next.createInstance();
  await instance.init({
    resources,
    lng: 'pl',
    fallbackLng: 'en',
    supportedLngs: locales,
    interpolation: { escapeValue: false },
  });

  assert.equal(
    instance.t(key),
    localeResources.en.tour.cities.cbgb.story,
  );
});

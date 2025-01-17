module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],
    files: [
      { pattern: 'https://cdn.polyfill.io/v2/polyfill.js?flags=gated&features=default,NodeList.prototype.@@iterator', watched: false, served: false, included: true },
      { pattern: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min.js', watched: false, served: false, included: true },
      { pattern: 'https://cdnjs.cloudflare.com/ajax/libs/i18next/11.3.2/i18next.min.js', watched: false, served: false, included: true },
      { pattern: 'node_modules/power-assert/build/power-assert.js', watched: true, served: true, included: true },
      { pattern: 'dist/*.test.js', watched: true, served: true, included: true }
    ],
    exclude: [
    ],
    espowerPreprocessor: {
      options: {
        emitActualCode: false,
        ignoreUpstreamSourceMap: true
      }
    },
    reporters: ['dots'],
    coverageReporter: {
      dir: 'coverage',
      subdir: function (browser, platform) {
        return browser.toLowerCase().split(' ')[0];
      },
      includeAllSources: true,
      instrumenters: {
        isparta: require('isparta')
      },
      instrumenter: {
        '**/*.js': 'isparta'
      },
      reporters: [
        { type: 'lcov' },
        { type: 'text-summary', subdir: '.', file: 'summary.txt' },
      ]
    },
    autoWatch: true,
    autoWatchBatchDelay: 500,
    browsers: ['Chrome'],
  });
};

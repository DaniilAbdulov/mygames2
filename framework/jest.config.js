module.exports = {
  bail: false,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/oasUi/**/*.js',
    '!src/tracer/**/*.js',
    '!src/utils/files.js',
    '!src/connectionPool/*.js',
    '!src/lib/database/**/*.js',
    'extensions/**/*.js',
    '!extensions/mysql/**/*.js',
    '!extensions/metrics/**/*.js',
    '!extensions/events/**/*.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['html'],
  testPathIgnorePatterns: ['/node_modules/']
};

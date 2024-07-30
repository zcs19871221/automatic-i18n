module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: ['./src/**/*.ts'],
  coverageReporters: [['github-actions', { silent: false }], 'summary'],
  testRegex: '(/test/.*test)\\.[jt]sx?$',
  testPathIgnorePatterns: ['/lib/', '/node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
};

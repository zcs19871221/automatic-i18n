module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: ['./src/**/*.ts'],
  testRegex: '(/test/.*test)\\.[jt]sx?$',
  testPathIgnorePatterns: ['/lib/', '/node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

// jest.config.js
module.exports = {
  // Tells Jest to run in a Node environment (no browser APIs)
  testEnvironment: 'node',
  // Prints individual test results to the console
  verbose: true,
  // Collect code coverage
  collectCoverage: true,
  // Where to store coverage reports
  coverageDirectory: 'coverage',
  // Use Babel to transform modern JS so Jest can understand
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  // Where to look for test files
  testMatch: ['**/tests/**/*.test.js']
};

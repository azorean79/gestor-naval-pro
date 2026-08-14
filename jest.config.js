module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Optional: collect coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
};

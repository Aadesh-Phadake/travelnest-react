/**
 * Jest Configuration
 * 
 * - Uses Node test environment (not jsdom)
 * - 30s timeout for DB setup/teardown
 * - Coverage reporting enabled
 * - Global setup file for mongodb-memory-server
 */

module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'text-summary', 'lcov'],
    testMatch: ['**/tests/**/*.test.js'],
    // Setup file runs before each test suite
    setupFilesAfterSetup: ['./tests/setup.js'],
};

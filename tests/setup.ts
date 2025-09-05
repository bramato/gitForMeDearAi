import { jest } from '@jest/globals';

// Global test setup
beforeEach(() => {
  // Reset all environment variables to avoid side effects
  delete process.env.GITHUB_TOKEN;
  delete process.env.MCP_MODE;
  delete process.env.NODE_ENV;
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to avoid noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global test utilities
global.TestUtils = {
  createMockGitResult: (success = true, data = null, message = 'Success') => ({
    success,
    data,
    message,
    error: success ? null : 'Test error'
  }),
  
  createMockContext: (workingDir = '/test/repo') => ({
    workingDirectory: workingDir,
    config: {
      githubToken: 'test-token',
      defaultBranch: 'main'
    },
    git: {},
    github: {}
  })
};
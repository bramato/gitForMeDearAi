// Jest setup file for GitForMeDearAi tests

// Mock chalk to avoid ESM issues
jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    red: (text: string) => text,
    green: (text: string) => text,
    blue: (text: string) => text,
    yellow: (text: string) => text,
    gray: (text: string) => text,
    bold: {
      blue: (text: string) => text,
      green: (text: string) => text,
      yellow: (text: string) => text,
    },
  },
  red: (text: string) => text,
  green: (text: string) => text,
  blue: (text: string) => text,
  yellow: (text: string) => text,
  gray: (text: string) => text,
}));

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'ERROR'; // Only show errors in tests
  
  // Mock console methods for cleaner test output
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error; // Keep errors visible
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Mock Git repository for tests
jest.mock('simple-git', () => {
  return {
    simpleGit: jest.fn(() => ({
      status: jest.fn(),
      log: jest.fn(),
      add: jest.fn(),
      commit: jest.fn(),
      push: jest.fn(),
      pull: jest.fn(),
      branch: jest.fn(),
      checkout: jest.fn(),
      merge: jest.fn(),
      stash: jest.fn(),
      stashList: jest.fn(),
      getRemotes: jest.fn(),
      addRemote: jest.fn(),
      removeRemote: jest.fn(),
      raw: jest.fn(),
      revparse: jest.fn(),
      diff: jest.fn(),
      show: jest.fn(),
    })),
  };
});

// Mock GitHub API
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn(() => ({
      rest: {
        repos: {
          get: jest.fn(),
          create: jest.fn(),
        },
        issues: {
          list: jest.fn(),
          create: jest.fn(),
        },
        pulls: {
          list: jest.fn(),
          create: jest.fn(),
        },
      },
    })),
  };
});

// Global test timeout
jest.setTimeout(10000);

export {};
import { jest } from '@jest/globals';

export const createMockSimpleGit = () => {
  return {
    // Status commands
    status: jest.fn().mockResolvedValue({
      current: 'main',
      tracking: 'origin/main',
      ahead: 0,
      behind: 0,
      staged: [],
      modified: [],
      not_added: [],
      conflicted: [],
      created: [],
      deleted: [],
      renamed: [],
      files: []
    }),

    // Log commands
    log: jest.fn().mockResolvedValue({
      all: [
        {
          hash: 'abc123',
          date: '2024-01-01',
          message: 'Initial commit',
          author_name: 'Test User',
          author_email: 'test@example.com'
        }
      ],
      total: 1,
      latest: {
        hash: 'abc123',
        date: '2024-01-01',
        message: 'Initial commit',
        author_name: 'Test User',
        author_email: 'test@example.com'
      }
    }),

    // Diff commands
    diff: jest.fn().mockResolvedValue('diff --git a/file.txt b/file.txt'),
    diffSummary: jest.fn().mockResolvedValue({
      changed: 1,
      insertions: 5,
      deletions: 2,
      files: [
        { file: 'file.txt', changes: 7, insertions: 5, deletions: 2, binary: false }
      ]
    }),

    // Branch commands
    branchLocal: jest.fn().mockResolvedValue({
      all: ['main', 'feature/test'],
      branches: {
        main: { current: true, name: 'main', commit: 'abc123' },
        'feature/test': { current: false, name: 'feature/test', commit: 'def456' }
      },
      current: 'main'
    }),

    branch: jest.fn().mockResolvedValue({
      all: ['main', 'feature/test', 'remotes/origin/main'],
      branches: {
        main: { current: true, name: 'main', commit: 'abc123' },
        'feature/test': { current: false, name: 'feature/test', commit: 'def456' }
      },
      current: 'main'
    }),

    checkout: jest.fn().mockResolvedValue(undefined),
    checkoutBranch: jest.fn().mockResolvedValue(undefined),
    deleteLocalBranch: jest.fn().mockResolvedValue(undefined),

    // Commit commands
    add: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue({
      commit: 'abc123',
      summary: {
        changes: 1,
        insertions: 5,
        deletions: 2
      }
    }),

    // Push/Pull commands
    push: jest.fn().mockResolvedValue({
      pushed: [{ local: 'main', remote: 'main' }]
    }),
    pull: jest.fn().mockResolvedValue({
      files: ['file.txt'],
      insertions: { 'file.txt': 5 },
      deletions: { 'file.txt': 2 }
    }),

    // Stash commands
    stash: jest.fn().mockResolvedValue('Saved working directory'),
    stashList: jest.fn().mockResolvedValue({
      all: [
        {
          hash: 'stash@{0}',
          date: '2024-01-01',
          message: 'WIP on main: abc123 Initial commit',
          author_name: 'Test User',
          author_email: 'test@example.com'
        }
      ],
      total: 1,
      latest: {
        hash: 'stash@{0}',
        date: '2024-01-01',
        message: 'WIP on main: abc123 Initial commit',
        author_name: 'Test User',
        author_email: 'test@example.com'
      }
    }),

    // Merge commands
    merge: jest.fn().mockResolvedValue({
      result: 'success',
      merges: ['file.txt']
    }),

    // Remote commands
    getRemotes: jest.fn().mockResolvedValue([
      { name: 'origin', refs: { fetch: 'git@github.com:user/repo.git', push: 'git@github.com:user/repo.git' } }
    ]),
    addRemote: jest.fn().mockResolvedValue(undefined),
    removeRemote: jest.fn().mockResolvedValue(undefined),

    // Config commands
    addConfig: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn().mockResolvedValue('test-value'),
    listConfig: jest.fn().mockResolvedValue({
      all: {
        'user.name': 'Test User',
        'user.email': 'test@example.com'
      }
    }),

    // Other commands
    show: jest.fn().mockResolvedValue('commit abc123\nAuthor: Test User <test@example.com>\nDate: 2024-01-01\n\nInitial commit'),
    blame: jest.fn().mockResolvedValue([
      {
        hash: 'abc123',
        line: '1',
        author: 'Test User',
        date: '2024-01-01',
        content: 'console.log("Hello World");'
      }
    ]),
    
    init: jest.fn().mockResolvedValue(undefined),
    clone: jest.fn().mockResolvedValue(undefined),
    
    // Error simulation helpers
    mockError: (command: string, error: Error) => {
      // @ts-ignore - accessing mock functions for testing
      return this[command].mockRejectedValue(error);
    },

    // Reset all mocks
    resetMocks: () => {
      Object.values(this).forEach(mock => {
        if (jest.isMockFunction(mock)) {
          mock.mockReset();
        }
      });
    }
  };
};
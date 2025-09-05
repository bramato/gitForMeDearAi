// Test fixtures for git repositories and common scenarios

export const mockRepositoryStates = {
  // Clean repository state
  clean: {
    status: {
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
    }
  },

  // Repository with changes
  withChanges: {
    status: {
      current: 'main',
      tracking: 'origin/main',
      ahead: 0,
      behind: 0,
      staged: ['staged-file.txt'],
      modified: ['modified-file.txt'],
      not_added: ['new-file.txt'],
      conflicted: [],
      created: ['staged-file.txt'],
      deleted: [],
      renamed: [],
      files: [
        { path: 'staged-file.txt', index: 'A', working_dir: ' ' },
        { path: 'modified-file.txt', index: ' ', working_dir: 'M' },
        { path: 'new-file.txt', index: '?', working_dir: '?' }
      ]
    }
  },

  // Repository with conflicts
  withConflicts: {
    status: {
      current: 'main',
      tracking: 'origin/main',
      ahead: 0,
      behind: 0,
      staged: [],
      modified: [],
      not_added: [],
      conflicted: ['conflict-file.txt', 'another-conflict.js'],
      created: [],
      deleted: [],
      renamed: [],
      files: [
        { path: 'conflict-file.txt', index: 'U', working_dir: 'U' },
        { path: 'another-conflict.js', index: 'U', working_dir: 'U' }
      ]
    }
  },

  // Repository ahead of remote
  aheadOfRemote: {
    status: {
      current: 'main',
      tracking: 'origin/main',
      ahead: 3,
      behind: 0,
      staged: [],
      modified: [],
      not_added: [],
      conflicted: [],
      created: [],
      deleted: [],
      renamed: [],
      files: []
    }
  },

  // Repository behind remote
  behindRemote: {
    status: {
      current: 'main',
      tracking: 'origin/main',
      ahead: 0,
      behind: 2,
      staged: [],
      modified: [],
      not_added: [],
      conflicted: [],
      created: [],
      deleted: [],
      renamed: [],
      files: []
    }
  }
};

export const mockCommitHistory = {
  simple: {
    all: [
      {
        hash: 'abc123def456',
        date: '2024-01-03T12:00:00Z',
        message: 'feat: add new feature',
        author_name: 'John Doe',
        author_email: 'john@example.com',
        body: 'This commit adds a new feature\\n\\nDetailed description of the feature',
        refs: 'HEAD -> main, origin/main'
      },
      {
        hash: 'def456ghi789',
        date: '2024-01-02T10:30:00Z',
        message: 'fix: resolve bug in authentication',
        author_name: 'Jane Smith',
        author_email: 'jane@example.com',
        body: 'Fixed authentication issue that was causing login failures',
        refs: ''
      },
      {
        hash: 'ghi789jkl012',
        date: '2024-01-01T09:00:00Z',
        message: 'Initial commit',
        author_name: 'John Doe',
        author_email: 'john@example.com',
        body: 'Initial project setup',
        refs: ''
      }
    ],
    total: 3,
    latest: {
      hash: 'abc123def456',
      date: '2024-01-03T12:00:00Z',
      message: 'feat: add new feature',
      author_name: 'John Doe',
      author_email: 'john@example.com'
    }
  }
};

export const mockBranchState = {
  multipleBranches: {
    all: ['main', 'develop', 'feature/auth', 'feature/ui'],
    branches: {
      main: {
        current: true,
        name: 'main',
        commit: 'abc123def456',
        label: 'main'
      },
      develop: {
        current: false,
        name: 'develop',
        commit: 'def456ghi789',
        label: 'develop'
      },
      'feature/auth': {
        current: false,
        name: 'feature/auth',
        commit: 'ghi789jkl012',
        label: 'feature/auth'
      },
      'feature/ui': {
        current: false,
        name: 'feature/ui',
        commit: 'jkl012mno345',
        label: 'feature/ui'
      }
    },
    current: 'main'
  },

  withRemotes: {
    all: ['main', 'develop', 'remotes/origin/main', 'remotes/origin/develop', 'remotes/upstream/main'],
    branches: {
      main: {
        current: true,
        name: 'main',
        commit: 'abc123def456',
        label: 'main'
      },
      develop: {
        current: false,
        name: 'develop',
        commit: 'def456ghi789',
        label: 'develop'
      },
      'remotes/origin/main': {
        current: false,
        name: 'remotes/origin/main',
        commit: 'abc123def456',
        label: 'remotes/origin/main'
      },
      'remotes/origin/develop': {
        current: false,
        name: 'remotes/origin/develop',
        commit: 'def456ghi789',
        label: 'remotes/origin/develop'
      },
      'remotes/upstream/main': {
        current: false,
        name: 'remotes/upstream/main',
        commit: 'abc123def456',
        label: 'remotes/upstream/main'
      }
    },
    current: 'main'
  }
};

export const mockStashList = {
  withStashes: {
    all: [
      {
        hash: 'stash@{0}',
        date: '2024-01-03T15:30:00Z',
        message: 'WIP on feature/auth: abc123 Work in progress on authentication',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      },
      {
        hash: 'stash@{1}',
        date: '2024-01-02T14:15:00Z',
        message: 'WIP on main: def456 Quick fix for production issue',
        author_name: 'Jane Smith',
        author_email: 'jane@example.com'
      }
    ],
    total: 2,
    latest: {
      hash: 'stash@{0}',
      date: '2024-01-03T15:30:00Z',
      message: 'WIP on feature/auth: abc123 Work in progress on authentication',
      author_name: 'John Doe',
      author_email: 'john@example.com'
    }
  },

  empty: {
    all: [],
    total: 0,
    latest: null
  }
};

export const mockRemotes = {
  withOrigin: [
    {
      name: 'origin',
      refs: {
        fetch: 'git@github.com:user/repo.git',
        push: 'git@github.com:user/repo.git'
      }
    }
  ],

  withMultipleRemotes: [
    {
      name: 'origin',
      refs: {
        fetch: 'git@github.com:user/repo.git',
        push: 'git@github.com:user/repo.git'
      }
    },
    {
      name: 'upstream',
      refs: {
        fetch: 'git@github.com:original/repo.git',
        push: 'git@github.com:original/repo.git'
      }
    }
  ],

  empty: []
};

export const mockDiffOutput = {
  simpleDiff: `diff --git a/src/file.ts b/src/file.ts
index abc123..def456 100644
--- a/src/file.ts
+++ b/src/file.ts
@@ -1,5 +1,8 @@
 import { something } from './utils';
 
+// This is a new comment
 export function doSomething() {
-  console.log('Hello');
+  console.log('Hello World');
+  console.log('This is new');
 }`,

  complexDiff: `diff --git a/src/auth.ts b/src/auth.ts
index abc123..def456 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,7 +10,7 @@ export class AuthService {
   
   async login(username: string, password: string): Promise<AuthResult> {
     try {
-      const result = await this.api.authenticate(username, password);
+      const result = await this.api.authenticateUser(username, password);
       return { success: true, token: result.token };
     } catch (error) {
       return { success: false, error: error.message };

diff --git a/src/utils.ts b/src/utils.ts
new file mode 100644
index 0000000..ghi789
--- /dev/null
+++ b/src/utils.ts
@@ -0,0 +1,5 @@
+export function validateEmail(email: string): boolean {
+  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
+  return emailRegex.test(email);
+}`
};
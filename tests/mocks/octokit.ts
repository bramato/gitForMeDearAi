import { jest } from '@jest/globals';

export const createMockOctokit = () => {
  return {
    rest: {
      // Repository operations
      repos: {
        get: jest.fn().mockResolvedValue({
          data: {
            id: 123456789,
            name: 'test-repo',
            full_name: 'user/test-repo',
            owner: { login: 'user' },
            description: 'Test repository',
            private: false,
            fork: false,
            default_branch: 'main',
            stargazers_count: 42,
            watchers_count: 10,
            forks_count: 5,
            language: 'TypeScript',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            pushed_at: '2024-01-02T12:00:00Z'
          }
        }),

        listForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: [
            {
              id: 123456789,
              name: 'test-repo',
              full_name: 'user/test-repo',
              private: false,
              fork: false,
              language: 'TypeScript'
            }
          ]
        }),

        create: jest.fn().mockResolvedValue({
          data: {
            id: 123456789,
            name: 'test-repo',
            full_name: 'user/test-repo',
            clone_url: 'https://github.com/user/test-repo.git',
            ssh_url: 'git@github.com:user/test-repo.git'
          }
        })
      },

      // Issues operations
      issues: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              number: 1,
              title: 'Test Issue',
              body: 'This is a test issue',
              state: 'open',
              user: { login: 'user' },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              labels: [{ name: 'bug', color: 'red' }]
            }
          ]
        }),

        get: jest.fn().mockResolvedValue({
          data: {
            number: 1,
            title: 'Test Issue',
            body: 'This is a test issue',
            state: 'open',
            user: { login: 'user' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            labels: [{ name: 'bug', color: 'red' }]
          }
        }),

        create: jest.fn().mockResolvedValue({
          data: {
            number: 2,
            title: 'New Issue',
            body: 'This is a new issue',
            state: 'open',
            user: { login: 'user' },
            html_url: 'https://github.com/user/test-repo/issues/2'
          }
        }),

        update: jest.fn().mockResolvedValue({
          data: {
            number: 1,
            title: 'Updated Issue',
            state: 'closed'
          }
        })
      },

      // Pull Requests operations
      pulls: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              number: 1,
              title: 'Test PR',
              body: 'This is a test pull request',
              state: 'open',
              user: { login: 'user' },
              head: { ref: 'feature/test' },
              base: { ref: 'main' },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ]
        }),

        get: jest.fn().mockResolvedValue({
          data: {
            number: 1,
            title: 'Test PR',
            body: 'This is a test pull request',
            state: 'open',
            user: { login: 'user' },
            head: { ref: 'feature/test' },
            base: { ref: 'main' },
            mergeable: true,
            mergeable_state: 'clean'
          }
        }),

        create: jest.fn().mockResolvedValue({
          data: {
            number: 2,
            title: 'New PR',
            body: 'This is a new pull request',
            state: 'open',
            html_url: 'https://github.com/user/test-repo/pull/2'
          }
        }),

        merge: jest.fn().mockResolvedValue({
          data: {
            merged: true,
            message: 'Pull Request successfully merged'
          }
        })
      },

      // Actions/Workflows operations
      actions: {
        listWorkflowRuns: jest.fn().mockResolvedValue({
          data: {
            workflow_runs: [
              {
                id: 123456789,
                name: 'CI',
                status: 'completed',
                conclusion: 'success',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T01:00:00Z',
                head_branch: 'main',
                head_sha: 'abc123',
                html_url: 'https://github.com/user/test-repo/actions/runs/123456789'
              }
            ]
          }
        }),

        getWorkflowRun: jest.fn().mockResolvedValue({
          data: {
            id: 123456789,
            name: 'CI',
            status: 'completed',
            conclusion: 'success',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T01:00:00Z',
            jobs_url: 'https://api.github.com/repos/user/test-repo/actions/runs/123456789/jobs'
          }
        })
      },

      // Releases operations
      repos: {
        ...jest.fn().mockResolvedValue({}),
        listReleases: jest.fn().mockResolvedValue({
          data: [
            {
              id: 123456789,
              tag_name: 'v1.0.0',
              name: 'Version 1.0.0',
              body: 'First release',
              draft: false,
              prerelease: false,
              created_at: '2024-01-01T00:00:00Z',
              published_at: '2024-01-01T00:00:00Z',
              html_url: 'https://github.com/user/test-repo/releases/tag/v1.0.0'
            }
          ]
        }),

        createRelease: jest.fn().mockResolvedValue({
          data: {
            id: 123456790,
            tag_name: 'v1.1.0',
            name: 'Version 1.1.0',
            body: 'New release',
            html_url: 'https://github.com/user/test-repo/releases/tag/v1.1.0'
          }
        })
      }
    },

    // User operations
    users: {
      getAuthenticated: jest.fn().mockResolvedValue({
        data: {
          login: 'test-user',
          id: 12345,
          name: 'Test User',
          email: 'test@example.com',
          bio: 'Test user for testing purposes'
        }
      })
    },

    // Error simulation helpers
    mockError: (operation: string, error: Error) => {
      const parts = operation.split('.');
      let current = this as any;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      
      const lastPart = parts[parts.length - 1];
      current[lastPart].mockRejectedValue(error);
    },

    // Reset all mocks
    resetMocks: () => {
      const resetRecursively = (obj: any) => {
        Object.values(obj).forEach(value => {
          if (jest.isMockFunction(value)) {
            (value as any).mockReset();
          } else if (typeof value === 'object' && value !== null) {
            resetRecursively(value);
          }
        });
      };
      resetRecursively(this);
    }
  };
};
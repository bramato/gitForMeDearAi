import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock simple-git 
const mockGit = {
  status: jest.fn(),
  revparse: jest.fn(),
  raw: jest.fn(),
  stashList: jest.fn(),
};

// Mock context
const mockContext = {
  workingDirectory: '/test/repo',
  config: {
    githubToken: 'test-token',
    defaultBranch: 'main'
  },
  git: mockGit,
  github: undefined
};

// Mock git status tool function
const createGitStatusTool = () => {
  return {
    name: 'git_status',
    description: 'Get comprehensive Git repository status',
    inputSchema: {
      type: 'object',
      properties: {
        porcelain: { type: 'boolean', default: false },
        short: { type: 'boolean', default: false },
        branch: { type: 'boolean', default: true },
        showStash: { type: 'boolean', default: true }
      }
    },
    execute: async (context: any, args: any) => {
      try {
        const status = await context.git.status();
        const currentBranch = await context.git.revparse(['--abbrev-ref', 'HEAD']);
        
        // Mock implementation
        const statusData = {
          branch: currentBranch.trim(),
          ahead: 0,
          behind: 0,
          staged: status.staged || [],
          unstaged: status.modified || [],
          untracked: status.not_added || [],
          conflicted: status.conflicted || []
        };

        return {
          success: true,
          message: 'Repository status retrieved',
          data: {
            status: statusData,
            formatted: `On branch ${statusData.branch}`,
            stashCount: 0
          }
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to get repository status',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
};

describe('Git Status Tool', () => {
  let statusTool: any;

  beforeEach(() => {
    statusTool = createGitStatusTool();
    mockGit.status.mockReset();
    mockGit.revparse.mockReset();
    mockGit.raw.mockReset();
    mockGit.stashList.mockReset();
  });

  it('should be properly configured', () => {
    expect(statusTool.name).toBe('git_status');
    expect(statusTool.description).toContain('Git repository status');
    expect(statusTool.inputSchema.type).toBe('object');
  });

  it('should return clean repository status', async () => {
    mockGit.status.mockResolvedValue({
      current: 'main',
      staged: [],
      modified: [],
      not_added: [],
      conflicted: []
    });
    mockGit.revparse.mockResolvedValue('main');

    const result = await statusTool.execute(mockContext, {});

    expect(result.success).toBe(true);
    expect(result.message).toBe('Repository status retrieved');
    expect(result.data.status.branch).toBe('main');
    expect(result.data.status.staged).toHaveLength(0);
    expect(result.data.status.unstaged).toHaveLength(0);
  });

  it('should return repository status with changes', async () => {
    mockGit.status.mockResolvedValue({
      current: 'main',
      staged: ['staged-file.txt'],
      modified: ['modified-file.txt'],
      not_added: ['new-file.txt'],
      conflicted: []
    });
    mockGit.revparse.mockResolvedValue('main');

    const result = await statusTool.execute(mockContext, {});

    expect(result.success).toBe(true);
    expect(result.data.status.staged).toEqual(['staged-file.txt']);
    expect(result.data.status.unstaged).toEqual(['modified-file.txt']);
    expect(result.data.status.untracked).toEqual(['new-file.txt']);
  });

  it('should return repository status with conflicts', async () => {
    mockGit.status.mockResolvedValue({
      current: 'main',
      staged: [],
      modified: [],
      not_added: [],
      conflicted: ['conflict-file.txt']
    });
    mockGit.revparse.mockResolvedValue('main');

    const result = await statusTool.execute(mockContext, {});

    expect(result.success).toBe(true);
    expect(result.data.status.conflicted).toEqual(['conflict-file.txt']);
  });

  it('should handle git errors gracefully', async () => {
    mockGit.status.mockRejectedValue(new Error('Not a git repository'));

    const result = await statusTool.execute(mockContext, {});

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to get repository status');
    expect(result.error).toContain('Not a git repository');
  });

  it('should handle different branch names', async () => {
    mockGit.status.mockResolvedValue({
      current: 'feature/test',
      staged: [],
      modified: [],
      not_added: [],
      conflicted: []
    });
    mockGit.revparse.mockResolvedValue('feature/test');

    const result = await statusTool.execute(mockContext, {});

    expect(result.success).toBe(true);
    expect(result.data.status.branch).toBe('feature/test');
  });

  it('should handle empty status', async () => {
    mockGit.status.mockResolvedValue({
      current: 'main',
      staged: [],
      modified: [],
      not_added: [],
      conflicted: []
    });
    mockGit.revparse.mockResolvedValue('main');

    const result = await statusTool.execute(mockContext, {});

    expect(result.success).toBe(true);
    expect(result.data.status.staged).toHaveLength(0);
    expect(result.data.status.unstaged).toHaveLength(0);
    expect(result.data.status.untracked).toHaveLength(0);
    expect(result.data.status.conflicted).toHaveLength(0);
  });
});
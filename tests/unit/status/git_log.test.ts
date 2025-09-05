import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StatusTools } from '../../../src/commands/status/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import { mockCommitHistory } from '../../fixtures/git-repositories.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('StatusTools - git_log', () => {
  let statusTools: StatusTools;
  let mockGit: any;
  let mockContext: McpServerContext;

  beforeEach(() => {
    statusTools = new StatusTools();
    mockGit = createMockSimpleGit();
    
    mockContext = {
      workingDirectory: '/test/repo',
      config: {
        githubToken: 'test-token',
        defaultBranch: 'main'
      },
      git: mockGit,
      github: undefined
    };
  });

  describe('git_log tool', () => {
    it('should be properly configured', () => {
      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      expect(logTool).toBeDefined();
      expect(logTool?.name).toBe('git_log');
      expect(logTool?.description).toContain('Git commit history');
      expect(logTool?.inputSchema.properties).toHaveProperty('maxCount');
      expect(logTool?.inputSchema.properties).toHaveProperty('oneline');
      expect(logTool?.inputSchema.properties).toHaveProperty('graph');
      expect(logTool?.inputSchema.properties).toHaveProperty('author');
    });

    it('should return commit history with default parameters', async () => {
      mockGit.log.mockResolvedValue(mockCommitHistory.simple);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Retrieved 3 commits');
      expect(result?.data.commits).toHaveLength(3);
      expect(result?.data.total).toBe(3);
      expect(result?.data.latest).toBeDefined();
      
      // Check first commit structure
      const firstCommit = result?.data.commits[0];
      expect(firstCommit).toEqual({
        hash: 'abc123def456',
        message: 'feat: add new feature',
        author: 'John Doe',
        email: 'john@example.com',
        date: '2024-01-03T12:00:00Z',
        files: []
      });
    });

    it('should limit commits when maxCount is specified', async () => {
      const limitedHistory = {
        ...mockCommitHistory.simple,
        all: mockCommitHistory.simple.all.slice(0, 2)
      };
      mockGit.log.mockResolvedValue(limitedHistory);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        maxCount: 2
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commits).toHaveLength(2);
      expect(mockGit.log).toHaveBeenCalledWith(expect.objectContaining({
        maxCount: 2
      }));
    });

    it('should filter commits by author', async () => {
      const authorFilteredHistory = {
        ...mockCommitHistory.simple,
        all: mockCommitHistory.simple.all.filter(commit => commit.author_name === 'John Doe')
      };
      mockGit.log.mockResolvedValue(authorFilteredHistory);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        author: 'John Doe'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commits).toHaveLength(2);
      expect(mockGit.log).toHaveBeenCalledWith(expect.objectContaining({
        author: 'John Doe'
      }));
      
      // All commits should be from John Doe
      result?.data.commits.forEach((commit: any) => {
        expect(commit.author).toBe('John Doe');
      });
    });

    it('should filter commits by date range', async () => {
      mockGit.log.mockResolvedValue(mockCommitHistory.simple);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        since: '2024-01-01',
        until: '2024-01-31'
      });

      expect(result?.success).toBe(true);
      expect(mockGit.log).toHaveBeenCalledWith(expect.objectContaining({
        since: '2024-01-01',
        until: '2024-01-31'
      }));
    });

    it('should filter commits by message pattern', async () => {
      const grepFilteredHistory = {
        ...mockCommitHistory.simple,
        all: mockCommitHistory.simple.all.filter(commit => 
          commit.message.toLowerCase().includes('feat')
        )
      };
      mockGit.log.mockResolvedValue(grepFilteredHistory);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        grep: 'feat'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commits).toHaveLength(1);
      expect(result?.data.commits[0].message).toContain('feat');
      expect(mockGit.log).toHaveBeenCalledWith(expect.objectContaining({
        grep: 'feat'
      }));
    });

    it('should show commits for specific path', async () => {
      mockGit.log.mockResolvedValue(mockCommitHistory.simple);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        path: 'src/auth.ts'
      });

      expect(result?.success).toBe(true);
      expect(mockGit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          '--': 'src/auth.ts'
        })
      );
    });

    it('should handle oneline format', async () => {
      mockGit.log.mockResolvedValue(mockCommitHistory.simple);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        oneline: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          '--oneline': undefined
        })
      );
    });

    it('should handle graph format', async () => {
      mockGit.log.mockResolvedValue(mockCommitHistory.simple);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        graph: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          '--graph': undefined
        })
      );
    });

    it('should handle multiple filters combined', async () => {
      const filteredHistory = {
        ...mockCommitHistory.simple,
        all: [mockCommitHistory.simple.all[0]] // Only the latest commit
      };
      mockGit.log.mockResolvedValue(filteredHistory);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {
        maxCount: 5,
        author: 'John Doe',
        since: '2024-01-01',
        grep: 'feat',
        oneline: true,
        graph: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.log).toHaveBeenCalledWith(expect.objectContaining({
        maxCount: 5,
        author: 'John Doe',
        since: '2024-01-01',
        grep: 'feat',
        '--oneline': undefined,
        '--graph': undefined
      }));
    });

    it('should handle empty commit history', async () => {
      mockGit.log.mockResolvedValue({
        all: [],
        total: 0,
        latest: null
      });

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Retrieved 0 commits');
      expect(result?.data.commits).toHaveLength(0);
      expect(result?.data.total).toBe(0);
    });

    it('should handle git log errors gracefully', async () => {
      mockGit.log.mockRejectedValue(new Error('Not a git repository'));

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {});

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get commit history');
      expect(result?.error).toContain('Not a git repository');
    });

    it('should handle commits with file changes', async () => {
      const historyWithFiles = {
        ...mockCommitHistory.simple,
        all: mockCommitHistory.simple.all.map(commit => ({
          ...commit,
          diff: {
            files: [
              { file: 'src/file.ts', changes: 10, insertions: 7, deletions: 3 },
              { file: 'README.md', changes: 2, insertions: 2, deletions: 0 }
            ]
          }
        }))
      };
      mockGit.log.mockResolvedValue(historyWithFiles);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.commits[0].files).toHaveLength(2);
      expect(result?.data.commits[0].files[0]).toEqual({
        file: 'src/file.ts',
        changes: 10,
        insertions: 7,
        deletions: 3
      });
    });

    it('should handle malformed commit data gracefully', async () => {
      const malformedHistory = {
        all: [
          {
            hash: 'abc123',
            message: 'Test commit',
            // Missing author fields
            date: '2024-01-01'
          }
        ],
        total: 1,
        latest: {
          hash: 'abc123',
          message: 'Test commit'
        }
      };
      mockGit.log.mockResolvedValue(malformedHistory);

      const tools = statusTools.getTools();
      const logTool = tools.find(tool => tool.name === 'git_log');
      
      const result = await logTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.commits).toHaveLength(1);
      expect(result?.data.commits[0]).toEqual({
        hash: 'abc123',
        message: 'Test commit',
        author: undefined,
        email: undefined,
        date: '2024-01-01',
        files: []
      });
    });
  });
});
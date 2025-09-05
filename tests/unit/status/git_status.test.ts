import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StatusTools } from '../../../src/commands/status/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import { mockRepositoryStates } from '../../fixtures/git-repositories.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('StatusTools - git_status', () => {
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

  describe('git_status tool', () => {
    it('should be properly configured', () => {
      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      expect(statusTool).toBeDefined();
      expect(statusTool?.name).toBe('git_status');
      expect(statusTool?.description).toContain('comprehensive Git repository status');
      expect(statusTool?.inputSchema.type).toBe('object');
    });

    it('should return clean repository status', async () => {
      // Mock clean repository
      mockGit.status.mockResolvedValue(mockRepositoryStates.clean.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main') // upstream
        .mockResolvedValueOnce('0\t0'); // ahead/behind count
      mockGit.stashList.mockResolvedValue({ total: 0, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {
        porcelain: false,
        short: false,
        branch: true,
        showStash: true
      });

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Repository status retrieved');
      expect(result?.data.status.branch).toBe('main');
      expect(result?.data.status.staged).toHaveLength(0);
      expect(result?.data.status.unstaged).toHaveLength(0);
      expect(result?.data.status.untracked).toHaveLength(0);
      expect(result?.data.stashCount).toBe(0);
    });

    it('should return repository status with changes', async () => {
      // Mock repository with changes
      mockGit.status.mockResolvedValue(mockRepositoryStates.withChanges.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main') // upstream
        .mockResolvedValueOnce('0\t0'); // ahead/behind count
      mockGit.stashList.mockResolvedValue({ total: 2, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {
        porcelain: false,
        short: false,
        branch: true,
        showStash: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.status.staged).toEqual(['staged-file.txt']);
      expect(result?.data.status.unstaged).toEqual(['modified-file.txt']);
      expect(result?.data.status.untracked).toEqual(['new-file.txt']);
      expect(result?.data.stashCount).toBe(2);
      expect(result?.data.formatted).toContain('staged-file.txt');
      expect(result?.data.formatted).toContain('modified-file.txt');
      expect(result?.data.formatted).toContain('new-file.txt');
    });

    it('should return repository status with conflicts', async () => {
      // Mock repository with conflicts
      mockGit.status.mockResolvedValue(mockRepositoryStates.withConflicts.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main')
        .mockResolvedValueOnce('0\t0');
      mockGit.stashList.mockResolvedValue({ total: 0, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.status.conflicted).toEqual(['conflict-file.txt', 'another-conflict.js']);
      expect(result?.data.formatted).toContain('conflict-file.txt');
      expect(result?.data.formatted).toContain('another-conflict.js');
    });

    it('should return porcelain format when requested', async () => {
      mockGit.status.mockResolvedValue(mockRepositoryStates.withChanges.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main')
        .mockResolvedValueOnce('2\t1'); // behind 2, ahead 1
      mockGit.stashList.mockResolvedValue({ total: 0, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {
        porcelain: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.formatted).toMatch(/^##.*main.*ahead.*behind/);
      expect(result?.data.formatted).toContain('A  staged-file.txt');
      expect(result?.data.formatted).toContain(' M modified-file.txt');
      expect(result?.data.formatted).toContain('?? new-file.txt');
    });

    it('should return short format when requested', async () => {
      mockGit.status.mockResolvedValue(mockRepositoryStates.withChanges.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main')
        .mockResolvedValueOnce('1\t0'); // behind 1, ahead 0
      mockGit.stashList.mockResolvedValue({ total: 0, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {
        short: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.formatted).toMatch(/^On branch main \| 3 changes \| 0↑ 1↓$/);
    });

    it('should handle repository ahead of remote', async () => {
      mockGit.status.mockResolvedValue(mockRepositoryStates.aheadOfRemote.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main')
        .mockResolvedValueOnce('0\t3'); // behind 0, ahead 3
      mockGit.stashList.mockResolvedValue({ total: 0, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.status.ahead).toBe(3);
      expect(result?.data.status.behind).toBe(0);
      expect(result?.data.formatted).toContain('ahead of origin by 3 commits');
    });

    it('should handle repository behind remote', async () => {
      mockGit.status.mockResolvedValue(mockRepositoryStates.behindRemote.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main')
        .mockResolvedValueOnce('2\t0'); // behind 2, ahead 0
      mockGit.stashList.mockResolvedValue({ total: 0, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.status.ahead).toBe(0);
      expect(result?.data.status.behind).toBe(2);
      expect(result?.data.formatted).toContain('behind by 2 commits');
    });

    it('should handle no upstream branch', async () => {
      mockGit.status.mockResolvedValue(mockRepositoryStates.clean.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockRejectedValueOnce(new Error('No upstream branch')) // No upstream
        .mockResolvedValueOnce('0'); // stash count
      mockGit.stashList.mockResolvedValue({ total: 0, all: [], latest: null });

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.status.ahead).toBe(0);
      expect(result?.data.status.behind).toBe(0);
    });

    it('should handle stash count disabled', async () => {
      mockGit.status.mockResolvedValue(mockRepositoryStates.clean.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main')
        .mockResolvedValueOnce('0\t0');

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {
        showStash: false
      });

      expect(result?.success).toBe(true);
      expect(result?.data.stashCount).toBe(0);
      expect(mockGit.stashList).not.toHaveBeenCalled();
    });

    it('should handle git errors gracefully', async () => {
      mockGit.status.mockRejectedValue(new Error('Not a git repository'));

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {});

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get repository status');
      expect(result?.error).toContain('Not a git repository');
    });

    it('should handle stash errors gracefully', async () => {
      mockGit.status.mockResolvedValue(mockRepositoryStates.clean.status);
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw
        .mockResolvedValueOnce('origin/main')
        .mockResolvedValueOnce('0\t0');
      mockGit.stashList.mockRejectedValue(new Error('Stash error'));

      const tools = statusTools.getTools();
      const statusTool = tools.find(tool => tool.name === 'git_status');
      
      const result = await statusTool?.execute(mockContext, {
        showStash: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.stashCount).toBe(0);
    });
  });
});
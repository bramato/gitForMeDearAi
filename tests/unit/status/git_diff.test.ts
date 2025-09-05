import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StatusTools } from '../../../src/commands/status/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import { mockDiffOutput } from '../../fixtures/git-repositories.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('StatusTools - git_diff', () => {
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

  describe('git_diff tool', () => {
    it('should be properly configured', () => {
      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      expect(diffTool).toBeDefined();
      expect(diffTool?.name).toBe('git_diff');
      expect(diffTool?.description).toContain('differences between commits');
      expect(diffTool?.inputSchema.properties).toHaveProperty('target');
      expect(diffTool?.inputSchema.properties).toHaveProperty('commit1');
      expect(diffTool?.inputSchema.properties).toHaveProperty('nameOnly');
    });

    it('should return working directory diff by default', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.simpleDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Diff retrieved successfully');
      expect(result?.data.diff).toBe(mockDiffOutput.simpleDiff);
      expect(result?.data.target).toBe('working');
      expect(mockGit.diff).toHaveBeenCalledWith([]);
    });

    it('should return staged changes diff', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.simpleDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'staged'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.target).toBe('staged');
      expect(mockGit.diff).toHaveBeenCalledWith(['--cached']);
    });

    it('should return diff between commits', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.complexDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'commit',
        commit1: 'abc123',
        commit2: 'def456'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commit1).toBe('abc123');
      expect(result?.data.commit2).toBe('def456');
      expect(mockGit.diff).toHaveBeenCalledWith(['abc123', 'def456']);
    });

    it('should return diff for single commit (vs its parent)', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.simpleDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'commit',
        commit1: 'abc123'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commit1).toBe('abc123');
      expect(result?.data.commit2).toBeUndefined();
      expect(mockGit.diff).toHaveBeenCalledWith(['abc123^', 'abc123']);
    });

    it('should return diff for specific branch', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.simpleDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'branch',
        commit1: 'feature/test'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commit1).toBe('feature/test');
      expect(mockGit.diff).toHaveBeenCalledWith(['feature/test']);
    });

    it('should return diff between branches', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.complexDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'branch',
        commit1: 'main',
        commit2: 'feature/test'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commit1).toBe('main');
      expect(result?.data.commit2).toBe('feature/test');
      expect(mockGit.diff).toHaveBeenCalledWith(['main', 'feature/test']);
    });

    it('should filter diff for specific path', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.simpleDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        path: 'src/file.ts'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.path).toBe('src/file.ts');
      expect(mockGit.diff).toHaveBeenCalledWith(['--', 'src/file.ts']);
    });

    it('should return only file names when nameOnly is true', async () => {
      mockGit.diff.mockResolvedValue('src/file.ts\nREADME.md\npackage.json');

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        nameOnly: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.options.nameOnly).toBe(true);
      expect(mockGit.diff).toHaveBeenCalledWith(['--name-only']);
    });

    it('should return stat summary when stat is true', async () => {
      mockGit.diff.mockResolvedValue(' file.ts | 10 +++++++---\n 1 file changed, 7 insertions(+), 3 deletions(-)');

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        stat: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.options.stat).toBe(true);
      expect(mockGit.diff).toHaveBeenCalledWith(['--stat']);
    });

    it('should use custom context lines', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.simpleDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        contextLines: 5
      });

      expect(result?.success).toBe(true);
      expect(result?.data.options.contextLines).toBe(5);
      expect(mockGit.diff).toHaveBeenCalledWith(['-U5']);
    });

    it('should combine multiple options', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.complexDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'staged',
        path: 'src/',
        nameOnly: true,
        stat: false,
        contextLines: 2
      });

      expect(result?.success).toBe(true);
      expect(mockGit.diff).toHaveBeenCalledWith(['-U2', '--name-only', '--cached', '--', 'src/']);
    });

    it('should require commit1 for commit target', async () => {
      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'commit'
        // Missing commit1
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get diff');
      expect(result?.error).toContain('commit1 is required for commit target');
    });

    it('should require commit1 for branch target', async () => {
      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'branch'
        // Missing commit1
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get diff');
      expect(result?.error).toContain('commit1 is required for branch target');
    });

    it('should handle empty diff', async () => {
      mockGit.diff.mockResolvedValue('');

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.diff).toBe('');
    });

    it('should handle git diff errors gracefully', async () => {
      mockGit.diff.mockRejectedValue(new Error('Invalid commit hash'));

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {
        target: 'commit',
        commit1: 'invalid-hash'
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get diff');
      expect(result?.error).toContain('Invalid commit hash');
    });

    it('should handle binary files in diff', async () => {
      const binaryDiff = 'Binary files a/image.png and b/image.png differ';
      mockGit.diff.mockResolvedValue(binaryDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.diff).toBe(binaryDiff);
    });

    it('should handle large diffs', async () => {
      const largeDiff = 'A'.repeat(100000); // Large diff content
      mockGit.diff.mockResolvedValue(largeDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.diff).toBe(largeDiff);
      expect(result?.data.diff.length).toBe(100000);
    });

    it('should preserve diff format and structure', async () => {
      mockGit.diff.mockResolvedValue(mockDiffOutput.complexDiff);

      const tools = statusTools.getTools();
      const diffTool = tools.find(tool => tool.name === 'git_diff');
      
      const result = await diffTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.diff).toContain('diff --git');
      expect(result?.data.diff).toContain('@@');
      expect(result?.data.diff).toContain('+++');
      expect(result?.data.diff).toContain('---');
    });
  });
});
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BranchTools } from '../../../src/commands/branches/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('BranchTools - git_branch_create', () => {
  let branchTools: BranchTools;
  let mockGit: any;
  let mockContext: McpServerContext;

  beforeEach(() => {
    branchTools = new BranchTools();
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

  describe('git_branch_create tool', () => {
    it('should be properly configured', () => {
      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      expect(branchCreateTool).toBeDefined();
      expect(branchCreateTool?.name).toBe('git_branch_create');
      expect(branchCreateTool?.description).toContain('Create new Git branch');
      expect(branchCreateTool?.inputSchema.properties).toHaveProperty('name');
      expect(branchCreateTool?.inputSchema.required).toContain('name');
    });

    it('should create and checkout branch by default', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/new-feature'
      });

      expect(result?.success).toBe(true);
      expect(result?.message).toBe("Branch 'feature/new-feature' created and checked out");
      expect(result?.data.name).toBe('feature/new-feature');
      expect(result?.data.checkout).toBe(true);
      
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', 'feature/new-feature']);
      expect(mockGit.checkout).toHaveBeenCalledWith('feature/new-feature');
    });

    it('should create branch without checkout when checkout is false', async () => {
      mockGit.raw.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/new-feature',
        checkout: false
      });

      expect(result?.success).toBe(true);
      expect(result?.message).toBe("Branch 'feature/new-feature' created");
      expect(result?.data.checkout).toBe(false);
      
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', 'feature/new-feature']);
      expect(mockGit.checkout).not.toHaveBeenCalled();
    });

    it('should create branch from specific start point', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'hotfix/critical-bug',
        startPoint: 'v1.0.0'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.startPoint).toBe('v1.0.0');
      
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', 'hotfix/critical-bug', 'v1.0.0']);
      expect(mockGit.checkout).toHaveBeenCalledWith('hotfix/critical-bug');
    });

    it('should create branch from commit hash', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'bugfix/issue-123',
        startPoint: 'abc123def456'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.startPoint).toBe('abc123def456');
      
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', 'bugfix/issue-123', 'abc123def456']);
    });

    it('should create branch from another branch', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/based-on-develop',
        startPoint: 'develop'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.startPoint).toBe('develop');
      
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', 'feature/based-on-develop', 'develop']);
    });

    it('should force create branch when force is true', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'existing-branch',
        force: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.force).toBe(true);
      
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', '-f', 'existing-branch']);
    });

    it('should create tracking branch when track is true', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/tracked-branch',
        track: true,
        startPoint: 'origin/feature/remote-branch'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.track).toBe(true);
      
      expect(mockGit.raw).toHaveBeenCalledWith([
        'branch', '--track', 'feature/tracked-branch', 'origin/feature/remote-branch'
      ]);
    });

    it('should combine multiple options', async () => {
      mockGit.raw.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'complex-branch',
        startPoint: 'develop',
        checkout: false,
        track: true,
        force: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data).toEqual({
        name: 'complex-branch',
        startPoint: 'develop',
        checkout: false,
        track: true,
        force: true
      });
      
      expect(mockGit.raw).toHaveBeenCalledWith([
        'branch', '-f', '--track', 'complex-branch', 'develop'
      ]);
      expect(mockGit.checkout).not.toHaveBeenCalled();
    });

    it('should handle branch creation failure', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: A branch named \'existing-branch\' already exists'));

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'existing-branch'
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe("Failed to create branch 'existing-branch'");
      expect(result?.error).toContain('already exists');
    });

    it('should handle checkout failure after successful branch creation', async () => {
      mockGit.raw.mockResolvedValue(undefined); // Branch creation succeeds
      mockGit.checkout.mockRejectedValue(new Error('Your local changes would be overwritten'));

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/new-feature'
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe("Failed to create branch 'feature/new-feature'");
      expect(result?.error).toContain('local changes would be overwritten');
    });

    it('should handle invalid branch names', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: \'invalid..name\' is not a valid branch name'));

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'invalid..name'
      });

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('not a valid branch name');
    });

    it('should handle invalid start point', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: Not a valid object name: \'nonexistent-branch\''));

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/new-feature',
        startPoint: 'nonexistent-branch'
      });

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('Not a valid object name');
    });

    it('should handle not a git repository error', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: not a git repository'));

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/test'
      });

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('not a git repository');
    });

    it('should handle branch names with special characters', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const specialBranchName = 'feature/user-auth_v2.0';
      
      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: specialBranchName
      });

      expect(result?.success).toBe(true);
      expect(result?.data.name).toBe(specialBranchName);
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', specialBranchName]);
    });

    it('should handle empty branch name', async () => {
      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: ''
      });

      expect(result?.success).toBe(false);
      // Should fail because empty string is invalid branch name
    });

    it('should handle long branch names', async () => {
      const longBranchName = 'feature/' + 'a'.repeat(200);
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: longBranchName
      });

      expect(result?.success).toBe(true);
      expect(result?.data.name).toBe(longBranchName);
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', longBranchName]);
    });

    it('should handle branch creation with unstaged changes when force is used', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'hotfix/urgent-fix',
        force: true,
        checkout: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.force).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', '-f', 'hotfix/urgent-fix']);
    });

    it('should handle branch creation from HEAD', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/from-head',
        startPoint: 'HEAD'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.startPoint).toBe('HEAD');
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', 'feature/from-head', 'HEAD']);
    });

    it('should handle remote branch as start point', async () => {
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: 'feature/from-remote',
        startPoint: 'origin/develop',
        track: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.startPoint).toBe('origin/develop');
      expect(result?.data.track).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith([
        'branch', '--track', 'feature/from-remote', 'origin/develop'
      ]);
    });

    it('should handle nested branch names', async () => {
      const nestedBranchName = 'feature/auth/oauth/google-integration';
      mockGit.raw.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, {
        name: nestedBranchName
      });

      expect(result?.success).toBe(true);
      expect(result?.data.name).toBe(nestedBranchName);
      expect(mockGit.raw).toHaveBeenCalledWith(['branch', nestedBranchName]);
    });

    it('should preserve all input options in result data', async () => {
      mockGit.raw.mockResolvedValue(undefined);

      const inputArgs = {
        name: 'feature/test',
        startPoint: 'develop',
        checkout: false,
        track: true,
        force: false
      };

      const tools = branchTools.getTools();
      const branchCreateTool = tools.find(tool => tool.name === 'git_branch_create');
      
      const result = await branchCreateTool?.execute(mockContext, inputArgs);

      expect(result?.success).toBe(true);
      expect(result?.data).toEqual(inputArgs);
    });
  });
});
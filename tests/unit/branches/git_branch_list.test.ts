import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BranchTools } from '../../../src/commands/branches/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import { mockBranchState } from '../../fixtures/git-repositories.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('BranchTools - git_branch_list', () => {
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

  describe('git_branch_list tool', () => {
    it('should be properly configured', () => {
      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      expect(branchListTool).toBeDefined();
      expect(branchListTool?.name).toBe('git_branch_list');
      expect(branchListTool?.description).toContain('List Git branches');
      expect(branchListTool?.inputSchema.properties).toHaveProperty('includeRemote');
      expect(branchListTool?.inputSchema.properties).toHaveProperty('all');
      expect(branchListTool?.inputSchema.properties).toHaveProperty('verbose');
    });

    it('should list local branches by default', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.multipleBranches);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Found 4 branches');
      expect(result?.data.branches).toHaveLength(4);
      expect(result?.data.current).toBe('main');
      expect(result?.data.total).toBe(4);
      
      // Check that current branch is marked
      const currentBranch = result?.data.branches.find((b: any) => b.current);
      expect(currentBranch?.name).toBe('main');
      expect(mockGit.branch).toHaveBeenCalledWith([]);
    });

    it('should include remote branches when includeRemote is true', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.withRemotes);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {
        includeRemote: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.branches).toHaveLength(5);
      expect(mockGit.branch).toHaveBeenCalledWith(['-r']);
    });

    it('should show all branches when all is true', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.withRemotes);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {
        all: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.branches).toHaveLength(5);
      expect(mockGit.branch).toHaveBeenCalledWith(['-a']);
    });

    it('should show verbose information when verbose is true', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.multipleBranches);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {
        verbose: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.branch).toHaveBeenCalledWith(['-v']);
    });

    it('should show only merged branches when merged is true', async () => {
      const mergedBranches = {
        ...mockBranchState.multipleBranches,
        all: ['main', 'feature/auth'], // Only merged branches
        branches: {
          main: mockBranchState.multipleBranches.branches.main,
          'feature/auth': mockBranchState.multipleBranches.branches['feature/auth']
        }
      };
      mockGit.branch.mockResolvedValue(mergedBranches);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {
        merged: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.branches).toHaveLength(2);
      expect(mockGit.branch).toHaveBeenCalledWith(['--merged']);
    });

    it('should show only unmerged branches when noMerged is true', async () => {
      const unmergedBranches = {
        ...mockBranchState.multipleBranches,
        all: ['feature/ui'], // Only unmerged branches
        branches: {
          'feature/ui': mockBranchState.multipleBranches.branches['feature/ui']
        }
      };
      mockGit.branch.mockResolvedValue(unmergedBranches);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {
        noMerged: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.branches).toHaveLength(1);
      expect(result?.data.branches[0].name).toBe('feature/ui');
      expect(mockGit.branch).toHaveBeenCalledWith(['--no-merged']);
    });

    it('should combine multiple options', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.withRemotes);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {
        all: true,
        verbose: true,
        merged: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.branch).toHaveBeenCalledWith(['-a', '-v', '--merged']);
    });

    it('should calculate ahead/behind for current branch', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.multipleBranches);
      mockGit.raw
        .mockResolvedValueOnce('origin/main') // upstream
        .mockResolvedValueOnce('2\t3'); // behind 2, ahead 3

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      
      const currentBranch = result?.data.branches.find((b: any) => b.current);
      expect(currentBranch?.ahead).toBe(3);
      expect(currentBranch?.behind).toBe(2);
      
      expect(mockGit.raw).toHaveBeenCalledWith([
        'rev-parse', '--abbrev-ref', '@{upstream}'
      ]);
      expect(mockGit.raw).toHaveBeenCalledWith([
        'rev-list', '--left-right', '--count', 'origin/main...HEAD'
      ]);
    });

    it('should handle branches without upstream', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.multipleBranches);
      mockGit.raw.mockRejectedValue(new Error('No upstream branch'));

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      
      const currentBranch = result?.data.branches.find((b: any) => b.current);
      expect(currentBranch?.ahead).toBe(0);
      expect(currentBranch?.behind).toBe(0);
    });

    it('should handle empty upstream response', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.multipleBranches);
      mockGit.raw.mockResolvedValue(''); // Empty upstream

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      
      const currentBranch = result?.data.branches.find((b: any) => b.current);
      expect(currentBranch?.ahead).toBe(0);
      expect(currentBranch?.behind).toBe(0);
    });

    it('should handle repositories with no branches', async () => {
      mockGit.branch.mockResolvedValue({
        all: [],
        branches: {},
        current: null
      });

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.branches).toHaveLength(0);
      expect(result?.data.current).toBeNull();
      expect(result?.data.total).toBe(0);
    });

    it('should parse branch information correctly', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.multipleBranches);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      
      const mainBranch = result?.data.branches.find((b: any) => b.name === 'main');
      expect(mainBranch).toEqual({
        name: 'main',
        current: true,
        remote: undefined,
        upstream: undefined,
        ahead: 0,
        behind: 0
      });
      
      const featureBranch = result?.data.branches.find((b: any) => b.name === 'feature/auth');
      expect(featureBranch).toEqual({
        name: 'feature/auth',
        current: false,
        remote: undefined,
        upstream: undefined,
        ahead: 0,
        behind: 0
      });
    });

    it('should handle git branch errors gracefully', async () => {
      mockGit.branch.mockRejectedValue(new Error('Not a git repository'));

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to list branches');
      expect(result?.error).toContain('Not a git repository');
    });

    it('should handle branches with special characters in names', async () => {
      const specialBranches = {
        all: ['main', 'feature/user-auth', 'hotfix/bug#123', 'release/v1.0.0'],
        branches: {
          main: { current: true, name: 'main', commit: 'abc123' },
          'feature/user-auth': { current: false, name: 'feature/user-auth', commit: 'def456' },
          'hotfix/bug#123': { current: false, name: 'hotfix/bug#123', commit: 'ghi789' },
          'release/v1.0.0': { current: false, name: 'release/v1.0.0', commit: 'jkl012' }
        },
        current: 'main'
      };
      mockGit.branch.mockResolvedValue(specialBranches);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.branches).toHaveLength(4);
      expect(result?.data.branches.map((b: any) => b.name)).toEqual([
        'main', 'feature/user-auth', 'hotfix/bug#123', 'release/v1.0.0'
      ]);
    });

    it('should handle branches with remote tracking info', async () => {
      const branchesWithTracking = {
        all: ['main', 'feature/test'],
        branches: {
          main: { 
            current: true, 
            name: 'main', 
            commit: 'abc123',
            remote: 'origin',
            upstream: 'origin/main'
          },
          'feature/test': { 
            current: false, 
            name: 'feature/test', 
            commit: 'def456',
            remote: 'origin',
            upstream: 'origin/feature/test'
          }
        },
        current: 'main'
      };
      mockGit.branch.mockResolvedValue(branchesWithTracking);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      
      const mainBranch = result?.data.branches.find((b: any) => b.name === 'main');
      expect(mainBranch?.remote).toBe('origin');
      expect(mainBranch?.upstream).toBe('origin/main');
      
      const featureBranch = result?.data.branches.find((b: any) => b.name === 'feature/test');
      expect(featureBranch?.remote).toBe('origin');
      expect(featureBranch?.upstream).toBe('origin/feature/test');
    });

    it('should handle malformed ahead/behind response', async () => {
      mockGit.branch.mockResolvedValue(mockBranchState.multipleBranches);
      mockGit.raw
        .mockResolvedValueOnce('origin/main') // upstream
        .mockResolvedValueOnce('invalid-format'); // malformed ahead/behind

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      
      const currentBranch = result?.data.branches.find((b: any) => b.current);
      expect(currentBranch?.ahead).toBe(0);
      expect(currentBranch?.behind).toBe(0);
    });

    it('should handle detached HEAD state', async () => {
      const detachedState = {
        all: ['HEAD'],
        branches: {
          HEAD: { current: true, name: 'HEAD', commit: 'abc123' }
        },
        current: 'HEAD'
      };
      mockGit.branch.mockResolvedValue(detachedState);

      const tools = branchTools.getTools();
      const branchListTool = tools.find(tool => tool.name === 'git_branch_list');
      
      const result = await branchListTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.current).toBe('HEAD');
      expect(result?.data.branches).toHaveLength(1);
      expect(result?.data.branches[0].name).toBe('HEAD');
    });
  });
});
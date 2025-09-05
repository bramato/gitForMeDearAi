import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StatusTools } from '../../../src/commands/status/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import { mockCommitHistory } from '../../fixtures/git-repositories.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('StatusTools - git_show', () => {
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

  describe('git_show tool', () => {
    const mockShowOutput = `commit abc123def456789
Author: John Doe <john@example.com>
Date:   Wed Jan 3 12:00:00 2024 +0000

    feat: add new feature

    This commit adds a new feature with the following changes:
    - Added new function calculateSum
    - Updated documentation
    - Fixed linting issues

diff --git a/src/utils.ts b/src/utils.ts
index abc123..def456 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,3 +1,7 @@
 export function greet(name: string) {
   return \`Hello, \${name}!\`;
 }
+
+export function calculateSum(a: number, b: number) {
+  return a + b;
+}`;

    it('should be properly configured', () => {
      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      expect(showTool).toBeDefined();
      expect(showTool?.name).toBe('git_show');
      expect(showTool?.description).toContain('commit details including changes');
      expect(showTool?.inputSchema.properties).toHaveProperty('commit');
      expect(showTool?.inputSchema.properties).toHaveProperty('showDiff');
    });

    it('should show HEAD commit by default', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Commit details retrieved for HEAD');
      expect(result?.data.raw).toBe(mockShowOutput);
      expect(mockGit.show).toHaveBeenCalledWith(['HEAD']);
      expect(mockGit.log).toHaveBeenCalledWith(['-1', 'HEAD']);
    });

    it('should show specific commit', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.all[1]
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        commit: 'def456'
      });

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Commit details retrieved for def456');
      expect(result?.data.commit.hash).toBe('def456ghi789');
      expect(result?.data.commit.message).toBe('fix: resolve bug in authentication');
      expect(mockGit.show).toHaveBeenCalledWith(['def456']);
      expect(mockGit.log).toHaveBeenCalledWith(['-1', 'def456']);
    });

    it('should show commit without diff when showDiff is false', async () => {
      const mockShowNoDiff = `commit abc123def456789
Author: John Doe <john@example.com>
Date:   Wed Jan 3 12:00:00 2024 +0000

    feat: add new feature`;
      
      mockGit.show.mockResolvedValue(mockShowNoDiff);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        commit: 'abc123',
        showDiff: false
      });

      expect(result?.success).toBe(true);
      expect(result?.data.raw).toBe(mockShowNoDiff);
      expect(result?.data.raw).not.toContain('diff --git');
      expect(mockGit.show).toHaveBeenCalledWith(['abc123', '--no-patch']);
    });

    it('should show only file names when nameOnly is true', async () => {
      const mockShowNameOnly = `commit abc123def456789
Author: John Doe <john@example.com>
Date:   Wed Jan 3 12:00:00 2024 +0000

    feat: add new feature

src/utils.ts
README.md
package.json`;
      
      mockGit.show.mockResolvedValue(mockShowNameOnly);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        nameOnly: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.raw).toContain('src/utils.ts');
      expect(result?.data.raw).toContain('README.md');
      expect(result?.data.raw).not.toContain('@@');
      expect(mockGit.show).toHaveBeenCalledWith(['HEAD', '--name-only']);
    });

    it('should show stat summary when stat is true', async () => {
      const mockShowStat = `commit abc123def456789
Author: John Doe <john@example.com>
Date:   Wed Jan 3 12:00:00 2024 +0000

    feat: add new feature

 README.md    |  2 ++
 src/utils.ts | 10 ++++++++++
 2 files changed, 12 insertions(+)`;
      
      mockGit.show.mockResolvedValue(mockShowStat);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        stat: true
      });

      expect(result?.success).toBe(true);
      expect(result?.data.raw).toContain('2 files changed, 12 insertions(+)');
      expect(mockGit.show).toHaveBeenCalledWith(['HEAD', '--stat']);
    });

    it('should combine multiple options', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.all[2]
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        commit: 'ghi789',
        showDiff: false,
        nameOnly: true,
        stat: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.show).toHaveBeenCalledWith(['ghi789', '--no-patch', '--name-only', '--stat']);
    });

    it('should handle branch names as commit references', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        commit: 'feature/auth'
      });

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Commit details retrieved for feature/auth');
      expect(mockGit.show).toHaveBeenCalledWith(['feature/auth']);
      expect(mockGit.log).toHaveBeenCalledWith(['-1', 'feature/auth']);
    });

    it('should handle tag references', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        commit: 'v1.0.0'
      });

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Commit details retrieved for v1.0.0');
      expect(mockGit.show).toHaveBeenCalledWith(['v1.0.0']);
    });

    it('should parse commit data correctly', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockResolvedValue({
        latest: {
          hash: 'abc123def456789',
          message: 'feat: add new feature',
          author_name: 'John Doe',
          author_email: 'john@example.com',
          date: '2024-01-03T12:00:00Z',
          diff: {
            files: [
              { file: 'src/utils.ts', changes: 4, insertions: 4, deletions: 0 },
              { file: 'README.md', changes: 2, insertions: 2, deletions: 0 }
            ]
          }
        }
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.commit).toEqual({
        hash: 'abc123def456789',
        message: 'feat: add new feature',
        author: 'John Doe',
        email: 'john@example.com',
        date: '2024-01-03T12:00:00Z',
        files: [
          { file: 'src/utils.ts', changes: 4, insertions: 4, deletions: 0 },
          { file: 'README.md', changes: 2, insertions: 2, deletions: 0 }
        ]
      });
    });

    it('should handle commits without diff files', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockResolvedValue({
        latest: {
          hash: 'abc123def456789',
          message: 'feat: add new feature',
          author_name: 'John Doe',
          author_email: 'john@example.com',
          date: '2024-01-03T12:00:00Z'
          // No diff property
        }
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.commit.files).toEqual([]);
    });

    it('should handle merge commits', async () => {
      const mergeCommitOutput = `commit abc123def456789
Merge: def456 ghi789
Author: John Doe <john@example.com>
Date:   Wed Jan 3 12:00:00 2024 +0000

    Merge pull request #42 from feature/auth
    
    Add authentication system`;
      
      mockGit.show.mockResolvedValue(mergeCommitOutput);
      mockGit.log.mockResolvedValue({
        latest: {
          hash: 'abc123def456789',
          message: 'Merge pull request #42 from feature/auth\n\nAdd authentication system',
          author_name: 'John Doe',
          author_email: 'john@example.com',
          date: '2024-01-03T12:00:00Z'
        }
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.raw).toContain('Merge:');
      expect(result?.data.commit.message).toContain('Merge pull request');
    });

    it('should handle initial commit', async () => {
      const initialCommitOutput = `commit abc123def456789
Author: John Doe <john@example.com>
Date:   Mon Jan 1 09:00:00 2024 +0000

    Initial commit

diff --git a/README.md b/README.md
new file mode 100644
index 0000000..abc123
--- /dev/null
+++ b/README.md
@@ -0,0 +1 @@
+# Project Title`;
      
      mockGit.show.mockResolvedValue(initialCommitOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.all[2]
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        commit: 'ghi789jkl012'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.commit.message).toBe('Initial commit');
      expect(result?.data.raw).toContain('new file mode');
    });

    it('should handle invalid commit reference', async () => {
      mockGit.show.mockRejectedValue(new Error('fatal: bad revision \'invalid-commit\''));

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {
        commit: 'invalid-commit'
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to show commit invalid-commit');
      expect(result?.error).toContain('bad revision');
    });

    it('should handle not a git repository error', async () => {
      mockGit.show.mockRejectedValue(new Error('fatal: not a git repository'));

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to show commit HEAD');
      expect(result?.error).toContain('not a git repository');
    });

    it('should handle empty repository', async () => {
      mockGit.show.mockRejectedValue(new Error('fatal: bad default revision \'HEAD\''));

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to show commit HEAD');
      expect(result?.error).toContain('bad default revision');
    });

    it('should handle git log failure gracefully', async () => {
      mockGit.show.mockResolvedValue(mockShowOutput);
      mockGit.log.mockRejectedValue(new Error('git log failed'));

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('git log failed');
    });

    it('should handle large commit output', async () => {
      const largeOutput = mockShowOutput + '\n' + '+'.repeat(50000); // Large diff
      mockGit.show.mockResolvedValue(largeOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.raw.length).toBeGreaterThan(50000);
    });

    it('should handle commit with binary files', async () => {
      const binaryCommitOutput = `commit abc123def456789
Author: John Doe <john@example.com>
Date:   Wed Jan 3 12:00:00 2024 +0000

    Add logo image

diff --git a/logo.png b/logo.png
new file mode 100644
index 0000000..abc123
Binary files /dev/null and b/logo.png differ`;
      
      mockGit.show.mockResolvedValue(binaryCommitOutput);
      mockGit.log.mockResolvedValue({
        latest: mockCommitHistory.simple.latest
      });

      const tools = statusTools.getTools();
      const showTool = tools.find(tool => tool.name === 'git_show');
      
      const result = await showTool?.execute(mockContext, {});

      expect(result?.success).toBe(true);
      expect(result?.data.raw).toContain('Binary files');
    });
  });
});
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StatusTools } from '../../../src/commands/status/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('StatusTools - git_blame', () => {
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

  describe('git_blame tool', () => {
    const mockBlameOutput = `abc123de (John Doe    2024-01-01 10:30:45 +0000  1) export function calculateSum(a: number, b: number) {
abc123de (John Doe    2024-01-01 10:30:45 +0000  2)   return a + b;
def456gh (Jane Smith  2024-01-02 14:15:20 +0000  3) }
def456gh (Jane Smith  2024-01-02 14:15:20 +0000  4) 
ghi789jk (Bob Johnson 2024-01-03 09:45:10 +0000  5) // Added error handling
ghi789jk (Bob Johnson 2024-01-03 09:45:10 +0000  6) export function safeDivide(a: number, b: number) {
ghi789jk (Bob Johnson 2024-01-03 09:45:10 +0000  7)   if (b === 0) throw new Error('Division by zero');
ghi789jk (Bob Johnson 2024-01-03 09:45:10 +0000  8)   return a / b;
ghi789jk (Bob Johnson 2024-01-03 09:45:10 +0000  9) }`;

    it('should be properly configured', () => {
      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      expect(blameTool).toBeDefined();
      expect(blameTool?.name).toBe('git_blame');
      expect(blameTool?.description).toContain('line-by-line authorship');
      expect(blameTool?.inputSchema.properties).toHaveProperty('file');
      expect(blameTool?.inputSchema.required).toContain('file');
    });

    it('should return blame for entire file', async () => {
      mockGit.raw.mockResolvedValue(mockBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts'
      });

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Blame retrieved for src/utils.ts');
      expect(result?.data.file).toBe('src/utils.ts');
      expect(result?.data.lines).toHaveLength(9);
      expect(mockGit.raw).toHaveBeenCalledWith(['blame', '-n', 'src/utils.ts']);
    });

    it('should parse blame output correctly', async () => {
      mockGit.raw.mockResolvedValue(mockBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts'
      });

      expect(result?.success).toBe(true);
      
      const firstLine = result?.data.lines[0];
      expect(firstLine?.hash).toBe('abc123de');
      expect(firstLine?.author).toBe('John Doe');
      expect(firstLine?.content).toBe('export function calculateSum(a: number, b: number) {');
      
      const lastLine = result?.data.lines[8];
      expect(lastLine?.hash).toBe('ghi789jk');
      expect(lastLine?.author).toBe('Bob Johnson');
      expect(lastLine?.content).toBe('}');
    });

    it('should return blame with email addresses when showEmail is true', async () => {
      mockGit.raw.mockResolvedValue(mockBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts',
        showEmail: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith(['blame', '-e', '-n', 'src/utils.ts']);
    });

    it('should hide line numbers when showLineNumbers is false', async () => {
      mockGit.raw.mockResolvedValue(mockBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts',
        showLineNumbers: false
      });

      expect(result?.success).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith(['blame', 'src/utils.ts']);
    });

    it('should return blame for specific line range', async () => {
      const limitedBlameOutput = `abc123de (John Doe    2024-01-01 10:30:45 +0000  1) export function calculateSum(a: number, b: number) {
abc123de (John Doe    2024-01-01 10:30:45 +0000  2)   return a + b;
def456gh (Jane Smith  2024-01-02 14:15:20 +0000  3) }`;
      
      mockGit.raw.mockResolvedValue(limitedBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts',
        lineStart: 1,
        lineEnd: 3
      });

      expect(result?.success).toBe(true);
      expect(result?.data.lines).toHaveLength(3);
      expect(result?.data.lineRange).toEqual({ start: 1, end: 3 });
      expect(mockGit.raw).toHaveBeenCalledWith(['blame', '-n', '-L', '1,3', 'src/utils.ts']);
    });

    it('should return blame for single line when only lineStart is provided', async () => {
      const singleLineBlameOutput = `abc123de (John Doe    2024-01-01 10:30:45 +0000  5) // Added error handling`;
      
      mockGit.raw.mockResolvedValue(singleLineBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts',
        lineStart: 5
      });

      expect(result?.success).toBe(true);
      expect(result?.data.lines).toHaveLength(1);
      expect(mockGit.raw).toHaveBeenCalledWith(['blame', '-n', '-L', '5,+1', 'src/utils.ts']);
    });

    it('should combine all options correctly', async () => {
      mockGit.raw.mockResolvedValue(mockBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts',
        lineStart: 2,
        lineEnd: 5,
        showEmail: true,
        showLineNumbers: true
      });

      expect(result?.success).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith(['blame', '-e', '-n', '-L', '2,5', 'src/utils.ts']);
    });

    it('should handle empty file gracefully', async () => {
      mockGit.raw.mockResolvedValue('');

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'empty.txt'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.lines).toHaveLength(0);
    });

    it('should handle malformed blame lines gracefully', async () => {
      const malformedBlameOutput = `abc123de (John Doe    2024-01-01 10:30:45 +0000  1) normal line
invalid-blame-line-format
def456gh (Jane Smith  2024-01-02 14:15:20 +0000  3) another normal line`;
      
      mockGit.raw.mockResolvedValue(malformedBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.lines).toHaveLength(3);
      
      // First line should be parsed correctly
      expect(result?.data.lines[0].hash).toBe('abc123de');
      expect(result?.data.lines[0].author).toBe('John Doe');
      
      // Malformed line should have empty fields but preserve content
      expect(result?.data.lines[1].hash).toBe('');
      expect(result?.data.lines[1].author).toBe('');
      expect(result?.data.lines[1].content).toBe('invalid-blame-line-format');
      
      // Third line should be parsed correctly
      expect(result?.data.lines[2].hash).toBe('def456gh');
      expect(result?.data.lines[2].author).toBe('Jane Smith');
    });

    it('should handle file not found error', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: no such path nonexistent.ts in HEAD'));

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'nonexistent.ts'
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get blame for nonexistent.ts');
      expect(result?.error).toContain('no such path');
    });

    it('should handle binary files error', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: no such path or binary file'));

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'binary-file.png'
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get blame for binary-file.png');
      expect(result?.error).toContain('binary file');
    });

    it('should handle invalid line range', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: file src/utils.ts has only 10 lines'));

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts',
        lineStart: 15,
        lineEnd: 20
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get blame for src/utils.ts');
      expect(result?.error).toContain('has only 10 lines');
    });

    it('should handle not a git repository error', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: not a git repository'));

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts'
      });

      expect(result?.success).toBe(false);
      expect(result?.message).toBe('Failed to get blame for src/utils.ts');
      expect(result?.error).toContain('not a git repository');
    });

    it('should handle very long lines in blame output', async () => {
      const longContent = 'const veryLongVariableName = ' + 'x'.repeat(1000);
      const longLineBlameOutput = `abc123de (John Doe    2024-01-01 10:30:45 +0000  1) ${longContent}`;
      
      mockGit.raw.mockResolvedValue(longLineBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.lines).toHaveLength(1);
      expect(result?.data.lines[0].content).toBe(longContent);
      expect(result?.data.lines[0].content.length).toBeGreaterThan(1000);
    });

    it('should handle blame with complex author names and dates', async () => {
      const complexBlameOutput = `abc123de (Author With-Spaces 2024-01-01 10:30:45 +0000  1) line 1
def456gh (Another.Author@email.com 2024-12-31 23:59:59 -0800  2) line 2
ghi789jk (作者名前          2024-06-15 12:00:00 +0900  3) line 3`;
      
      mockGit.raw.mockResolvedValue(complexBlameOutput);

      const tools = statusTools.getTools();
      const blameTool = tools.find(tool => tool.name === 'git_blame');
      
      const result = await blameTool?.execute(mockContext, {
        file: 'src/utils.ts'
      });

      expect(result?.success).toBe(true);
      expect(result?.data.lines).toHaveLength(3);
      expect(result?.data.lines[0].author).toBe('Author With-Spaces');
      expect(result?.data.lines[1].author).toBe('Another.Author@email.com');
      expect(result?.data.lines[2].author).toBe('作者名前');
    });
  });
});
import { RepositoryTools } from '../../../src/commands/repository/index';
import { McpServerContext } from '../../../src/types/index';

describe('Repository Tools', () => {
  let repositoryTools: RepositoryTools;
  let mockContext: McpServerContext;

  beforeEach(() => {
    repositoryTools = new RepositoryTools();
    mockContext = {
      workingDirectory: '/test/repo',
      config: {
        defaultRemote: 'origin',
        autoCommitConventions: true,
        gitmojis: true,
      },
      git: {
        raw: jest.fn(),
        addRemote: jest.fn(),
        removeRemote: jest.fn(),
        getRemotes: jest.fn(),
      },
    } as any;
  });

  describe('getTools', () => {
    it('should return all repository tools', () => {
      const tools = repositoryTools.getTools();
      
      expect(tools).toHaveLength(4);
      expect(tools.map(t => t.name)).toEqual([
        'git_init',
        'git_clone', 
        'git_remote',
        'git_config',
      ]);
    });

    it('should have proper tool descriptions', () => {
      const tools = repositoryTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });

  describe('git_init tool', () => {
    it('should initialize repository with default settings', async () => {
      const initTool = repositoryTools.getTools().find(t => t.name === 'git_init')!;
      mockContext.git.raw.mockResolvedValue('');

      const result = await initTool.execute(mockContext, {});

      expect(result.success).toBe(true);
      expect(result.message).toContain('Repository initialized');
      expect(mockContext.git.raw).toHaveBeenCalledWith(['init', '/test/repo']);
    });

    it('should initialize bare repository when requested', async () => {
      const initTool = repositoryTools.getTools().find(t => t.name === 'git_init')!;
      mockContext.git.raw.mockResolvedValue('');

      const result = await initTool.execute(mockContext, {
        bare: true,
        defaultBranch: 'develop',
      });

      expect(result.success).toBe(true);
      expect(mockContext.git.raw).toHaveBeenCalledWith([
        'init',
        '--bare',
        '--initial-branch',
        'develop',
        '/test/repo',
      ]);
    });

    it('should handle initialization errors', async () => {
      const initTool = repositoryTools.getTools().find(t => t.name === 'git_init')!;
      mockContext.git.raw.mockRejectedValue(new Error('Permission denied'));

      const result = await initTool.execute(mockContext, {});

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to initialize repository');
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('git_clone tool', () => {
    it('should clone repository successfully', async () => {
      const cloneTool = repositoryTools.getTools().find(t => t.name === 'git_clone')!;
      mockContext.git.raw.mockResolvedValue('');

      const result = await cloneTool.execute(mockContext, {
        url: 'https://github.com/user/repo.git',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Repository cloned');
      expect(mockContext.git.raw).toHaveBeenCalledWith([
        'clone',
        'https://github.com/user/repo.git',
      ]);
    });

    it('should clone with branch and depth options', async () => {
      const cloneTool = repositoryTools.getTools().find(t => t.name === 'git_clone')!;
      mockContext.git.raw.mockResolvedValue('');

      const result = await cloneTool.execute(mockContext, {
        url: 'https://github.com/user/repo.git',
        directory: 'my-repo',
        branch: 'develop',
        depth: 1,
        recursive: true,
      });

      expect(result.success).toBe(true);
      expect(mockContext.git.raw).toHaveBeenCalledWith([
        'clone',
        '--branch',
        'develop',
        '--depth',
        '1',
        '--recursive',
        'https://github.com/user/repo.git',
        'my-repo',
      ]);
    });

    it('should handle clone errors', async () => {
      const cloneTool = repositoryTools.getTools().find(t => t.name === 'git_clone')!;
      mockContext.git.raw.mockRejectedValue(new Error('Repository not found'));

      const result = await cloneTool.execute(mockContext, {
        url: 'https://github.com/invalid/repo.git',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Repository not found');
    });
  });

  describe('git_remote tool', () => {
    it('should list remotes', async () => {
      const remoteTool = repositoryTools.getTools().find(t => t.name === 'git_remote')!;
      const mockRemotes = [
        { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git' } },
      ];
      mockContext.git.getRemotes.mockResolvedValue(mockRemotes);

      const result = await remoteTool.execute(mockContext, {
        action: 'list',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRemotes);
      expect(mockContext.git.getRemotes).toHaveBeenCalledWith(false);
    });

    it('should add remote', async () => {
      const remoteTool = repositoryTools.getTools().find(t => t.name === 'git_remote')!;
      mockContext.git.addRemote.mockResolvedValue(undefined);

      const result = await remoteTool.execute(mockContext, {
        action: 'add',
        name: 'upstream',
        url: 'https://github.com/upstream/repo.git',
      });

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('added');
      expect(mockContext.git.addRemote).toHaveBeenCalledWith('upstream', 'https://github.com/upstream/repo.git');
    });

    it('should remove remote', async () => {
      const remoteTool = repositoryTools.getTools().find(t => t.name === 'git_remote')!;
      mockContext.git.removeRemote.mockResolvedValue(undefined);

      const result = await remoteTool.execute(mockContext, {
        action: 'remove',
        name: 'upstream',
      });

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('removed');
      expect(mockContext.git.removeRemote).toHaveBeenCalledWith('upstream');
    });

    it('should handle missing required parameters', async () => {
      const remoteTool = repositoryTools.getTools().find(t => t.name === 'git_remote')!;

      const result = await remoteTool.execute(mockContext, {
        action: 'add',
        // Missing name and url
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Remote name and URL are required');
    });
  });

  describe('git_config tool', () => {
    it('should get configuration value', async () => {
      const configTool = repositoryTools.getTools().find(t => t.name === 'git_config')!;
      mockContext.git.raw.mockResolvedValue('John Doe');

      const result = await configTool.execute(mockContext, {
        action: 'get',
        key: 'user.name',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('John Doe');
      expect(mockContext.git.raw).toHaveBeenCalledWith(['config', 'user.name']);
    });

    it('should set configuration value', async () => {
      const configTool = repositoryTools.getTools().find(t => t.name === 'git_config')!;
      mockContext.git.raw.mockResolvedValue('');

      const result = await configTool.execute(mockContext, {
        action: 'set',
        key: 'user.email',
        value: 'john@example.com',
        global: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('set');
      expect(mockContext.git.raw).toHaveBeenCalledWith([
        'config',
        '--global',
        'user.email',
        'john@example.com',
      ]);
    });

    it('should list all configuration', async () => {
      const configTool = repositoryTools.getTools().find(t => t.name === 'git_config')!;
      mockContext.git.raw.mockResolvedValue('user.name=John\nuser.email=john@example.com');

      const result = await configTool.execute(mockContext, {
        action: 'list',
      });

      expect(result.success).toBe(true);
      expect(mockContext.git.raw).toHaveBeenCalledWith(['config', '--list']);
    });
  });
});
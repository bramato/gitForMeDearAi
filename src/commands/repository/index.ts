import { z } from 'zod';
import { McpServerContext, GitCommandResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (context: McpServerContext, args: any) => Promise<any>;
}

export class RepositoryTools {
  getTools(): McpTool[] {
    return [
      this.createInitTool(),
      this.createCloneTool(),
      this.createRemoteTool(),
      this.createConfigTool(),
    ];
  }

  private createInitTool(): McpTool {
    return {
      name: 'git_init',
      description: 'Initialize a new Git repository with optional configuration',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to initialize (defaults to current directory)',
          },
          bare: {
            type: 'boolean',
            description: 'Create a bare repository',
            default: false,
          },
          defaultBranch: {
            type: 'string',
            description: 'Set the default branch name',
            default: 'main',
          },
          template: {
            type: 'string',
            description: 'Template directory to use',
          },
        },
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { path, bare, defaultBranch, template } = args;
          
          logger.info(`🚀 Initializing Git repository`, { path, bare, defaultBranch });

          const initOptions: string[] = [];
          
          if (bare) {
            initOptions.push('--bare');
          }
          
          if (defaultBranch) {
            initOptions.push('--initial-branch', defaultBranch);
          }
          
          if (template) {
            initOptions.push('--template', template);
          }

          const targetPath = path || context.workingDirectory;
          
          await context.git.raw(['init', ...initOptions, targetPath]);

          // Set basic configuration if not a bare repo
          if (!bare) {
            const gitInPath = context.git.cwd(targetPath);
            
            // Configure default branch
            if (defaultBranch) {
              await gitInPath.raw(['config', 'init.defaultBranch', defaultBranch]);
            }
            
            // Set basic configuration from context
            if (context.config.autoCommitConventions) {
              await gitInPath.raw(['config', 'commit.template', '.gitmessage']);
            }
          }

          logger.success(`✅ Repository initialized successfully at ${targetPath}`);

          return {
            success: true,
            message: `Repository initialized at ${targetPath}`,
            data: {
              path: targetPath,
              bare,
              defaultBranch,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to initialize repository:', error);
          return {
            success: false,
            message: 'Failed to initialize repository',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createCloneTool(): McpTool {
    return {
      name: 'git_clone',
      description: 'Clone a Git repository from remote URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Repository URL to clone',
          },
          directory: {
            type: 'string',
            description: 'Target directory name (optional)',
          },
          branch: {
            type: 'string',
            description: 'Specific branch to clone',
          },
          depth: {
            type: 'number',
            description: 'Create a shallow clone with limited history',
          },
          recursive: {
            type: 'boolean',
            description: 'Clone submodules recursively',
            default: false,
          },
        },
        required: ['url'],
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { url, directory, branch, depth, recursive } = args;
          
          logger.info(`📥 Cloning repository from ${url}`, { directory, branch, depth });

          const cloneOptions: string[] = [url];
          
          if (directory) {
            cloneOptions.push(directory);
          }
          
          const options: string[] = [];
          
          if (branch) {
            options.push('--branch', branch);
          }
          
          if (depth) {
            options.push('--depth', depth.toString());
          }
          
          if (recursive) {
            options.push('--recursive');
          }

          await context.git.raw(['clone', ...options, ...cloneOptions]);

          const targetDir = directory || url.split('/').pop()?.replace('.git', '') || 'repository';
          
          logger.success(`✅ Repository cloned successfully to ${targetDir}`);

          return {
            success: true,
            message: `Repository cloned to ${targetDir}`,
            data: {
              url,
              directory: targetDir,
              branch,
              depth,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to clone repository:', error);
          return {
            success: false,
            message: 'Failed to clone repository',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createRemoteTool(): McpTool {
    return {
      name: 'git_remote',
      description: 'Manage Git remote repositories (add, remove, set-url, list)',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['add', 'remove', 'set-url', 'list', 'show'],
            description: 'Remote action to perform',
          },
          name: {
            type: 'string',
            description: 'Remote name (e.g., origin, upstream)',
          },
          url: {
            type: 'string',
            description: 'Remote URL',
          },
          verbose: {
            type: 'boolean',
            description: 'Show detailed information',
            default: false,
          },
        },
        required: ['action'],
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { action, name, url, verbose } = args;
          
          logger.info(`🔗 Managing remote: ${action}`, { name, url });

          let result;
          
          switch (action) {
            case 'list':
              const remotes = await context.git.getRemotes(verbose);
              result = remotes;
              break;
              
            case 'add':
              if (!name || !url) {
                throw new Error('Remote name and URL are required for add action');
              }
              await context.git.addRemote(name, url);
              result = { name, url, action: 'added' };
              break;
              
            case 'remove':
              if (!name) {
                throw new Error('Remote name is required for remove action');
              }
              await context.git.removeRemote(name);
              result = { name, action: 'removed' };
              break;
              
            case 'set-url':
              if (!name || !url) {
                throw new Error('Remote name and URL are required for set-url action');
              }
              await context.git.raw(['remote', 'set-url', name, url]);
              result = { name, url, action: 'url-updated' };
              break;
              
            case 'show':
              if (!name) {
                throw new Error('Remote name is required for show action');
              }
              const remoteInfo = await context.git.raw(['remote', 'show', name]);
              result = { name, info: remoteInfo };
              break;
              
            default:
              throw new Error(`Unknown remote action: ${action}`);
          }

          logger.success(`✅ Remote ${action} completed successfully`);

          return {
            success: true,
            message: `Remote ${action} completed`,
            data: result,
          };
        } catch (error) {
          logger.error(`❌ Failed to ${args.action} remote:`, error);
          return {
            success: false,
            message: `Failed to ${args.action} remote`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createConfigTool(): McpTool {
    return {
      name: 'git_config',
      description: 'Get or set Git configuration values (user.name, user.email, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['get', 'set', 'unset', 'list'],
            description: 'Configuration action to perform',
          },
          key: {
            type: 'string',
            description: 'Configuration key (e.g., user.name, user.email)',
          },
          value: {
            type: 'string',
            description: 'Configuration value (required for set action)',
          },
          global: {
            type: 'boolean',
            description: 'Apply to global Git configuration',
            default: false,
          },
          system: {
            type: 'boolean',
            description: 'Apply to system Git configuration',
            default: false,
          },
        },
        required: ['action'],
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { action, key, value, global, system } = args;
          
          logger.info(`⚙️ Git config ${action}`, { key, value, global, system });

          let result;
          const configArgs: string[] = ['config'];
          
          if (global) configArgs.push('--global');
          if (system) configArgs.push('--system');
          
          switch (action) {
            case 'list':
              configArgs.push('--list');
              result = await context.git.raw(configArgs);
              break;
              
            case 'get':
              if (!key) {
                throw new Error('Configuration key is required for get action');
              }
              configArgs.push(key);
              result = await context.git.raw(configArgs);
              break;
              
            case 'set':
              if (!key || !value) {
                throw new Error('Configuration key and value are required for set action');
              }
              configArgs.push(key, value);
              await context.git.raw(configArgs);
              result = { key, value, action: 'set' };
              break;
              
            case 'unset':
              if (!key) {
                throw new Error('Configuration key is required for unset action');
              }
              configArgs.push('--unset', key);
              await context.git.raw(configArgs);
              result = { key, action: 'unset' };
              break;
              
            default:
              throw new Error(`Unknown config action: ${action}`);
          }

          logger.success(`✅ Git config ${action} completed successfully`);

          return {
            success: true,
            message: `Git config ${action} completed`,
            data: result,
          };
        } catch (error) {
          logger.error(`❌ Failed to ${args.action} git config:`, error);
          return {
            success: false,
            message: `Failed to ${args.action} git config`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }
}
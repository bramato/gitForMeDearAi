import { z } from 'zod';
import { McpServerContext, GitCommandResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { gitKrakenDetector } from '../../utils/gitKrakenDetector.js';

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

export class GitKrakenTools {
  private isInitialized = false;
  private capabilities = {
    hasGraph: false,
    hasWorkflow: false,
    hasWorkspace: false,
    hasAI: false,
  };

  async getTools(): Promise<McpTool[]> {
    // Check if GitKraken CLI is available
    const isAvailable = await gitKrakenDetector.isAvailable();
    
    if (!isAvailable) {
      logger.info('🔍 GitKraken CLI not detected - GitKraken tools disabled');
      return [];
    }

    // Initialize capabilities if not already done
    if (!this.isInitialized) {
      await this.initializeCapabilities();
    }

    const tools: McpTool[] = [];

    // Add tools based on available capabilities
    if (this.capabilities.hasGraph) {
      tools.push(this.createGraphTool());
    }

    if (this.capabilities.hasWorkflow && this.capabilities.hasAI) {
      tools.push(this.createWorkCommitAiTool());
      tools.push(this.createWorkPrCreateAiTool());
    }

    if (this.capabilities.hasWorkspace) {
      tools.push(this.createWorkspaceListTool());
      tools.push(this.createWorkspaceCreateTool());
    }

    // Add additional tools
    tools.push(this.createWorkListTool());
    tools.push(this.createSetupTool());

    logger.info(`🐙 GitKraken tools initialized: ${tools.length} tools available`);
    return tools;
  }

  private async initializeCapabilities(): Promise<void> {
    try {
      this.capabilities = await gitKrakenDetector.checkCapabilities();
      const version = await gitKrakenDetector.getVersion();
      
      logger.info(`🐙 GitKraken CLI v${version} capabilities:`, this.capabilities);
      this.isInitialized = true;
    } catch (error) {
      logger.error('❌ Failed to initialize GitKraken capabilities:', error);
      this.isInitialized = true; // Prevent retry loops
    }
  }

  private createGraphTool(): McpTool {
    return {
      name: 'gk_graph',
      description: 'Display interactive commit graph visualization using GitKraken CLI',
      inputSchema: {
        type: 'object',
        properties: {
          branch: {
            type: 'string',
            description: 'Specific branch to visualize (optional)',
          },
          limit: {
            type: 'number',
            description: 'Number of commits to show',
            default: 20,
          },
          position: {
            type: 'string',
            enum: ['top', 'bottom', 'left', 'right'],
            description: 'Position of the graph visualization panel',
            default: 'right',
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { branch, limit = 20, position = 'right' } = args;
        const command = ['graph'];

        if (branch) command.push('--branch', branch);
        if (limit) command.push('--limit', limit.toString());
        if (position) command.push(`--${position}`);

        const result = await gitKrakenDetector.executeGkCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to display commit graph',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'Commit graph visualization opened',
          data: {
            graphOpened: true,
            branch: branch || 'current',
            limit,
            position,
            info: 'Interactive commit graph is now displayed in a separate panel',
          },
        };
      },
    };
  }

  private createWorkCommitAiTool(): McpTool {
    return {
      name: 'gk_work_commit_ai',
      description: 'Create intelligent commit messages using GitKraken AI',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Optional base message to enhance with AI',
          },
          all: {
            type: 'boolean',
            description: 'Stage all modified files before committing',
            default: false,
          },
          scope: {
            type: 'string',
            description: 'Scope for the commit (e.g., "api", "ui", "core")',
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { message, all = false, scope } = args;
        const command = ['work', 'commit', '--ai'];

        if (message) command.push('--message', message);
        if (all) command.push('--all');
        if (scope) command.push('--scope', scope);

        const result = await gitKrakenDetector.executeGkCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to create AI-generated commit',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'AI-generated commit created successfully',
          data: {
            commitCreated: true,
            aiGenerated: true,
            baseMessage: message,
            scope,
            result: result.data,
          },
        };
      },
    };
  }

  private createWorkPrCreateAiTool(): McpTool {
    return {
      name: 'gk_work_pr_create_ai',
      description: 'Create pull request with AI-generated title and description',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Base title to enhance with AI',
          },
          description: {
            type: 'string',
            description: 'Base description to enhance with AI',
          },
          base: {
            type: 'string',
            description: 'Target branch for the pull request',
            default: 'main',
          },
          draft: {
            type: 'boolean',
            description: 'Create as draft pull request',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { title, description, base = 'main', draft = false } = args;
        const command = ['work', 'pr', 'create', '--ai'];

        if (title) command.push('--title', title);
        if (description) command.push('--description', description);
        command.push('--base', base);
        if (draft) command.push('--draft');

        const result = await gitKrakenDetector.executeGkCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to create AI-generated pull request',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'AI-generated pull request created successfully',
          data: {
            prCreated: true,
            aiGenerated: true,
            baseTitle: title,
            baseDescription: description,
            targetBranch: base,
            isDraft: draft,
            result: result.data,
          },
        };
      },
    };
  }

  private createWorkspaceListTool(): McpTool {
    return {
      name: 'gk_workspace_list',
      description: 'List all GitKraken workspaces',
      inputSchema: {
        type: 'object',
        properties: {
          detailed: {
            type: 'boolean',
            description: 'Show detailed information about each workspace',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { detailed = false } = args;
        const command = ['workspace', 'list'];

        if (detailed) command.push('--detailed');

        const result = await gitKrakenDetector.executeGkCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to list workspaces',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'Workspaces listed successfully',
          data: result.data,
        };
      },
    };
  }

  private createWorkspaceCreateTool(): McpTool {
    return {
      name: 'gk_workspace_create',
      description: 'Create a new GitKraken workspace',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the new workspace',
          },
          description: {
            type: 'string',
            description: 'Description for the workspace',
          },
          repos: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of repository paths to add to the workspace',
          },
        },
        required: ['name'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { name, description, repos } = args;
        const command = ['workspace', 'create', name];

        if (description) command.push('--description', description);
        if (repos && repos.length > 0) {
          command.push('--repos', repos.join(','));
        }

        const result = await gitKrakenDetector.executeGkCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to create workspace',
            error: result.error,
          };
        }

        return {
          success: true,
          message: `Workspace "${name}" created successfully`,
          data: {
            workspaceName: name,
            description,
            repositories: repos || [],
            result: result.data,
          },
        };
      },
    };
  }

  private createWorkListTool(): McpTool {
    return {
      name: 'gk_work_list',
      description: 'List active work items in GitKraken',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'completed', 'all'],
            description: 'Filter work items by status',
            default: 'active',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of work items to return',
            default: 10,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { status = 'active', limit = 10 } = args;
        const command = ['work', 'list'];

        command.push('--status', status);
        command.push('--limit', limit.toString());

        const result = await gitKrakenDetector.executeGkCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to list work items',
            error: result.error,
          };
        }

        return {
          success: true,
          message: `Found work items with status: ${status}`,
          data: result.data,
        };
      },
    };
  }

  private createSetupTool(): McpTool {
    return {
      name: 'gk_setup',
      description: 'Display GitKraken CLI setup and configuration information',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const command = ['setup'];

        const result = await gitKrakenDetector.executeGkCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to get setup information',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'GitKraken CLI setup information retrieved',
          data: result.data,
        };
      },
    };
  }
}
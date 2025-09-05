import { z } from 'zod';
import { McpServerContext, GitCommandResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

export class GitHubTools {
  getTools(): McpTool[] {
    return [
      this.createRepoInfoTool(),
      this.createIssueListTool(),
      this.createIssueCreateTool(),
      this.createIssueViewTool(),
      this.createPullRequestListTool(),
      this.createPullRequestCreateTool(),
      this.createPullRequestViewTool(),
      this.createWorkflowRunTool(),
      this.createReleaseListTool(),
    ];
  }

  private async executeGhCommand(
    command: string[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info(`🐙 Executing gh command: ${command.join(' ')}`);
      const { stdout, stderr } = await execAsync(`gh ${command.join(' ')}`);

      if (stderr && !stdout) {
        return { success: false, error: stderr };
      }

      // Try to parse JSON output if possible
      let data = stdout.trim();
      try {
        data = JSON.parse(stdout);
      } catch {
        // Keep as string if not valid JSON
      }

      return { success: true, data };
    } catch (error) {
      logger.error('❌ GitHub CLI command failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private createRepoInfoTool(): McpTool {
    return {
      name: 'gh_repo_info',
      description: 'Get detailed information about a GitHub repository',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo) or URL. Uses current repo if not specified.',
          },
          json: {
            type: 'boolean',
            description: 'Return data in JSON format',
            default: true,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { repo, json = true } = args;
        const command = ['repo', 'view'];

        if (repo) command.push(repo);
        if (json)
          command.push(
            '--json',
            'name,owner,description,url,sshUrl,pushedAt,createdAt,updatedAt,isPrivate,isFork,stargazerCount,forkCount,languages,topics'
          );

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to get repository information',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'Repository information retrieved successfully',
          data: result.data,
        };
      },
    };
  }

  private createIssueListTool(): McpTool {
    return {
      name: 'gh_issue_list',
      description: 'List GitHub issues with filtering options',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'Filter by issue state',
            default: 'open',
          },
          assignee: {
            type: 'string',
            description: 'Filter by assignee username',
          },
          author: {
            type: 'string',
            description: 'Filter by author username',
          },
          label: {
            type: 'string',
            description: 'Filter by label',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of issues to return',
            default: 30,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const {
          repo,
          state = 'open',
          assignee,
          author,
          label,
          limit = 30,
        } = args;
        const command = ['issue', 'list'];

        if (repo) command.push('--repo', repo);
        command.push('--state', state);
        if (assignee) command.push('--assignee', assignee);
        if (author) command.push('--author', author);
        if (label) command.push('--label', label);
        command.push('--limit', limit.toString());
        command.push(
          '--json',
          'number,title,state,author,assignees,labels,createdAt,updatedAt,url'
        );

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to list issues',
            error: result.error,
          };
        }

        return {
          success: true,
          message: `Found ${Array.isArray(result.data) ? result.data.length : 0} issues`,
          data: result.data,
        };
      },
    };
  }

  private createIssueCreateTool(): McpTool {
    return {
      name: 'gh_issue_create',
      description: 'Create a new GitHub issue',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          title: {
            type: 'string',
            description: 'Issue title',
          },
          body: {
            type: 'string',
            description: 'Issue body/description',
          },
          assignee: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of usernames to assign',
          },
          label: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of labels to add',
          },
          milestone: {
            type: 'string',
            description: 'Milestone to assign',
          },
        },
        required: ['title'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { repo, title, body, assignee, label, milestone } = args;
        const command = ['issue', 'create'];

        if (repo) command.push('--repo', repo);
        command.push('--title', title);
        if (body) command.push('--body', body);
        if (assignee && assignee.length > 0) {
          command.push('--assignee', assignee.join(','));
        }
        if (label && label.length > 0) {
          command.push('--label', label.join(','));
        }
        if (milestone) command.push('--milestone', milestone);

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to create issue',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'Issue created successfully',
          data: { url: result.data },
        };
      },
    };
  }

  private createIssueViewTool(): McpTool {
    return {
      name: 'gh_issue_view',
      description: 'View detailed information about a specific GitHub issue',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          issue: {
            type: 'string',
            description: 'Issue number or URL',
          },
          comments: {
            type: 'boolean',
            description: 'Include comments in the output',
            default: false,
          },
        },
        required: ['issue'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { repo, issue, comments = false } = args;
        const command = ['issue', 'view', issue];

        if (repo) command.push('--repo', repo);
        if (comments) command.push('--comments');
        command.push(
          '--json',
          'number,title,body,state,author,assignees,labels,createdAt,updatedAt,closedAt,url'
        );

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to view issue',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'Issue details retrieved successfully',
          data: result.data,
        };
      },
    };
  }

  private createPullRequestListTool(): McpTool {
    return {
      name: 'gh_pr_list',
      description: 'List GitHub pull requests with filtering options',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'merged', 'all'],
            description: 'Filter by pull request state',
            default: 'open',
          },
          assignee: {
            type: 'string',
            description: 'Filter by assignee username',
          },
          author: {
            type: 'string',
            description: 'Filter by author username',
          },
          base: {
            type: 'string',
            description: 'Filter by base branch',
          },
          head: {
            type: 'string',
            description: 'Filter by head branch',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of PRs to return',
            default: 30,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const {
          repo,
          state = 'open',
          assignee,
          author,
          base,
          head,
          limit = 30,
        } = args;
        const command = ['pr', 'list'];

        if (repo) command.push('--repo', repo);
        command.push('--state', state);
        if (assignee) command.push('--assignee', assignee);
        if (author) command.push('--author', author);
        if (base) command.push('--base', base);
        if (head) command.push('--head', head);
        command.push('--limit', limit.toString());
        command.push(
          '--json',
          'number,title,state,author,assignees,labels,createdAt,updatedAt,mergedAt,headRefName,baseRefName,url'
        );

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to list pull requests',
            error: result.error,
          };
        }

        return {
          success: true,
          message: `Found ${Array.isArray(result.data) ? result.data.length : 0} pull requests`,
          data: result.data,
        };
      },
    };
  }

  private createPullRequestCreateTool(): McpTool {
    return {
      name: 'gh_pr_create',
      description: 'Create a new GitHub pull request',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          title: {
            type: 'string',
            description: 'Pull request title',
          },
          body: {
            type: 'string',
            description: 'Pull request body/description',
          },
          base: {
            type: 'string',
            description: 'Base branch (target branch)',
            default: 'main',
          },
          head: {
            type: 'string',
            description:
              'Head branch (source branch). Uses current branch if not specified.',
          },
          assignee: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of usernames to assign',
          },
          reviewer: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of usernames to request review from',
          },
          label: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of labels to add',
          },
          draft: {
            type: 'boolean',
            description: 'Create as draft pull request',
            default: false,
          },
        },
        required: ['title'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const {
          repo,
          title,
          body,
          base = 'main',
          head,
          assignee,
          reviewer,
          label,
          draft = false,
        } = args;
        const command = ['pr', 'create'];

        if (repo) command.push('--repo', repo);
        command.push('--title', title);
        if (body) command.push('--body', body);
        command.push('--base', base);
        if (head) command.push('--head', head);
        if (assignee && assignee.length > 0) {
          command.push('--assignee', assignee.join(','));
        }
        if (reviewer && reviewer.length > 0) {
          command.push('--reviewer', reviewer.join(','));
        }
        if (label && label.length > 0) {
          command.push('--label', label.join(','));
        }
        if (draft) command.push('--draft');

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to create pull request',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'Pull request created successfully',
          data: { url: result.data },
        };
      },
    };
  }

  private createPullRequestViewTool(): McpTool {
    return {
      name: 'gh_pr_view',
      description:
        'View detailed information about a specific GitHub pull request',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          pr: {
            type: 'string',
            description: 'Pull request number or URL',
          },
          comments: {
            type: 'boolean',
            description: 'Include comments in the output',
            default: false,
          },
        },
        required: ['pr'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { repo, pr, comments = false } = args;
        const command = ['pr', 'view', pr];

        if (repo) command.push('--repo', repo);
        if (comments) command.push('--comments');
        command.push(
          '--json',
          'number,title,body,state,author,assignees,reviewers,labels,createdAt,updatedAt,mergedAt,headRefName,baseRefName,mergeable,url'
        );

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to view pull request',
            error: result.error,
          };
        }

        return {
          success: true,
          message: 'Pull request details retrieved successfully',
          data: result.data,
        };
      },
    };
  }

  private createWorkflowRunTool(): McpTool {
    return {
      name: 'gh_workflow_run',
      description: 'List and view GitHub Actions workflow runs',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          workflow: {
            type: 'string',
            description: 'Workflow name or ID to filter by',
          },
          status: {
            type: 'string',
            enum: ['completed', 'in_progress', 'queued'],
            description: 'Filter by workflow run status',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of workflow runs to return',
            default: 20,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { repo, workflow, status, limit = 20 } = args;
        const command = ['run', 'list'];

        if (repo) command.push('--repo', repo);
        if (workflow) command.push('--workflow', workflow);
        if (status) command.push('--status', status);
        command.push('--limit', limit.toString());
        command.push(
          '--json',
          'databaseId,name,status,conclusion,workflowName,headBranch,event,createdAt,updatedAt,url'
        );

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to list workflow runs',
            error: result.error,
          };
        }

        return {
          success: true,
          message: `Found ${Array.isArray(result.data) ? result.data.length : 0} workflow runs`,
          data: result.data,
        };
      },
    };
  }

  private createReleaseListTool(): McpTool {
    return {
      name: 'gh_release_list',
      description: 'List GitHub releases',
      inputSchema: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description:
              'Repository name (owner/repo). Uses current repo if not specified.',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of releases to return',
            default: 30,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { repo, limit = 30 } = args;
        const command = ['release', 'list'];

        if (repo) command.push('--repo', repo);
        command.push('--limit', limit.toString());
        command.push(
          '--json',
          'tagName,name,body,isDraft,isPrerelease,createdAt,publishedAt,url'
        );

        const result = await this.executeGhCommand(command);

        if (!result.success) {
          return {
            success: false,
            message: 'Failed to list releases',
            error: result.error,
          };
        }

        return {
          success: true,
          message: `Found ${Array.isArray(result.data) ? result.data.length : 0} releases`,
          data: result.data,
        };
      },
    };
  }
}

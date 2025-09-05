import { McpServerContext, GitCommandResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { McpTool } from '../repository/index.js';

export class CommitTools {
  getTools(): McpTool[] {
    return [
      this.createAddTool(),
      this.createCommitTool(),
      this.createPushTool(),
      this.createPullTool(),
      this.createStashTool(),
      this.createFetchTool(),
    ];
  }

  private createAddTool(): McpTool {
    return {
      name: 'git_add',
      description:
        'Stage files for commit with intelligent pattern matching and selective staging',
      inputSchema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Files or patterns to stage (e.g., [".", "*.js", "src/"])',
          },
          all: {
            type: 'boolean',
            description: 'Stage all modified and deleted files (-A)',
            default: false,
          },
          update: {
            type: 'boolean',
            description: 'Stage only modified files, not new files (-u)',
            default: false,
          },
          patch: {
            type: 'boolean',
            description: 'Interactively choose hunks to stage (-p)',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be staged without actually staging',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { files = [], all, update, patch, dryRun } = args;

          logger.info('📥 Staging files for commit', {
            files,
            all,
            update,
            patch,
            dryRun,
          });

          const addArgs: string[] = [];

          if (dryRun) addArgs.push('--dry-run');
          if (all) addArgs.push('-A');
          if (update) addArgs.push('-u');
          if (patch) addArgs.push('-p');

          // Add files/patterns
          if (files.length > 0) {
            addArgs.push(...files);
          } else if (!all && !update) {
            // Default to current directory if no files specified
            addArgs.push('.');
          }

          const result = await context.git.raw(['add', ...addArgs]);

          // Get status after staging to show what was staged
          const status = await context.git.status();

          const stagedFiles = status.staged;
          const message = dryRun
            ? `Would stage ${stagedFiles.length} files`
            : `Staged ${stagedFiles.length} files`;

          logger.success(`✅ ${message}`);

          return {
            success: true,
            message,
            data: {
              staged: stagedFiles,
              command: addArgs,
              dryRun,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to stage files:', error);
          return {
            success: false,
            message: 'Failed to stage files',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createCommitTool(): McpTool {
    return {
      name: 'git_commit',
      description:
        'Create commit with conventional messages, gitmoji support, and smart templates',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Commit message',
          },
          type: {
            type: 'string',
            enum: [
              'feat',
              'fix',
              'docs',
              'style',
              'refactor',
              'test',
              'chore',
              'ci',
              'perf',
            ],
            description: 'Conventional commit type',
          },
          scope: {
            type: 'string',
            description: 'Conventional commit scope (e.g., api, ui, core)',
          },
          description: {
            type: 'string',
            description:
              'Commit description (will be combined with type/scope)',
          },
          body: {
            type: 'string',
            description: 'Extended commit body',
          },
          breaking: {
            type: 'boolean',
            description: 'Mark as breaking change',
            default: false,
          },
          gitmoji: {
            type: 'boolean',
            description: 'Add appropriate gitmoji emoji',
            default: true,
          },
          all: {
            type: 'boolean',
            description: 'Stage all modified files before committing (-a)',
            default: false,
          },
          amend: {
            type: 'boolean',
            description: 'Amend the last commit',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be committed',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const {
            message,
            type,
            scope,
            description,
            body,
            breaking,
            gitmoji,
            all,
            amend,
            dryRun,
          } = args;

          logger.info('💾 Creating commit', {
            type,
            scope,
            message: message || description,
          });

          // Build conventional commit message
          let commitMessage = '';

          if (type && description) {
            // Conventional commit format
            let conventionalMsg = type;
            if (scope) conventionalMsg += `(${scope})`;
            if (breaking) conventionalMsg += '!';
            conventionalMsg += `: ${description}`;

            // Add gitmoji if enabled
            if (gitmoji && context.config.gitmojis) {
              const emoji = this.getGitmojiForType(type);
              conventionalMsg = `${emoji} ${conventionalMsg}`;
            }

            commitMessage = conventionalMsg;

            // Add body if provided
            if (body) {
              commitMessage += `\n\n${body}`;
            }

            // Add breaking change notice
            if (breaking) {
              commitMessage += `\n\nBREAKING CHANGE: ${description}`;
            }
          } else if (message) {
            // Direct message
            commitMessage = message;

            // Add gitmoji if enabled and message doesn't start with emoji
            if (gitmoji && context.config.gitmojis && !this.hasEmoji(message)) {
              const detectedType = this.detectCommitType(message);
              const emoji = this.getGitmojiForType(detectedType);
              commitMessage = `${emoji} ${commitMessage}`;
            }
          } else {
            throw new Error('Either message or type+description is required');
          }

          const commitArgs: string[] = [];

          if (dryRun) commitArgs.push('--dry-run');
          if (all) commitArgs.push('-a');
          if (amend) commitArgs.push('--amend');

          commitArgs.push('-m', commitMessage);

          if (dryRun) {
            // Show what would be committed
            const status = await context.git.status();
            const filesToCommit = all
              ? [...status.staged, ...status.modified]
              : status.staged;

            logger.info(
              `Would commit ${filesToCommit.length} files with message: "${commitMessage}"`
            );

            return {
              success: true,
              message: 'Dry run completed',
              data: {
                message: commitMessage,
                files: filesToCommit,
                dryRun: true,
              },
            };
          }

          const result = await context.git.commit(commitMessage, undefined, {
            '-a': all,
            '--amend': amend,
          });

          logger.success(`✅ Commit created: ${result.commit.substring(0, 8)}`);

          return {
            success: true,
            message: `Commit created: ${result.commit}`,
            data: {
              hash: result.commit,
              message: commitMessage,
              files: result.summary.changes,
              insertions: result.summary.insertions,
              deletions: result.summary.deletions,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to create commit:', error);
          return {
            success: false,
            message: 'Failed to create commit',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createPushTool(): McpTool {
    return {
      name: 'git_push',
      description:
        'Push commits to remote repository with upstream tracking and force options',
      inputSchema: {
        type: 'object',
        properties: {
          remote: {
            type: 'string',
            description: 'Remote repository name',
            default: 'origin',
          },
          branch: {
            type: 'string',
            description: 'Branch to push (defaults to current branch)',
          },
          setUpstream: {
            type: 'boolean',
            description: 'Set upstream tracking (-u)',
            default: false,
          },
          force: {
            type: 'boolean',
            description: 'Force push (use with caution)',
            default: false,
          },
          forceWithLease: {
            type: 'boolean',
            description: 'Force push with lease (safer than force)',
            default: false,
          },
          tags: {
            type: 'boolean',
            description: 'Push tags along with commits',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be pushed',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const {
            remote,
            branch,
            setUpstream,
            force,
            forceWithLease,
            tags,
            dryRun,
          } = args;

          const currentBranch =
            branch || (await context.git.revparse(['--abbrev-ref', 'HEAD']));
          const targetRemote = remote || context.config.defaultRemote;

          logger.info(`🚀 Pushing to ${targetRemote}/${currentBranch.trim()}`, {
            setUpstream,
            force,
            tags,
          });

          const pushArgs: string[] = [];

          if (dryRun) pushArgs.push('--dry-run');
          if (setUpstream) pushArgs.push('-u');
          if (force && !forceWithLease) pushArgs.push('--force');
          if (forceWithLease) pushArgs.push('--force-with-lease');
          if (tags) pushArgs.push('--tags');

          pushArgs.push(targetRemote, currentBranch.trim());

          const result = await context.git.push(pushArgs);

          logger.success(
            `✅ Successfully pushed to ${targetRemote}/${currentBranch.trim()}`
          );

          return {
            success: true,
            message: `Pushed to ${targetRemote}/${currentBranch.trim()}`,
            data: {
              remote: targetRemote,
              branch: currentBranch.trim(),
              setUpstream,
              result,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to push:', error);
          return {
            success: false,
            message: 'Failed to push',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createPullTool(): McpTool {
    return {
      name: 'git_pull',
      description:
        'Pull and merge changes from remote repository with rebase options',
      inputSchema: {
        type: 'object',
        properties: {
          remote: {
            type: 'string',
            description: 'Remote repository name',
            default: 'origin',
          },
          branch: {
            type: 'string',
            description: 'Branch to pull from (defaults to upstream)',
          },
          rebase: {
            type: 'boolean',
            description: 'Use rebase instead of merge',
            default: false,
          },
          ff: {
            type: 'string',
            enum: ['only', 'no', 'default'],
            description: 'Fast-forward strategy',
            default: 'default',
          },
          squash: {
            type: 'boolean',
            description: 'Squash commits from pulled branch',
            default: false,
          },
          tags: {
            type: 'boolean',
            description: 'Fetch tags as well',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { remote, branch, rebase, ff, squash, tags } = args;

          const targetRemote = remote || context.config.defaultRemote;
          const currentBranch = await context.git.revparse([
            '--abbrev-ref',
            'HEAD',
          ]);
          const targetBranch = branch || currentBranch.trim();

          logger.info(`⬇️ Pulling from ${targetRemote}/${targetBranch}`, {
            rebase,
            ff,
            squash,
          });

          const pullOptions: any = {};

          if (rebase) pullOptions['--rebase'] = null;
          if (ff === 'only') pullOptions['--ff-only'] = null;
          if (ff === 'no') pullOptions['--no-ff'] = null;
          if (squash) pullOptions['--squash'] = null;
          if (tags) pullOptions['--tags'] = null;

          const result = await context.git.pull(
            targetRemote,
            targetBranch,
            pullOptions
          );

          logger.success(
            `✅ Successfully pulled from ${targetRemote}/${targetBranch}`
          );

          return {
            success: true,
            message: `Pulled from ${targetRemote}/${targetBranch}`,
            data: {
              remote: targetRemote,
              branch: targetBranch,
              result,
              summary: result.summary,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to pull:', error);
          return {
            success: false,
            message: 'Failed to pull',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createStashTool(): McpTool {
    return {
      name: 'git_stash',
      description: 'Manage Git stash for temporary storage of changes',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['push', 'pop', 'apply', 'list', 'show', 'drop', 'clear'],
            description: 'Stash action to perform',
          },
          message: {
            type: 'string',
            description: 'Stash message (for push action)',
          },
          includeUntracked: {
            type: 'boolean',
            description: 'Include untracked files in stash',
            default: false,
          },
          keepIndex: {
            type: 'boolean',
            description: 'Keep staged changes in index',
            default: false,
          },
          stashIndex: {
            type: 'number',
            description: 'Stash index for pop/apply/show/drop actions',
            default: 0,
          },
        },
        required: ['action'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { action, message, includeUntracked, keepIndex, stashIndex } =
            args;

          logger.info(`📦 Stash ${action}`, {
            message,
            includeUntracked,
            stashIndex,
          });

          let result;

          switch (action) {
            case 'push':
              const stashOptions: string[] = [];
              if (message) stashOptions.push('-m', message);
              if (includeUntracked) stashOptions.push('-u');
              if (keepIndex) stashOptions.push('--keep-index');

              await context.git.stash(['push', ...stashOptions]);
              result = { action: 'pushed', message };
              break;

            case 'pop':
              await context.git.stash(['pop', `stash@{${stashIndex}}`]);
              result = { action: 'popped', index: stashIndex };
              break;

            case 'apply':
              await context.git.stash(['apply', `stash@{${stashIndex}}`]);
              result = { action: 'applied', index: stashIndex };
              break;

            case 'list':
              const stashes = await context.git.stashList();
              result = {
                action: 'listed',
                stashes: stashes.all,
                total: stashes.total,
              };
              break;

            case 'show':
              const show = await context.git.stash([
                'show',
                `stash@{${stashIndex}}`,
              ]);
              result = { action: 'showed', index: stashIndex, content: show };
              break;

            case 'drop':
              await context.git.stash(['drop', `stash@{${stashIndex}}`]);
              result = { action: 'dropped', index: stashIndex };
              break;

            case 'clear':
              await context.git.stash(['clear']);
              result = { action: 'cleared' };
              break;

            default:
              throw new Error(`Unknown stash action: ${action}`);
          }

          logger.success(`✅ Stash ${action} completed successfully`);

          return {
            success: true,
            message: `Stash ${action} completed`,
            data: result,
          };
        } catch (error) {
          logger.error(`❌ Failed to ${args.action} stash:`, error);
          return {
            success: false,
            message: `Failed to ${args.action} stash`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createFetchTool(): McpTool {
    return {
      name: 'git_fetch',
      description: 'Fetch changes from remote repository without merging',
      inputSchema: {
        type: 'object',
        properties: {
          remote: {
            type: 'string',
            description: 'Remote name to fetch from (defaults to origin)',
            default: 'origin',
          },
          branch: {
            type: 'string',
            description: 'Specific branch to fetch (fetches all by default)',
          },
          all: {
            type: 'boolean',
            description: 'Fetch from all remotes',
            default: false,
          },
          tags: {
            type: 'boolean',
            description: 'Fetch tags as well',
            default: true,
          },
          prune: {
            type: 'boolean',
            description: 'Remove remote-tracking branches that no longer exist',
            default: false,
          },
          depth: {
            type: 'number',
            description: 'Limit fetching to specified number of commits',
          },
          force: {
            type: 'boolean',
            description: 'Force fetch (overwrite local refs)',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be fetched without fetching',
            default: false,
          },
          quiet: {
            type: 'boolean',
            description: 'Suppress output except for errors',
            default: false,
          },
          verbose: {
            type: 'boolean',
            description: 'Show detailed fetch information',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { 
            remote = 'origin', 
            branch, 
            all = false, 
            tags = true, 
            prune = false,
            depth,
            force = false,
            dryRun = false,
            quiet = false,
            verbose = false 
          } = args;

          logger.info(`📥 Fetching from ${all ? 'all remotes' : remote}${branch ? ` branch ${branch}` : ''}`, {
            remote,
            branch,
            all,
            tags,
            prune,
            depth,
            force,
            dryRun,
          });

          const fetchArgs: string[] = ['fetch'];

          // Add options
          if (dryRun) fetchArgs.push('--dry-run');
          if (force) fetchArgs.push('--force');
          if (prune) fetchArgs.push('--prune');
          if (tags) fetchArgs.push('--tags');
          if (quiet) fetchArgs.push('--quiet');
          if (verbose) fetchArgs.push('--verbose');
          if (depth) fetchArgs.push('--depth', depth.toString());

          // Add remote and branch
          if (all) {
            fetchArgs.push('--all');
          } else {
            fetchArgs.push(remote);
            if (branch) {
              fetchArgs.push(branch);
            }
          }

          // Get current state before fetch
          const beforeBranches = await context.git.branch(['-r']);

          // Execute fetch
          const fetchResult = await context.git.raw(fetchArgs);

          // Get state after fetch
          const afterBranches = await context.git.branch(['-r']);

          // Analyze what was fetched
          const beforeBranchNames = Object.keys(beforeBranches.branches);
          const afterBranchNames = Object.keys(afterBranches.branches);
          
          const newBranches = afterBranchNames.filter(b => !beforeBranchNames.includes(b));
          const updatedBranches = afterBranchNames.filter(b => {
            if (!beforeBranches.branches[b] || !afterBranches.branches[b]) return false;
            return beforeBranches.branches[b].commit !== afterBranches.branches[b].commit;
          });

          const action = dryRun ? 'would fetch' : 'fetched';
          const summary = {
            newBranches: newBranches.length,
            updatedBranches: updatedBranches.length,
          };

          let message = `Successfully ${action} from ${all ? 'all remotes' : remote}`;
          if (summary.newBranches > 0) message += `, ${summary.newBranches} new branches`;
          if (summary.updatedBranches > 0) message += `, ${summary.updatedBranches} updated branches`;

          logger.success(`✅ ${message}`);

          return {
            success: true,
            message,
            data: {
              remote: all ? 'all' : remote,
              branch: branch || 'all',
              summary,
              newBranches,
              updatedBranches,
              dryRun,
              output: fetchResult.trim(),
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to fetch from ${args.all ? 'all remotes' : args.remote}:`, error);
          return {
            success: false,
            message: `Failed to fetch from ${args.all ? 'all remotes' : args.remote}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  // Helper methods for commit message formatting
  private getGitmojiForType(type: string): string {
    const gitmojiMap: Record<string, string> = {
      feat: '✨',
      fix: '🐛',
      docs: '📚',
      style: '💄',
      refactor: '♻️',
      test: '✅',
      chore: '🔧',
      ci: '👷',
      perf: '⚡',
    };

    return gitmojiMap[type] || '📝';
  }

  private hasEmoji(text: string): boolean {
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(text);
  }

  private detectCommitType(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('fix') || lowerMessage.includes('bug'))
      return 'fix';
    if (lowerMessage.includes('add') || lowerMessage.includes('new'))
      return 'feat';
    if (lowerMessage.includes('doc')) return 'docs';
    if (lowerMessage.includes('style') || lowerMessage.includes('format'))
      return 'style';
    if (
      lowerMessage.includes('refactor') ||
      lowerMessage.includes('restructure')
    )
      return 'refactor';
    if (lowerMessage.includes('test')) return 'test';
    if (lowerMessage.includes('performance') || lowerMessage.includes('perf'))
      return 'perf';
    if (lowerMessage.includes('ci') || lowerMessage.includes('build'))
      return 'ci';

    return 'chore';
  }
}

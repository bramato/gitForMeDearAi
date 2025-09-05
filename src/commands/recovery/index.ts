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

export class RecoveryTools {
  getTools(): McpTool[] {
    return [
      this.createResetTool(),
      this.createRevertTool(),
      this.createReflogTool(),
      this.createCleanTool(),
    ];
  }

  private createResetTool(): McpTool {
    return {
      name: 'git_reset',
      description: 'Reset current HEAD to specified state (soft, mixed, hard)',
      inputSchema: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['soft', 'mixed', 'hard'],
            description: 'Reset mode: soft (keep staged), mixed (unstage), hard (discard all)',
            default: 'mixed',
          },
          target: {
            type: 'string',
            description: 'Target commit hash, branch, or HEAD~n (defaults to HEAD)',
          },
          paths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific paths to reset (for path mode)',
          },
          force: {
            type: 'boolean',
            description: 'Force reset even with uncommitted changes',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be reset without making changes',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { mode = 'mixed', target, paths, force = false, dryRun = false } = args;

          logger.info(`🔄 Git reset ${mode}${target ? ` to ${target}` : ''}`, {
            mode,
            target,
            paths,
            force,
            dryRun,
          });

          // Safety check for hard reset
          if (mode === 'hard' && !force && !dryRun) {
            const status = await context.git.status();
            if (status.files.length > 0) {
              return {
                success: false,
                message: 'Hard reset would lose uncommitted changes. Use force=true to proceed.',
                error: 'Uncommitted changes detected',
                data: {
                  uncommittedFiles: status.files.map((f: any) => ({
                    path: f.path,
                    status: f.working_dir + f.index,
                  })),
                },
              };
            }
          }

          const resetArgs: string[] = ['reset'];

          // Add mode flag
          if (mode !== 'mixed') {
            resetArgs.push(`--${mode}`);
          }

          // Add target if specified
          if (target) {
            resetArgs.push(target);
          }

          // Add paths if specified (path mode)
          if (paths && paths.length > 0) {
            resetArgs.push('--', ...paths);
          }

          // Dry run
          if (dryRun) {
            const currentCommit = await context.git.revparse(['HEAD']);
            const targetCommit = target ? await context.git.revparse([target]) : currentCommit;
            
            return {
              success: true,
              message: `Would reset ${mode} to ${targetCommit.slice(0, 8)}`,
              data: {
                currentCommit: currentCommit.slice(0, 8),
                targetCommit: targetCommit.slice(0, 8),
                mode,
                dryRun: true,
              },
            };
          }

          // Execute reset
          await context.git.raw(resetArgs);

          // Get updated status
          const afterStatus = await context.git.status();
          const currentCommit = await context.git.revparse(['HEAD']);

          logger.success(`✅ Reset ${mode} completed successfully`);

          return {
            success: true,
            message: `Reset ${mode} completed successfully`,
            data: {
              mode,
              target: target || 'HEAD',
              currentCommit: currentCommit.slice(0, 8),
              paths: paths || [],
              filesAfter: afterStatus.files.length,
              status: {
                staged: afterStatus.staged.length,
                modified: afterStatus.modified.length,
                untracked: afterStatus.not_added.length,
              },
            },
          };
        } catch (error) {
          logger.error('❌ Failed to reset:', error);
          return {
            success: false,
            message: 'Failed to reset repository',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createRevertTool(): McpTool {
    return {
      name: 'git_revert',
      description: 'Safely revert commits by creating new commits that undo changes',
      inputSchema: {
        type: 'object',
        properties: {
          commits: {
            type: 'array',
            items: { type: 'string' },
            description: 'Commit hashes to revert (can be multiple)',
          },
          noCommit: {
            type: 'boolean',
            description: 'Stage revert changes without committing',
            default: false,
          },
          mainline: {
            type: 'number',
            description: 'Parent number for merge commits (1 or 2)',
          },
          edit: {
            type: 'boolean',
            description: 'Edit commit message before committing',
            default: false,
          },
          signoff: {
            type: 'boolean',
            description: 'Add Signed-off-by line',
            default: false,
          },
          continue: {
            type: 'boolean',
            description: 'Continue revert after resolving conflicts',
            default: false,
          },
          abort: {
            type: 'boolean',
            description: 'Abort revert operation',
            default: false,
          },
        },
        required: ['commits'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { 
            commits, 
            noCommit = false, 
            mainline, 
            edit = false, 
            signoff = false,
            continue: continueRevert = false,
            abort = false 
          } = args;

          // Handle continue/abort operations
          if (continueRevert) {
            logger.info('🔄 Continuing revert after conflict resolution');
            await context.git.raw(['revert', '--continue']);
            return {
              success: true,
              message: 'Revert continued successfully',
              data: { action: 'continue' },
            };
          }

          if (abort) {
            logger.info('🔄 Aborting revert operation');
            await context.git.raw(['revert', '--abort']);
            return {
              success: true,
              message: 'Revert operation aborted',
              data: { action: 'abort' },
            };
          }

          logger.info(`↩️ Reverting commits: ${commits.join(', ')}`, {
            commits,
            noCommit,
            mainline,
            edit,
          });

          const revertArgs: string[] = ['revert'];

          // Add options
          if (noCommit) revertArgs.push('--no-commit');
          if (edit) revertArgs.push('--edit');
          if (signoff) revertArgs.push('--signoff');
          if (mainline) revertArgs.push('--mainline', mainline.toString());

          // Add commits to revert
          revertArgs.push(...commits);

          // Execute revert
          const result = await context.git.raw(revertArgs);
          
          // Check if there are conflicts
          const status = await context.git.status();
          const hasConflicts = status.conflicted.length > 0;

          if (hasConflicts) {
            logger.warn('⚠️ Revert has conflicts that need resolution');
            return {
              success: false,
              message: 'Revert completed with conflicts - resolve conflicts and continue',
              data: {
                commits: commits,
                conflicts: status.conflicted,
                needsResolution: true,
                nextSteps: [
                  'Resolve conflicts in conflicted files',
                  'Stage resolved files with git_add',
                  'Continue revert with git_revert --continue',
                ],
              },
            };
          }

          const currentCommit = await context.git.revparse(['HEAD']);

          logger.success(`✅ Successfully reverted ${commits.length} commit(s)`);

          return {
            success: true,
            message: `Successfully reverted ${commits.length} commit(s)`,
            data: {
              revertedCommits: commits,
              currentCommit: currentCommit.slice(0, 8),
              noCommit,
              created: noCommit ? 'staged changes' : 'new revert commit',
            },
          };
        } catch (error) {
          logger.error('❌ Failed to revert commits:', error);
          return {
            success: false,
            message: 'Failed to revert commits',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createReflogTool(): McpTool {
    return {
      name: 'git_reflog',
      description: 'Show or manage reflog (reference logs) for commit recovery',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['show', 'expire', 'delete'],
            description: 'Reflog action to perform',
            default: 'show',
          },
          reference: {
            type: 'string',
            description: 'Reference to show reflog for (defaults to HEAD)',
            default: 'HEAD',
          },
          limit: {
            type: 'number',
            description: 'Limit number of entries to show',
            default: 20,
          },
          oneline: {
            type: 'boolean',
            description: 'Show compact one-line format',
            default: false,
          },
          all: {
            type: 'boolean',
            description: 'Show reflog for all references',
            default: false,
          },
          expireTime: {
            type: 'string',
            description: 'Expire entries older than time (e.g., "30.days", "1.week")',
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { 
            action = 'show', 
            reference = 'HEAD', 
            limit = 20, 
            oneline = false, 
            all = false,
            expireTime 
          } = args;

          logger.info(`📜 Git reflog ${action}`, {
            action,
            reference,
            limit,
            oneline,
            all,
          });

          const reflogArgs: string[] = ['reflog', action];

          if (action === 'show') {
            if (all) {
              reflogArgs.push('--all');
            } else {
              reflogArgs.push(reference);
            }

            if (oneline) {
              reflogArgs.push('--oneline');
            }

            reflogArgs.push(`-${limit}`);

            const reflogOutput = await context.git.raw(reflogArgs);
            
            // Parse reflog entries
            const entries = reflogOutput
              .split('\n')
              .filter((line: string) => line.trim())
              .slice(0, limit)
              .map((line: string, index: number) => {
                const match = line.match(/^([a-f0-9]+) ([^@]+@\{(\d+)\}):\s*(.+)$/);
                if (match) {
                  return {
                    index: parseInt(match[3] || '0'),
                    hash: match[1],
                    reference: match[2],
                    message: match[4],
                    selector: `${reference}@{${match[3]}}`,
                  };
                }
                return {
                  index,
                  raw: line,
                };
              });

            return {
              success: true,
              message: `Found ${entries.length} reflog entries for ${all ? 'all references' : reference}`,
              data: {
                reference: all ? 'all' : reference,
                entries,
                total: entries.length,
                recoveryTip: 'Use git_reset to recover to any of these commits',
              },
            };

          } else if (action === 'expire' && expireTime) {
            reflogArgs.push('--expire', expireTime);
            if (all) {
              reflogArgs.push('--all');
            } else {
              reflogArgs.push(reference);
            }

            await context.git.raw(reflogArgs);

            return {
              success: true,
              message: `Expired reflog entries older than ${expireTime}`,
              data: {
                action: 'expire',
                expireTime,
                reference: all ? 'all' : reference,
              },
            };

          } else if (action === 'delete') {
            reflogArgs.push('--delete', reference);
            await context.git.raw(reflogArgs);

            return {
              success: true,
              message: `Deleted reflog for ${reference}`,
              data: {
                action: 'delete',
                reference,
              },
            };
          }

          return {
            success: false,
            message: 'Invalid reflog action or missing parameters',
            error: 'Invalid action parameters',
          };

        } catch (error) {
          logger.error('❌ Failed to access reflog:', error);
          return {
            success: false,
            message: 'Failed to access reflog',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createCleanTool(): McpTool {
    return {
      name: 'git_clean',
      description: 'Remove untracked files and directories from working tree',
      inputSchema: {
        type: 'object',
        properties: {
          dryRun: {
            type: 'boolean',
            description: 'Show what would be removed without actually removing',
            default: true,
          },
          force: {
            type: 'boolean',
            description: 'Force removal of files (required for actual removal)',
            default: false,
          },
          directories: {
            type: 'boolean',
            description: 'Remove untracked directories as well',
            default: false,
          },
          ignored: {
            type: 'boolean',
            description: 'Remove ignored files as well',
            default: false,
          },
          paths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific paths to clean (optional)',
          },
          exclude: {
            type: 'array',
            items: { type: 'string' },
            description: 'Patterns to exclude from cleaning',
          },
          quiet: {
            type: 'boolean',
            description: 'Suppress output of removed files',
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
            dryRun = true, 
            force = false, 
            directories = false, 
            ignored = false,
            paths = [],
            exclude = [],
            quiet = false 
          } = args;

          logger.info(`🧹 Git clean${dryRun ? ' (dry run)' : ''}`, {
            dryRun,
            force,
            directories,
            ignored,
            paths,
          });

          const cleanArgs: string[] = ['clean'];

          // Safety: require force for actual removal
          if (!dryRun && !force) {
            return {
              success: false,
              message: 'Force flag required for actual file removal. Use dryRun=false and force=true.',
              error: 'Safety check: force flag required',
            };
          }

          // Add flags
          if (dryRun) {
            cleanArgs.push('--dry-run');
          } else if (force) {
            cleanArgs.push('--force');
          }

          if (directories) cleanArgs.push('-d');
          if (ignored) cleanArgs.push('-x');
          if (quiet && !dryRun) cleanArgs.push('--quiet');

          // Add exclude patterns
          exclude.forEach((pattern: string) => {
            cleanArgs.push('--exclude', pattern);
          });

          // Add specific paths
          if (paths.length > 0) {
            cleanArgs.push('--', ...paths);
          }

          const result = await context.git.raw(cleanArgs);

          // Parse output to get list of files that would be/were removed
          const files = result
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => {
              // Remove "Would remove " or "Removing " prefix
              return line.replace(/^(Would remove|Removing)\s+/, '');
            })
            .filter((file: string) => file);

          const action = dryRun ? 'would be removed' : 'removed';

          logger.success(`✅ Clean completed: ${files.length} files ${action}`);

          return {
            success: true,
            message: `Clean completed: ${files.length} files ${action}`,
            data: {
              files,
              count: files.length,
              dryRun,
              directories,
              ignored,
              paths: paths.length > 0 ? paths : 'all',
              action: dryRun ? 'dry-run' : 'removed',
            },
          };
        } catch (error) {
          logger.error('❌ Failed to clean repository:', error);
          return {
            success: false,
            message: 'Failed to clean repository',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }
}
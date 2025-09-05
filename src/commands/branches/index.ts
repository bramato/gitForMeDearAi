import { McpServerContext, GitCommandResult, GitBranch } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { McpTool } from '../repository/index.js';

export class BranchTools {
  getTools(): McpTool[] {
    return [
      this.createBranchListTool(),
      this.createBranchCreateTool(),
      this.createBranchSwitchTool(),
      this.createBranchDeleteTool(),
      this.createMergeTool(),
    ];
  }

  private createBranchListTool(): McpTool {
    return {
      name: 'git_branch_list',
      description: 'List Git branches with detailed information including remote tracking',
      inputSchema: {
        type: 'object',
        properties: {
          includeRemote: {
            type: 'boolean',
            description: 'Include remote branches in listing',
            default: false,
          },
          all: {
            type: 'boolean',
            description: 'Show both local and remote branches',
            default: false,
          },
          verbose: {
            type: 'boolean',
            description: 'Show detailed information (commit hash, message)',
            default: false,
          },
          merged: {
            type: 'boolean',
            description: 'Show only branches merged into current branch',
            default: false,
          },
          noMerged: {
            type: 'boolean',
            description: 'Show only branches not merged into current branch',
            default: false,
          },
        },
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { includeRemote, all, verbose, merged, noMerged } = args;
          
          logger.info('🌿 Listing branches', { includeRemote, all, verbose, merged, noMerged });

          const branchArgs: string[] = [];
          
          if (all) branchArgs.push('-a');
          else if (includeRemote) branchArgs.push('-r');
          
          if (verbose) branchArgs.push('-v');
          if (merged) branchArgs.push('--merged');
          if (noMerged) branchArgs.push('--no-merged');

          const branchList = await context.git.branch(branchArgs);
          
          // Parse branches into structured format
          const branches: GitBranch[] = [];
          const currentBranch = branchList.current;
          
          // Process local branches
          Object.keys(branchList.branches).forEach(branchName => {
            const branch = branchList.branches[branchName];
            branches.push({
              name: branchName,
              current: branchName === currentBranch,
              remote: branch.remote || undefined,
              upstream: branch.upstream || undefined,
              ahead: 0, // Will be calculated if needed
              behind: 0, // Will be calculated if needed
            });
          });

          // Get ahead/behind information for current branch
          if (currentBranch) {
            try {
              const upstream = await context.git.raw(['rev-parse', '--abbrev-ref', '@{upstream}']);
              if (upstream.trim()) {
                const aheadBehind = await context.git.raw(['rev-list', '--left-right', '--count', `${upstream.trim()}...HEAD`]);
                const [behind, ahead] = aheadBehind.trim().split('\t').map(Number);
                
                const currentBranchInfo = branches.find(b => b.name === currentBranch);
                if (currentBranchInfo) {
                  currentBranchInfo.ahead = ahead || 0;
                  currentBranchInfo.behind = behind || 0;
                }
              }
            } catch {
              // No upstream or error getting ahead/behind info
            }
          }

          logger.success(`✅ Found ${branches.length} branches`);

          return {
            success: true,
            message: `Found ${branches.length} branches`,
            data: {
              branches,
              current: currentBranch,
              total: branches.length,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to list branches:', error);
          return {
            success: false,
            message: 'Failed to list branches',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createBranchCreateTool(): McpTool {
    return {
      name: 'git_branch_create',
      description: 'Create new Git branch with optional upstream tracking',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the new branch',
          },
          startPoint: {
            type: 'string',
            description: 'Starting point for new branch (commit, branch, or tag)',
          },
          checkout: {
            type: 'boolean',
            description: 'Switch to the new branch after creating',
            default: true,
          },
          track: {
            type: 'boolean',
            description: 'Set up tracking for remote branch',
            default: false,
          },
          force: {
            type: 'boolean',
            description: 'Force creation even if branch exists',
            default: false,
          },
        },
        required: ['name'],
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { name, startPoint, checkout, track, force } = args;
          
          logger.info(`🌱 Creating branch '${name}'`, { startPoint, checkout, track, force });

          const branchArgs: string[] = [];
          
          if (force) branchArgs.push('-f');
          if (track) branchArgs.push('--track');
          
          branchArgs.push(name);
          if (startPoint) branchArgs.push(startPoint);

          // Create branch
          await context.git.raw(['branch', ...branchArgs]);

          // Switch to branch if requested
          if (checkout) {
            await context.git.checkout(name);
            logger.info(`🔄 Switched to branch '${name}'`);
          }

          logger.success(`✅ Branch '${name}' created successfully`);

          return {
            success: true,
            message: `Branch '${name}' created${checkout ? ' and checked out' : ''}`,
            data: {
              name,
              startPoint,
              checkout,
              track,
              force,
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to create branch '${args.name}':`, error);
          return {
            success: false,
            message: `Failed to create branch '${args.name}'`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createBranchSwitchTool(): McpTool {
    return {
      name: 'git_branch_switch',
      description: 'Switch between Git branches with optional creation and stash handling',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Branch name to switch to',
          },
          create: {
            type: 'boolean',
            description: 'Create the branch if it doesn\'t exist (-b)',
            default: false,
          },
          force: {
            type: 'boolean',
            description: 'Force switch, discarding local changes',
            default: false,
          },
          stash: {
            type: 'boolean',
            description: 'Automatically stash changes before switching',
            default: false,
          },
          track: {
            type: 'boolean',
            description: 'Set up tracking for remote branch when creating',
            default: false,
          },
          startPoint: {
            type: 'string',
            description: 'Starting point when creating new branch',
          },
        },
        required: ['name'],
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { name, create, force, stash, track, startPoint } = args;
          
          logger.info(`🔄 Switching to branch '${name}'`, { create, force, stash, track });

          // Handle stashing if requested
          let stashed = false;
          if (stash) {
            const status = await context.git.status();
            if (status.files.length > 0) {
              await context.git.stash(['push', '-m', `Auto-stash before switching to ${name}`]);
              stashed = true;
              logger.info('📦 Changes stashed automatically');
            }
          }

          const checkoutArgs: string[] = [];
          
          if (create) checkoutArgs.push('-b');
          if (force) checkoutArgs.push('-f');
          if (track && create) checkoutArgs.push('--track');
          
          checkoutArgs.push(name);
          if (startPoint && create) checkoutArgs.push(startPoint);

          // Switch/create branch
          await context.git.checkout(checkoutArgs);

          logger.success(`✅ Switched to branch '${name}'${create ? ' (created)' : ''}`);

          return {
            success: true,
            message: `Switched to branch '${name}'${create ? ' (created)' : ''}`,
            data: {
              name,
              created: create,
              stashed,
              track,
              startPoint,
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to switch to branch '${args.name}':`, error);
          return {
            success: false,
            message: `Failed to switch to branch '${args.name}'`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createBranchDeleteTool(): McpTool {
    return {
      name: 'git_branch_delete',
      description: 'Delete Git branches with safety checks and force options',
      inputSchema: {
        type: 'object',
        properties: {
          names: {
            type: 'array',
            items: { type: 'string' },
            description: 'Branch names to delete',
          },
          force: {
            type: 'boolean',
            description: 'Force delete unmerged branches (-D)',
            default: false,
          },
          remote: {
            type: 'boolean',
            description: 'Delete remote-tracking branches',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be deleted',
            default: false,
          },
        },
        required: ['names'],
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { names, force, remote, dryRun } = args;
          
          logger.info(`🗑️ Deleting branches: ${names.join(', ')}`, { force, remote, dryRun });

          const results: Array<{ name: string; success: boolean; error?: string }> = [];

          for (const branchName of names) {
            try {
              if (dryRun) {
                // Check if branch exists and is merged
                const branches = await context.git.branch();
                const branchExists = Object.keys(branches.branches).includes(branchName);
                
                if (!branchExists) {
                  results.push({ name: branchName, success: false, error: 'Branch does not exist' });
                  continue;
                }

                const currentBranch = branches.current;
                if (branchName === currentBranch) {
                  results.push({ name: branchName, success: false, error: 'Cannot delete current branch' });
                  continue;
                }

                results.push({ name: branchName, success: true });
              } else {
                const deleteArgs: string[] = [];
                
                if (remote) deleteArgs.push('-r');
                if (force) deleteArgs.push('-D');
                else deleteArgs.push('-d');
                
                deleteArgs.push(branchName);

                await context.git.raw(['branch', ...deleteArgs]);
                results.push({ name: branchName, success: true });
                
                logger.info(`✅ Deleted branch '${branchName}'`);
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              results.push({ name: branchName, success: false, error: errorMsg });
              logger.warn(`⚠️ Failed to delete branch '${branchName}': ${errorMsg}`);
            }
          }

          const successCount = results.filter(r => r.success).length;
          const message = dryRun 
            ? `Would delete ${successCount}/${names.length} branches`
            : `Deleted ${successCount}/${names.length} branches`;

          logger.success(message);

          return {
            success: successCount > 0,
            message,
            data: {
              results,
              successCount,
              totalCount: names.length,
              dryRun,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to delete branches:', error);
          return {
            success: false,
            message: 'Failed to delete branches',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createMergeTool(): McpTool {
    return {
      name: 'git_merge',
      description: 'Merge branches with various strategies and options',
      inputSchema: {
        type: 'object',
        properties: {
          branch: {
            type: 'string',
            description: 'Branch to merge into current branch',
          },
          strategy: {
            type: 'string',
            enum: ['resolve', 'recursive', 'octopus', 'ours', 'subtree'],
            description: 'Merge strategy to use',
            default: 'recursive',
          },
          ff: {
            type: 'string',
            enum: ['only', 'no', 'default'],
            description: 'Fast-forward option',
            default: 'default',
          },
          squash: {
            type: 'boolean',
            description: 'Squash commits from merged branch',
            default: false,
          },
          noCommit: {
            type: 'boolean',
            description: 'Don\'t create merge commit automatically',
            default: false,
          },
          message: {
            type: 'string',
            description: 'Custom merge commit message',
          },
          abort: {
            type: 'boolean',
            description: 'Abort an in-progress merge',
            default: false,
          },
          continue: {
            type: 'boolean',
            description: 'Continue merge after resolving conflicts',
            default: false,
          },
        },
        required: ['branch'],
      },
      execute: async (context: McpServerContext, args: any): Promise<GitCommandResult> => {
        try {
          const { branch, strategy, ff, squash, noCommit, message, abort, continue: continueFlag } = args;
          
          if (abort) {
            logger.info('🚫 Aborting merge');
            await context.git.merge(['--abort']);
            
            return {
              success: true,
              message: 'Merge aborted',
              data: { action: 'abort' },
            };
          }
          
          if (continueFlag) {
            logger.info('▶️ Continuing merge');
            await context.git.merge(['--continue']);
            
            return {
              success: true,
              message: 'Merge continued',
              data: { action: 'continue' },
            };
          }
          
          logger.info(`🔀 Merging branch '${branch}'`, { strategy, ff, squash, noCommit });

          const mergeArgs: string[] = [];
          
          if (strategy && strategy !== 'recursive') mergeArgs.push('-s', strategy);
          if (ff === 'only') mergeArgs.push('--ff-only');
          if (ff === 'no') mergeArgs.push('--no-ff');
          if (squash) mergeArgs.push('--squash');
          if (noCommit) mergeArgs.push('--no-commit');
          if (message) mergeArgs.push('-m', message);
          
          mergeArgs.push(branch);

          try {
            const result = await context.git.merge(mergeArgs);
            
            logger.success(`✅ Successfully merged '${branch}'`);

            return {
              success: true,
              message: `Successfully merged '${branch}'`,
              data: {
                branch,
                strategy,
                ff,
                squash,
                result,
              },
            };
          } catch (error) {
            // Check if it's a merge conflict
            const status = await context.git.status();
            if (status.conflicted.length > 0) {
              logger.warn(`⚠️ Merge conflicts detected in ${status.conflicted.length} files`);
              
              return {
                success: false,
                message: `Merge conflicts detected in ${status.conflicted.length} files`,
                data: {
                  conflicts: status.conflicted,
                  branch,
                  action: 'resolve_conflicts',
                },
              };
            }
            
            throw error;
          }
        } catch (error) {
          logger.error(`❌ Failed to merge branch '${args.branch}':`, error);
          return {
            success: false,
            message: `Failed to merge branch '${args.branch}'`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }
}
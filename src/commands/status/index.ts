import {
  McpServerContext,
  GitCommandResult,
  GitStatus,
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { McpTool } from '../repository/index.js';

export class StatusTools {
  getTools(): McpTool[] {
    return [
      this.createStatusTool(),
      this.createLogTool(),
      this.createDiffTool(),
      this.createBlameTool(),
      this.createShowTool(),
    ];
  }

  private createStatusTool(): McpTool {
    return {
      name: 'git_status',
      description:
        'Get comprehensive Git repository status with staged, unstaged, and untracked files',
      inputSchema: {
        type: 'object',
        properties: {
          porcelain: {
            type: 'boolean',
            description: 'Return porcelain format for scripting',
            default: false,
          },
          short: {
            type: 'boolean',
            description: 'Return short format status',
            default: false,
          },
          branch: {
            type: 'boolean',
            description: 'Include branch information',
            default: true,
          },
          showStash: {
            type: 'boolean',
            description: 'Include stash count',
            default: true,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { porcelain, short, branch, showStash } = args;

          logger.info('🔍 Getting repository status');

          const status = await context.git.status();
          const currentBranch = await context.git.revparse([
            '--abbrev-ref',
            'HEAD',
          ]);

          // Get ahead/behind info
          let ahead = 0;
          let behind = 0;
          try {
            const upstream = await context.git.raw([
              'rev-parse',
              '--abbrev-ref',
              '@{upstream}',
            ]);
            if (upstream) {
              const aheadBehind = await context.git.raw([
                'rev-list',
                '--left-right',
                '--count',
                `${upstream.trim()}...HEAD`,
              ]);
              const [behindCount, aheadCount] = aheadBehind
                .trim()
                .split('\t')
                .map(Number);
              ahead = aheadCount || 0;
              behind = behindCount || 0;
            }
          } catch {
            // No upstream branch or other error
          }

          // Get stash count if requested
          let stashCount = 0;
          if (showStash) {
            try {
              const stashList = await context.git.stashList();
              stashCount = stashList.total;
            } catch {
              // Stash not available or empty
            }
          }

          const statusData: GitStatus = {
            branch: currentBranch.trim(),
            ahead,
            behind,
            staged: status.staged,
            unstaged: status.modified.concat(status.deleted),
            untracked: status.not_added,
            conflicted: status.conflicted,
          };

          let formattedOutput;
          if (porcelain) {
            // Porcelain format for scripting
            formattedOutput = this.formatPorcelainStatus(statusData);
          } else if (short) {
            // Short format
            formattedOutput = this.formatShortStatus(statusData);
          } else {
            // Human-readable format
            formattedOutput = this.formatHumanStatus(statusData, stashCount);
          }

          logger.success('✅ Repository status retrieved successfully');

          return {
            success: true,
            message: 'Repository status retrieved',
            data: {
              status: statusData,
              formatted: formattedOutput,
              stashCount,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to get repository status:', error);
          return {
            success: false,
            message: 'Failed to get repository status',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createLogTool(): McpTool {
    return {
      name: 'git_log',
      description:
        'Get Git commit history with customizable format and filters',
      inputSchema: {
        type: 'object',
        properties: {
          maxCount: {
            type: 'number',
            description: 'Maximum number of commits to show',
            default: 10,
          },
          oneline: {
            type: 'boolean',
            description: 'Show compact one-line format',
            default: false,
          },
          graph: {
            type: 'boolean',
            description: 'Show ASCII graph of branch/merge history',
            default: false,
          },
          author: {
            type: 'string',
            description: 'Filter commits by author',
          },
          since: {
            type: 'string',
            description:
              'Show commits since date (e.g., "2023-01-01", "1 week ago")',
          },
          until: {
            type: 'string',
            description: 'Show commits until date',
          },
          grep: {
            type: 'string',
            description: 'Filter commits by message pattern',
          },
          path: {
            type: 'string',
            description: 'Show commits affecting specific path',
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { maxCount, oneline, graph, author, since, until, grep, path } =
            args;

          logger.info('📚 Getting commit history', { maxCount, author, since });

          const logOptions: any = {};

          if (maxCount) logOptions.maxCount = maxCount;
          if (author) logOptions.author = author;
          if (since) logOptions.since = since;
          if (until) logOptions.until = until;
          if (grep) logOptions.grep = grep;

          const format = oneline ? 'oneline' : undefined;

          const logArgs: string[] = [];
          if (graph) logArgs.push('--graph');
          if (format) logArgs.push(`--${format}`);
          if (path) logArgs.push('--', path);

          const log = await context.git.log({ ...logOptions, ...logArgs });

          const commits = log.all.map((commit: any) => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author_name,
            email: commit.author_email,
            date: commit.date,
            files: commit.diff?.files || [],
          }));

          logger.success(`✅ Retrieved ${commits.length} commits from history`);

          return {
            success: true,
            message: `Retrieved ${commits.length} commits`,
            data: {
              commits,
              total: log.total,
              latest: log.latest,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to get commit history:', error);
          return {
            success: false,
            message: 'Failed to get commit history',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createDiffTool(): McpTool {
    return {
      name: 'git_diff',
      description:
        'Show differences between commits, branches, working tree, or staging area',
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['working', 'staged', 'commit', 'branch'],
            description: 'What to diff against',
            default: 'working',
          },
          commit1: {
            type: 'string',
            description:
              'First commit/branch for comparison (required for commit/branch target)',
          },
          commit2: {
            type: 'string',
            description: 'Second commit/branch for comparison',
          },
          path: {
            type: 'string',
            description: 'Show diff for specific file or directory path',
          },
          nameOnly: {
            type: 'boolean',
            description: 'Show only file names that changed',
            default: false,
          },
          stat: {
            type: 'boolean',
            description: 'Show diffstat (summary of changes)',
            default: false,
          },
          contextLines: {
            type: 'number',
            description: 'Number of context lines around changes',
            default: 3,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const {
            target,
            commit1,
            commit2,
            path,
            nameOnly,
            stat,
            contextLines,
          } = args;

          logger.info('📊 Getting diff', { target, commit1, commit2, path });

          const diffArgs: string[] = [];

          // Set context lines
          if (contextLines !== 3) {
            diffArgs.push(`-U${contextLines}`);
          }

          // Format options
          if (nameOnly) diffArgs.push('--name-only');
          if (stat) diffArgs.push('--stat');

          // Target-specific logic
          switch (target) {
            case 'working':
              // Diff working tree vs staging area (default)
              break;

            case 'staged':
              diffArgs.push('--cached');
              break;

            case 'commit':
              if (!commit1) {
                throw new Error('commit1 is required for commit target');
              }
              if (commit2) {
                diffArgs.push(commit1, commit2);
              } else {
                diffArgs.push(`${commit1}^`, commit1);
              }
              break;

            case 'branch':
              if (!commit1) {
                throw new Error('commit1 is required for branch target');
              }
              if (commit2) {
                diffArgs.push(commit1, commit2);
              } else {
                diffArgs.push(commit1);
              }
              break;
          }

          // Add path filter if specified
          if (path) {
            diffArgs.push('--', path);
          }

          const diff = await context.git.diff(diffArgs);

          logger.success('✅ Diff retrieved successfully');

          return {
            success: true,
            message: 'Diff retrieved successfully',
            data: {
              diff,
              target,
              commit1,
              commit2,
              path,
              options: { nameOnly, stat, contextLines },
            },
          };
        } catch (error) {
          logger.error('❌ Failed to get diff:', error);
          return {
            success: false,
            message: 'Failed to get diff',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createBlameTool(): McpTool {
    return {
      name: 'git_blame',
      description:
        'Show line-by-line authorship and commit information for a file',
      inputSchema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            description: 'File path to blame',
          },
          lineStart: {
            type: 'number',
            description: 'Start line number (1-based)',
          },
          lineEnd: {
            type: 'number',
            description: 'End line number (1-based)',
          },
          showEmail: {
            type: 'boolean',
            description: 'Show email addresses instead of names',
            default: false,
          },
          showLineNumbers: {
            type: 'boolean',
            description: 'Show original line numbers',
            default: true,
          },
        },
        required: ['file'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { file, lineStart, lineEnd, showEmail, showLineNumbers } = args;

          logger.info(`🔍 Getting blame for ${file}`, { lineStart, lineEnd });

          const blameArgs: string[] = [];

          if (showEmail) blameArgs.push('-e');
          if (showLineNumbers) blameArgs.push('-n');

          if (lineStart && lineEnd) {
            blameArgs.push('-L', `${lineStart},${lineEnd}`);
          } else if (lineStart) {
            blameArgs.push('-L', `${lineStart},+1`);
          }

          blameArgs.push(file);

          const blame = await context.git.raw(['blame', ...blameArgs]);

          // Parse blame output into structured format
          const lines = blame.split('\n').filter((line: string) => line.trim());
          const blameData = lines.map((line: string) => {
            const match = line.match(/^(\w+)\s+\(([^)]+)\)\s+(.*)$/);
            if (match) {
              const [, hash, authorInfo, content] = match;
              const [author, ...dateParts] = (authorInfo || '').split(
                /\s+\d{4}-\d{2}-\d{2}/
              );
              return {
                hash: (hash || '').substring(0, 8),
                author: (author || '').trim(),
                date: dateParts.join('').trim(),
                content: content || '',
              };
            }
            return { hash: '', author: '', date: '', content: line };
          });

          logger.success(
            `✅ Blame retrieved for ${file} (${blameData.length} lines)`
          );

          return {
            success: true,
            message: `Blame retrieved for ${file}`,
            data: {
              file,
              lines: blameData,
              lineRange:
                lineStart && lineEnd
                  ? { start: lineStart, end: lineEnd }
                  : null,
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to get blame for ${args.file}:`, error);
          return {
            success: false,
            message: `Failed to get blame for ${args.file}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createShowTool(): McpTool {
    return {
      name: 'git_show',
      description: 'Show commit details including changes, metadata, and files',
      inputSchema: {
        type: 'object',
        properties: {
          commit: {
            type: 'string',
            description:
              'Commit hash, branch, or tag to show (defaults to HEAD)',
            default: 'HEAD',
          },
          showDiff: {
            type: 'boolean',
            description: 'Include diff in output',
            default: true,
          },
          nameOnly: {
            type: 'boolean',
            description: 'Show only file names that changed',
            default: false,
          },
          stat: {
            type: 'boolean',
            description: 'Show diffstat summary',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { commit, showDiff, nameOnly, stat } = args;

          logger.info(`🔍 Showing commit details for ${commit}`);

          const showArgs: string[] = [commit || 'HEAD'];

          if (!showDiff) showArgs.push('--no-patch');
          if (nameOnly) showArgs.push('--name-only');
          if (stat) showArgs.push('--stat');

          const show = await context.git.show(showArgs);

          // Also get structured commit info
          const log = await context.git.log(['-1', commit || 'HEAD']);
          const commitInfo = log.latest;

          logger.success(`✅ Commit details retrieved for ${commit}`);

          return {
            success: true,
            message: `Commit details retrieved for ${commit}`,
            data: {
              raw: show,
              commit: {
                hash: commitInfo?.hash,
                message: commitInfo?.message,
                author: commitInfo?.author_name,
                email: commitInfo?.author_email,
                date: commitInfo?.date,
                files: commitInfo?.diff?.files || [],
              },
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to show commit ${args.commit}:`, error);
          return {
            success: false,
            message: `Failed to show commit ${args.commit}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  // Helper methods for formatting status output
  private formatPorcelainStatus(status: GitStatus): string {
    let output = '';

    // Branch info
    output += `## ${status.branch}`;
    if (status.ahead > 0) output += `...ahead ${status.ahead}`;
    if (status.behind > 0) output += `...behind ${status.behind}`;
    output += '\n';

    // File statuses
    status.staged.forEach((file) => (output += `A  ${file}\n`));
    status.unstaged.forEach((file) => (output += ` M ${file}\n`));
    status.untracked.forEach((file) => (output += `?? ${file}\n`));
    status.conflicted.forEach((file) => (output += `UU ${file}\n`));

    return output;
  }

  private formatShortStatus(status: GitStatus): string {
    const total =
      status.staged.length + status.unstaged.length + status.untracked.length;
    return `On branch ${status.branch} | ${total} changes | ${status.ahead}↑ ${status.behind}↓`;
  }

  private formatHumanStatus(status: GitStatus, stashCount: number): string {
    let output = `On branch ${status.branch}\n`;

    if (status.ahead > 0 || status.behind > 0) {
      output += `Your branch is `;
      if (status.ahead > 0)
        output += `ahead of origin by ${status.ahead} commit${status.ahead > 1 ? 's' : ''}`;
      if (status.ahead > 0 && status.behind > 0) output += ' and ';
      if (status.behind > 0)
        output += `behind by ${status.behind} commit${status.behind > 1 ? 's' : ''}`;
      output += '\n';
    }

    if (status.staged.length > 0) {
      output += '\nChanges to be committed:\n';
      status.staged.forEach((file) => (output += `  modified: ${file}\n`));
    }

    if (status.unstaged.length > 0) {
      output += '\nChanges not staged for commit:\n';
      status.unstaged.forEach((file) => (output += `  modified: ${file}\n`));
    }

    if (status.untracked.length > 0) {
      output += '\nUntracked files:\n';
      status.untracked.forEach((file) => (output += `  ${file}\n`));
    }

    if (status.conflicted.length > 0) {
      output += '\nUnmerged paths:\n';
      status.conflicted.forEach(
        (file) => (output += `  both modified: ${file}\n`)
      );
    }

    if (stashCount > 0) {
      output += `\nYou have ${stashCount} stash${stashCount > 1 ? 'es' : ''}\n`;
    }

    return output;
  }
}

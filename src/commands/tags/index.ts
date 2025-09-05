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

export class TagTools {
  getTools(): McpTool[] {
    return [
      this.createTagTool(),
      this.createTagListTool(),
      this.createTagDeleteTool(),
      this.createTagPushTool(),
    ];
  }

  private createTagTool(): McpTool {
    return {
      name: 'git_tag',
      description: 'Create annotated or lightweight Git tags',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Tag name (e.g., v1.0.0, release-2024)',
          },
          message: {
            type: 'string',
            description: 'Tag message (creates annotated tag)',
          },
          commit: {
            type: 'string',
            description: 'Commit to tag (defaults to HEAD)',
          },
          force: {
            type: 'boolean',
            description: 'Replace existing tag',
            default: false,
          },
          sign: {
            type: 'boolean',
            description: 'Create GPG-signed tag',
            default: false,
          },
          annotated: {
            type: 'boolean',
            description: 'Force creation of annotated tag (even without message)',
            default: false,
          },
          file: {
            type: 'string',
            description: 'Read tag message from file',
          },
        },
        required: ['name'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { 
            name, 
            message, 
            commit, 
            force = false, 
            sign = false, 
            annotated = false,
            file 
          } = args;

          logger.info(`🏷️ Creating tag: ${name}`, {
            name,
            message,
            commit,
            force,
            sign,
            annotated,
          });

          // Validate tag name
          if (!/^[a-zA-Z0-9._/-]+$/.test(name)) {
            return {
              success: false,
              message: 'Invalid tag name. Use only letters, numbers, dots, hyphens, underscores, and slashes.',
              error: 'Invalid tag name format',
            };
          }

          // Check if tag already exists
          try {
            await context.git.raw(['rev-parse', `refs/tags/${name}`]);
            if (!force) {
              return {
                success: false,
                message: `Tag '${name}' already exists. Use force=true to replace it.`,
                error: 'Tag already exists',
              };
            }
          } catch {
            // Tag doesn't exist, which is fine
          }

          const tagArgs: string[] = ['tag'];

          // Add options
          if (force) tagArgs.push('--force');
          if (sign) tagArgs.push('--sign');
          if (annotated && !message && !file) tagArgs.push('--annotate');

          // Add message options
          if (message) {
            tagArgs.push('--message', message);
          } else if (file) {
            tagArgs.push('--file', file);
          }

          // Add tag name
          tagArgs.push(name);

          // Add commit if specified
          if (commit) {
            tagArgs.push(commit);
          }

          // Create the tag
          await context.git.raw(tagArgs);

          // Get tag information
          const tagInfo = await this.getTagInfo(context, name);

          logger.success(`✅ Tag '${name}' created successfully`);

          return {
            success: true,
            message: `Tag '${name}' created successfully`,
            data: {
              name,
              type: message || file || annotated ? 'annotated' : 'lightweight',
              commit: tagInfo.commit,
              message: tagInfo.message,
              tagger: tagInfo.tagger,
              date: tagInfo.date,
              signed: sign,
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to create tag '${args.name}':`, error);
          return {
            success: false,
            message: `Failed to create tag '${args.name}'`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createTagListTool(): McpTool {
    return {
      name: 'git_tag_list',
      description: 'List Git tags with optional filtering and sorting',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Pattern to filter tags (shell wildcard)',
          },
          sort: {
            type: 'string',
            enum: ['name', 'version', 'creatordate', 'committerdate'],
            description: 'Sort order for tags',
            default: 'name',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of tags to return',
            default: 50,
          },
          detailed: {
            type: 'boolean',
            description: 'Include detailed information for each tag',
            default: false,
          },
          merged: {
            type: 'string',
            description: 'Only show tags reachable from specified commit/branch',
          },
          contains: {
            type: 'string',
            description: 'Only show tags that contain the specified commit',
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { 
            pattern, 
            sort = 'name', 
            limit = 50, 
            detailed = false,
            merged,
            contains 
          } = args;

          logger.info(`📋 Listing tags`, {
            pattern,
            sort,
            limit,
            detailed,
            merged,
            contains,
          });

          const tagArgs: string[] = ['tag', '--list'];

          // Add sorting
          tagArgs.push(`--sort=${sort === 'name' ? 'refname' : sort}`);

          // Add filters
          if (merged) tagArgs.push('--merged', merged);
          if (contains) tagArgs.push('--contains', contains);

          // Add pattern if specified
          if (pattern) {
            tagArgs.push(pattern);
          }

          const tagList = await context.git.raw(tagArgs);
          const tagNames = tagList
            .split('\n')
            .filter((tag: string) => tag.trim())
            .slice(0, limit);

          if (tagNames.length === 0) {
            return {
              success: true,
              message: 'No tags found matching criteria',
              data: {
                tags: [],
                count: 0,
                pattern,
                sort,
              },
            };
          }

          let tags;

          if (detailed) {
            // Get detailed information for each tag
            tags = await Promise.all(
              tagNames.map(async (name: string) => {
                try {
                  return await this.getTagInfo(context, name);
                } catch (error) {
                  return {
                    name,
                    error: 'Failed to get tag info',
                  };
                }
              })
            );
          } else {
            // Simple list
            tags = tagNames.map((name: string) => ({ name }));
          }

          logger.success(`✅ Found ${tags.length} tags`);

          return {
            success: true,
            message: `Found ${tags.length} tags`,
            data: {
              tags,
              count: tags.length,
              pattern,
              sort,
              detailed,
              hasMore: tagNames.length >= limit,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to list tags:', error);
          return {
            success: false,
            message: 'Failed to list tags',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createTagDeleteTool(): McpTool {
    return {
      name: 'git_tag_delete',
      description: 'Delete local Git tags',
      inputSchema: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tag names to delete',
          },
          force: {
            type: 'boolean',
            description: 'Force deletion without confirmation',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be deleted without actually deleting',
            default: false,
          },
        },
        required: ['tags'],
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const { tags, force = false, dryRun = false } = args;

          logger.info(`🗑️ Deleting tags: ${tags.join(', ')}`, {
            tags,
            force,
            dryRun,
          });

          if (!Array.isArray(tags) || tags.length === 0) {
            return {
              success: false,
              message: 'No tags specified for deletion',
              error: 'No tags provided',
            };
          }

          // Validate tags exist
          const existingTags: string[] = [];
          const nonExistentTags: string[] = [];

          for (const tag of tags as string[]) {
            try {
              await context.git.raw(['rev-parse', `refs/tags/${tag}`]);
              existingTags.push(tag);
            } catch {
              nonExistentTags.push(tag);
            }
          }

          if (existingTags.length === 0) {
            return {
              success: false,
              message: 'None of the specified tags exist',
              error: 'No valid tags found',
              data: { nonExistentTags },
            };
          }

          if (dryRun) {
            return {
              success: true,
              message: `Would delete ${existingTags.length} tags`,
              data: {
                wouldDelete: existingTags,
                nonExistent: nonExistentTags,
                dryRun: true,
              },
            };
          }

          // Delete tags
          const results: Array<{ tag: string; success: boolean; error?: string }> = [];

          for (const tag of existingTags as string[]) {
            try {
              await context.git.raw(['tag', '--delete', tag]);
              results.push({ tag, success: true });
              logger.info(`✅ Deleted tag: ${tag}`);
            } catch (error) {
              results.push({
                tag,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              logger.error(`❌ Failed to delete tag: ${tag}`, error);
            }
          }

          const deletedCount = results.filter(r => r.success).length;
          const failedResults = results.filter(r => !r.success);

          logger.success(`✅ Deleted ${deletedCount} of ${existingTags.length} tags`);

          return {
            success: failedResults.length === 0,
            message: `Deleted ${deletedCount} of ${existingTags.length} tags`,
            data: {
              deleted: results.filter(r => r.success).map(r => r.tag),
              failed: failedResults,
              nonExistent: nonExistentTags,
              total: tags.length,
              successful: deletedCount,
            },
          };
        } catch (error) {
          logger.error('❌ Failed to delete tags:', error);
          return {
            success: false,
            message: 'Failed to delete tags',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createTagPushTool(): McpTool {
    return {
      name: 'git_tag_push',
      description: 'Push tags to remote repository',
      inputSchema: {
        type: 'object',
        properties: {
          remote: {
            type: 'string',
            description: 'Remote name to push to',
            default: 'origin',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific tags to push (empty = push all tags)',
          },
          all: {
            type: 'boolean',
            description: 'Push all tags',
            default: false,
          },
          force: {
            type: 'boolean',
            description: 'Force push tags (overwrite remote tags)',
            default: false,
          },
          delete: {
            type: 'boolean',
            description: 'Delete tags from remote',
            default: false,
          },
          dryRun: {
            type: 'boolean',
            description: 'Show what would be pushed without pushing',
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
            tags = [], 
            all = false, 
            force = false, 
            delete: deleteRemote = false,
            dryRun = false 
          } = args;

          logger.info(`🚀 Pushing tags to ${remote}`, {
            remote,
            tags,
            all,
            force,
            delete: deleteRemote,
            dryRun,
          });

          // Validate remote exists
          try {
            await context.git.getRemotes();
          } catch (error) {
            return {
              success: false,
              message: `Remote '${remote}' not found`,
              error: 'Remote not found',
            };
          }

          const pushArgs: string[] = ['push'];

          if (dryRun) pushArgs.push('--dry-run');
          if (force) pushArgs.push('--force');

          pushArgs.push(remote);

          if (deleteRemote) {
            if (tags.length === 0) {
              return {
                success: false,
                message: 'Must specify tags to delete from remote',
                error: 'No tags specified for deletion',
              };
            }
            
            // Delete specific tags from remote
            for (const tag of tags as string[]) {
              pushArgs.push(`:refs/tags/${tag}`);
            }
          } else if (all) {
            // Push all tags
            pushArgs.push('--tags');
          } else if (tags.length > 0) {
            // Push specific tags
            for (const tag of tags as string[]) {
              pushArgs.push(`refs/tags/${tag}:refs/tags/${tag}`);
            }
          } else {
            // Push all tags by default
            pushArgs.push('--tags');
          }

          const result = await context.git.raw(pushArgs);

          const action = deleteRemote ? 'deleted from' : 'pushed to';
          const targetTags = tags.length > 0 ? tags.join(', ') : 'all tags';

          logger.success(`✅ Tags ${action} ${remote} successfully`);

          return {
            success: true,
            message: `Tags ${action} ${remote} successfully`,
            data: {
              remote,
              tags: tags.length > 0 ? tags : 'all',
              action: deleteRemote ? 'delete' : 'push',
              all,
              force,
              dryRun,
              output: result.trim(),
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to push tags to ${args.remote}:`, error);
          return {
            success: false,
            message: `Failed to push tags to ${args.remote}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private async getTagInfo(context: McpServerContext, tagName: string) {
    try {
      // Get tag object info
      const tagInfo = await context.git.raw(['show', '--format=%H%n%s%n%an%n%ad', '--no-patch', tagName]);
      const lines = tagInfo.split('\n').filter((line: string) => line.trim());

      // Check if it's an annotated tag
      const objectType = await context.git.raw(['cat-file', '-t', tagName]);
      const isAnnotated = objectType.trim() === 'tag';

      let commit, message, tagger, date;

      if (isAnnotated) {
        // For annotated tags, get tag message and tagger info
        const annotatedInfo = await context.git.raw(['show', '--format=%H%n%B%n%an%n%ad', '--no-patch', tagName]);
        const annotatedLines = annotatedInfo.split('\n');
        
        commit = annotatedLines[0];
        message = annotatedLines.slice(1, -2).join('\n').trim();
        tagger = annotatedLines[annotatedLines.length - 2];
        date = annotatedLines[annotatedLines.length - 1];
      } else {
        // For lightweight tags, get commit info
        commit = lines[0];
        message = lines[1];
        tagger = lines[2];
        date = lines[3];
      }

      return {
        name: tagName,
        commit: commit?.slice(0, 8) || 'unknown',
        message: message || '',
        tagger: tagger || 'unknown',
        date: date || 'unknown',
        type: isAnnotated ? 'annotated' : 'lightweight',
      };
    } catch (error) {
      return {
        name: tagName,
        error: 'Failed to get tag information',
      };
    }
  }
}
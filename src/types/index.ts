import { z } from 'zod';

// Git Repository Types
export const GitConfigSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  defaultBranch: z.string().default('main'),
  remote: z.string().url().optional(),
});

export const GitStatusSchema = z.object({
  branch: z.string(),
  ahead: z.number(),
  behind: z.number(),
  staged: z.array(z.string()),
  unstaged: z.array(z.string()),
  untracked: z.array(z.string()),
  conflicted: z.array(z.string()),
});

export const GitCommitSchema = z.object({
  hash: z.string(),
  message: z.string(),
  author: z.string(),
  email: z.string(),
  date: z.string(),
  files: z.array(z.string()),
});

export const GitBranchSchema = z.object({
  name: z.string(),
  current: z.boolean(),
  remote: z.string().optional(),
  upstream: z.string().optional(),
  ahead: z.number().default(0),
  behind: z.number().default(0),
});

// GitHub Types
export const GitHubIssueSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']),
  labels: z.array(z.string()),
  assignees: z.array(z.string()),
  milestone: z.string().optional(),
});

export const GitHubPullRequestSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().optional(),
  head: z.string(),
  base: z.string(),
  state: z.enum(['open', 'closed', 'merged']),
  draft: z.boolean(),
  mergeable: z.boolean().optional(),
});

// MCP Tool Types
export const McpToolInputSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.any()),
  required: z.array(z.string()).optional(),
});

export const McpToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: McpToolInputSchema,
});

// Response Types
export const GitCommandResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
});

// Exported Types
export type GitConfig = z.infer<typeof GitConfigSchema>;
export type GitStatus = z.infer<typeof GitStatusSchema>;
export type GitCommit = z.infer<typeof GitCommitSchema>;
export type GitBranch = z.infer<typeof GitBranchSchema>;
export type GitHubIssue = z.infer<typeof GitHubIssueSchema>;
export type GitHubPullRequest = z.infer<typeof GitHubPullRequestSchema>;
export type McpTool = z.infer<typeof McpToolSchema>;
export type GitCommandResult = z.infer<typeof GitCommandResultSchema>;

// Utility Types
export interface GitForMeDearAiConfig {
  githubToken?: string;
  defaultRemote: string;
  autoCommitConventions: boolean;
  gitmojis: boolean;
}

export interface McpServerContext {
  workingDirectory: string;
  config: GitForMeDearAiConfig;
  git: any; // simple-git instance
  github?: any; // octokit instance
}

# GitForMeDearAi MCP Server - Complete Commands Reference

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference Table](#quick-reference-table)
3. [Repository Management](#repository-management)
4. [Status & Inspection](#status--inspection)
5. [Commit & Push Operations](#commit--push-operations)
6. [Branch Operations](#branch-operations)
7. [GitHub Integration](#github-integration)
8. [GitKraken Premium Features](#gitkraken-premium-features)
9. [Installation & System](#installation--system)
10. [Recovery & History](#recovery--history)
11. [Tag Management](#tag-management)
12. [Common Workflows](#common-workflows)
13. [Dependencies & Compatibility](#dependencies--compatibility)

## Overview

GitForMeDearAi is an enterprise-grade MCP (Model Context Protocol) server that provides comprehensive Git, GitHub, and GitKraken CLI automation capabilities. The platform offers 40+ specialized commands organized into functional categories, supporting both standard Git workflows and advanced premium GitKraken features.

### Key Features
- **Standard Git Operations**: Complete Git command coverage with enhanced parameters
- **GitHub CLI Integration**: Native GitHub issue, PR, and release management
- **GitKraken Premium**: AI-powered commits and visual workflows (requires GitKraken CLI)
- **Smart Installation**: Automatic Git and GitKraken CLI installation across platforms
- **Enterprise Security**: Safe operations with comprehensive validation and dry-run modes
- **Advanced Recovery**: Sophisticated git history recovery and cleanup tools

## Quick Reference Table

| Category | Commands Count | Key Commands |
|----------|----------------|--------------|
| Repository Management | 4 | `git_init`, `git_clone`, `git_remote`, `git_config` |
| Status & Inspection | 5 | `git_status`, `git_log`, `git_diff`, `git_blame`, `git_show` |
| Commit & Push | 6 | `git_add`, `git_commit`, `git_push`, `git_pull`, `git_stash`, `git_fetch` |
| Branch Operations | 5 | `git_branch_list`, `git_branch_create`, `git_branch_switch`, `git_branch_delete`, `git_merge` |
| GitHub Integration | 9 | `gh_repo_info`, `gh_issue_list`, `gh_pr_create`, `gh_workflow_run` |
| GitKraken Premium | 6 | `gk_graph`, `gk_work_commit_ai`, `gk_work_pr_create_ai`, `gk_workspace_create` |
| Installation | 4 | `install_git`, `install_gitkraken_cli`, `system_info`, `verify_installations` |
| Recovery & History | 4 | `git_reset`, `git_revert`, `git_reflog`, `git_clean` |
| Tag Management | 4 | `git_tag`, `git_tag_list`, `git_tag_delete`, `git_tag_push` |

**Total Commands: 47**

---

## Repository Management

### git_init
**Description**: Initialize a new Git repository with optional configuration  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "path": "string (optional) - Directory path to initialize",
  "bare": "boolean - Create a bare repository (default: false)",
  "defaultBranch": "string - Set default branch name (default: 'main')",
  "template": "string (optional) - Template directory to use"
}
```

#### Example Usage
```javascript
// Basic repository initialization
{
  "defaultBranch": "main"
}

// Initialize in specific directory with template
{
  "path": "/path/to/project",
  "defaultBranch": "main",
  "template": "/path/to/template"
}
```

### git_clone
**Description**: Clone a Git repository from remote URL  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "url": "string (required) - Repository URL to clone",
  "directory": "string (optional) - Target directory name",
  "branch": "string (optional) - Specific branch to clone",
  "depth": "number (optional) - Shallow clone depth",
  "recursive": "boolean - Clone submodules recursively (default: false)"
}
```

#### Example Usage
```javascript
// Basic clone
{
  "url": "https://github.com/user/repository.git"
}

// Shallow clone with specific branch
{
  "url": "https://github.com/user/repository.git",
  "branch": "develop",
  "depth": 1,
  "directory": "my-project"
}
```

### git_remote
**Description**: Manage Git remote repositories (add, remove, set-url, list)  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "action": "string (required) - Remote action: ['add', 'remove', 'set-url', 'list', 'show']",
  "name": "string (optional) - Remote name (e.g., origin, upstream)",
  "url": "string (optional) - Remote URL",
  "verbose": "boolean - Show detailed information (default: false)"
}
```

#### Example Usage
```javascript
// List all remotes
{
  "action": "list",
  "verbose": true
}

// Add new remote
{
  "action": "add",
  "name": "upstream",
  "url": "https://github.com/original/repository.git"
}
```

### git_config
**Description**: Get or set Git configuration values  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "action": "string (required) - Configuration action: ['get', 'set', 'unset', 'list']",
  "key": "string (optional) - Configuration key (e.g., user.name, user.email)",
  "value": "string (optional) - Configuration value (required for set action)",
  "global": "boolean - Apply to global Git configuration (default: false)",
  "system": "boolean - Apply to system Git configuration (default: false)"
}
```

#### Example Usage
```javascript
// Set global user configuration
{
  "action": "set",
  "key": "user.name",
  "value": "John Doe",
  "global": true
}

// List all configurations
{
  "action": "list"
}
```

---

## Status & Inspection

### git_status
**Description**: Get comprehensive Git repository status with staged, unstaged, and untracked files  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "porcelain": "boolean - Return porcelain format for scripting (default: false)",
  "short": "boolean - Return short format status (default: false)",
  "branch": "boolean - Include branch information (default: true)",
  "showStash": "boolean - Include stash count (default: true)"
}
```

#### Example Usage
```javascript
// Standard human-readable status
{
  "branch": true,
  "showStash": true
}

// Machine-readable porcelain format
{
  "porcelain": true
}
```

### git_log
**Description**: Get Git commit history with customizable format and filters  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "maxCount": "number - Maximum commits to show (default: 10)",
  "oneline": "boolean - Show compact one-line format (default: false)",
  "graph": "boolean - Show ASCII graph of branch/merge history (default: false)",
  "author": "string (optional) - Filter commits by author",
  "since": "string (optional) - Show commits since date (e.g., '2023-01-01', '1 week ago')",
  "until": "string (optional) - Show commits until date",
  "grep": "string (optional) - Filter commits by message pattern",
  "path": "string (optional) - Show commits affecting specific path"
}
```

#### Example Usage
```javascript
// Recent commits with graph
{
  "maxCount": 20,
  "graph": true,
  "oneline": true
}

// Commits by specific author in last month
{
  "author": "john.doe",
  "since": "1 month ago",
  "maxCount": 50
}
```

### git_diff
**Description**: Show differences between commits, branches, working tree, or staging area  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "target": "string - What to diff: ['working', 'staged', 'commit', 'branch'] (default: 'working')",
  "commit1": "string (optional) - First commit/branch for comparison",
  "commit2": "string (optional) - Second commit/branch for comparison",
  "path": "string (optional) - Show diff for specific file or directory",
  "nameOnly": "boolean - Show only file names that changed (default: false)",
  "stat": "boolean - Show diffstat summary (default: false)",
  "contextLines": "number - Number of context lines (default: 3)"
}
```

#### Example Usage
```javascript
// Working directory changes
{
  "target": "working"
}

// Compare two branches
{
  "target": "branch",
  "commit1": "main",
  "commit2": "feature-branch"
}
```

### git_blame
**Description**: Show line-by-line authorship and commit information for a file  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "file": "string (required) - File path to blame",
  "lineStart": "number (optional) - Start line number (1-based)",
  "lineEnd": "number (optional) - End line number (1-based)",
  "showEmail": "boolean - Show email addresses instead of names (default: false)",
  "showLineNumbers": "boolean - Show original line numbers (default: true)"
}
```

#### Example Usage
```javascript
// Blame entire file
{
  "file": "src/index.ts",
  "showEmail": true
}

// Blame specific lines
{
  "file": "README.md",
  "lineStart": 1,
  "lineEnd": 50
}
```

### git_show
**Description**: Show commit details including changes, metadata, and files  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "commit": "string - Commit hash, branch, or tag (default: 'HEAD')",
  "showDiff": "boolean - Include diff in output (default: true)",
  "nameOnly": "boolean - Show only file names that changed (default: false)",
  "stat": "boolean - Show diffstat summary (default: false)"
}
```

#### Example Usage
```javascript
// Show latest commit with diff
{
  "commit": "HEAD",
  "showDiff": true
}

// Show specific commit summary
{
  "commit": "abc123",
  "stat": true,
  "nameOnly": true
}
```

---

## Commit & Push Operations

### git_add
**Description**: Stage files for commit with intelligent pattern matching  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "files": "array (optional) - Files or patterns to stage (e.g., ['.', '*.js', 'src/'])",
  "all": "boolean - Stage all modified and deleted files (default: false)",
  "update": "boolean - Stage only modified files, not new files (default: false)",
  "patch": "boolean - Interactively choose hunks to stage (default: false)",
  "dryRun": "boolean - Show what would be staged (default: false)"
}
```

#### Example Usage
```javascript
// Stage all changes
{
  "all": true
}

// Stage specific files
{
  "files": ["src/*.ts", "README.md"]
}

// Dry run to preview
{
  "files": ["."],
  "dryRun": true
}
```

### git_commit
**Description**: Create commit with conventional messages, gitmoji support, and smart templates  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "message": "string (optional) - Commit message",
  "type": "string (optional) - Conventional commit type: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci', 'perf']",
  "scope": "string (optional) - Conventional commit scope (e.g., 'api', 'ui', 'core')",
  "description": "string (optional) - Commit description (combined with type/scope)",
  "body": "string (optional) - Extended commit body",
  "breaking": "boolean - Mark as breaking change (default: false)",
  "gitmoji": "boolean - Add appropriate gitmoji emoji (default: true)",
  "all": "boolean - Stage all modified files before committing (default: false)",
  "amend": "boolean - Amend the last commit (default: false)",
  "dryRun": "boolean - Show what would be committed (default: false)"
}
```

#### Example Usage
```javascript
// Conventional commit with gitmoji
{
  "type": "feat",
  "scope": "api",
  "description": "add user authentication endpoint",
  "body": "Implements JWT-based authentication with refresh tokens",
  "gitmoji": true
}

// Simple commit message
{
  "message": "Fix bug in user profile update"
}

// Breaking change commit
{
  "type": "feat",
  "scope": "core",
  "description": "redesign configuration system",
  "breaking": true
}
```

### git_push
**Description**: Push commits to remote repository with upstream tracking  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "remote": "string - Remote repository name (default: 'origin')",
  "branch": "string (optional) - Branch to push (defaults to current branch)",
  "setUpstream": "boolean - Set upstream tracking (default: false)",
  "force": "boolean - Force push (use with caution) (default: false)",
  "forceWithLease": "boolean - Safer force push (default: false)",
  "tags": "boolean - Push tags along with commits (default: false)",
  "dryRun": "boolean - Show what would be pushed (default: false)"
}
```

#### Example Usage
```javascript
// Standard push with upstream tracking
{
  "setUpstream": true
}

// Force push with lease (safer)
{
  "forceWithLease": true
}

// Push with tags
{
  "tags": true
}
```

### git_pull
**Description**: Pull and merge changes from remote repository with rebase options  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "remote": "string - Remote repository name (default: 'origin')",
  "branch": "string (optional) - Branch to pull from (defaults to upstream)",
  "rebase": "boolean - Use rebase instead of merge (default: false)",
  "ff": "string - Fast-forward strategy: ['only', 'no', 'default'] (default: 'default')",
  "squash": "boolean - Squash commits from pulled branch (default: false)",
  "tags": "boolean - Fetch tags as well (default: false)"
}
```

#### Example Usage
```javascript
// Standard pull
{
  "remote": "origin"
}

// Pull with rebase
{
  "rebase": true,
  "tags": true
}
```

### git_stash
**Description**: Manage Git stash for temporary storage of changes  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "action": "string (required) - Stash action: ['push', 'pop', 'apply', 'list', 'show', 'drop', 'clear']",
  "message": "string (optional) - Stash message (for push action)",
  "includeUntracked": "boolean - Include untracked files (default: false)",
  "keepIndex": "boolean - Keep staged changes in index (default: false)",
  "stashIndex": "number - Stash index for operations (default: 0)"
}
```

#### Example Usage
```javascript
// Save current changes with message
{
  "action": "push",
  "message": "WIP: refactoring user service",
  "includeUntracked": true
}

// List all stashes
{
  "action": "list"
}

// Apply specific stash
{
  "action": "apply",
  "stashIndex": 1
}
```

### git_fetch
**Description**: Fetch changes from remote repository without merging  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "remote": "string - Remote name to fetch from (default: 'origin')",
  "branch": "string (optional) - Specific branch to fetch",
  "all": "boolean - Fetch from all remotes (default: false)",
  "tags": "boolean - Fetch tags as well (default: true)",
  "prune": "boolean - Remove remote-tracking branches that no longer exist (default: false)",
  "depth": "number (optional) - Limit fetching to specified number of commits",
  "force": "boolean - Force fetch (default: false)",
  "dryRun": "boolean - Show what would be fetched (default: false)",
  "quiet": "boolean - Suppress output except errors (default: false)",
  "verbose": "boolean - Show detailed fetch information (default: false)"
}
```

#### Example Usage
```javascript
// Standard fetch with tags and prune
{
  "tags": true,
  "prune": true
}

// Fetch all remotes
{
  "all": true,
  "verbose": true
}
```

---

## Branch Operations

### git_branch_list
**Description**: List Git branches with detailed information including remote tracking  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "includeRemote": "boolean - Include remote branches (default: false)",
  "all": "boolean - Show both local and remote branches (default: false)",
  "verbose": "boolean - Show detailed information (default: false)",
  "merged": "boolean - Show only merged branches (default: false)",
  "noMerged": "boolean - Show only unmerged branches (default: false)"
}
```

#### Example Usage
```javascript
// List all branches with details
{
  "all": true,
  "verbose": true
}

// Show unmerged branches
{
  "noMerged": true
}
```

### git_branch_create
**Description**: Create new Git branch with optional upstream tracking  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "name": "string (required) - Name of the new branch",
  "startPoint": "string (optional) - Starting commit, branch, or tag",
  "checkout": "boolean - Switch to new branch after creating (default: true)",
  "track": "boolean - Set up tracking for remote branch (default: false)",
  "force": "boolean - Force creation even if branch exists (default: false)"
}
```

#### Example Usage
```javascript
// Create and switch to new feature branch
{
  "name": "feature/user-auth",
  "startPoint": "main"
}

// Create branch with tracking
{
  "name": "feature/api-v2",
  "track": true,
  "checkout": false
}
```

### git_branch_switch
**Description**: Switch between Git branches with optional creation and stash handling  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "name": "string (required) - Branch name to switch to",
  "create": "boolean - Create branch if it doesn't exist (default: false)",
  "force": "boolean - Force switch, discarding local changes (default: false)",
  "stash": "boolean - Automatically stash changes before switching (default: false)",
  "track": "boolean - Set up tracking when creating (default: false)",
  "startPoint": "string (optional) - Starting point when creating new branch"
}
```

#### Example Usage
```javascript
// Switch to existing branch
{
  "name": "develop"
}

// Create and switch with auto-stash
{
  "name": "hotfix/critical-bug",
  "create": true,
  "stash": true,
  "startPoint": "main"
}
```

### git_branch_delete
**Description**: Delete Git branches with safety checks and force options  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "names": "array (required) - Branch names to delete",
  "force": "boolean - Force delete unmerged branches (default: false)",
  "remote": "boolean - Delete remote-tracking branches (default: false)",
  "dryRun": "boolean - Show what would be deleted (default: false)"
}
```

#### Example Usage
```javascript
// Safe delete merged branches
{
  "names": ["feature/completed", "hotfix/old-fix"]
}

// Force delete with dry run
{
  "names": ["feature/experimental"],
  "force": true,
  "dryRun": true
}
```

### git_merge
**Description**: Merge branches with various strategies and options  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "branch": "string (required) - Branch to merge into current branch",
  "strategy": "string - Merge strategy: ['resolve', 'recursive', 'octopus', 'ours', 'subtree'] (default: 'recursive')",
  "ff": "string - Fast-forward option: ['only', 'no', 'default'] (default: 'default')",
  "squash": "boolean - Squash commits from merged branch (default: false)",
  "noCommit": "boolean - Don't create merge commit automatically (default: false)",
  "message": "string (optional) - Custom merge commit message",
  "abort": "boolean - Abort an in-progress merge (default: false)",
  "continue": "boolean - Continue merge after resolving conflicts (default: false)"
}
```

#### Example Usage
```javascript
// Standard merge
{
  "branch": "feature/new-feature"
}

// Squash merge with custom message
{
  "branch": "feature/ui-updates",
  "squash": true,
  "message": "Add new UI components and styling updates"
}

// Continue merge after conflict resolution
{
  "branch": "feature/complex",
  "continue": true
}
```

---

## GitHub Integration

### gh_repo_info
**Description**: Get detailed information about a GitHub repository  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo) or URL",
  "json": "boolean - Return data in JSON format (default: true)"
}
```

#### Example Usage
```javascript
// Current repository info
{
  "json": true
}

// Specific repository
{
  "repo": "microsoft/vscode",
  "json": true
}
```

### gh_issue_list
**Description**: List GitHub issues with filtering options  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo)",
  "state": "string - Filter by issue state: ['open', 'closed', 'all'] (default: 'open')",
  "assignee": "string (optional) - Filter by assignee username",
  "author": "string (optional) - Filter by author username",
  "label": "string (optional) - Filter by label",
  "limit": "number - Maximum number of issues to return (default: 30)"
}
```

#### Example Usage
```javascript
// Open issues assigned to current user
{
  "state": "open",
  "assignee": "@me",
  "limit": 50
}

// Issues with specific label
{
  "label": "bug",
  "state": "all"
}
```

### gh_issue_create
**Description**: Create a new GitHub issue  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo)",
  "title": "string (required) - Issue title",
  "body": "string (optional) - Issue body/description",
  "assignee": "array (optional) - List of usernames to assign",
  "label": "array (optional) - List of labels to add",
  "milestone": "string (optional) - Milestone to assign"
}
```

#### Example Usage
```javascript
// Create bug report
{
  "title": "Application crashes on startup",
  "body": "## Bug Description\n\nThe application crashes immediately after startup...",
  "label": ["bug", "high-priority"],
  "assignee": ["developer-username"]
}
```

### gh_issue_view
**Description**: View detailed information about a specific GitHub issue  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo)",
  "issue": "string (required) - Issue number or URL",
  "comments": "boolean - Include comments in output (default: false)"
}
```

### gh_pr_list
**Description**: List GitHub pull requests with filtering options  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo)",
  "state": "string - Filter by PR state: ['open', 'closed', 'merged', 'all'] (default: 'open')",
  "assignee": "string (optional) - Filter by assignee username",
  "author": "string (optional) - Filter by author username",
  "base": "string (optional) - Filter by base branch",
  "head": "string (optional) - Filter by head branch",
  "limit": "number - Maximum number of PRs to return (default: 30)"
}
```

### gh_pr_create
**Description**: Create a new GitHub pull request  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo)",
  "title": "string (required) - Pull request title",
  "body": "string (optional) - Pull request body/description",
  "base": "string - Base branch (default: 'main')",
  "head": "string (optional) - Head branch (uses current branch if not specified)",
  "assignee": "array (optional) - List of usernames to assign",
  "reviewer": "array (optional) - List of usernames to request review from",
  "label": "array (optional) - List of labels to add",
  "draft": "boolean - Create as draft pull request (default: false)"
}
```

#### Example Usage
```javascript
// Create feature PR
{
  "title": "Add user authentication system",
  "body": "## Changes\n\n- Implement JWT authentication\n- Add login/logout endpoints\n- Update user model",
  "base": "main",
  "reviewer": ["team-lead", "senior-dev"],
  "label": ["feature", "backend"]
}
```

### gh_pr_view
**Description**: View detailed information about a specific GitHub pull request  
**Dependencies**: GitHub CLI (gh)

### gh_workflow_run
**Description**: List and view GitHub Actions workflow runs  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo)",
  "workflow": "string (optional) - Workflow name or ID to filter by",
  "status": "string (optional) - Filter by status: ['completed', 'in_progress', 'queued']",
  "limit": "number - Maximum number of workflow runs (default: 20)"
}
```

### gh_release_list
**Description**: List GitHub releases  
**Dependencies**: GitHub CLI (gh)

#### Parameters
```json
{
  "repo": "string (optional) - Repository name (owner/repo)",
  "limit": "number - Maximum number of releases (default: 30)"
}
```

---

## GitKraken Premium Features

**Note**: These commands require GitKraken CLI to be installed and may require a GitKraken premium license.

### gk_graph
**Description**: Display interactive commit graph visualization using GitKraken CLI  
**Dependencies**: GitKraken CLI

#### Parameters
```json
{
  "branch": "string (optional) - Specific branch to visualize",
  "limit": "number - Number of commits to show (default: 20)",
  "position": "string - Panel position: ['top', 'bottom', 'left', 'right'] (default: 'right')"
}
```

#### Example Usage
```javascript
// Show commit graph for current branch
{
  "limit": 50,
  "position": "right"
}

// Visualize specific branch
{
  "branch": "feature/complex-merge",
  "limit": 30
}
```

### gk_work_commit_ai
**Description**: Create intelligent commit messages using GitKraken AI  
**Dependencies**: GitKraken CLI with AI features

#### Parameters
```json
{
  "message": "string (optional) - Base message to enhance with AI",
  "all": "boolean - Stage all modified files before committing (default: false)",
  "scope": "string (optional) - Scope for the commit (e.g., 'api', 'ui', 'core')"
}
```

#### Example Usage
```javascript
// AI-generated commit message
{
  "all": true,
  "scope": "api"
}

// Enhance existing message with AI
{
  "message": "fix user login issue",
  "scope": "auth"
}
```

### gk_work_pr_create_ai
**Description**: Create pull request with AI-generated title and description  
**Dependencies**: GitKraken CLI with AI features

#### Parameters
```json
{
  "title": "string (optional) - Base title to enhance with AI",
  "description": "string (optional) - Base description to enhance with AI",
  "base": "string - Target branch (default: 'main')",
  "draft": "boolean - Create as draft pull request (default: false)"
}
```

### gk_workspace_list
**Description**: List all GitKraken workspaces  
**Dependencies**: GitKraken CLI

### gk_workspace_create
**Description**: Create a new GitKraken workspace  
**Dependencies**: GitKraken CLI

#### Parameters
```json
{
  "name": "string (required) - Name of the new workspace",
  "description": "string (optional) - Description for the workspace",
  "repos": "array (optional) - List of repository paths to add"
}
```

### gk_work_list
**Description**: List active work items in GitKraken  
**Dependencies**: GitKraken CLI

---

## Installation & System

### install_git
**Description**: Automatically install Git on the current system  
**Dependencies**: System package manager

#### Parameters
```json
{
  "force": "boolean - Force reinstallation even if Git is already installed (default: false)"
}
```

#### Example Usage
```javascript
// Standard installation
{}

// Force reinstallation
{
  "force": true
}
```

### install_gitkraken_cli
**Description**: Automatically install GitKraken CLI on the current system  
**Dependencies**: System package manager

#### Parameters
```json
{
  "force": "boolean - Force reinstallation (default: false)"
}
```

### system_info
**Description**: Get detailed system information for installation compatibility  
**Dependencies**: None

#### Example Usage
```javascript
// Get complete system information
{}
```

#### Sample Response
```json
{
  "system": {
    "platform": "darwin",
    "arch": "arm64",
    "packageManager": "brew",
    "shell": "/bin/zsh",
    "isWSL": false,
    "isAdmin": false
  },
  "installations": {
    "git": {
      "installed": true,
      "version": "2.39.2"
    },
    "gitKrakenCli": {
      "installed": false,
      "version": null
    }
  }
}
```

### verify_installations
**Description**: Verify Git and GitKraken CLI installations and provide setup recommendations  
**Dependencies**: None

#### Parameters
```json
{
  "tool": "string - Which tool to verify: ['git', 'gitkraken-cli', 'both'] (default: 'both')"
}
```

---

## Recovery & History

### git_reset
**Description**: Reset current HEAD to specified state (soft, mixed, hard)  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "mode": "string - Reset mode: ['soft', 'mixed', 'hard'] (default: 'mixed')",
  "target": "string (optional) - Target commit hash, branch, or HEAD~n",
  "paths": "array (optional) - Specific paths to reset (for path mode)",
  "force": "boolean - Force reset even with uncommitted changes (default: false)",
  "dryRun": "boolean - Show what would be reset (default: false)"
}
```

#### Example Usage
```javascript
// Soft reset to previous commit
{
  "mode": "soft",
  "target": "HEAD~1"
}

// Hard reset with safety check
{
  "mode": "hard",
  "target": "HEAD~2",
  "dryRun": true
}
```

### git_revert
**Description**: Safely revert commits by creating new commits that undo changes  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "commits": "array (required) - Commit hashes to revert",
  "noCommit": "boolean - Stage revert changes without committing (default: false)",
  "mainline": "number (optional) - Parent number for merge commits (1 or 2)",
  "edit": "boolean - Edit commit message before committing (default: false)",
  "signoff": "boolean - Add Signed-off-by line (default: false)",
  "continue": "boolean - Continue revert after resolving conflicts (default: false)",
  "abort": "boolean - Abort revert operation (default: false)"
}
```

#### Example Usage
```javascript
// Revert specific commits
{
  "commits": ["abc123", "def456"]
}

// Revert merge commit
{
  "commits": ["merge789"],
  "mainline": 1
}
```

### git_reflog
**Description**: Show or manage reflog (reference logs) for commit recovery  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "action": "string - Reflog action: ['show', 'expire', 'delete'] (default: 'show')",
  "reference": "string - Reference to show reflog for (default: 'HEAD')",
  "limit": "number - Limit number of entries (default: 20)",
  "oneline": "boolean - Show compact one-line format (default: false)",
  "all": "boolean - Show reflog for all references (default: false)",
  "expireTime": "string (optional) - Expire entries older than time (e.g., '30.days', '1.week')"
}
```

#### Example Usage
```javascript
// Show recent reflog entries
{
  "action": "show",
  "limit": 50,
  "oneline": true
}

// Expire old entries
{
  "action": "expire",
  "expireTime": "30.days",
  "all": true
}
```

### git_clean
**Description**: Remove untracked files and directories from working tree  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "dryRun": "boolean - Show what would be removed (default: true)",
  "force": "boolean - Force removal of files (default: false)",
  "directories": "boolean - Remove untracked directories (default: false)",
  "ignored": "boolean - Remove ignored files as well (default: false)",
  "paths": "array (optional) - Specific paths to clean",
  "exclude": "array (optional) - Patterns to exclude from cleaning",
  "quiet": "boolean - Suppress output of removed files (default: false)"
}
```

#### Example Usage
```javascript
// Dry run to see what would be removed
{
  "dryRun": true,
  "directories": true
}

// Clean untracked files (requires force)
{
  "dryRun": false,
  "force": true,
  "directories": true
}
```

---

## Tag Management

### git_tag
**Description**: Create annotated or lightweight Git tags  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "name": "string (required) - Tag name (e.g., v1.0.0, release-2024)",
  "message": "string (optional) - Tag message (creates annotated tag)",
  "commit": "string (optional) - Commit to tag (defaults to HEAD)",
  "force": "boolean - Replace existing tag (default: false)",
  "sign": "boolean - Create GPG-signed tag (default: false)",
  "annotated": "boolean - Force creation of annotated tag (default: false)",
  "file": "string (optional) - Read tag message from file"
}
```

#### Example Usage
```javascript
// Create release tag
{
  "name": "v1.2.0",
  "message": "Release version 1.2.0\n\nNew features:\n- User authentication\n- API improvements",
  "sign": true
}

// Lightweight tag
{
  "name": "checkpoint-2024-01-15"
}
```

### git_tag_list
**Description**: List Git tags with optional filtering and sorting  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "pattern": "string (optional) - Pattern to filter tags (shell wildcard)",
  "sort": "string - Sort order: ['name', 'version', 'creatordate', 'committerdate'] (default: 'name')",
  "limit": "number - Maximum number of tags (default: 50)",
  "detailed": "boolean - Include detailed information (default: false)",
  "merged": "string (optional) - Only show tags reachable from specified commit/branch",
  "contains": "string (optional) - Only show tags that contain the specified commit"
}
```

#### Example Usage
```javascript
// List version tags
{
  "pattern": "v*",
  "sort": "version",
  "detailed": true
}

// Recent tags
{
  "sort": "creatordate",
  "limit": 10
}
```

### git_tag_delete
**Description**: Delete local Git tags  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "tags": "array (required) - Tag names to delete",
  "force": "boolean - Force deletion without confirmation (default: false)",
  "dryRun": "boolean - Show what would be deleted (default: false)"
}
```

### git_tag_push
**Description**: Push tags to remote repository  
**Dependencies**: Git CLI

#### Parameters
```json
{
  "remote": "string - Remote name (default: 'origin')",
  "tags": "array (optional) - Specific tags to push (empty = push all tags)",
  "all": "boolean - Push all tags (default: false)",
  "force": "boolean - Force push tags (default: false)",
  "delete": "boolean - Delete tags from remote (default: false)",
  "dryRun": "boolean - Show what would be pushed (default: false)"
}
```

---

## Common Workflows

### 1. Project Initialization
```javascript
// Initialize new project
git_init({ "defaultBranch": "main" })

// Set up user configuration
git_config({ 
  "action": "set", 
  "key": "user.name", 
  "value": "Developer Name",
  "global": true 
})

// Add remote origin
git_remote({
  "action": "add",
  "name": "origin",
  "url": "https://github.com/user/project.git"
})
```

### 2. Feature Development
```javascript
// Create and switch to feature branch
git_branch_create({
  "name": "feature/new-api",
  "startPoint": "main"
})

// Stage and commit changes
git_add({ "all": true })
git_commit({
  "type": "feat",
  "scope": "api",
  "description": "add user management endpoints",
  "gitmoji": true
})

// Push feature branch
git_push({ 
  "setUpstream": true,
  "branch": "feature/new-api"
})
```

### 3. GitHub PR Workflow
```javascript
// Create pull request
gh_pr_create({
  "title": "Add user management API endpoints",
  "body": "## Changes\n\n- Add CRUD endpoints for users\n- Implement validation\n- Add unit tests",
  "base": "main",
  "reviewer": ["team-lead"],
  "label": ["feature", "api"]
})

// Check workflow status
gh_workflow_run({
  "workflow": "CI",
  "limit": 5
})
```

### 4. Release Process
```javascript
// Create release tag
git_tag({
  "name": "v1.0.0",
  "message": "Release version 1.0.0\n\nMajor features:\n- User authentication\n- API v1 complete\n- Documentation",
  "sign": true
})

// Push tags
git_tag_push({
  "tags": ["v1.0.0"]
})

// List recent releases
gh_release_list({ "limit": 5 })
```

### 5. Emergency Recovery
```javascript
// Check reflog for lost commits
git_reflog({ 
  "limit": 30,
  "oneline": true 
})

// Reset to specific point (with dry run first)
git_reset({
  "mode": "hard",
  "target": "HEAD~3",
  "dryRun": true
})

// Clean up working directory
git_clean({
  "dryRun": true,
  "directories": true
})
```

### 6. GitKraken AI-Powered Workflow
```javascript
// AI-generated commit
gk_work_commit_ai({
  "all": true,
  "scope": "ui"
})

// AI-generated PR
gk_work_pr_create_ai({
  "base": "main",
  "draft": false
})

// Visualize branch history
gk_graph({
  "limit": 50,
  "position": "right"
})
```

---

## Dependencies & Compatibility

### System Requirements
- **Git CLI**: Required for all basic Git operations
- **GitHub CLI (gh)**: Required for GitHub integration commands
- **GitKraken CLI**: Required for premium GitKraken features
- **Node.js**: v16+ for running the MCP server
- **Operating Systems**: Windows, macOS, Linux

### Automatic Installation Support
| Platform | Git Auto-Install | GitKraken CLI Auto-Install | Package Manager |
|----------|------------------|---------------------------|-----------------|
| **macOS** | ✅ Homebrew | ✅ Homebrew | brew |
| **Windows** | ✅ Chocolatey/Scoop | ✅ Chocolatey/Scoop | choco, scoop |
| **Linux** | ✅ apt/yum/pacman | ✅ Manual download | apt, yum, pacman |
| **WSL** | ✅ Native Linux | ✅ Native Linux | apt |

### Authentication Setup
- **GitHub**: Set `GITHUB_TOKEN` environment variable or use `gh auth login`
- **GitKraken**: Requires GitKraken account login via CLI
- **Git**: Configure user.name and user.email

### Performance Considerations
- Commands include dry-run options for safe operation
- Batch operations use concurrent processing where applicable
- Large repository operations include limit parameters
- Background operations support progress monitoring

### Error Handling
- Comprehensive validation before destructive operations
- Automatic conflict detection and resolution guidance
- Safe-mode defaults for potentially dangerous operations
- Detailed error messages with suggested solutions

---

## License & Support

This documentation covers GitForMeDearAi MCP Server v0.1.0. 

**Enterprise Features**: GitKraken premium features require appropriate licensing.  
**Community Support**: Issues and contributions welcome on GitHub.  
**Documentation**: Updated regularly with new features and improvements.

For the most current information, please refer to the project repository and official documentation.
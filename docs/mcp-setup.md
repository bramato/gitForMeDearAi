# 🔧 GitForMeDearAi MCP Setup Guide

Complete guide for setting up GitForMeDearAi MCP server with various clients.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed and configured
- GitHub account (optional, for GitHub features)

## 🚀 Quick Start

### 1. Install GitForMeDearAi

```bash
# Install globally via npm
npm install -g git-for-me-dear-ai

# Verify installation
git-for-me-dear-ai --version
git-for-me-dear-ai tools
```

### 2. Test Server Standalone

```bash
# Start server in standalone mode
git-for-me-dear-ai start

# Test configuration
git-for-me-dear-ai config --show
```

## 🎯 Client-Specific Setup

### 💻 **Cursor IDE**

#### Method 1: Auto-Detection Path

1. **Find your global npm path**:
   ```bash
   npm root -g
   # Example output: /usr/local/lib/node_modules
   ```

2. **Add to Cursor MCP config**:
   ```json
   {
     "mcpServers": {
       "git-for-me-dear-ai": {
         "command": "node",
         "args": ["/usr/local/lib/node_modules/git-for-me-dear-ai/dist/index.js"],
         "env": {
           "GITHUB_TOKEN": "ghp_your_token_optional"
         }
       }
     }
   }
   ```

#### Method 2: NPX Command

```json
{
  "mcpServers": {
    "git-for-me-dear-ai": {
      "command": "npx",
      "args": ["git-for-me-dear-ai", "start"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_optional"
      }
    }
  }
}
```

#### Method 3: Direct Binary

```json
{
  "mcpServers": {
    "git-for-me-dear-ai": {
      "command": "git-for-me-dear-ai",
      "args": ["start"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_optional"
      }
    }
  }
}
```

### 🎯 **Claude Code**

1. **Create MCP config file**:
   ```bash
   mkdir -p ~/.config/claude-code
   ```

2. **Add to `~/.config/claude-code/mcp.json`**:
   ```json
   {
     "servers": {
       "git-for-me-dear-ai": {
         "command": "git-for-me-dear-ai",
         "args": ["start"],
         "env": {
           "GITHUB_TOKEN": "ghp_your_github_token_here",
           "LOG_LEVEL": "INFO"
         }
       }
     }
   }
   ```

3. **Restart Claude Code** to load the server

### 🔧 **Claude Desktop**

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "git-for-me-dear-ai": {
      "command": "git-for-me-dear-ai",
      "args": ["start"],
      "env": {
        "GITHUB_TOKEN": "optional_token_here"
      }
    }
  }
}
```

### 🌐 **Other MCP Clients**

Generic configuration for any MCP-compatible client:

```json
{
  "name": "git-for-me-dear-ai",
  "command": "git-for-me-dear-ai",
  "args": ["start"],
  "cwd": "your-project-directory",
  "env": {
    "GITHUB_TOKEN": "optional_github_token",
    "LOG_LEVEL": "INFO",
    "GIT_DEFAULT_REMOTE": "origin"
  }
}
```

## 🔐 GitHub Token Setup

### Creating a GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (for repository access)
   - `issues` (for issue management)
   - `pull_requests` (for PR management)
   - `workflow` (for GitHub Actions)
4. Copy the generated token

### Configuring the Token

#### Option 1: Environment Variable (Recommended)
```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export GITHUB_TOKEN="ghp_your_token_here"
```

#### Option 2: Local Config File
```bash
# Create local config in your project
echo '{"githubToken": "ghp_your_token_here"}' > .gitformeDearai.json

# Or global config
echo '{"githubToken": "ghp_your_token_here"}' > ~/.gitformeDearai.json
```

#### Option 3: MCP Client Config
```json
{
  "env": {
    "GITHUB_TOKEN": "ghp_your_token_here"
  }
}
```

## 🧪 Testing the Setup

### 1. Verify Server Connection

In your MCP client, try these commands:

```
Ask Claude to list available tools:
"What MCP tools do you have available?"

Test a simple Git command:
"Show me the git status of this project"

Test GitHub integration (if token configured):
"List the issues in this repository"
```

### 2. Command Examples

```bash
# Test via CLI
git-for-me-dear-ai tools --category repository
git-for-me-dear-ai config --validate

# Check if GitHub integration works
git-for-me-dear-ai config --show
```

### 3. Troubleshooting Commands

```bash
# Check if server starts correctly
git-for-me-dear-ai start --verbose

# Validate configuration
git-for-me-dear-ai config --validate

# List all available tools
git-for-me-dear-ai tools
```

## ⚠️ Troubleshooting

### Common Issues

#### "Command not found: git-for-me-dear-ai"
```bash
# Reinstall globally
npm uninstall -g git-for-me-dear-ai
npm install -g git-for-me-dear-ai

# Check npm global path
npm config get prefix
```

#### "Permission denied" on macOS/Linux
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use a Node version manager like nvm
```

#### MCP Server Not Starting
```bash
# Check if port is in use
lsof -i :3000

# Start with verbose logging
git-for-me-dear-ai start --verbose

# Check for errors
git-for-me-dear-ai config --validate
```

#### GitHub Features Not Working
```bash
# Verify token is set
echo $GITHUB_TOKEN

# Test token manually
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Check configuration
git-for-me-dear-ai config --show
```

### Debug Mode

Enable debug logging:

```bash
# Environment variable
export LOG_LEVEL=DEBUG
git-for-me-dear-ai start

# Or in MCP config
{
  "env": {
    "LOG_LEVEL": "DEBUG"
  }
}
```

### Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/bramato/git-for-me-dear-ai/issues)
2. Run diagnostics: `git-for-me-dear-ai config --validate`
3. Enable debug logging and check output
4. Create a new issue with:
   - Your operating system
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Error logs with debug mode enabled

## 🎉 Success!

Once configured, you should be able to use all GitForMeDearAi tools through your MCP client:

- 📁 **Repository management** (init, clone, remote, config)
- 🔍 **Status & inspection** (status, log, diff, blame, show)
- 💾 **Commit operations** (add, commit, push, pull, stash)
- 🌿 **Branch management** (list, create, switch, delete, merge)

Start using commands like:
- "Initialize a new git repository"
- "Show me the commit history for the last 10 commits"
- "Create a new branch called 'feature/awesome'"
- "Push my changes to origin"

Enjoy automated Git/GitHub workflows with AI assistance! 🚀
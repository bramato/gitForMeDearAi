# 🎯 GitForMeDearAi

> A complete MCP (Model Context Protocol) server for automating all Git and GitHub commands, globally installable via npm.

## 🌟 Overview

**GitForMeDearAi** is an MCP server that provides complete access to all Git and GitHub commands through a unified interface. Designed for developers who want to automate versioning and collaboration workflows without having to remember complex syntax.

## 🚀 Key Features

- 🔧 **150+ Git/GitHub Commands** - From initialization to deployment
- ⚡ **Global Installation** - One npm command to get operational
- 🎨 **Zero Configuration** - Works immediately after installation
- 🔒 **Secure Management** - Integrated GitHub authentication
- 📋 **Logical Categorization** - Commands organized by workflow
- 🌐 **Cross-Platform** - Compatible with Windows, macOS, Linux

## 📦 Installation

```bash
# Global installation
npm install -g git-for-me-dear-ai

# Verify installation
git-for-me-dear-ai --version
```

## 🔧 MCP Client Configuration

### 🎯 **Cursor IDE**

1. **Open MCP settings** in Cursor:
   ```
   Cursor → Preferences → Features → Model Context Protocol
   ```

2. **Add the GitForMeDearAi server** in the MCP configuration file:
   ```json
   {
     "mcpServers": {
       "git-for-me-dear-ai": {
         "command": "node",
         "args": [
           "/path/to/your/global/node_modules/git-for-me-dear-ai/dist/index.js"
         ],
         "env": {
           "GITHUB_TOKEN": "your-github-token-here"
         }
       }
     }
   }
   ```

3. **Find the global installation path**:
   ```bash
   npm list -g git-for-me-dear-ai
   # Or use: npm root -g
   ```

4. **Restart Cursor** to load the MCP server

### 🎯 **Claude Code**

1. **Install the server** globally:
   ```bash
   npm install -g git-for-me-dear-ai
   ```

2. **Add to the MCP configuration file** (`~/.config/claude-code/mcp.json`):
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

3. **Configure GitHub token** (optional for GitHub functions):
   ```bash
   # Method 1: Environment variable
   export GITHUB_TOKEN="ghp_your_github_token_here"
   
   # Method 2: Config file
   echo '{"githubToken": "ghp_your_token_here"}' > ~/.gitformeDearai.json
   ```

4. **Verify the configuration**:
   ```bash
   git-for-me-dear-ai config --show
   git-for-me-dear-ai tools --category repository
   ```

### 🎯 **Other MCP Clients**

For other clients that support MCP, use this basic configuration:

```json
{
  "name": "git-for-me-dear-ai",
  "command": "git-for-me-dear-ai",
  "args": ["start"],
  "env": {
    "GITHUB_TOKEN": "optional_github_token"
  }
}
```

### 🔐 **GitHub Token Setup** (Optional)

To use GitHub functionalities:

1. **Create a Personal Access Token** on GitHub:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate a new token with scopes: `repo`, `issues`, `pull_requests`

2. **Configure the token**:
   ```bash
   # Option 1: Environment variable (recommended)
   export GITHUB_TOKEN="ghp_your_token_here"
   
   # Option 2: Local config file
   echo '{"githubToken": "ghp_your_token_here"}' > .gitformeDearai.json
   
   # Option 3: Global config file
   echo '{"githubToken": "ghp_your_token_here"}' > ~/.gitformeDearai.json
   ```

## 🎯 Command Categories

### 🔥 **High Priority** (Daily Workflows)

#### 📁 **Repository Management**
- Repository initialization and cloning
- Remote and configuration management
- Repository import/export

#### 🌿 **Branch & Merge Operations**
- Branch creation, switching and deletion
- Merge, rebase and cherry-pick
- Conflict management

#### 💾 **Commit & Push Operations**
- Add, commit with structured messages
- Push/pull with upstream management
- Staging area management

#### 🔍 **Status & Inspection**
- Repository and working tree status
- Log, diff and blame
- File tracking and ignoring

### ⚡ **Medium Priority** (Advanced Features)

#### 🐛 **GitHub Issues**
- Issue creation and management
- Assignment and labeling
- Milestones and projects

#### 🔀 **Pull Requests**
- PR creation and review
- Merge strategies
- Drafts and conversions

#### 🏷️ **Tags & Releases**
- Tag and versioning management
- Release creation
- Asset management

#### ⏪ **History & Recovery**
- Reset and revert operations
- Stash management
- Reflog and recovery

### 📋 **Low Priority** (Specialized Cases)

#### 🔧 **Advanced Git**
- Submodules and subtrees
- Custom hooks
- Multiple worktrees

#### 🏢 **Enterprise Features**
- Team management
- Organization settings
- Security and compliance

#### 🛠️ **Maintenance**
- Garbage collection
- Repository optimization
- Backup and sync

## 💻 Usage Examples

### 🎯 Via MCP Client (Cursor, Claude Code)

Once configured, you can use natural commands:

```
"Initialize a new Git repository in this directory"
→ Uses: git_init

"Show repository status with details about modified files"
→ Uses: git_status

"Create a commit with the message 'feat: add new authentication system'"
→ Uses: git_commit with conventions

"Create a new branch called 'feature/user-dashboard'"
→ Uses: git_branch_create

"Push my changes to origin main"
→ Uses: git_push

"Show the history of the last 5 commits with details"
→ Uses: git_log

"Merge feature/awesome branch into current branch"
→ Uses: git_merge
```

### 🔧 Via Standalone CLI

```bash
# Start the MCP server
git-for-me-dear-ai start

# Show all available tools
git-for-me-dear-ai tools

# Show only commit tools
git-for-me-dear-ai tools --category commits

# Verify configuration
git-for-me-dear-ai config --show
```

### 📋 Available Tools by Category

- **Repository**: `git_init`, `git_clone`, `git_remote`, `git_config`
- **Status**: `git_status`, `git_log`, `git_diff`, `git_blame`, `git_show`
- **Commits**: `git_add`, `git_commit`, `git_push`, `git_pull`, `git_stash`
- **Branches**: `git_branch_list`, `git_branch_create`, `git_branch_switch`, `git_branch_delete`, `git_merge`

## 🏗️ Architecture

```
GitForMeDearAi/
├── src/
│   ├── commands/           # Git/GitHub command implementations
│   │   ├── repository/     # Repository operations
│   │   ├── branches/       # Branch management
│   │   ├── commits/        # Commit operations
│   │   ├── issues/         # GitHub issues
│   │   ├── pull-requests/  # Pull request management
│   │   └── releases/       # Release management
│   ├── core/              # Core MCP implementation
│   ├── auth/              # GitHub authentication
│   ├── utils/             # Utility functions
│   └── index.ts           # Entry point
├── tests/                 # Complete test suite
├── docs/                  # Detailed documentation
└── examples/              # Usage examples
```

## 🧪 Testing

```bash
# Run test suite
npm test

# Test con coverage
npm run test:coverage

# Test integration
npm run test:integration
```

## 📖 Documentation

- 🔧 [MCP Client Setup](./docs/mcp-setup.md) - Complete configuration for Cursor, Claude Code and other clients
- 📚 [Complete Guide](./docs/guide.md) - Detailed usage guide
- 🔧 [API Reference](./docs/api.md) - Complete API documentation
- 💡 [Practical Examples](./docs/examples.md) - Workflow examples
- 🐛 [Troubleshooting](./docs/troubleshooting.md) - Common problem resolution

## 🤝 Contributing

This project is open source! Contributions are welcome.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m '✨ feat: add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

---

## 🎵 Support the Developer

**Love coding with chill vibes?** Support this project by listening to my developer album:

### **"Code Chill: Loops of Relaxation"** 🎧

*Perfect background music for your coding sessions*

<div align="center">

[![Listen on Apple Music](https://img.shields.io/badge/Apple_Music-000000?style=for-the-badge&logo=apple-music&logoColor=white)](https://music.apple.com/it/album/code-chill-loops-of-relaxation/1815061487)
[![Listen on Spotify](https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](http://open.spotify.com/intl-it/album/0hBmSuyrMWpdazYTMCV0fp?go=1&nd=1&dlsi=ce8dfc8f237340e7)
[![Listen on YouTube Music](https://img.shields.io/badge/YouTube_Music-FF0000?style=for-the-badge&logo=youtube-music&logoColor=white)](https://music.youtube.com/playlist?list=OLAK5uy_lHyFL4eHr1FAikCrvsQrPYkU3AAX4DM6k)

</div>

*Every stream helps support the development of free tools like this one! 🙏*

</div>

## 📄 License

MIT © 2025 GitForMeDearAi

## 🙏 Credits

Developed with ❤️ to simplify every developer's Git/GitHub workflow.

---

**Ready to revolutionize your Git/GitHub workflow?**

```bash
npm install -g git-for-me-dear-ai
```
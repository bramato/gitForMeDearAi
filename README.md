# 🎯 GitForMeDearAi

```
┏┓• ┏┓    ┳┳┓  ┳┓      ┏┓•
┃┓┓╋┣ ┏┓┏┓┃┃┃┏┓┃┃┏┓┏┓┏┓┣┫┓
┗┛┗┗┻ ┗┛┛ ┛ ┗┗ ┻┛┗ ┗┻┛ ┛┗┗
```

> A complete MCP (Model Context Protocol) server for automating all Git and GitHub commands, globally installable via npm.

## 🌟 Overview

**GitForMeDearAi** is an MCP server that provides complete access to all Git and GitHub commands through a unified interface. Designed for developers who want to automate versioning and collaboration workflows without having to remember complex syntax.

## 🚀 Key Features

- 🔧 **47 Specialized Commands** - Complete Git, GitHub, and GitKraken CLI automation
- 🐙 **GitHub CLI Integration** - Issue management, PR handling, workflow monitoring
- ✨ **GitKraken CLI Support** *(Optional)* - AI-powered commits, interactive graphs, workspace management
- 📦 **Automatic Installation** - Install Git and GitKraken CLI directly from AI assistants
- ⚡ **Global Installation** - One npm command to get operational
- 🎨 **Zero Configuration** - Works immediately after installation
- 🔒 **Enterprise Security** - Safe operations with validation and dry-run modes
- 📋 **9 Functional Categories** - Commands organized by workflow and complexity
- 🌐 **Cross-Platform** - Compatible with Windows, macOS, Linux

## 📦 Installation

```bash
# Global installation
npm install -g git-for-me-dear-ai

# Verify installation
git-for-me-dear-ai --version
```

### 🚀 **Automatic Dependency Installation**

GitForMeDearAi can automatically install Git and GitKraken CLI for you:

```bash
# Check system compatibility and current installations
"Check system info and installed tools"
→ Uses: system_info

# Install Git automatically (if not present)
"Install Git on this system"
→ Uses: install_git

# Install GitKraken CLI for premium features  
"Install GitKraken CLI for AI-powered workflows"
→ Uses: install_gitkraken_cli

# Verify both installations
"Verify Git and GitKraken CLI installations"
→ Uses: verify_installations
```

**Supported Installation Methods:**
- **macOS**: Homebrew, Manual download
- **Windows**: Chocolatey, Winget, Scoop, Manual download  
- **Linux**: apt, yum, dnf, pacman, Manual download

> **Smart Detection**: The system automatically detects your OS and available package managers, choosing the best installation method for your environment.

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

### 🐙✨ **GitKraken CLI Setup** (Optional - Premium Features)

For enhanced AI-powered workflows and interactive visualizations:

1. **Install GitKraken CLI**:
   ```bash
   # Download from official releases
   # Visit: https://github.com/gitkraken/gk-cli/releases
   
   # Or use package managers
   brew install gitkraken-cli  # macOS
   ```

2. **Verify installation**:
   ```bash
   gk version
   gk help
   ```

3. **Authentication** (if required):
   ```bash
   gk auth login
   ```

**Available GitKraken Tools** (auto-detected when CLI is present):
- `gk_graph` - Interactive commit graph visualization
- `gk_work_commit_ai` - AI-generated commit messages
- `gk_work_pr_create_ai` - AI-generated pull request descriptions
- `gk_workspace_list` - Manage multi-repository workspaces
- `gk_workspace_create` - Create new workspaces
- `gk_work_list` - View active work items
- `gk_setup` - Configuration and system info

## 🎯 Command Categories

> **📋 For detailed documentation of all 47 commands with parameters, examples, and workflows, see [Complete Commands Reference](./docs/COMMANDS_REFERENCE.md)**

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

#### 🐛 **GitHub Issues** ✨ *NEW*
- `gh_issue_list` - List issues with advanced filtering
- `gh_issue_create` - Create new issues with templates
- `gh_issue_view` - View detailed issue information
- Assignment and labeling support

#### 🔀 **Pull Requests** ✨ *NEW*  
- `gh_pr_list` - List PRs with state and branch filtering
- `gh_pr_create` - Create PRs with reviewers and labels
- `gh_pr_view` - View detailed PR information
- Draft and review management

#### 🐙 **GitHub Repository** ✨ *NEW*
- `gh_repo_info` - Get detailed repository information
- `gh_workflow_run` - Monitor GitHub Actions workflows
- `gh_release_list` - Manage releases and tags

> **Enhanced Visual Formatting**: All GitHub CLI commands now feature beautiful, structured responses with visual success/error indicators (✅/❌), formatted JSON data blocks, and contextual information. See our [Response Visualization Guide](./docs/VISUALIZATION.md) for detailed examples.

#### 🐙✨ **GitKraken Premium** *(Optional - Auto-detected)*
- `gk_graph` - Interactive commit graph with visual navigation
- `gk_work_commit_ai` - AI-powered smart commit message generation
- `gk_work_pr_create_ai` - AI-enhanced pull request creation
- `gk_workspace_list` - Multi-repository workspace management
- `gk_workspace_create` - Create organized development environments
- `gk_work_list` - Track active work items across projects
- `gk_setup` - System configuration and diagnostics

> **Smart Detection**: GitKraken tools are automatically enabled when GitKraken CLI is detected on your system. No additional configuration required!

#### 🏷️ **Tags & Releases**
- Tag and versioning management
- Release creation
- Asset management

#### ⏪ **History & Recovery**
- Reset and revert operations
- Stash management
- Reflog and recovery

### 📋 **Low Priority** (Specialized Cases)

#### 📦 **System Installation** ✨ *NEW*
- `install_git` - Automatically install Git on any system
- `install_gitkraken_cli` - Automatically install GitKraken CLI  
- `system_info` - Detailed system compatibility information
- `verify_installations` - Verify and validate tool installations

> **Cross-Platform Support**: Automatic detection of OS and package managers (Homebrew, apt, yum, Chocolatey, winget, etc.) for seamless installation experience.

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

"Create a commit with AI-generated message based on my changes"
→ Uses: gk_work_commit_ai (if GitKraken CLI available)

"Show me an interactive commit graph"
→ Uses: gk_graph (if GitKraken CLI available)

"Create a pull request with AI-generated title and description"
→ Uses: gk_work_pr_create_ai (if GitKraken CLI available)

"Install Git automatically on my system"
→ Uses: install_git

"Install GitKraken CLI for premium features"  
→ Uses: install_gitkraken_cli

"Check what development tools are installed on this system"
→ Uses: system_info

"Verify that Git and GitKraken CLI are working correctly"
→ Uses: verify_installations
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

The project includes a comprehensive test suite covering all Git commands and workflows:

```bash
# Run all tests
npm test

# Run tests with coverage (80% threshold)
npm run test:coverage

# Run specific test categories  
npm run test:status      # Status commands (git_status, git_log, git_diff, etc.)
npm run test:branches    # Branch commands (git_branch_list, git_branch_create, etc.)
npm run test:commits     # Commit commands (git_add, git_commit, git_push, etc.)
npm run test:github      # GitHub integration tests
npm run test:integration # End-to-end workflow tests

# Run all tests with enhanced reporting
npm run test:all         # Custom test runner with detailed output

# Watch mode for development
npm run test:watch
```

### 🎯 Test Coverage

- **Unit Tests**: Individual command testing with comprehensive mocking
- **Integration Tests**: End-to-end workflow scenarios  
- **Error Handling**: Edge cases and failure scenarios
- **Performance**: Large repository handling

**Coverage Requirements**: 80% minimum for branches, functions, lines, and statements

### 📊 Test Reports

- **HTML Coverage**: `./coverage/lcov-report/index.html`
- **LCOV Format**: `./coverage/lcov.info` 
- **JSON Report**: `./coverage/coverage-final.json`

See [Testing Guide](./tests/README.md) for detailed documentation.

## 📖 Documentation

### 🎯 **Essential References**
- 📋 **[Complete Commands Reference](./docs/COMMANDS_REFERENCE.md)** - **47 Commands** detailed documentation with examples
- 🔧 [MCP Client Setup](./docs/mcp-setup.md) - Complete configuration for Cursor, Claude Code and other clients
- 📊 [Response Visualization](./docs/VISUALIZATION.md) - Enhanced GitHub CLI integration formatting and examples

### 📚 **Advanced Guides**  
- 🧪 [Testing Guide](./tests/README.md) - Comprehensive testing documentation and best practices
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
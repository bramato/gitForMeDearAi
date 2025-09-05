import { exec } from 'child_process';
import { promisify } from 'util';
import { systemDetector, SystemInfo } from './systemDetector.js';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export interface InstallResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
  requiresManualInstall?: boolean;
  manualInstructions?: string;
}

export class Installer {
  private static instance: Installer;

  private constructor() {}

  static getInstance(): Installer {
    if (!Installer.instance) {
      Installer.instance = new Installer();
    }
    return Installer.instance;
  }

  async installGit(force: boolean = false): Promise<InstallResult> {
    logger.info('🔧 Starting Git installation...');

    // Check if Git is already installed
    if (!force && await systemDetector.hasCommand('git')) {
      try {
        const { stdout } = await execAsync('git --version');
        return {
          success: true,
          message: `Git is already installed: ${stdout.trim()}`,
          output: stdout.trim(),
        };
      } catch (error) {
        // Continue with installation if version check fails
      }
    }

    const systemInfo = await systemDetector.getSystemInfo();
    return this.installGitByPlatform(systemInfo);
  }

  async installGitKrakenCli(force: boolean = false): Promise<InstallResult> {
    logger.info('🐙 Starting GitKraken CLI installation...');

    // Check if GitKraken CLI is already installed
    if (!force && await systemDetector.hasCommand('gk')) {
      try {
        const { stdout } = await execAsync('gk version');
        return {
          success: true,
          message: `GitKraken CLI is already installed: ${stdout.trim()}`,
          output: stdout.trim(),
        };
      } catch (error) {
        // Continue with installation if version check fails
      }
    }

    const systemInfo = await systemDetector.getSystemInfo();
    return this.installGitKrakenByPlatform(systemInfo);
  }

  private async installGitByPlatform(systemInfo: SystemInfo): Promise<InstallResult> {
    switch (systemInfo.packageManager) {
      case 'brew':
        return this.executeInstallCommand('brew install git', 'Git installed successfully via Homebrew');
      
      case 'apt':
        return this.executeInstallCommand('apt update && apt install -y git', 'Git installed successfully via apt');
      
      case 'yum':
        return this.executeInstallCommand('yum install -y git', 'Git installed successfully via yum');
      
      case 'dnf':
        return this.executeInstallCommand('dnf install -y git', 'Git installed successfully via dnf');
      
      case 'pacman':
        return this.executeInstallCommand('pacman -S --noconfirm git', 'Git installed successfully via pacman');
      
      case 'choco':
        return this.executeInstallCommand('choco install git -y', 'Git installed successfully via Chocolatey');
      
      case 'winget':
        return this.executeInstallCommand('winget install --id Git.Git -e --source winget', 'Git installed successfully via winget');
      
      case 'scoop':
        return this.executeInstallCommand('scoop install git', 'Git installed successfully via Scoop');
      
      default:
        return this.getManualGitInstallInstructions(systemInfo);
    }
  }

  private async installGitKrakenByPlatform(systemInfo: SystemInfo): Promise<InstallResult> {
    switch (systemInfo.packageManager) {
      case 'brew':
        // Note: GitKraken CLI might not be available in Homebrew, so we provide manual instructions
        return {
          success: false,
          message: 'GitKraken CLI not available via Homebrew',
          requiresManualInstall: true,
          manualInstructions: this.getGitKrakenManualInstructions(systemInfo),
        };
      
      case 'choco':
        // Check if GitKraken CLI is available in Chocolatey
        return {
          success: false,
          message: 'GitKraken CLI not available via Chocolatey',
          requiresManualInstall: true,
          manualInstructions: this.getGitKrakenManualInstructions(systemInfo),
        };
      
      case 'winget':
        // Try winget first
        try {
          const result = await this.executeInstallCommand(
            'winget install --id GitKraken.CLI -e --source winget',
            'GitKraken CLI installed successfully via winget'
          );
          if (result.success) return result;
        } catch {
          // Fall back to manual installation
        }
        return {
          success: false,
          message: 'GitKraken CLI not available via winget',
          requiresManualInstall: true,
          manualInstructions: this.getGitKrakenManualInstructions(systemInfo),
        };
      
      default:
        return {
          success: false,
          message: 'GitKraken CLI requires manual installation',
          requiresManualInstall: true,
          manualInstructions: this.getGitKrakenManualInstructions(systemInfo),
        };
    }
  }

  private async executeInstallCommand(command: string, successMessage: string): Promise<InstallResult> {
    try {
      logger.info(`📦 Executing install command: ${command}`);
      const result = await systemDetector.executeWithElevation(command);
      
      if (result.success) {
        return {
          success: true,
          message: successMessage,
          output: result.output,
          ...(result.error && { error: result.error }),
        };
      } else {
        return {
          success: false,
          message: 'Installation failed',
          ...(result.error && { error: result.error }),
        };
      }
    } catch (error) {
      logger.error('❌ Installation command failed:', error);
      return {
        success: false,
        message: 'Installation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getManualGitInstallInstructions(systemInfo: SystemInfo): InstallResult {
    let instructions = '';
    
    switch (systemInfo.platform) {
      case 'win32':
        instructions = `
**Windows Installation:**
1. Visit: https://git-scm.com/download/windows
2. Download and run the Git installer
3. Follow the installation wizard
4. Restart your terminal/command prompt
5. Verify installation: \`git --version\`

**Alternative methods:**
- Microsoft Store: Search for "Git"
- Package managers: \`winget install Git.Git\` or \`choco install git\`
        `.trim();
        break;
        
      case 'darwin':
        instructions = `
**macOS Installation:**
1. Install Homebrew: \`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"\`
2. Install Git: \`brew install git\`
3. Or download from: https://git-scm.com/download/mac
4. Verify installation: \`git --version\`

**Alternative methods:**
- Xcode Command Line Tools: \`xcode-select --install\`
        `.trim();
        break;
        
      default:
        instructions = `
**Linux Installation:**
- Ubuntu/Debian: \`sudo apt update && sudo apt install git\`
- CentOS/RHEL: \`sudo yum install git\` or \`sudo dnf install git\`
- Arch Linux: \`sudo pacman -S git\`
- Or visit: https://git-scm.com/download/linux
- Verify installation: \`git --version\`
        `.trim();
    }

    return {
      success: false,
      message: 'Git installation requires manual setup',
      requiresManualInstall: true,
      manualInstructions: instructions,
    };
  }

  private getGitKrakenManualInstructions(systemInfo: SystemInfo): string {
    switch (systemInfo.platform) {
      case 'win32':
        return `
**GitKraken CLI Windows Installation:**
1. Visit: https://github.com/gitkraken/gk-cli/releases
2. Download the latest Windows release (gk-windows-x64.exe)
3. Rename to \`gk.exe\` and add to your PATH
4. Or use package manager: \`winget install GitKraken.CLI\`
5. Restart your terminal
6. Verify: \`gk version\`

**Setup:**
- Run \`gk auth login\` to authenticate
- Follow the prompts to connect your GitKraken account
        `.trim();

      case 'darwin':
        return `
**GitKraken CLI macOS Installation:**
1. Visit: https://github.com/gitkraken/gk-cli/releases
2. Download the latest macOS release (gk-darwin-x64 or gk-darwin-arm64)
3. Make executable: \`chmod +x gk-darwin-*\`
4. Move to PATH: \`sudo mv gk-darwin-* /usr/local/bin/gk\`
5. Verify: \`gk version\`

**Alternative with Homebrew:**
- Currently not available in Homebrew core
- Check for third-party taps or manual installation

**Setup:**
- Run \`gk auth login\` to authenticate
- Follow the prompts to connect your GitKraken account
        `.trim();

      default:
        return `
**GitKraken CLI Linux Installation:**
1. Visit: https://github.com/gitkraken/gk-cli/releases
2. Download the appropriate Linux release (gk-linux-x64)
3. Make executable: \`chmod +x gk-linux-x64\`
4. Move to PATH: \`sudo mv gk-linux-x64 /usr/local/bin/gk\`
5. Verify: \`gk version\`

**Setup:**
- Run \`gk auth login\` to authenticate
- Follow the prompts to connect your GitKraken account
        `.trim();
    }
  }

  async verifyInstallation(command: string): Promise<{ installed: boolean; version?: string }> {
    try {
      const { stdout } = await execAsync(`${command} --version`);
      return {
        installed: true,
        version: stdout.trim(),
      };
    } catch {
      return {
        installed: false,
      };
    }
  }
}

export const installer = Installer.getInstance();
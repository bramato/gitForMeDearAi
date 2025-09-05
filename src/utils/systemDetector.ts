import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  release: string;
  packageManager: 'brew' | 'apt' | 'yum' | 'dnf' | 'pacman' | 'choco' | 'winget' | 'scoop' | 'unknown';
  shell: string;
  isWSL: boolean;
  isAdmin: boolean;
}

export class SystemDetector {
  private static instance: SystemDetector;
  private _systemInfo: SystemInfo | null = null;

  private constructor() {}

  static getInstance(): SystemDetector {
    if (!SystemDetector.instance) {
      SystemDetector.instance = new SystemDetector();
    }
    return SystemDetector.instance;
  }

  async getSystemInfo(): Promise<SystemInfo> {
    if (this._systemInfo) {
      return this._systemInfo;
    }

    const platform = os.platform();
    const arch = os.arch();
    const release = os.release();
    const shell = process.env.SHELL || process.env.COMSPEC || 'unknown';
    const isWSL = await this.detectWSL();
    const isAdmin = await this.checkAdminRights();
    const packageManager = await this.detectPackageManager();

    this._systemInfo = {
      platform,
      arch,
      release,
      packageManager,
      shell,
      isWSL,
      isAdmin,
    };

    logger.info('🖥️  System detected:', {
      platform: this._systemInfo.platform,
      arch: this._systemInfo.arch,
      packageManager: this._systemInfo.packageManager,
      isWSL: this._systemInfo.isWSL,
      isAdmin: this._systemInfo.isAdmin,
    });

    return this._systemInfo;
  }

  private async detectPackageManager(): Promise<SystemInfo['packageManager']> {
    const packageManagers = [
      { name: 'brew' as const, command: 'brew --version' },
      { name: 'apt' as const, command: 'apt --version' },
      { name: 'yum' as const, command: 'yum --version' },
      { name: 'dnf' as const, command: 'dnf --version' },
      { name: 'pacman' as const, command: 'pacman --version' },
      { name: 'choco' as const, command: 'choco --version' },
      { name: 'winget' as const, command: 'winget --version' },
      { name: 'scoop' as const, command: 'scoop --version' },
    ];

    for (const pm of packageManagers) {
      try {
        await execAsync(pm.command);
        logger.info(`📦 Package manager detected: ${pm.name}`);
        return pm.name;
      } catch {
        // Continue trying other package managers
      }
    }

    logger.warn('⚠️  No supported package manager detected');
    return 'unknown';
  }

  private async detectWSL(): Promise<boolean> {
    try {
      if (os.platform() !== 'linux') return false;
      
      const { stdout } = await execAsync('cat /proc/version 2>/dev/null || echo ""');
      return stdout.toLowerCase().includes('microsoft') || stdout.toLowerCase().includes('wsl');
    } catch {
      return false;
    }
  }

  private async checkAdminRights(): Promise<boolean> {
    try {
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Check Windows admin rights
        const { stdout } = await execAsync('net session 2>&1');
        return !stdout.includes('Access is denied');
      } else {
        // Check Unix-like admin rights
        return process.getuid ? process.getuid() === 0 : false;
      }
    } catch {
      return false;
    }
  }

  async hasCommand(command: string): Promise<boolean> {
    try {
      const platform = os.platform();
      const checkCommand = platform === 'win32' ? `where ${command}` : `which ${command}`;
      await execAsync(checkCommand);
      return true;
    } catch {
      return false;
    }
  }

  async executeWithElevation(command: string): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const systemInfo = await this.getSystemInfo();
      let elevatedCommand = command;

      if (!systemInfo.isAdmin) {
        switch (systemInfo.platform) {
          case 'darwin':
          case 'linux':
            elevatedCommand = `sudo ${command}`;
            break;
          case 'win32':
            // For Windows, we would need a more complex approach
            // For now, try without elevation and suggest manual installation
            break;
        }
      }

      logger.info(`🔐 Executing elevated command: ${elevatedCommand}`);
      const { stdout, stderr } = await execAsync(elevatedCommand);

      const result: { success: true; output: string; error?: string } = {
        success: true,
        output: stdout.trim(),
      };
      
      if (stderr) {
        result.error = stderr.trim();
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Elevated command failed:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  resetCache(): void {
    this._systemInfo = null;
  }
}

export const systemDetector = SystemDetector.getInstance();
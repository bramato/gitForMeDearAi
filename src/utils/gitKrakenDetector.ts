import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export class GitKrakenDetector {
  private static instance: GitKrakenDetector;
  private _isAvailable: boolean | null = null;
  private _version: string | null = null;

  private constructor() {}

  static getInstance(): GitKrakenDetector {
    if (!GitKrakenDetector.instance) {
      GitKrakenDetector.instance = new GitKrakenDetector();
    }
    return GitKrakenDetector.instance;
  }

  /**
   * Check if GitKraken CLI is available on the system
   */
  async isAvailable(): Promise<boolean> {
    if (this._isAvailable !== null) {
      return this._isAvailable;
    }

    try {
      await this.checkGitKrakenCli();
      this._isAvailable = true;
      logger.info('🐙 GitKraken CLI detected and available');
      return true;
    } catch (error) {
      this._isAvailable = false;
      logger.info('❌ GitKraken CLI not available - features will be disabled');
      return false;
    }
  }

  /**
   * Get GitKraken CLI version if available
   */
  async getVersion(): Promise<string | null> {
    if (this._version !== null) {
      return this._version;
    }

    if (!(await this.isAvailable())) {
      return null;
    }

    try {
      const { stdout } = await execAsync('gk version');
      this._version = stdout.trim();
      return this._version;
    } catch (error) {
      logger.error('❌ Failed to get GitKraken CLI version:', error);
      return null;
    }
  }

  /**
   * Execute a GitKraken CLI command with error handling
   */
  async executeGkCommand(
    command: string[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!(await this.isAvailable())) {
      return {
        success: false,
        error: 'GitKraken CLI is not available on this system',
      };
    }

    try {
      logger.info(`🐙 Executing gk command: ${command.join(' ')}`);
      const { stdout, stderr } = await execAsync(`gk ${command.join(' ')}`);

      if (stderr && !stdout) {
        return { success: false, error: stderr };
      }

      // Try to parse JSON output if possible
      let data = stdout.trim();
      try {
        data = JSON.parse(stdout);
      } catch {
        // Keep as string if not valid JSON
      }

      return { success: true, data };
    } catch (error) {
      logger.error('❌ GitKraken CLI command failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check specific GitKraken CLI capabilities
   */
  async checkCapabilities(): Promise<{
    hasGraph: boolean;
    hasWorkflow: boolean;
    hasWorkspace: boolean;
    hasAI: boolean;
  }> {
    if (!(await this.isAvailable())) {
      return {
        hasGraph: false,
        hasWorkflow: false,
        hasWorkspace: false,
        hasAI: false,
      };
    }

    // For now, assume all capabilities are available if CLI is present
    // This could be enhanced to check specific command availability
    return {
      hasGraph: true,
      hasWorkflow: true,
      hasWorkspace: true,
      hasAI: true,
    };
  }

  /**
   * Reset cached availability check (useful for testing)
   */
  resetCache(): void {
    this._isAvailable = null;
    this._version = null;
  }

  private async checkGitKrakenCli(): Promise<void> {
    // Try multiple ways to detect GitKraken CLI
    const commands = ['gk version', 'gk help', 'which gk'];

    for (const cmd of commands) {
      try {
        await execAsync(cmd);
        return; // Success - GitKraken CLI is available
      } catch (error) {
        // Continue trying other commands
      }
    }

    // If all commands fail, throw an error
    throw new Error('GitKraken CLI not found');
  }
}

// Export singleton instance
export const gitKrakenDetector = GitKrakenDetector.getInstance();
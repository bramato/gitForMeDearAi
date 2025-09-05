import { z } from 'zod';
import { McpServerContext, GitCommandResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { installer } from '../../utils/installer.js';
import { systemDetector } from '../../utils/systemDetector.js';

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

export class InstallerTools {
  getTools(): McpTool[] {
    return [
      this.createInstallGitTool(),
      this.createInstallGitKrakenCliTool(),
      this.createSystemInfoTool(),
      this.createVerifyInstallationTool(),
    ];
  }

  private createInstallGitTool(): McpTool {
    return {
      name: 'install_git',
      description: 'Automatically install Git on the current system',
      inputSchema: {
        type: 'object',
        properties: {
          force: {
            type: 'boolean',
            description: 'Force reinstallation even if Git is already installed',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { force = false } = args;

        logger.info(`🔧 Installing Git (force: ${force})`);

        try {
          const result = await installer.installGit(force);

          if (result.success) {
            // Verify the installation
            const verification = await installer.verifyInstallation('git');
            
            return {
              success: true,
              message: result.message,
              data: {
                installed: true,
                version: verification.version,
                output: result.output,
                method: 'automatic',
              },
            };
          } else if (result.requiresManualInstall) {
            return {
              success: false,
              message: result.message,
              data: {
                installed: false,
                requiresManualInstall: true,
                instructions: result.manualInstructions,
                method: 'manual',
              },
            };
          } else {
            return {
              success: false,
              message: result.message || 'Git installation failed',
              error: result.error,
            };
          }
        } catch (error) {
          logger.error('❌ Git installation failed:', error);
          return {
            success: false,
            message: 'Git installation failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createInstallGitKrakenCliTool(): McpTool {
    return {
      name: 'install_gitkraken_cli',
      description: 'Automatically install GitKraken CLI on the current system',
      inputSchema: {
        type: 'object',
        properties: {
          force: {
            type: 'boolean',
            description: 'Force reinstallation even if GitKraken CLI is already installed',
            default: false,
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { force = false } = args;

        logger.info(`🐙 Installing GitKraken CLI (force: ${force})`);

        try {
          const result = await installer.installGitKrakenCli(force);

          if (result.success) {
            // Verify the installation
            const verification = await installer.verifyInstallation('gk');
            
            // Reset GitKraken detector cache to re-detect availability
            const { gitKrakenDetector } = await import('../../utils/gitKrakenDetector.js');
            gitKrakenDetector.resetCache();
            
            return {
              success: true,
              message: result.message,
              data: {
                installed: true,
                version: verification.version,
                output: result.output,
                method: 'automatic',
                note: 'GitKraken CLI tools will be available after server restart',
              },
            };
          } else if (result.requiresManualInstall) {
            return {
              success: false,
              message: result.message,
              data: {
                installed: false,
                requiresManualInstall: true,
                instructions: result.manualInstructions,
                method: 'manual',
                downloadUrl: 'https://github.com/gitkraken/gk-cli/releases',
              },
            };
          } else {
            return {
              success: false,
              message: result.message || 'GitKraken CLI installation failed',
              error: result.error,
            };
          }
        } catch (error) {
          logger.error('❌ GitKraken CLI installation failed:', error);
          return {
            success: false,
            message: 'GitKraken CLI installation failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createSystemInfoTool(): McpTool {
    return {
      name: 'system_info',
      description: 'Get detailed system information for installation compatibility',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        try {
          const systemInfo = await systemDetector.getSystemInfo();
          const gitInstalled = await systemDetector.hasCommand('git');
          const gkInstalled = await systemDetector.hasCommand('gk');

          let gitVersion = null;
          let gkVersion = null;

          if (gitInstalled) {
            const gitVerification = await installer.verifyInstallation('git');
            gitVersion = gitVerification.version;
          }

          if (gkInstalled) {
            const gkVerification = await installer.verifyInstallation('gk');
            gkVersion = gkVerification.version;
          }

          return {
            success: true,
            message: 'System information retrieved successfully',
            data: {
              system: {
                platform: systemInfo.platform,
                arch: systemInfo.arch,
                release: systemInfo.release,
                packageManager: systemInfo.packageManager,
                shell: systemInfo.shell,
                isWSL: systemInfo.isWSL,
                isAdmin: systemInfo.isAdmin,
              },
              installations: {
                git: {
                  installed: gitInstalled,
                  version: gitVersion,
                },
                gitKrakenCli: {
                  installed: gkInstalled,
                  version: gkVersion,
                },
              },
              recommendations: this.getInstallationRecommendations(systemInfo, gitInstalled, gkInstalled),
            },
          };
        } catch (error) {
          logger.error('❌ Failed to get system info:', error);
          return {
            success: false,
            message: 'Failed to retrieve system information',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private createVerifyInstallationTool(): McpTool {
    return {
      name: 'verify_installations',
      description: 'Verify Git and GitKraken CLI installations and provide setup recommendations',
      inputSchema: {
        type: 'object',
        properties: {
          tool: {
            type: 'string',
            enum: ['git', 'gitkraken-cli', 'both'],
            description: 'Which tool to verify',
            default: 'both',
          },
        },
      },
      execute: async (
        context: McpServerContext,
        args: any
      ): Promise<GitCommandResult> => {
        const { tool = 'both' } = args;

        try {
          const results: any = {};

          if (tool === 'git' || tool === 'both') {
            const gitVerification = await installer.verifyInstallation('git');
            results.git = {
              installed: gitVerification.installed,
              version: gitVerification.version,
              status: gitVerification.installed ? 'ready' : 'not_installed',
            };
          }

          if (tool === 'gitkraken-cli' || tool === 'both') {
            const gkVerification = await installer.verifyInstallation('gk');
            results.gitKrakenCli = {
              installed: gkVerification.installed,
              version: gkVerification.version,
              status: gkVerification.installed ? 'ready' : 'not_installed',
            };
          }

          const allInstalled = Object.values(results).every((r: any) => r.installed);
          const systemInfo = await systemDetector.getSystemInfo();

          return {
            success: true,
            message: allInstalled 
              ? 'All requested tools are installed and ready' 
              : 'Some tools need installation',
            data: {
              verifications: results,
              system: {
                platform: systemInfo.platform,
                packageManager: systemInfo.packageManager,
              },
              nextSteps: this.getNextSteps(results),
            },
          };
        } catch (error) {
          logger.error('❌ Verification failed:', error);
          return {
            success: false,
            message: 'Installation verification failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    };
  }

  private getInstallationRecommendations(systemInfo: any, gitInstalled: boolean, gkInstalled: boolean): string[] {
    const recommendations = [];

    if (!gitInstalled) {
      if (systemInfo.packageManager !== 'unknown') {
        recommendations.push(`Install Git using: Use the install_git command for automatic installation`);
      } else {
        recommendations.push('Install Git manually from https://git-scm.com/downloads');
      }
    }

    if (!gkInstalled) {
      recommendations.push('Install GitKraken CLI using: Use the install_gitkraken_cli command');
      recommendations.push('GitKraken CLI provides AI-powered commits and visual git workflows');
    }

    if (systemInfo.packageManager === 'unknown') {
      recommendations.push('Consider installing a package manager for easier software management');
      switch (systemInfo.platform) {
        case 'win32':
          recommendations.push('Recommended: Install Chocolatey (https://chocolatey.org/) or Scoop (https://scoop.sh/)');
          break;
        case 'darwin':
          recommendations.push('Recommended: Install Homebrew (https://brew.sh/)');
          break;
      }
    }

    if (!systemInfo.isAdmin && systemInfo.packageManager !== 'brew' && systemInfo.packageManager !== 'scoop') {
      recommendations.push('Some installations may require administrator privileges');
    }

    return recommendations;
  }

  private getNextSteps(results: any): string[] {
    const steps = [];

    if (results.git && !results.git.installed) {
      steps.push('Run: install_git to automatically install Git');
    }

    if (results.gitKrakenCli && !results.gitKrakenCli.installed) {
      steps.push('Run: install_gitkraken_cli to install GitKraken CLI');
      steps.push('After installation, restart the MCP server to enable GitKraken tools');
    }

    if (results.git?.installed && !results.gitKrakenCli?.installed) {
      steps.push('Consider installing GitKraken CLI for enhanced AI-powered Git workflows');
    }

    if (results.git?.installed && results.gitKrakenCli?.installed) {
      steps.push('All tools are ready! You have access to both standard Git and premium GitKraken features');
    }

    return steps;
  }
}
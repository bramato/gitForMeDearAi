#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { GitForMeDearAiServer } from './core/server.js';

const program = new Command();

program
  .name('git-for-me-dear-ai')
  .description('Complete MCP server for Git and GitHub automation')
  .version('0.1.0');

// Start server command (default)
program
  .command('start', { isDefault: true })
  .description('Start the GitForMeDearAi MCP server')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Enable quiet mode (errors only)')
  .option('--config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      // Set log level based on options
      if (options.verbose) {
        process.env.LOG_LEVEL = 'DEBUG';
      } else if (options.quiet) {
        process.env.LOG_LEVEL = 'ERROR';
      }

      // Load configuration
      const config = loadConfig();
      const configErrors = validateConfig(config);

      if (configErrors.length > 0) {
        logger.error('❌ Configuration validation failed:');
        configErrors.forEach((error) => logger.error(`  - ${error}`));
        process.exit(1);
      }

      // Start server
      const server = new GitForMeDearAiServer();
      await server.start();
    } catch (error) {
      logger.error('💥 Failed to start server:', error);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage GitForMeDearAi configuration')
  .option('--show', 'Show current configuration')
  .option('--validate', 'Validate configuration')
  .option('--github-token <token>', 'Set GitHub token')
  .action((options) => {
    try {
      const config = loadConfig();

      if (options.show) {
        console.log(chalk.blue('📋 Current Configuration:'));
        console.log(
          JSON.stringify(
            {
              ...config,
              githubToken: config.githubToken ? '***' : undefined,
            },
            null,
            2
          )
        );
      }

      if (options.validate) {
        const errors = validateConfig(config);
        if (errors.length === 0) {
          console.log(chalk.green('✅ Configuration is valid'));
        } else {
          console.log(chalk.red('❌ Configuration validation failed:'));
          errors.forEach((error) => console.log(`  - ${error}`));
          process.exit(1);
        }
      }

      if (options.githubToken) {
        console.log(
          chalk.yellow('⚠️  GitHub token management not yet implemented')
        );
        console.log(
          'Please set GITHUB_TOKEN environment variable or add to config file'
        );
      }
    } catch (error) {
      logger.error('❌ Config command failed:', error);
      process.exit(1);
    }
  });

// Tools command
program
  .command('tools')
  .description('List available MCP tools')
  .option(
    '--category <category>',
    'Filter by category (repository, status, commits, branches)'
  )
  .action((options) => {
    console.log(chalk.blue.bold('🔧 Available GitForMeDearAi MCP Tools:\n'));

    const tools = [
      // Repository Management
      {
        category: 'repository',
        name: 'git_init',
        description: 'Initialize a new Git repository',
      },
      {
        category: 'repository',
        name: 'git_clone',
        description: 'Clone repository from remote URL',
      },
      {
        category: 'repository',
        name: 'git_remote',
        description: 'Manage remote repositories',
      },
      {
        category: 'repository',
        name: 'git_config',
        description: 'Get or set Git configuration',
      },

      // Status & Inspection
      {
        category: 'status',
        name: 'git_status',
        description: 'Get comprehensive repository status',
      },
      {
        category: 'status',
        name: 'git_log',
        description: 'Get commit history with filters',
      },
      {
        category: 'status',
        name: 'git_diff',
        description: 'Show differences between commits/branches',
      },
      {
        category: 'status',
        name: 'git_blame',
        description: 'Show line-by-line authorship',
      },
      {
        category: 'status',
        name: 'git_show',
        description: 'Show commit details and changes',
      },

      // Commits & Push
      {
        category: 'commits',
        name: 'git_add',
        description: 'Stage files with intelligent patterns',
      },
      {
        category: 'commits',
        name: 'git_commit',
        description: 'Create commits with conventions/gitmoji',
      },
      {
        category: 'commits',
        name: 'git_push',
        description: 'Push commits with upstream tracking',
      },
      {
        category: 'commits',
        name: 'git_pull',
        description: 'Pull and merge from remote',
      },
      {
        category: 'commits',
        name: 'git_stash',
        description: 'Manage temporary change storage',
      },

      // Branch Management
      {
        category: 'branches',
        name: 'git_branch_list',
        description: 'List branches with tracking info',
      },
      {
        category: 'branches',
        name: 'git_branch_create',
        description: 'Create new branches',
      },
      {
        category: 'branches',
        name: 'git_branch_switch',
        description: 'Switch between branches',
      },
      {
        category: 'branches',
        name: 'git_branch_delete',
        description: 'Delete branches safely',
      },
      {
        category: 'branches',
        name: 'git_merge',
        description: 'Merge branches with strategies',
      },
    ];

    const filteredTools = options.category
      ? tools.filter((tool) => tool.category === options.category)
      : tools;

    const categories = [...new Set(filteredTools.map((tool) => tool.category))];

    categories.forEach((category) => {
      console.log(chalk.yellow.bold(`📁 ${category.toUpperCase()} TOOLS:`));

      const categoryTools = filteredTools.filter(
        (tool) => tool.category === category
      );
      categoryTools.forEach((tool) => {
        console.log(`  ${chalk.green(tool.name)} - ${tool.description}`);
      });

      console.log('');
    });

    console.log(chalk.blue(`Total: ${filteredTools.length} tools available`));
  });

// Version command
program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log(chalk.blue.bold('GitForMeDearAi v0.1.0'));
    console.log(
      chalk.gray('Complete MCP server for Git and GitHub automation')
    );
    console.log(chalk.gray('https://github.com/bramato/git-for-me-dear-ai'));
  });

// Help command customization
program.on('--help', () => {
  console.log('');
  console.log(chalk.blue.bold('Examples:'));
  console.log(
    '  $ git-for-me-dear-ai start           # Start MCP server (default)'
  );
  console.log(
    '  $ git-for-me-dear-ai start --verbose # Start with verbose logging'
  );
  console.log(
    '  $ git-for-me-dear-ai config --show   # Show current configuration'
  );
  console.log(
    '  $ git-for-me-dear-ai tools           # List all available tools'
  );
  console.log(
    '  $ git-for-me-dear-ai tools --category commits # Show only commit tools'
  );
  console.log('');
  console.log(
    chalk.yellow(
      '💡 For MCP integration, add this server to your MCP client configuration.'
    )
  );
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

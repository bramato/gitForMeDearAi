#!/usr/bin/env node

import { GitForMeDearAiServer } from './core/server.js';
import { logger } from './utils/logger.js';
import chalk from 'chalk';

async function main(): Promise<void> {
  try {
    // Set MCP mode before logger initialization if running as MCP server
    if (process.stdin.isTTY === false) {
      process.env.MCP_MODE = 'true';
    }
    // Set up process handlers
    process.on('SIGINT', async () => {
      logger.info('🛑 Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Display startup banner only if not in MCP mode
    const mcpMode = process.env.MCP_MODE === 'true' || !process.stdin.isTTY;
    if (!mcpMode) {
      console.log(
        chalk.blue.bold(`
╔══════════════════════════════════════╗
║        GitForMeDearAi v0.1.0         ║
║    Complete Git/GitHub MCP Server    ║
╚══════════════════════════════════════╝
`)
      );
    }

    // Create and start server
    const server = new GitForMeDearAiServer();
    await server.start();
  } catch (error) {
    logger.error('💥 Fatal error starting GitForMeDearAi server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error('💥 Failed to start server:', error);
  process.exit(1);
});

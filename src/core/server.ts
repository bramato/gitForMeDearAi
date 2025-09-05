import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { simpleGit, SimpleGit } from 'simple-git';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import { GitForMeDearAiConfig, McpServerContext } from '../types/index.js';
import { loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { RepositoryTools } from '../commands/repository/index.js';
import { StatusTools } from '../commands/status/index.js';
import { CommitTools } from '../commands/commits/index.js';
import { BranchTools } from '../commands/branches/index.js';

export class GitForMeDearAiServer {
  private server: Server;
  private context: McpServerContext;
  private tools: Map<string, any>;

  constructor() {
    this.server = new Server({
      name: 'git-for-me-dear-ai',
      version: '0.1.0',
    });

    this.tools = new Map();
    this.context = this.initializeContext();
    this.setupHandlers();
    this.registerTools();
  }

  private initializeContext(): McpServerContext {
    const config = loadConfig();
    const git = simpleGit({
      baseDir: process.cwd(),
      binary: 'git',
      maxConcurrentProcesses: 6,
    });

    let github: Octokit | undefined;
    if (config.githubToken) {
      github = new Octokit({
        auth: config.githubToken,
      });
    }

    return {
      workingDirectory: process.cwd(),
      config,
      git,
      github,
    };
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('📋 Listing available tools');
      return {
        tools: Array.from(this.tools.values()).map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`🔧 Executing tool: ${chalk.blue(name)}`);
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool '${name}' not found`
        );
      }

      try {
        const result = await tool.execute(this.context, args);
        logger.info(`✅ Tool '${name}' executed successfully`);
        return result;
      } catch (error) {
        logger.error(`❌ Tool '${name}' failed:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private registerTools(): void {
    logger.info('🔧 Registering MCP tools...');

    // Repository Management Tools
    const repositoryTools = new RepositoryTools();
    repositoryTools.getTools().forEach((tool) => {
      this.tools.set(tool.name, tool);
      logger.info(`  📁 ${tool.name} - ${tool.description}`);
    });

    // Status & Inspection Tools  
    const statusTools = new StatusTools();
    statusTools.getTools().forEach((tool) => {
      this.tools.set(tool.name, tool);
      logger.info(`  🔍 ${tool.name} - ${tool.description}`);
    });

    // Commit & Push Tools
    const commitTools = new CommitTools();
    commitTools.getTools().forEach((tool) => {
      this.tools.set(tool.name, tool);
      logger.info(`  💾 ${tool.name} - ${tool.description}`);
    });

    // Branch Management Tools
    const branchTools = new BranchTools();
    branchTools.getTools().forEach((tool) => {
      this.tools.set(tool.name, tool);
      logger.info(`  🌿 ${tool.name} - ${tool.description}`);
    });

    logger.info(`✅ Registered ${this.tools.size} tools total`);
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    logger.info(chalk.green('🚀 Starting GitForMeDearAi MCP Server...'));
    logger.info(`📁 Working directory: ${this.context.workingDirectory}`);
    logger.info(`🔧 Tools registered: ${this.tools.size}`);
    
    if (this.context.github) {
      logger.info('🐙 GitHub integration enabled');
    } else {
      logger.warn('⚠️  GitHub token not configured - GitHub features disabled');
    }

    await this.server.connect(transport);
    logger.info(chalk.green('✅ GitForMeDearAi MCP Server started successfully!'));
  }

  public async stop(): Promise<void> {
    logger.info('🛑 Stopping GitForMeDearAi MCP Server...');
    await this.server.close();
    logger.info('✅ Server stopped');
  }
}
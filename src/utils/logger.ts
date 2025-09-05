import chalk from 'chalk';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;
  private mcpMode: boolean;

  constructor() {
    this.mcpMode = process.env.MCP_MODE === 'true';
    
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR':
        this.level = LogLevel.ERROR;
        break;
      case 'WARN':
        this.level = LogLevel.WARN;
        break;
      case 'DEBUG':
        this.level = LogLevel.DEBUG;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? ' ' +
          args
            .map((arg) =>
              typeof arg === 'object'
                ? JSON.stringify(arg, null, 2)
                : String(arg)
            )
            .join(' ')
        : '';

    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  error(message: string, ...args: any[]): void {
    // Check MCP mode dynamically
    const mcpMode = process.env.MCP_MODE === 'true' || !process.stdin.isTTY;
    if (!mcpMode && this.level >= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, ...args);
      console.error(chalk.red(formatted));
    }
  }

  warn(message: string, ...args: any[]): void {
    const mcpMode = process.env.MCP_MODE === 'true' || !process.stdin.isTTY;
    if (!mcpMode && this.level >= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, ...args);
      console.warn(chalk.yellow(formatted));
    }
  }

  info(message: string, ...args: any[]): void {
    const mcpMode = process.env.MCP_MODE === 'true' || !process.stdin.isTTY;
    if (!mcpMode && this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, ...args);
      console.info(chalk.blue(formatted));
    }
  }

  debug(message: string, ...args: any[]): void {
    const mcpMode = process.env.MCP_MODE === 'true' || !process.stdin.isTTY;
    if (!mcpMode && this.level >= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, ...args);
      console.debug(chalk.gray(formatted));
    }
  }

  success(message: string, ...args: any[]): void {
    const mcpMode = process.env.MCP_MODE === 'true' || !process.stdin.isTTY;
    if (!mcpMode && this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('SUCCESS', message, ...args);
      console.info(chalk.green(formatted));
    }
  }
}

export const logger = new Logger();

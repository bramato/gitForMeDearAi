import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { GitForMeDearAiConfig } from '../types/index.js';

const DEFAULT_CONFIG: GitForMeDearAiConfig = {
  defaultRemote: 'origin',
  autoCommitConventions: true,
  gitmojis: true,
};

export function loadConfig(): GitForMeDearAiConfig {
  const config = { ...DEFAULT_CONFIG };

  // Try to load from environment variables
  if (process.env.GITHUB_TOKEN) {
    config.githubToken = process.env.GITHUB_TOKEN;
  }

  if (process.env.GIT_DEFAULT_REMOTE) {
    config.defaultRemote = process.env.GIT_DEFAULT_REMOTE;
  }

  if (process.env.GIT_AUTO_CONVENTIONS) {
    config.autoCommitConventions = process.env.GIT_AUTO_CONVENTIONS === 'true';
  }

  if (process.env.GIT_GITMOJIS) {
    config.gitmojis = process.env.GIT_GITMOJIS === 'true';
  }

  // Try to load from config file
  const configPaths = [
    join(process.cwd(), '.gitformeDearai.json'),
    join(process.cwd(), 'gitformeDearai.config.json'),
    join(homedir(), '.gitformeDearai.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
        Object.assign(config, fileConfig);
        break;
      } catch (error) {
        console.warn(`Failed to parse config file ${configPath}:`, error);
      }
    }
  }

  return config;
}

export function validateConfig(config: GitForMeDearAiConfig): string[] {
  const errors: string[] = [];

  if (config.githubToken && typeof config.githubToken !== 'string') {
    errors.push('githubToken must be a string');
  }

  if (typeof config.defaultRemote !== 'string') {
    errors.push('defaultRemote must be a string');
  }

  if (typeof config.autoCommitConventions !== 'boolean') {
    errors.push('autoCommitConventions must be a boolean');
  }

  if (typeof config.gitmojis !== 'boolean') {
    errors.push('gitmojis must be a boolean');
  }

  return errors;
}

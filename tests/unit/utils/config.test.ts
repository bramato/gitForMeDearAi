import { loadConfig, validateConfig } from '../../../src/utils/config';
import { GitForMeDearAiConfig } from '../../../src/types/index';

describe('Config Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    delete process.env.GITHUB_TOKEN;
    delete process.env.GIT_DEFAULT_REMOTE;
    delete process.env.GIT_AUTO_CONVENTIONS;
    delete process.env.GIT_GITMOJIS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should return default configuration', () => {
      const config = loadConfig();
      
      expect(config).toEqual({
        defaultRemote: 'origin',
        autoCommitConventions: true,
        gitmojis: true,
      });
    });

    it('should load configuration from environment variables', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.GIT_DEFAULT_REMOTE = 'upstream';
      process.env.GIT_AUTO_CONVENTIONS = 'false';
      process.env.GIT_GITMOJIS = 'false';

      const config = loadConfig();
      
      expect(config).toEqual({
        githubToken: 'test-token',
        defaultRemote: 'upstream',
        autoCommitConventions: false,
        gitmojis: false,
      });
    });

    it('should prioritize environment variables over defaults', () => {
      process.env.GIT_DEFAULT_REMOTE = 'my-remote';

      const config = loadConfig();
      
      expect(config.defaultRemote).toBe('my-remote');
      expect(config.autoCommitConventions).toBe(true); // Default value
    });
  });

  describe('validateConfig', () => {
    it('should validate valid configuration', () => {
      const config: GitForMeDearAiConfig = {
        githubToken: 'valid-token',
        defaultRemote: 'origin',
        autoCommitConventions: true,
        gitmojis: true,
      };

      const errors = validateConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should validate configuration without GitHub token', () => {
      const config: GitForMeDearAiConfig = {
        defaultRemote: 'origin',
        autoCommitConventions: true,
        gitmojis: false,
      };

      const errors = validateConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid GitHub token type', () => {
      const config = {
        githubToken: 123,
        defaultRemote: 'origin',
        autoCommitConventions: true,
        gitmojis: true,
      } as any;

      const errors = validateConfig(config);
      expect(errors).toContain('githubToken must be a string');
    });

    it('should return error for invalid defaultRemote type', () => {
      const config = {
        defaultRemote: 123,
        autoCommitConventions: true,
        gitmojis: true,
      } as any;

      const errors = validateConfig(config);
      expect(errors).toContain('defaultRemote must be a string');
    });

    it('should return errors for multiple invalid fields', () => {
      const config = {
        githubToken: 123,
        defaultRemote: null,
        autoCommitConventions: 'not-boolean',
        gitmojis: 'not-boolean',
      } as any;

      const errors = validateConfig(config);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('githubToken must be a string');
      expect(errors).toContain('defaultRemote must be a string');
      expect(errors).toContain('autoCommitConventions must be a boolean');
      expect(errors).toContain('gitmojis must be a boolean');
    });
  });
});
# 🧪 Testing Guide - GitForMeDearAi

Comprehensive testing suite for the GitForMeDearAi MCP server, ensuring all git commands work correctly across different scenarios.

## 📋 Overview

The test suite covers:
- **Unit Tests**: Individual command testing with mocks
- **Integration Tests**: End-to-end workflow testing
- **Error Handling**: Edge cases and failure scenarios
- **Performance**: Large repository handling

## 🏗️ Test Structure

```
tests/
├── setup.ts              # Global test configuration
├── run-tests.sh          # Test runner script
├── README.md             # This file
├── mocks/                # Mock implementations
│   ├── simple-git.ts     # Git command mocks
│   └── octokit.ts        # GitHub API mocks
├── fixtures/             # Test data
│   └── git-repositories.ts # Repository state fixtures
├── unit/                 # Unit tests
│   ├── status/           # Status command tests
│   ├── branches/         # Branch command tests
│   ├── commits/          # Commit command tests
│   └── github/           # GitHub command tests
├── integration/          # Integration tests
│   └── workflows/        # Complete workflow tests
└── utils/               # Test utilities
```

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- git_status.test.ts

# Run tests with custom script (recommended)
./tests/run-tests.sh
```

### Test Categories

#### 1. Status Commands
```bash
npm test -- --testPathPattern="tests/unit/status"
```
- `git_status` - Repository status with changes, conflicts, ahead/behind
- `git_log` - Commit history with filtering and pagination
- `git_diff` - Differences between commits, branches, working tree
- `git_blame` - Line-by-line authorship information
- `git_show` - Commit details with diff and metadata

#### 2. Branch Commands
```bash
npm test -- --testPathPattern="tests/unit/branches"
```
- `git_branch_list` - Branch listing with remote tracking
- `git_branch_create` - Branch creation with options
- `git_branch_switch` - Branch switching and checkout
- `git_branch_delete` - Safe branch deletion

#### 3. Commit Commands
```bash
npm test -- --testPathPattern="tests/unit/commits"
```
- `git_add` - Staging files and patterns
- `git_commit` - Creating commits with messages
- `git_push` - Pushing changes to remotes
- `git_pull` - Pulling and merging changes

#### 4. Integration Tests
```bash
npm test -- --testPathPattern="tests/integration"
```
- Complete git workflows
- Multi-command scenarios
- Error recovery testing

## 🔧 Test Configuration

### Jest Configuration
The project uses Jest with TypeScript and ESM support:
- **Environment**: Node.js
- **Timeout**: 30 seconds per test
- **Coverage**: 80% threshold for all metrics
- **Modules**: ESM with automatic mocking

### Mock Strategy
- **simple-git**: Comprehensive git command mocking
- **@octokit/rest**: GitHub API response mocking  
- **Console methods**: Suppressed during tests
- **Environment variables**: Reset between tests

### Test Fixtures
Predefined repository states for consistent testing:
- Clean repository
- Repository with changes
- Repository with conflicts
- Repository ahead/behind remote
- Multiple branch scenarios
- Stash states

## 📊 Coverage Requirements

The test suite maintains high coverage standards:
- **Branches**: 80% minimum
- **Functions**: 80% minimum  
- **Lines**: 80% minimum
- **Statements**: 80% minimum

Coverage reports are generated in:
- `coverage/lcov-report/index.html` (HTML report)
- `coverage/lcov.info` (LCOV format)
- `coverage/coverage-final.json` (JSON format)

## ✍️ Writing Tests

### Test Structure Template
```typescript
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { YourToolClass } from '../../../src/commands/your-module/index.js';
import { createMockSimpleGit } from '../../mocks/simple-git.js';
import type { McpServerContext } from '../../../src/types/index.js';

describe('YourToolClass - your_command', () => {
  let toolClass: YourToolClass;
  let mockGit: any;
  let mockContext: McpServerContext;

  beforeEach(() => {
    toolClass = new YourToolClass();
    mockGit = createMockSimpleGit();
    
    mockContext = {
      workingDirectory: '/test/repo',
      config: { githubToken: 'test-token', defaultBranch: 'main' },
      git: mockGit,
      github: undefined
    };
  });

  describe('your_command tool', () => {
    it('should be properly configured', () => {
      const tools = toolClass.getTools();
      const tool = tools.find(t => t.name === 'your_command');
      
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('your_command');
    });

    it('should handle success case', async () => {
      mockGit.someMethod.mockResolvedValue(expectedResult);

      const tools = toolClass.getTools();
      const tool = tools.find(t => t.name === 'your_command');
      
      const result = await tool?.execute(mockContext, testArgs);

      expect(result?.success).toBe(true);
      expect(mockGit.someMethod).toHaveBeenCalledWith(expectedArgs);
    });

    it('should handle error case', async () => {
      mockGit.someMethod.mockRejectedValue(new Error('Test error'));

      const tools = toolClass.getTools();
      const tool = tools.find(t => t.name === 'your_command');
      
      const result = await tool?.execute(mockContext, testArgs);

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('Test error');
    });
  });
});
```

### Best Practices

1. **Test Naming**: Use descriptive test names that explain the scenario
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Error Testing**: Always test both success and failure paths
4. **Edge Cases**: Test boundary conditions and unusual inputs
5. **Mock Verification**: Verify that mocks are called with expected parameters
6. **Data Validation**: Ensure returned data structure matches expectations

### Mock Utilities

#### Simple Git Mock
```typescript
import { createMockSimpleGit } from '../../mocks/simple-git.js';

const mockGit = createMockSimpleGit();
mockGit.status.mockResolvedValue(mockRepositoryStates.clean.status);
```

#### GitHub API Mock  
```typescript
import { createMockOctokit } from '../../mocks/octokit.js';

const mockGithub = createMockOctokit();
mockGithub.rest.repos.get.mockResolvedValue({ data: mockRepoData });
```

#### Test Fixtures
```typescript
import { mockRepositoryStates, mockCommitHistory } from '../../fixtures/git-repositories.js';

mockGit.status.mockResolvedValue(mockRepositoryStates.withChanges.status);
mockGit.log.mockResolvedValue(mockCommitHistory.simple);
```

## 🚨 Troubleshooting

### Common Issues

#### ESM Module Errors
```bash
# Ensure proper Jest configuration for ESM
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts']
}
```

#### Mock Import Errors
```bash
# Use .js extensions for imports in test files
import { Tool } from '../../../src/commands/tool/index.js';
```

#### Timeout Issues  
```bash
# Increase timeout for slow tests
jest.setTimeout(60000);
```

### Debug Mode
```bash
# Run with debug output
DEBUG=true npm test

# Run single test with verbose output
npm test -- --testNamePattern="specific test" --verbose
```

## 📈 Continuous Integration

The test suite is designed for CI/CD integration:
- Fast execution (< 2 minutes for full suite)
- Reliable mocking (no external dependencies)
- Clear failure reporting
- Coverage threshold enforcement

### GitHub Actions Integration
```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## 🔄 Maintenance

### Adding New Commands
1. Create mock responses in `tests/mocks/`
2. Add test fixtures in `tests/fixtures/`
3. Write comprehensive unit tests
4. Update this README with new test categories
5. Ensure coverage thresholds are met

### Updating Dependencies
```bash
# Update test dependencies
npm update --dev jest @types/jest ts-jest

# Regenerate coverage baseline
npm run test:coverage
```

---

🎯 **Goal**: Maintain 100% confidence in code quality through comprehensive testing coverage.
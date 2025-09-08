# Development Setup Guide

This guide walks you through setting up your development environment for the dissertation project.

## Prerequisites

### Required Software
- **Git**: Version control system
- **Text Editor/IDE**: VS Code, IntelliJ, or similar
- **Programming Language Runtime**: (To be specified based on project needs)

### Optional Tools
- **Docker**: For containerized development
- **Make**: For build automation
- **Package Manager**: npm, pip, maven, etc. (depending on technology stack)

## Environment Setup

### 1. Repository Setup

#### Clone the Repository
```bash
git clone https://github.com/ch363/Dissertation.git
cd Dissertation
```

#### Configure Git
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 2. Development Branch Setup

#### Create Development Branch
```bash
git checkout -b develop origin/main
git push -u origin develop
```

#### Configure Branch Protection (Repository Admin)
- Protect `main` branch from direct pushes
- Require pull request reviews
- Require status checks to pass

### 3. Project Dependencies

#### Install Dependencies
```bash
# Example for Node.js project
npm install

# Example for Python project
pip install -r requirements.txt

# Example for Java project
mvn install
```

#### Verify Installation
```bash
# Run any verification commands
# Example: npm test, python -m pytest, mvn test
```

### 4. IDE Configuration

#### VS Code Setup
1. Install recommended extensions:
   - Language-specific extensions
   - GitLens for Git integration
   - Prettier for code formatting
   - ESLint/PyLint for linting

2. Configure workspace settings:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll": true
     }
   }
   ```

#### IntelliJ Setup
1. Import project as appropriate type
2. Configure code style and formatting
3. Set up version control integration
4. Configure build tools and dependencies

### 5. Development Tools

#### Install Linting Tools
```bash
# Example configurations - adjust based on project language
npm install -g eslint prettier  # JavaScript
pip install flake8 black        # Python
```

#### Configure Pre-commit Hooks (Optional)
```bash
# Install pre-commit framework
pip install pre-commit

# Set up hooks
pre-commit install
```

### 6. Testing Setup

#### Test Framework Configuration
```bash
# Install testing dependencies
# Adjust based on project needs
npm install --save-dev jest      # JavaScript
pip install pytest              # Python
```

#### Run Initial Tests
```bash
# Verify test setup works
npm test        # JavaScript
python -m pytest  # Python
mvn test          # Java
```

## Verification Checklist

After setup, verify everything works:

- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Can run build commands
- [ ] Tests pass
- [ ] Linting tools work
- [ ] IDE/editor configured properly
- [ ] Git configuration complete

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Fix npm permission issues (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Use sudo for global installs if needed
sudo npm install -g <package>
```

#### Path Issues
```bash
# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH="$PATH:/path/to/tools"
source ~/.bashrc
```

#### Dependency Conflicts
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. Check the [FAQ](faq.md) for common questions
2. Search existing issues in the repository
3. Ask team members for assistance
4. Create a new issue with detailed error information

## Development Environment Variations

### Docker Development

#### Dockerfile Example
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose Setup
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
```

### Remote Development

#### GitHub Codespaces
- Configure `.devcontainer/devcontainer.json`
- Install required extensions automatically
- Set up development environment in the cloud

#### VS Code Remote Development
- Use SSH, containers, or WSL for remote development
- Sync settings and extensions across environments

## Best Practices

### Security
- Never commit sensitive information (API keys, passwords)
- Use environment variables for configuration
- Keep dependencies updated for security patches

### Performance
- Use appropriate IDE plugins for better performance
- Configure exclusions for build artifacts and dependencies
- Regular cleanup of temporary files

### Consistency
- Use consistent formatting and linting rules
- Follow established coding standards
- Keep development environment documentation updated

## Next Steps

After completing setup:
1. Read the [Development Workflow](workflow.md)
2. Review [Coding Standards](coding-standards.md)
3. Understand the [Testing Guidelines](testing-guidelines.md)
4. Start with a small task to familiarize yourself with the codebase
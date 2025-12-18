# Contributing to BookDress

Thank you for your interest in contributing to BookDress! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes or new features
- **Documentation**: Improve or add documentation
- **Translations**: Help with localization efforts
- **Testing**: Help test new features and report issues

### Getting Started

1. **Fork the Repository**: Create a fork of the BookDress repository
2. **Clone Your Fork**: Clone your fork to your local machine
3. **Set Up Development Environment**: Follow the [Development Guide](deployment/DEVELOPMENT_GUIDE.md)
4. **Create a Branch**: Create a feature branch for your changes
5. **Make Changes**: Implement your changes following our guidelines
6. **Test Your Changes**: Ensure all tests pass and add new tests if needed
7. **Submit a Pull Request**: Create a pull request with a clear description

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git
- Code editor (VS Code recommended)

### Quick Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/bookdress.git
cd bookdress

# Set up development environment
./setup-bookdress.sh  # Linux/macOS
# or
./setup-bookdress.bat  # Windows

# Start development servers
docker compose up
```

### Project Structure

```
bookdress/
├── api/                    # Backend API server
├── backend/               # Admin dashboard
├── frontend/              # Customer application
├── mobile/                # Mobile app (React Native)
├── packages/              # Shared packages
├── deployment/            # Deployment configurations
└── docs/                  # Additional documentation
```

## 📝 Coding Standards

### Code Style

We use automated tools to maintain consistent code style:

- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Conventional Commits**: Commit message format

### TypeScript Guidelines

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use strict TypeScript configuration

### React Guidelines

- Use functional components with hooks
- Follow React best practices
- Use proper prop types and interfaces
- Implement proper error boundaries

### API Guidelines

- Follow RESTful API conventions
- Use proper HTTP status codes
- Implement comprehensive input validation
- Add proper error handling and logging

## 🧪 Testing

### Testing Requirements

All contributions must include appropriate tests:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and services
- **E2E Tests**: Test complete user workflows (for major features)

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific project
cd api && npm test
cd frontend && npm test
cd backend && npm test

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features and bug fixes
- Maintain or improve test coverage
- Use descriptive test names
- Follow existing test patterns

## 🌍 Localization

### Adding Translations

BookDress supports Arabic and English. When adding new text:

1. Add English text to appropriate language files
2. Add Arabic translation
3. Use the translation system in components
4. Test RTL layout for Arabic

### Translation Guidelines

- Use clear, concise language
- Consider cultural context for Arabic translations
- Test both LTR and RTL layouts
- Maintain consistency with existing translations

## 🐛 Bug Reports

### Before Reporting

- Check existing issues to avoid duplicates
- Test with the latest version
- Gather relevant information (browser, OS, steps to reproduce)

### Bug Report Template

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Version: [e.g., 7.2.0]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternatives Considered**
Any alternative solutions you've considered.

**Additional Context**
Any other context or screenshots about the feature.
```

## 📋 Pull Request Process

### Before Submitting

1. **Update Documentation**: Update relevant documentation
2. **Add Tests**: Include tests for new functionality
3. **Run Tests**: Ensure all tests pass
4. **Check Linting**: Fix any linting errors
5. **Update Changelog**: Add entry to CHANGELOG.md if applicable

### Pull Request Template

```markdown
**Description**
Brief description of changes.

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and checks
2. **Code Review**: Maintainers review code and provide feedback
3. **Address Feedback**: Make requested changes
4. **Approval**: Once approved, changes will be merged

## 🏷️ Commit Guidelines

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(api): add dress filtering by size
fix(frontend): resolve booking form validation issue
docs(readme): update installation instructions
test(api): add unit tests for dress controller
```

## 🔒 Security

### Reporting Security Issues

**Do not report security vulnerabilities through public GitHub issues.**

Instead, please email security@bookdress.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines

- Never commit sensitive data (passwords, API keys, etc.)
- Use environment variables for configuration
- Follow security best practices
- Keep dependencies updated

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time chat with the community
- **Email**: contact@bookdress.com for general inquiries

### Documentation

- **Development Guide**: [deployment/DEVELOPMENT_GUIDE.md](deployment/DEVELOPMENT_GUIDE.md)
- **API Documentation**: [api/README.md](api/README.md)
- **Deployment Guide**: [deployment/PRODUCTION_DEPLOYMENT.md](deployment/PRODUCTION_DEPLOYMENT.md)

## 📄 License

By contributing to BookDress, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes (for significant contributions)

Thank you for contributing to BookDress! 🎉👗

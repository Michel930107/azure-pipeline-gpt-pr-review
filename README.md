# Azure Pipeline GPT PR Review

An Azure DevOps Pipeline extension that uses OpenAI's GPT models to automatically review Pull Requests and provide intelligent code review feedback.

## Features

- Automated code review using GPT models (GPT-4, GPT-3.5-turbo)
- Support for both OpenAI and Azure OpenAI endpoints
- Configurable review contexts:
  - General Code Review
  - Security Focused
  - Performance Focused
  - Architecture Review
  - Custom Context with additional instructions
- Consolidated review comments
- Self-signed certificate support
- Configurable token limits

## Prerequisites

- Azure DevOps organization
- OpenAI API key or Azure OpenAI endpoint
- Node.js 10.x or later

## Installation

1. Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=fxstreet.GPTPullRequestReview)
2. Configure your pipeline with the required API key
3. Add the task to your pipeline YAML

## Setup

### Pipeline Configuration

Add the following to your pipeline YAML:

```yaml
steps:
- checkout: self
  persistCredentials: true  # Required for PR comments
- task: GPTPullRequestReview@0
  inputs:
    api_key: '$(openai.apikey)'
    model: 'gpt-4'  # Optional
    context_type: 'general'  # Optional
    additional_context: ''  # Optional
```

### Build Service Permissions

Ensure the build service has permissions to contribute to pull requests:
1. Go to Project Settings > Repositories
2. Select your repository
3. Add Build Service with "Contribute to Pull Requests" permission

### Azure OpenAI Configuration

When using Azure OpenAI:
1. Provide the Azure OpenAI endpoint URL
2. Format: `https://{RESOURCE_NAME}.openai.azure.com/openai/deployments/{DEPLOYMENT_NAME}/chat/completions?api-version={API_VERSION}`
3. Include your Azure OpenAI API key

## Development

```bash
# Install dependencies
npm install

# Clean install
npm run install:clean

# Build
npm run build

# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/Michel930107/azure-pipeline-gpt-pr-review/issues) page.

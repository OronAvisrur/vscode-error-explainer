# Error Explainer

A VS Code extension that explains terminal errors in plain language using AI.

## Features

- Click a button to analyze terminal errors
- Support for multiple LLM providers (OpenAI, Anthropic, Ollama, Custom)
- Local model support via Ollama
- Multi-language explanations (Hebrew, English)

## Installation

1. Clone this repository
2. Run `npm install`
3. Press F5 to run the extension in development mode

## Configuration

Configure the extension in VS Code settings:

- `errorExplainer.provider`: Choose your LLM provider
- `errorExplainer.model`: Model name to use
- `errorExplainer.language`: Explanation language (he/en)

## Development

This extension is built with:
- TypeScript
- VS Code Extension API
- Clean Architecture principles

## License

MIT
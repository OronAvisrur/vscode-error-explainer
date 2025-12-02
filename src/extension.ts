import * as vscode from 'vscode';
import { ExplainErrorCommand } from './commands/explainErrorCommand';
import { TerminalService } from './services/terminalService';
import { ErrorParserService } from './services/errorParserService';
import { StatusBarButton } from './ui/statusBarButton';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
  const logger = Logger.getInstance();
  logger.info('Error Explainer extension activated');

  const terminalService = new TerminalService();
  const errorParserService = new ErrorParserService();
  const explainErrorCommand = new ExplainErrorCommand(
    terminalService,
    errorParserService,
    logger
  );

  const commandDisposable = vscode.commands.registerCommand(
    'error-explainer.explainError',
    () => explainErrorCommand.execute()
  );

  const statusBarButton = new StatusBarButton(context);

  context.subscriptions.push(commandDisposable, statusBarButton);

  logger.info('Error Explainer extension ready');
}

export function deactivate() {}
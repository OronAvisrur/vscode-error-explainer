import * as vscode from 'vscode';
import { TerminalService } from '../services/terminalService';
import { ErrorParserService } from '../services/errorParserService';
import { Logger } from '../utils/logger';

export class ExplainErrorCommand {
  private terminalService: TerminalService;
  private errorParserService: ErrorParserService;
  private logger: Logger;

  constructor(
    terminalService: TerminalService,
    errorParserService: ErrorParserService,
    logger: Logger
  ) {
    this.terminalService = terminalService;
    this.errorParserService = errorParserService;
    this.logger = logger;
  }

  public async execute(): Promise<void> {
    this.logger.info('ExplainErrorCommand executed');

    const activeTerminal = this.terminalService.getActiveTerminal();

    if (!activeTerminal) {
      vscode.window.showWarningMessage('No active terminal found');
      this.logger.warn('No active terminal available');
      return;
    }

    let terminalOutput: string;
    try {
      terminalOutput = await this.terminalService.readTerminalOutput(activeTerminal);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to read terminal output');
      this.logger.error('Terminal read failed', error);
      return;
    }

    if (!terminalOutput || terminalOutput.trim().length === 0) {
      vscode.window.showWarningMessage('Terminal is empty');
      this.logger.warn('No terminal content available');
      return;
    }

    this.logger.info('Terminal output retrieved, parsing errors...');

    const parsedError = this.errorParserService.parseError(terminalOutput);

    if (!parsedError) {
      vscode.window.showInformationMessage('No error detected in terminal output');
      this.logger.info('No error pattern matched');
      return;
    }

    this.logger.info(`Error detected: ${parsedError.type} in ${parsedError.language}`);

    const errorSummary = this.buildErrorSummary(parsedError);
    vscode.window.showInformationMessage(errorSummary);
  }

  private buildErrorSummary(parsedError: any): string {
    const parts: string[] = [
      `Error: ${parsedError.type}`,
      `Message: ${parsedError.message}`,
      `Language: ${parsedError.language}`,
    ];

    if (parsedError.filePath) {
      parts.push(`File: ${parsedError.filePath}`);
    }

    if (parsedError.lineNumber) {
      parts.push(`Line: ${parsedError.lineNumber}`);
    }

    return parts.join(' | ');
  }
}
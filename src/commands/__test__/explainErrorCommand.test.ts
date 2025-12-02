import * as vscode from 'vscode';
import { ExplainErrorCommand } from '../explainErrorCommand';
import { TerminalService } from '../../services/terminalService';
import { ErrorParserService } from '../../services/errorParserService';
import { Logger } from '../../utils/logger';

jest.mock('vscode');

describe('ExplainErrorCommand', () => {
  let command: ExplainErrorCommand;
  let mockTerminalService: jest.Mocked<TerminalService>;
  let mockErrorParserService: jest.Mocked<ErrorParserService>;
  let mockLogger: jest.Mocked<Logger>;
  let mockTerminal: vscode.Terminal;

  beforeEach(() => {
    mockTerminal = {} as vscode.Terminal;

    mockTerminalService = {
      getActiveTerminal: jest.fn(),
      readTerminalOutput: jest.fn(),
    } as any;

    mockErrorParserService = {
      parseError: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    command = new ExplainErrorCommand(
      mockTerminalService,
      mockErrorParserService,
      mockLogger
    );

    (vscode.window.showWarningMessage as jest.Mock).mockClear();
    (vscode.window.showInformationMessage as jest.Mock).mockClear();
    (vscode.window.showErrorMessage as jest.Mock).mockClear();
  });

  describe('execute', () => {
    it('should show warning when no active terminal exists', async () => {
      mockTerminalService.getActiveTerminal.mockReturnValue(undefined);

      await command.execute();

      expect(mockLogger.info).toHaveBeenCalledWith('ExplainErrorCommand executed');
      expect(mockLogger.warn).toHaveBeenCalledWith('No active terminal available');
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No active terminal found');
      expect(mockTerminalService.readTerminalOutput).not.toHaveBeenCalled();
    });

    it('should show error when terminal read fails', async () => {
      mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal);
      mockTerminalService.readTerminalOutput.mockRejectedValue(new Error('Read failed'));

      await command.execute();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to read terminal output');
      expect(mockLogger.error).toHaveBeenCalledWith('Terminal read failed', expect.any(Error));
      expect(mockErrorParserService.parseError).not.toHaveBeenCalled();
    });

    it('should show warning when terminal is empty', async () => {
      mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal);
      mockTerminalService.readTerminalOutput.mockResolvedValue('   ');

      await command.execute();

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Terminal is empty');
      expect(mockLogger.warn).toHaveBeenCalledWith('No terminal content available');
      expect(mockErrorParserService.parseError).not.toHaveBeenCalled();
    });

    it('should show info message when no error is detected', async () => {
      const terminalOutput = 'Some regular output without errors';
      mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal);
      mockTerminalService.readTerminalOutput.mockResolvedValue(terminalOutput);
      mockErrorParserService.parseError.mockReturnValue(null);

      await command.execute();

      expect(mockLogger.info).toHaveBeenCalledWith('Terminal output retrieved, parsing errors...');
      expect(mockLogger.info).toHaveBeenCalledWith('No error pattern matched');
      expect(mockErrorParserService.parseError).toHaveBeenCalledWith(terminalOutput);
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'No error detected in terminal output'
      );
    });

    it('should display error summary when error is detected', async () => {
      const terminalOutput = 'TypeError: Cannot read property';
      const parsedError = {
        type: 'TypeError',
        message: 'Cannot read property',
        language: 'JavaScript',
        filePath: '/home/user/app.js',
        lineNumber: 42,
        columnNumber: 10,
        stackTrace: 'stack trace here',
        rawOutput: terminalOutput,
      };

      mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal);
      mockTerminalService.readTerminalOutput.mockResolvedValue(terminalOutput);
      mockErrorParserService.parseError.mockReturnValue(parsedError);

      await command.execute();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Error detected: TypeError in JavaScript'
      );
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Error: TypeError | Message: Cannot read property | Language: JavaScript | File: /home/user/app.js | Line: 42'
      );
    });

    it('should display error summary without file info when unavailable', async () => {
      const terminalOutput = 'RangeError: Maximum call stack size exceeded';
      const parsedError = {
        type: 'RangeError',
        message: 'Maximum call stack size exceeded',
        language: 'JavaScript',
        filePath: null,
        lineNumber: null,
        columnNumber: null,
        stackTrace: 'stack trace here',
        rawOutput: terminalOutput,
      };

      mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal);
      mockTerminalService.readTerminalOutput.mockResolvedValue(terminalOutput);
      mockErrorParserService.parseError.mockReturnValue(parsedError);

      await command.execute();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Error: RangeError | Message: Maximum call stack size exceeded | Language: JavaScript'
      );
    });

    it('should handle Python error with file but no column', async () => {
      const terminalOutput = 'NameError: name is not defined';
      const parsedError = {
        type: 'NameError',
        message: 'name is not defined',
        language: 'Python',
        filePath: 'script.py',
        lineNumber: 15,
        columnNumber: null,
        stackTrace: 'traceback here',
        rawOutput: terminalOutput,
      };

      mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal);
      mockTerminalService.readTerminalOutput.mockResolvedValue(terminalOutput);
      mockErrorParserService.parseError.mockReturnValue(parsedError);

      await command.execute();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Error: NameError | Message: name is not defined | Language: Python | File: script.py | Line: 15'
      );
    });
  });
});
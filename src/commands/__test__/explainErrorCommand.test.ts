import * as vscode from 'vscode';
import { ExplainErrorCommand } from '../explainErrorCommand';
import { TerminalService } from '../../services/terminalService';

jest.mock('../../services/terminalService');

describe('ExplainErrorCommand', () => {
    let explainErrorCommand: ExplainErrorCommand;
    let mockTerminalService: jest.Mocked<TerminalService>;
    let mockTerminal: Partial<vscode.Terminal>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTerminal = {
            name: 'TestTerminal',
            show: jest.fn(),
        };

        mockTerminalService = new TerminalService() as jest.Mocked<TerminalService>;
        explainErrorCommand = new ExplainErrorCommand();
        (explainErrorCommand as any).terminalService = mockTerminalService;
    });

    describe('execute', () => {
        it('should show warning when no active terminal exists', async () => {
            mockTerminalService.getActiveTerminal.mockReturnValue(undefined);

            await explainErrorCommand.execute();

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'No active terminal found. Please open a terminal first.'
            );
            expect(mockTerminalService.hasContent).not.toHaveBeenCalled();
        });

        it('should show warning when terminal is empty', async () => {
            mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal as vscode.Terminal);
            mockTerminalService.hasContent.mockResolvedValue(false);

            await explainErrorCommand.execute();

            expect(mockTerminalService.hasContent).toHaveBeenCalledWith(mockTerminal);
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Terminal is empty. Run a command first to generate output.'
            );
            expect(mockTerminalService.getLastLines).not.toHaveBeenCalled();
        });

        it('should read and display terminal output successfully', async () => {
            const mockOutput = 'Error: File not found\nat line 42\nSome other output';
            mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal as vscode.Terminal);
            mockTerminalService.hasContent.mockResolvedValue(true);
            mockTerminalService.getLastLines.mockResolvedValue(mockOutput);

            await explainErrorCommand.execute();

            expect(mockTerminalService.getActiveTerminal).toHaveBeenCalled();
            expect(mockTerminalService.hasContent).toHaveBeenCalledWith(mockTerminal);
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Reading terminal output...');
            expect(mockTerminalService.getLastLines).toHaveBeenCalledWith(mockTerminal, 50);
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Terminal output captured (3 lines)')
            );
        });

        it('should truncate preview when output is long', async () => {
            const longOutput = 'a'.repeat(250);
            mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal as vscode.Terminal);
            mockTerminalService.hasContent.mockResolvedValue(true);
            mockTerminalService.getLastLines.mockResolvedValue(longOutput);

            await explainErrorCommand.execute();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('...')
            );
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringMatching(/Preview: a{200}\.\.\./)
            );
        });

        it('should not truncate preview when output is short', async () => {
            const shortOutput = 'Error: Short message';
            mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal as vscode.Terminal);
            mockTerminalService.hasContent.mockResolvedValue(true);
            mockTerminalService.getLastLines.mockResolvedValue(shortOutput);

            await explainErrorCommand.execute();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                `Terminal output captured (1 lines). Preview: ${shortOutput}`
            );
        });

        it('should handle errors gracefully', async () => {
            const errorMessage = 'Failed to read terminal';
            mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal as vscode.Terminal);
            mockTerminalService.hasContent.mockRejectedValue(new Error(errorMessage));

            await explainErrorCommand.execute();

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                `Error reading terminal: ${errorMessage}`
            );
        });

        it('should handle unknown errors', async () => {
            mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal as vscode.Terminal);
            mockTerminalService.hasContent.mockRejectedValue('string error');

            await explainErrorCommand.execute();

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Error reading terminal: Unknown error'
            );
        });

        it('should request last 50 lines by default', async () => {
            const mockOutput = 'Some output';
            mockTerminalService.getActiveTerminal.mockReturnValue(mockTerminal as vscode.Terminal);
            mockTerminalService.hasContent.mockResolvedValue(true);
            mockTerminalService.getLastLines.mockResolvedValue(mockOutput);

            await explainErrorCommand.execute();

            expect(mockTerminalService.getLastLines).toHaveBeenCalledWith(mockTerminal, 50);
        });
    });
});
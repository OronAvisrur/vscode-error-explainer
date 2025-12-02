import * as vscode from 'vscode';
import { TerminalService } from '../services/terminalService';

jest.mock('vscode', () => ({
    window: {
        activeTerminal: undefined,
    },
    commands: {
        executeCommand: jest.fn(),
    },
    env: {
        clipboard: {
            readText: jest.fn(),
        },
    },
}));

describe('TerminalService', () => {
    let terminalService: TerminalService;
    let mockTerminal: Partial<vscode.Terminal>;

    beforeEach(() => {
        terminalService = new TerminalService();
        
        mockTerminal = {
            name: 'TestTerminal',
            show: jest.fn(),
        };

        jest.clearAllMocks();
    });

    describe('getActiveTerminal', () => {
        it('should return active terminal when available', () => {
            (vscode.window as any).activeTerminal = mockTerminal;

            const result = terminalService.getActiveTerminal();

            expect(result).toBe(mockTerminal);
        });

        it('should return undefined when no terminal is active', () => {
            (vscode.window as any).activeTerminal = undefined;

            const result = terminalService.getActiveTerminal();

            expect(result).toBeUndefined();
        });
    });

    describe('readTerminalOutput', () => {
        it('should successfully read terminal output', async () => {
            const mockOutput = 'Error: File not found\nat line 42';
            (vscode.env.clipboard.readText as jest.Mock).mockResolvedValue(mockOutput);
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            const result = await terminalService.readTerminalOutput(mockTerminal as vscode.Terminal);

            expect(mockTerminal.show).toHaveBeenCalled();
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.terminal.selectAll');
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('editor.action.clipboardCopyAction');
            expect(result).toBe(mockOutput);
        });

        it('should remove ANSI escape codes from output', async () => {
            const ansiOutput = '\x1b[31mError:\x1b[0m File not found';
            const expectedOutput = 'Error: File not found';
            (vscode.env.clipboard.readText as jest.Mock).mockResolvedValue(ansiOutput);
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            const result = await terminalService.readTerminalOutput(mockTerminal as vscode.Terminal);

            expect(result).toBe(expectedOutput);
        });

        it('should throw error when terminal is not available', async () => {
            await expect(terminalService.readTerminalOutput(null as any))
                .rejects
                .toThrow('Terminal is not available');
        });

        it('should handle clipboard read errors gracefully', async () => {
            (vscode.env.clipboard.readText as jest.Mock).mockRejectedValue(new Error('Clipboard access denied'));
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            await expect(terminalService.readTerminalOutput(mockTerminal as vscode.Terminal))
                .rejects
                .toThrow('Failed to read terminal output: Clipboard access denied');
        });
    });

    describe('hasContent', () => {
        it('should return true when terminal has content', async () => {
            (vscode.env.clipboard.readText as jest.Mock).mockResolvedValue('Some output');
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            const result = await terminalService.hasContent(mockTerminal as vscode.Terminal);

            expect(result).toBe(true);
        });

        it('should return false when terminal is empty', async () => {
            (vscode.env.clipboard.readText as jest.Mock).mockResolvedValue('   \n  ');
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            const result = await terminalService.hasContent(mockTerminal as vscode.Terminal);

            expect(result).toBe(false);
        });

        it('should return false when reading fails', async () => {
            (vscode.env.clipboard.readText as jest.Mock).mockRejectedValue(new Error('Failed'));

            const result = await terminalService.hasContent(mockTerminal as vscode.Terminal);

            expect(result).toBe(false);
        });
    });

    describe('getLastLines', () => {
        it('should return last N lines from terminal', async () => {
            const mockOutput = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
            (vscode.env.clipboard.readText as jest.Mock).mockResolvedValue(mockOutput);
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            const result = await terminalService.getLastLines(mockTerminal as vscode.Terminal, 3);

            expect(result).toBe('Line 3\nLine 4\nLine 5');
        });

        it('should return all lines if count exceeds total lines', async () => {
            const mockOutput = 'Line 1\nLine 2';
            (vscode.env.clipboard.readText as jest.Mock).mockResolvedValue(mockOutput);
            (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

            const result = await terminalService.getLastLines(mockTerminal as vscode.Terminal, 100);

            expect(result).toBe('Line 1\nLine 2');
        });
    });
});
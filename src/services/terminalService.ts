import * as vscode from 'vscode';

export class TerminalService {
    private static readonly MAX_LINES = 500;

    public getActiveTerminal(): vscode.Terminal | undefined {
        return vscode.window.activeTerminal;
    }

    public async readTerminalOutput(terminal: vscode.Terminal): Promise<string> {
        if (!terminal) {
            throw new Error('Terminal is not available');
        }

        try {
            terminal.show();
            
            await this.sleep(100);

            await vscode.commands.executeCommand('workbench.action.terminal.selectAll');
            
            await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
            
            const output = await vscode.env.clipboard.readText();
            
            await vscode.commands.executeCommand('workbench.action.terminal.clearSelection');

            return this.sanitizeOutput(output);
            
        } catch (error) {
            throw new Error(`Failed to read terminal output: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private sanitizeOutput(output: string): string {
        let cleaned = output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        
        cleaned = cleaned.replace(/\r/g, '');
        
        const lines = cleaned.split('\n');
        if (lines.length > TerminalService.MAX_LINES) {
            cleaned = lines.slice(-TerminalService.MAX_LINES).join('\n');
        }

        return cleaned.trim();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
import * as vscode from 'vscode';

export class TerminalService {
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

            return output.trim();
            
        } catch (error) {
            throw new Error(`Failed to read terminal output: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}